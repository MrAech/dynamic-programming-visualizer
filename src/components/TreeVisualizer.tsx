import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import type { TreeNode, DPStep } from '../types';

interface TreeVisualizerProps {
  tree: TreeNode | null;
  steps: DPStep[];
  currentStep: number;
}

const NODE_RADIUS = 28;
const HORIZONTAL_SPACING = 20;
const VERTICAL_SPACING = 90;

const COLORS = {
  line: '#4a4a4a',
  nodeBg: '#2a2a2a',
  text: '#f5f5f5',
  textSecondary: '#a0a0a0',
  active: '#f59e0b',
  memoized: '#22c55e',
  visited: '#4a90e2',
};

const colorCache: { [key: string]: string } = {};
const generateColor = (str: string): string => {
  if (colorCache[str]) return colorCache[str];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  const color = "00000".substring(0, 6 - c.length) + c;
  colorCache[str] = `#${color}`;
  return colorCache[str];
};

function findNode(tree: TreeNode, nodeId: string): TreeNode | null {
  if (tree.id === nodeId) return tree;
  for (const child of tree.children) {
    const found = findNode(child, nodeId);
    if (found) return found;
  }
  return null;
}

function drawTree(ctx: CanvasRenderingContext2D, node: TreeNode, isVisible: boolean) {
  if (!isVisible) return;

  node.children.forEach(child => {
    const childIsVisible = child.status !== 'idle';
    if (node.x && node.y && child.x && child.y && childIsVisible) {
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(child.x, child.y);
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });

  if (node.x && node.y) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
    
    ctx.fillStyle = generateColor(node.value);
    ctx.fill();

    ctx.strokeStyle = 
      node.status === 'active' ? COLORS.active :
      node.status === 'memoized' ? COLORS.memoized :
      node.status === 'visited' ? COLORS.visited :
      generateColor(node.value);
    ctx.lineWidth = node.status === 'active' ? 4 : 2;
    ctx.stroke();

    ctx.fillStyle = COLORS.text;
    ctx.font = '600 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(node.value), node.x, node.y - 6);

    if (node.result !== undefined) {
      ctx.fillStyle = COLORS.textSecondary;
      ctx.font = '500 11px Inter, sans-serif';
      ctx.fillText(`= ${node.result}`, node.x, node.y + 10);
    }
  }

  node.children.forEach(child => drawTree(ctx, child, child.status !== 'idle'));
}

function calculateStaticLayout(node: TreeNode, depth = 0, x = 0): { width: number } {
    const y = depth * VERTICAL_SPACING;
    
    if (node.children.length === 0) {
        const width = NODE_RADIUS * 2;
        node.x = x + NODE_RADIUS;
        node.y = y + NODE_RADIUS;
        return { width };
    }

    const childrenBounds = node.children.map(child => calculateStaticLayout(child, depth + 1, x));
    const totalChildrenWidth = childrenBounds.reduce((sum, bound) => sum + bound.width, 0) + HORIZONTAL_SPACING * (node.children.length - 1);

    let currentX = x;
    childrenBounds.forEach((bound, i) => {
        const childNode = node.children[i];
        const shift = (currentX - childNode.x!) + bound.width / 2;
        shiftSubtree(childNode, shift);
        currentX += bound.width + HORIZONTAL_SPACING;
    });

    const firstChild = node.children[0];
    const lastChild = node.children[node.children.length - 1];
    node.x = (firstChild.x! + lastChild.x!) / 2;
    node.y = y + NODE_RADIUS;

    return { width: totalChildrenWidth };
}

function shiftSubtree(node: TreeNode, shift: number) {
    node.x! += shift;
    node.children.forEach(child => shiftSubtree(child, shift));
}

function getTreeBounds(node: TreeNode, bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }) {
    if (node.x !== undefined && node.status !== 'idle') {
        bounds.minX = Math.min(bounds.minX, node.x - NODE_RADIUS);
        bounds.maxX = Math.max(bounds.maxX, node.x + NODE_RADIUS);
    }
    if (node.y !== undefined && node.status !== 'idle') {
        bounds.minY = Math.min(bounds.minY, node.y - NODE_RADIUS);
        bounds.maxY = Math.max(bounds.maxY, node.y + NODE_RADIUS);
    }
    node.children.forEach(child => getTreeBounds(child, bounds));
    return bounds;
}

const Legend: React.FC = () => (
  <div className="tree-legend">
    <div className="legend-item">
      <div className="legend-color" style={{ border: `3px solid ${COLORS.active}` }}></div>
      <span>Active</span>
    </div>
    <div className="legend-item">
      <div className="legend-color" style={{ border: `2px solid ${COLORS.visited}` }}></div>
      <span>Visited</span>
    </div>
    <div className="legend-item">
      <div className="legend-color" style={{ border: `2px solid ${COLORS.memoized}` }}></div>
      <span>Memoized</span>
    </div>
    <div className="legend-item">
      <div className="legend-color" style={{ backgroundColor: '#888' }}></div>
      <span>Problem Node</span>
    </div>
  </div>
);

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({ tree, steps, currentStep }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [layoutTree, setLayoutTree] = useState<TreeNode | null>(null);
  
  // Panning and zooming state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (containerRef.current) {
      setSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
    }
  }, []);

  useEffect(() => {
    if (tree) {
      const treeCopy = JSON.parse(JSON.stringify(tree));
      calculateStaticLayout(treeCopy);
      setLayoutTree(treeCopy);
    }
  }, [tree]);

  // Mouse event handlers for panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Wheel event handler for zooming
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prevZoom => Math.max(0.1, Math.min(3, prevZoom * delta)));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layoutTree || size.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const visibleTree = JSON.parse(JSON.stringify(layoutTree));
    
    function setIdle(node: TreeNode) {
        node.status = 'idle';
        node.children.forEach(setIdle);
    }
    setIdle(visibleTree);
    
    for (let i = 0; i <= currentStep; i++) {
        const step = steps[i];
        if (step.type === 'call' || step.type === 'return' || step.type === 'memo-hit') {
            const node = findNode(visibleTree, step.currentNodeId!);
            if (node) {
                if (step.type === 'call') node.status = 'active';
                if (step.type === 'return') node.status = 'visited';
                if (step.type === 'memo-hit') node.status = 'memoized';
                
                const originalNode = findNode(tree!, step.currentNodeId!);
                if(originalNode) node.result = originalNode.result;
            }
        }
    }
    
    const currentStepData = steps[currentStep];
    if (currentStepData && currentStepData.currentNodeId) {
        const activeNode = findNode(visibleTree, currentStepData.currentNodeId);
        if (activeNode) activeNode.status = 'active';
    }

    const bounds = getTreeBounds(visibleTree);
    const treeWidth = bounds.maxX - bounds.minX;
    // const treeHeight = bounds.maxY - bounds.minY;

    canvas.width = size.width;
    canvas.height = size.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const startX = (canvas.width / 2) - (treeWidth / 2) - bounds.minX;
    const startY = 20 - bounds.minY;

    ctx.save();
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-canvas.width / 2 + startX, -canvas.height / 2 + startY);
    drawTree(ctx, visibleTree, true);
    ctx.restore();

  }, [layoutTree, steps, currentStep, size, tree, pan, zoom]);

  if (!tree) {
    return <div className="empty-state">Run a problem to see the recursion tree.</div>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Legend />
      <div className="tree-controls">
        <button onClick={() => setZoom(z => Math.min(3, z * 1.2))} title="Zoom In">+</button>
        <button onClick={() => setZoom(z => Math.max(0.1, z / 1.2))} title="Zoom Out">−</button>
        <button className="reset-btn" onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }} title="Reset View">Reset</button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
      </div>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        <canvas 
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          style={{ display: 'block' }}
        />
      </div>
    </div>
  );
};
