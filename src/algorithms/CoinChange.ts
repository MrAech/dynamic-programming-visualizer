import { DPSolver } from './DPSolver';
import type { TreeNode, DPStep } from '../types';

export class CoinChange extends DPSolver {
  private coins: number[] = [];

  getDescription(): string {
    return 'Find the minimum number of coins needed to make a target amount.';
  }

  getTimeComplexity() {
    return {
      recursive: 'O(c^a)', // c = number of coins, a = amount
      memoized: 'O(c * a)',
      tabulated: 'O(c * a)',
    };
  }

  getSpaceComplexity() {
    return {
      recursive: 'O(a)',
      memoized: 'O(a)',
      tabulated: 'O(c * a)',
    };
  }

  solve(input: { coins: number[]; amount: number }): { memoized: number; tabulated: number } {
    this.coins = input.coins.sort((a, b) => a - b);
    
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

  solveTree(input: { coins: number[]; amount: number }): DPStep[] {
    this.coins = input.coins.sort((a, b) => a - b);
    this.reset();
    this.tree = this.createNode(`minCoins(${input.amount})`, [input.amount]);
    this.coinChangeMemoized(input.amount, this.tree);
    return this.steps;
  }

  solveMemo(input: { coins: number[]; amount: number }): DPStep[] {
    this.coins = input.coins.sort((a, b) => a - b);
    this.reset();
    this.tree = this.createNode(`minCoins(${input.amount})`, [input.amount]);
    this.coinChangeMemoized(input.amount, this.tree);
    return this.steps;
  }

  solveTable(input: { coins: number[]; amount: number }): DPStep[] {
    this.coins = input.coins.sort((a, b) => a - b);
    this.reset();
    this.coinChangeTabulated(input.amount);
    return this.steps;
  }

  private coinChangeMemoized(amount: number, node: TreeNode): number {
    this.recursiveCalls++;
    
    this.addStep({
      type: 'call',
      currentNodeId: node.id,
      message: `Calling minCoins(${amount})`,
    });

    if (amount < 0) {
      this.addStep({
        type: 'return',
        currentNodeId: node.id,
        message: `Amount is negative, returning Infinity.`,
      });
      return Infinity;
    }

    if (amount === 0) {
      node.result = 0;
      this.addStep({
        type: 'return',
        currentNodeId: node.id,
        memoKey: '0',
        memoValue: 0,
        message: `Base case: amount is 0, returning 0.`,
      });
      return 0;
    }

    const memoKey = `${amount}`;
    if (this.memo.has(memoKey)) {
      const memoValue = this.memo.get(memoKey);
      node.result = memoValue;
      node.status = 'memoized';
      this.addStep({
        type: 'memo-hit',
        currentNodeId: node.id,
        memoKey,
        memoValue,
        message: `Cache hit for minCoins(${amount}): ${memoValue}`,
      });
      return memoValue;
    }

    let minCoins = Infinity;
    
    for (const coin of this.coins) {
      const childNode = this.createNode(`minCoins(${amount - coin})`, [amount - coin]);
      node.children.push(childNode);
      const result = this.coinChangeMemoized(amount - coin, childNode);
      if (result !== Infinity) {
        minCoins = Math.min(minCoins, result + 1);
      }
    }

    node.result = minCoins;
    this.memo.set(memoKey, minCoins);

    this.addStep({
      type: 'return',
      currentNodeId: node.id,
      memoKey,
      memoValue: minCoins,
      message: `minCoins(${amount}) = ${minCoins === Infinity ? 'impossible' : minCoins}. Returning and caching.`,
    });

    return minCoins;
  }

  private coinChangeTabulated(amount: number): number {
    const n = this.coins.length;
    const dp: number[][] = Array(n + 1)
      .fill(0)
      .map(() => Array(amount + 1).fill(Infinity));
    this.table = dp;

    for (let i = 0; i <= n; i++) {
      dp[i][0] = 0;
      this.addStep({
        type: 'table',
        tableIndex: [i, 0],
        tableValue: 0,
        message: `Base case: For amount 0, 0 coins are needed.`,
        dependencies: [],
      });
    }

    for (let i = 1; i <= n; i++) {
      const coin = this.coins[i - 1];
      for (let j = 1; j <= amount; j++) {
        const dependencies: ([number, number])[] = [];
        let message: string;

        const withoutCoin = dp[i - 1][j];
        dependencies.push([i - 1, j]);

        if (coin <= j) {
          const withCoin = dp[i][j - coin] + 1;
          dependencies.push([i, j - coin]);
          dp[i][j] = Math.min(withoutCoin, withCoin);
          message = `dp[${i}][${j}] = min(without: ${withoutCoin}, with: 1 + ${dp[i][j - coin]}) = ${dp[i][j]}`;
        } else {
          dp[i][j] = withoutCoin;
          message = `dp[${i}][${j}] = ${dp[i - 1][j]} (coin ${coin} is too large)`;
        }
        
        this.addStep({
          type: 'table',
          tableIndex: [i, j],
          tableValue: dp[i][j],
          dependencies,
          message,
        });
      }
    }

    const result = dp[n][amount] === Infinity ? -1 : dp[n][amount];
    this.addStep({
      type: 'solution',
      message: `Final result for amount ${amount} is ${result === -1 ? 'impossible' : result}`,
      tableIndex: [n, amount],
      tableValue: result,
    });

    return result;
  }
}
