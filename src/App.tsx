import { useState, useEffect, useCallback, useRef, type RefObject } from 'react';
import { Fibonacci, CoinChange, Knapsack, LCS } from './algorithms';
import { ProblemSelector } from './components/ProblemSelector';
import type { ProblemConfig } from './components/ProblemSelector';
import { TreeVisualizer } from './components/TreeVisualizer';
import { DPTableVisualizer } from './components/DPTableVisualizer';
import { MemoVisualizer } from './components/MemoVisualizer';
import { ControlPanel } from './components/ControlPanel';
import { Tabs, Tab } from './components/Tabs';
import { CallStackVisualizer } from './components/CallStackVisualizer';
import type { DPStep, TreeNode } from './types';
import './App.css';

const problemConfigs: ProblemConfig[] = [
  {
    id: 'fibonacci',
    name: 'Fibonacci',
    description: 'Calculate the nth Fibonacci number',
    inputs: [
      { name: 'n', label: 'N', type: 'number', defaultValue: '7', placeholder: 'Enter n' },
    ],
  },
  {
    id: 'coinChange',
    name: 'Coin Change',
    description: 'Minimum coins to make amount',
    inputs: [
      { name: 'coins', label: 'Coins', type: 'array', defaultValue: '1,2,5', placeholder: '1,2,5' },
      { name: 'amount', label: 'Amount', type: 'number', defaultValue: '11', placeholder: 'Target amount' },
    ],
  },
  {
    id: 'knapsack',
    name: '0/1 Knapsack',
    description: 'Maximize value within capacity',
    inputs: [
      { name: 'weights', label: 'Weights', type: 'array', defaultValue: '2,3,4,5', placeholder: '2,3,4,5' },
      { name: 'values', label: 'Values', type: 'array', defaultValue: '3,4,5,6', placeholder: '3,4,5,6' },
      { name: 'capacity', label: 'Capacity', type: 'number', defaultValue: '8', placeholder: 'Max weight' },
    ],
  },
  {
    id: 'lcs',
    name: 'Longest Common Subsequence',
    description: 'Find LCS between two strings',
    inputs: [
      { name: 'str1', label: 'String 1', type: 'text', defaultValue: 'ABCBDAB', placeholder: 'First string' },
      { name: 'str2', label: 'String 2', type: 'text', defaultValue: 'BDCABA', placeholder: 'Second string' },
    ],
  },
];

const VITE_APP_TITLE = 'Dynamic Programming Visualizer';

type Connector = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
} | null;

function App() {
  const [selectedProblem, setSelectedProblem] = useState('fibonacci');
  const [problemInputs, setProblemInputs] = useState<any>({});
  const [activeTab, setActiveTab] = useState('tree');
  
  const [steps, setSteps] = useState<DPStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [memo, setMemo] = useState<Map<string, any>>(new Map());
  const [stats, setStats] = useState({ recursiveCalls: 0, timeComplexity: '-', spaceComplexity: '-' });
  
  const [callStack, setCallStack] = useState<DPStep[]>([]);
  const [highlightedMemoKey, setHighlightedMemoKey] = useState<string | undefined>(undefined);
  const [connector, setConnector] = useState<Connector>(null);
  const [hasVisualized, setHasVisualized] = useState(false);

  const memoItemRefs = useRef<Map<string, RefObject<HTMLDivElement>>>(new Map());
  const stackFrameRefs = useRef<Map<string, RefObject<HTMLDivElement>>>(new Map());
  const memoContainerRef = useRef<HTMLDivElement>(null);
  const stepsCache = useRef<Record<string, Record<string, DPStep[]>>>({});

  const getSolver = useCallback(() => {
    switch (selectedProblem) {
      case 'fibonacci': return new Fibonacci();
      case 'coinChange': return new CoinChange();
      case 'knapsack': return new Knapsack();
      case 'lcs': return new LCS();
      default: throw new Error('Unknown problem');
    }
  }, [selectedProblem]);

  useEffect(() => {
    // Only compute if we have valid inputs and have visualized at least once
    if (!problemInputs || Object.keys(problemInputs).length === 0 || !hasVisualized) {
      return;
    }

    const problemId = selectedProblem;
    const inputsKey = JSON.stringify(problemInputs);
    const cacheKey = `${problemId}-${inputsKey}`;

    if (!stepsCache.current[cacheKey]) {
      stepsCache.current[cacheKey] = {};
    }

    let newSteps: DPStep[] = [];
    const solver = getSolver();

    if (stepsCache.current[cacheKey][activeTab]) {
      newSteps = stepsCache.current[cacheKey][activeTab];
    } else {
      try {
        switch (activeTab) {
          case 'tree':
            if (solver.solveTree) {
              newSteps = solver.solveTree(problemInputs);
            }
            break;
          case 'memo':
            if (solver.solveMemo) {
              newSteps = solver.solveMemo(problemInputs);
            }
            break;
          case 'table':
            if (solver.solveTable) {
              newSteps = solver.solveTable(problemInputs);
            }
            break;
          default:
            newSteps = [];
        }
        stepsCache.current[cacheKey][activeTab] = newSteps;
      } catch (error) {
        console.error('Error solving problem:', error);
        newSteps = [];
      }
    }
    
    setSteps(newSteps);
    setTree(solver.getTree());
    setStats({
        recursiveCalls: solver.getRecursiveCalls(),
        timeComplexity: solver.getTimeComplexity().memoized,
        spaceComplexity: solver.getSpaceComplexity().memoized,
    });
    setCurrentStep(0);

  }, [selectedProblem, problemInputs, activeTab, getSolver, hasVisualized]);

  // Pause animation and reset to start when switching tabs
  useEffect(() => {
    setIsPlaying(false);
    setCurrentStep(0);
  }, [activeTab]);

  const handleVisualize = useCallback((inputs: any) => {
    setCurrentStep(0);
    setIsPlaying(false);
    
    // Clear cache for current inputs to force recomputation
    const problemId = selectedProblem;
    let transformedInputs = inputs;
    
    // Transform knapsack inputs
    if (selectedProblem === 'knapsack' && inputs.weights && inputs.values) {
      const items = inputs.weights.map((w: number, i: number) => ({
        weight: w,
        value: inputs.values[i],
        name: `Item${i + 1}`
      }));
      transformedInputs = { items, capacity: inputs.capacity };
    }
    
    const inputsKey = JSON.stringify(transformedInputs);
    const cacheKey = `${problemId}-${inputsKey}`;
    
    // Clear this specific cache entry to force recomputation
    if (stepsCache.current[cacheKey]) {
      delete stepsCache.current[cacheKey];
    }
    
    // Mark that we've triggered visualization
    setHasVisualized(true);
    setProblemInputs(transformedInputs);
  }, [selectedProblem]);

  const handleProblemChange = (problemId: string) => {
    setSelectedProblem(problemId);
    const newProblem = problemConfigs.find(p => p.id === problemId);
    const defaultInputs = newProblem?.inputs.reduce((acc, input) => {
        acc[input.name] = input.defaultValue;
        return acc;
    }, {} as any);
    
    // Clear cache when switching problems
    stepsCache.current = {};
    
    // Set appropriate default tab: memo for LCS, tree for others
    const defaultTab = problemId === 'lcs' ? 'memo' : 'tree';
    setActiveTab(defaultTab);
    
    // Transform inputs if needed
    let transformedInputs = defaultInputs || {};
    
    if (problemId === 'coinChange' && defaultInputs?.coins && defaultInputs?.amount) {
      transformedInputs = {
        coins: defaultInputs.coins.split(',').map((v: string) => Number(v.trim())),
        amount: Number(defaultInputs.amount)
      };
    } else if (problemId === 'knapsack' && defaultInputs?.weights && defaultInputs?.values) {
      const weights = defaultInputs.weights.split(',').map((v: string) => Number(v.trim()));
      const values = defaultInputs.values.split(',').map((v: string) => Number(v.trim()));
      const items = weights.map((w: number, i: number) => ({
        weight: w,
        value: values[i],
        name: `Item${i + 1}`
      }));
      transformedInputs = { items, capacity: Number(defaultInputs.capacity) };
    } else if (problemId === 'fibonacci' && defaultInputs?.n) {
      transformedInputs = { n: Number(defaultInputs.n) };
    }
    
    setProblemInputs(transformedInputs);
    
    // Auto-compute for new problem
    setHasVisualized(true);
    setCurrentStep(0);
    setIsPlaying(false);
  };
  
  const handlePlayPause = () => setIsPlaying(prev => !prev);
  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };
  const handleStepForward = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };
  const handleStepBackward = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // Auto-play animation - only when on the active tab
  useEffect(() => {
    if (!isPlaying || currentStep >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    
    // Only advance animation if we're on a tab with steps
    if (steps.length === 0) {
      setIsPlaying(false);
      return;
    }
    
    const timer = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, speed);
    
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, steps.length, speed, activeTab]);

  useEffect(() => {
    if (steps.length === 0) {
      setHighlightedMemoKey(undefined);
      setCallStack([]);
      setConnector(null);
      setMemo(new Map());
      return;
    }

    const newCallStack: DPStep[] = [];
    const newMemo = new Map<string, any>();
    let currentHighlight: string | undefined = undefined;
    let newConnector: Connector = null;

    for (let i = 0; i <= currentStep; i++) {
      const step = steps[i];
      if (step.type === 'call') {
        newCallStack.push(step);
      } else if (step.type === 'return' || step.type === 'memo-hit') {
        if(newCallStack.length > 0) newCallStack.pop();
      }
      
      // Build memo incrementally
      if (step.memoKey !== undefined && step.memoValue !== undefined) {
        newMemo.set(step.memoKey, step.memoValue);
      }
    }
    
    const currentStepData = steps[currentStep];
    if (currentStepData.type === 'memo-hit' && currentStepData.memoKey) {
      currentHighlight = currentStepData.memoKey;
      
      const stackFrameId = newCallStack[newCallStack.length - 1]?.currentNodeId;
      const memoKey = currentStepData.memoKey;

      const stackFrameRef = stackFrameId ? stackFrameRefs.current.get(stackFrameId) : null;
      const memoItemRef = memoKey ? memoItemRefs.current.get(memoKey) : null;
      const containerRect = memoContainerRef.current?.getBoundingClientRect();

      if (stackFrameRef?.current && memoItemRef?.current && containerRect) {
        const fromRect = stackFrameRef.current.getBoundingClientRect();
        const toRect = memoItemRef.current.getBoundingClientRect();
        
        newConnector = {
          x1: fromRect.right - containerRect.left,
          y1: fromRect.top + fromRect.height / 2 - containerRect.top,
          x2: toRect.left - containerRect.left,
          y2: toRect.top + toRect.height / 2 - containerRect.top,
        };
      }
    }
    
    setHighlightedMemoKey(currentHighlight);
    setCallStack(newCallStack);
    setMemo(newMemo);
    setConnector(newConnector);
    if (currentStepData.type !== 'memo-hit') {
      setTimeout(() => setConnector(null), 300);
    }
  }, [currentStep, steps, tree]);

  const findNode = (node: TreeNode, nodeId: string): TreeNode | null => {
    if (!node) return null;
    if (node.id === nodeId) return node;
    for (const child of node.children) {
      const found = findNode(child, nodeId);
      if (found) return found;
    }
    return null;
  };

  const currentStepData = steps.length > 0 ? steps[currentStep] : undefined;
  const isVisualizationRunning = steps.length > 0;
  const showTree = selectedProblem !== 'lcs';

  return (
    <div className="app">
      <header className="app-header">
        <h1>{VITE_APP_TITLE}</h1>
        <p>Visualize recursion, memoization, and tabulation for DP problems</p>
      </header>

      <div className="app-content">
        <aside className="sidebar">
          <div className="panel">
            <ProblemSelector
              problems={problemConfigs}
              selectedProblem={selectedProblem}
              onProblemChange={handleProblemChange}
              onSubmit={handleVisualize}
            />
          </div>
          <div className="panel stats-panel">
            <h3>Statistics</h3>
            <div className="stat-item">
              <span>Recursive Calls:</span>
              <strong>{stats.recursiveCalls}</strong>
            </div>
            <div className="stat-item">
              <span>Time Complexity:</span>
              <strong>{stats.timeComplexity}</strong>
            </div>
            <div className="stat-item">
              <span>Space Complexity:</span>
              <strong>{stats.spaceComplexity}</strong>
            </div>
          </div>
        </aside>

        <main className="main-area">
          <div className="panel control-panel">
            <ControlPanel
              isPlaying={isPlaying}
              speed={speed}
              currentStep={currentStep}
              totalSteps={steps.length}
              onPlayPause={handlePlayPause}
              onReset={handleReset}
              onSpeedChange={setSpeed}
              onStepForward={handleStepForward}
              onStepBackward={handleStepBackward}
            />
            {currentStepData && (
              <div className="step-message">
                {currentStepData.message}
              </div>
            )}
          </div>

          <div className="visualizations">
            <Tabs defaultTab={showTree ? 'tree' : 'table'} activeTab={activeTab} onTabChange={setActiveTab}>
              {showTree && (
                <Tab id="tree" title="Recursion Tree">
                  <div className="tree-container">
                    {steps.length > 0 && activeTab === 'tree' ? (
                      <TreeVisualizer tree={tree} steps={steps} currentStep={currentStep} />
                    ) : (
                      <div className="empty-state">{hasVisualized ? 'Loading...' : 'Select a problem to visualize'}</div>
                    )}
                  </div>
                </Tab>
              )}
              <Tab id="memo" title="Memoization">
                <div className="memo-container" ref={memoContainerRef}>
                  {steps.length > 0 && activeTab === 'memo' ? (
                    <>
                      <CallStackVisualizer stack={callStack} stackFrameRefs={stackFrameRefs} />
                      <MemoVisualizer 
                        memo={memo} 
                        highlightKey={highlightedMemoKey}
                        memoItemRefs={memoItemRefs}
                      />
                      {connector && (
                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                          <line
                            x1={connector.x1}
                            y1={connector.y1}
                            x2={connector.x2}
                            y2={connector.y2}
                            stroke="var(--accent2)"
                            strokeWidth="2"
                            strokeDasharray="5, 5"
                          />
                        </svg>
                      )}
                    </>
                  ) : (
                    <div className="empty-state">{hasVisualized ? 'Loading memoization...' : 'Select a problem to visualize'}</div>
                  )}
                </div>
              </Tab>
              <Tab id="table" title="DP Table">
                <div className="table-container">
                  {activeTab === 'table' && steps.length > 0 ? (
                    <DPTableVisualizer
                      key={`${selectedProblem}-${activeTab}-${steps.length}`}
                      steps={steps}
                      currentStep={currentStep}
                      rowLabels={
                        selectedProblem === 'coinChange'
                          ? ['Ø', ...(problemInputs.coins || [1, 2, 5])]
                          : selectedProblem === 'knapsack'
                          ? ['Ø', ...(problemInputs.items?.map((item: any) => `${item.name}(${item.weight})`) || [])]
                          : selectedProblem === 'lcs'
                          ? ['', ...(problemInputs.str1 || 'ABCBDAB').split('')]
                          : []
                      }
                      colLabel={
                        selectedProblem === 'coinChange'
                          ? 'Coin'
                          : selectedProblem === 'knapsack'
                          ? 'Weight'
                          : selectedProblem === 'lcs'
                          ? 'Str2'
                          : 'Index'
                      }
                    />
                  ) : activeTab === 'table' ? (
                    <div className="empty-state">
                      {hasVisualized ? 'Loading table...' : 'Select a problem to visualize'}
                    </div>
                  ) : (
                    <div className="empty-state">
                      Switch to table view to see DP table animation.
                    </div>
                  )}
                </div>
              </Tab>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
