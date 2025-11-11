import { DPSolver } from './DPSolver';
import type { TreeNode, DPStep } from '../types';

interface KnapsackItem {
  weight: number;
  value: number;
  name: string;
}

export class Knapsack extends DPSolver {
  private items: KnapsackItem[] = [];

  getDescription(): string {
    return '0/1 Knapsack: Maximize value while staying within weight capacity. Each item can be taken at most once.';
  }

  getTimeComplexity() {
    return {
      recursive: 'O(2^n)',
      memoized: 'O(n * W)',
      tabulated: 'O(n * W)',
    };
  }

  getSpaceComplexity() {
    return {
      recursive: 'O(n)',
      memoized: 'O(n * W)',
      tabulated: 'O(n * W)',
    };
  }

  solve(input: { items: KnapsackItem[]; capacity: number }): { memoized: number; tabulated: number } {
    this.items = input.items;

    const memoSteps = this.solveMemo(input);
    const lastMemoStep = memoSteps[memoSteps.length - 1];
    const memoizedResult = lastMemoStep.memoValue;

    const tableSteps = this.solveTable(input);
    const lastTableStep = tableSteps[tableSteps.length - 1];
    const tabulatedResult = lastTableStep.tableValue;

    return {
      memoized: memoizedResult,
      tabulated: tabulatedResult,
    };
  }

  solveTree(input: { items: KnapsackItem[]; capacity: number }): DPStep[] {
    this.items = input.items;
    this.reset();
    this.tree = this.createNode(`ks(${this.items.length - 1}, ${input.capacity})`, [this.items.length - 1, input.capacity]);
    this.knapsackMemoized(this.items.length - 1, input.capacity, this.tree);
    return this.steps;
  }

  solveMemo(input: { items: KnapsackItem[]; capacity: number }): DPStep[] {
    this.items = input.items;
    this.reset();
    this.tree = this.createNode(`ks(${this.items.length - 1}, ${input.capacity})`, [this.items.length - 1, input.capacity]);
    this.knapsackMemoized(this.items.length - 1, input.capacity, this.tree);
    return this.steps;
  }

  solveTable(input: { items: KnapsackItem[]; capacity: number }): DPStep[] {
    this.items = input.items;
    this.reset();
    this.knapsackTabulated(input.capacity);
    return this.steps;
  }

  private knapsackMemoized(index: number, capacity: number, node: TreeNode): number {
    this.recursiveCalls++;

    this.addStep({
      type: 'call',
      currentNodeId: node.id,
      message: `Calling ks(${index}, ${capacity})`,
    });

    if (index < 0 || capacity <= 0) {
      node.result = 0;
      this.addStep({
        type: 'return',
        currentNodeId: node.id,
        message: `Base case: ${index < 0 ? 'no items left' : 'no capacity'}, returning 0.`,
      });
      return 0;
    }

    const memoKey = `${index},${capacity}`;
    if (this.memo.has(memoKey)) {
      const memoValue = this.memo.get(memoKey);
      node.result = memoValue;
      node.status = 'memoized';
      this.addStep({
        type: 'memo-hit',
        currentNodeId: node.id,
        memoKey,
        memoValue,
        message: `Cache hit for ks(${index}, ${capacity}): ${memoValue}`,
      });
      return memoValue;
    }

    const item = this.items[index];

    // Case 1: Don't include the item
    const withoutChild = this.createNode(`ks(${index - 1}, ${capacity})`, [index - 1, capacity]);
    node.children.push(withoutChild);
    const withoutResult = this.knapsackMemoized(index - 1, capacity, withoutChild);

    let result = withoutResult;
    let message = `Result is from not taking item ${item.name}: ${result}`;

    // Case 2: Include the item (if it fits)
    if (item.weight <= capacity) {
      const withChild = this.createNode(`ks(${index - 1}, ${capacity - item.weight})`, [index - 1, capacity - item.weight]);
      node.children.push(withChild);
      const withResult = item.value + this.knapsackMemoized(index - 1, capacity - item.weight, withChild);
      
      if (withResult > withoutResult) {
        result = withResult;
        message = `Taking item ${item.name} is better. Value: ${withResult}`;
      }
    }

    node.result = result;
    this.memo.set(memoKey, result);

    this.addStep({
      type: 'return',
      currentNodeId: node.id,
      memoKey,
      memoValue: result,
      message: `ks(${index}, ${capacity}) = ${result}. ${message}. Returning and caching.`,
    });

    return result;
  }

  private knapsackTabulated(capacity: number): number {
    const n = this.items.length;
    const dp: number[][] = Array(n + 1)
      .fill(0)
      .map(() => Array(capacity + 1).fill(0));
    this.table = dp;

    for (let i = 1; i <= n; i++) {
      const item = this.items[i - 1];
      for (let w = 1; w <= capacity; w++) {
        const dependencies: ([number, number])[] = [];
        let message: string;

        const withoutItem = dp[i - 1][w];
        dependencies.push([i - 1, w]);

        if (item.weight <= w) {
          const withItem = item.value + dp[i - 1][w - item.weight];
          dependencies.push([i - 1, w - item.weight]);
          dp[i][w] = Math.max(withItem, withoutItem);
          message = `dp[${i}][${w}] = max(with: ${withItem}, without: ${withoutItem}) = ${dp[i][w]}`;
        } else {
          dp[i][w] = withoutItem;
          message = `dp[${i}][${w}] = ${withoutItem} (item too heavy)`;
        }

        this.addStep({
          type: 'table',
          tableIndex: [i, w],
          tableValue: dp[i][w],
          dependencies,
          message,
        });
      }
    }

    const result = dp[n][capacity];
    this.addStep({
      type: 'solution',
      message: `Maximum value: ${result}`,
      tableIndex: [n, capacity],
      tableValue: result,
    });

    return result;
  }
}
