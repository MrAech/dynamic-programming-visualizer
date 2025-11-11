// Core types for DP visualization

export type NodeStatus = 'active' | 'visited' | 'memoized' | 'idle';

export type TreeNode = {
  id: string;
  value: string;
  params: any[];
  result?: any;
  children: TreeNode[];
  x?: number;
  y?: number;
  status?: NodeStatus;
  level?: number;
}

export type DPStep = {
  type: 'call' | 'return' | 'memo-hit' | 'table' | 'solution';
  currentNodeId?: string;
  node?: TreeNode; // The node being acted upon
  memoKey?: string;
  memoValue?: any;
  tableIndex?: [number, number] | number;
  tableValue?: any;
  dependencies?: ([number, number] | number)[];
  message?: string;
}

export type DPProblem = {
  id: string;
  name: string;
  description: string;
  timeComplexity: {
    recursive: string;
    memoized: string;
    tabulated: string;
  };
  spaceComplexity: {
    recursive: string;
    memoized: string;
    tabulated: string;
  };
}

export type VisualizationState = {
  currentStep: number;
  steps: DPStep[];
  isPlaying: boolean;
  speed: number;
  tree: TreeNode | null;
  memo: Map<string, any>;
  table: any[][];
  solution: any;
  recursiveCalls: number;
}

export type ProblemInput = {
  [key: string]: any;
}
