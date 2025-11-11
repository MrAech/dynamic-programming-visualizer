import { DPSolver } from './DPSolver';
import type { TreeNode, DPStep } from '../types';

export class Fibonacci extends DPSolver {
  getDescription(): string {
    return 'Calculate the nth Fibonacci number. Classic DP problem showing overlapping subproblems.';
  }

  getTimeComplexity() {
    return {
      recursive: 'O(2^n)',
      memoized: 'O(n)',
      tabulated: 'O(n)',
    };
  }

  getSpaceComplexity() {
    return {
      recursive: 'O(n)',
      memoized: 'O(n)',
      tabulated: 'O(n)',
    };
  }

  solve(n: number): { memoized: number; tabulated: number } {
    // This method is now a placeholder, as the logic is moved to tab-specific solvers.
    // It could return final results if needed, but the visualization is driven by steps.
    const memoSteps = this.solveMemo(n);
    const lastMemoStep = memoSteps[memoSteps.length - 1];
    const memoizedResult = lastMemoStep.memoValue;

    const tableSteps = this.solveTable(n);
    const lastTableStep = tableSteps[tableSteps.length - 1];
    const tabulatedResult = lastTableStep.tableValue;

    return {
      memoized: memoizedResult,
      tabulated: tabulatedResult,
    };
  }

  solveTree(input: any): DPStep[] {
    const n = typeof input === 'number' ? input : (input?.n || 7);
    this.reset();
    this.tree = this.createNode(`fib(${n})`, [n]);
    this.fibMemoized(n, this.tree);
    return this.steps;
  }

  solveMemo(input: any): DPStep[] {
    const n = typeof input === 'number' ? input : (input?.n || 7);
    this.reset();
    this.tree = this.createNode(`fib(${n})`, [n]);
    this.fibMemoized(n, this.tree);
    return this.steps;
  }

  solveTable(input: any): DPStep[] {
    const n = typeof input === 'number' ? input : (input?.n || 7);
    this.reset();
    this.fibTabulated(n);
    return this.steps;
  }

  private fibMemoized(n: number, node: TreeNode): number {
    this.recursiveCalls++;
    
    this.addStep({
      type: 'call',
      currentNodeId: node.id,
      message: `Calling fib(${n})`,
    });

    const memoKey = `${n}`;
    if (this.memo.has(memoKey)) {
      const memoValue = this.memo.get(memoKey);
      node.result = memoValue;
      node.status = 'memoized';
      this.addStep({
        type: 'memo-hit',
        currentNodeId: node.id,
        memoKey,
        memoValue,
        message: `Cache hit for fib(${n}): ${memoValue}`,
      });
      return memoValue;
    }

    if (n <= 1) {
      node.result = n;
      this.memo.set(memoKey, n);
      this.addStep({
        type: 'return',
        currentNodeId: node.id,
        memoKey,
        memoValue: n,
        message: `Base case: fib(${n}) = ${n}. Returning and caching.`,
      });
      return n;
    }

    const leftChild = this.createNode(`fib(${n - 1})`, [n - 1]);
    node.children.push(leftChild);
    const leftResult = this.fibMemoized(n - 1, leftChild);

    const rightChild = this.createNode(`fib(${n - 2})`, [n - 2]);
    node.children.push(rightChild);
    const rightResult = this.fibMemoized(n - 2, rightChild);

    const result = leftResult + rightResult;
    node.result = result;
    this.memo.set(memoKey, result);

    this.addStep({
      type: 'return',
      currentNodeId: node.id,
      memoKey,
      memoValue: result,
      message: `fib(${n}) = fib(${n - 1}) + fib(${n - 2}) = ${leftResult} + ${rightResult} = ${result}. Returning and caching.`,
    });

    return result;
  }

  private fibTabulated(n: number): number {
    if (n === 0) {
      this.table = [0];
      this.addStep({ type: 'table', tableIndex: 0, tableValue: 0, message: 'Initialize dp[0] = 0' });
      return 0;
    }
    
    const dp: number[] = new Array(n + 1);
    this.table = dp;
    dp[0] = 0;
    this.addStep({ type: 'table', tableIndex: 0, tableValue: 0, message: 'Initialize dp[0] = 0' });
    dp[1] = 1;
    this.addStep({ type: 'table', tableIndex: 1, tableValue: 1, message: 'Initialize dp[1] = 1' });

    for (let i = 2; i <= n; i++) {
      dp[i] = dp[i - 1] + dp[i - 2];
      this.addStep({
        type: 'table',
        tableIndex: i,
        tableValue: dp[i],
        dependencies: [[0, i - 1], [0, i - 2]],
        message: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}`,
      });
    }

    this.addStep({
      type: 'solution',
      message: `Final result: fib(${n}) = ${dp[n]}`,
      tableValue: dp[n],
    });

    return dp[n];
  }
}
