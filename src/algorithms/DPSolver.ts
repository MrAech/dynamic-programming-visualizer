import type { TreeNode, DPStep } from '../types';

export abstract class DPSolver {
  protected steps: DPStep[] = [];
  protected recursiveCalls: number = 0;
  protected memo: Map<string, any> = new Map();
  protected tree: TreeNode | null = null;
  protected table: any[] | any[][] = [];
  protected nodeIdCounter: number = 0;

  abstract solve(input: any): any;
  abstract solveTree(input: any): DPStep[];
  abstract solveMemo(input: any): DPStep[];
  abstract solveTable(input: any): DPStep[];
  abstract getTimeComplexity(): { recursive: string; memoized: string; tabulated: string };
  abstract getSpaceComplexity(): { recursive: string; memoized: string; tabulated: string };
  abstract getDescription(): string;

  getSteps(): DPStep[] {
    return this.steps;
  }

  getRecursiveCalls(): number {
    return this.recursiveCalls;
  }

  getTree(): TreeNode | null {
    return this.tree;
  }

  getMemo(): Map<string, any> {
    return new Map(this.memo);
  }

  getTable(): any[] | any[][] {
    return this.table;
  }

  reset(): void {
    this.steps = [];
    this.recursiveCalls = 0;
    this.memo.clear();
    this.tree = null;
    this.table = [];
    this.nodeIdCounter = 0;
  }

  protected createNode(value: string, params: any[]): TreeNode {
    return {
      id: `node-${this.nodeIdCounter++}`,
      value,
      params,
      children: [],
    };
  }

  protected addStep(step: DPStep): void {
    this.steps.push(step);
  }
}
