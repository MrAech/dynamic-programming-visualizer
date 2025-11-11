import { DPSolver } from './DPSolver';
import type { DPStep } from '../types';

export class LCS extends DPSolver {
  getDescription(): string {
    return 'Find the Longest Common Subsequence between two strings.';
  }

  getTimeComplexity() {
    return {
      recursive: 'O(2^(m+n))',
      memoized: 'O(m * n)',
      tabulated: 'O(m * n)',
    };
  }

  getSpaceComplexity() {
    return {
      recursive: 'O(m + n)',
      memoized: 'O(m * n)',
      tabulated: 'O(m * n)',
    };
  }

  solve(input: { str1: string; str2: string }): { memoized: string; tabulated: string } {
    const tableSteps = this.solveTable(input);
    const lastTableStep = tableSteps[tableSteps.length - 1];
    const tabulatedResult = lastTableStep.tableValue;

    return {
      memoized: '', // Not implemented
      tabulated: tabulatedResult as string,
    };
  }

  solveTree(input: { str1: string; str2: string }): DPStep[] {
    this.reset();
    this.tree = this.createNode(`LCS("${input.str1}", "${input.str2}")`, [input.str1, input.str2]);
    this.lcsMemoized(input.str1, input.str2, input.str1.length, input.str2.length, this.tree);
    return this.steps;
  }

  solveMemo(input: { str1: string; str2: string }): DPStep[] {
    this.reset();
    this.tree = this.createNode(`LCS("${input.str1}", "${input.str2}")`, [input.str1, input.str2]);
    this.lcsMemoized(input.str1, input.str2, input.str1.length, input.str2.length, this.tree);
    return this.steps;
  }

  solveTable(input: { str1: string; str2: string }): DPStep[] {
    this.reset();
    this.lcsTabulated(input.str1, input.str2);
    return this.steps;
  }

  private lcsMemoized(str1: string, str2: string, i: number, j: number, node: any): number {
    this.recursiveCalls++;
    
    this.addStep({
      type: 'call',
      currentNodeId: node.id,
      message: `Calling LCS(i=${i}, j=${j})`,
    });

    if (i === 0 || j === 0) {
      node.result = 0;
      this.addStep({
        type: 'return',
        currentNodeId: node.id,
        memoKey: `${i},${j}`,
        memoValue: 0,
        message: `Base case: i=${i} or j=${j} is 0, returning 0`,
      });
      return 0;
    }

    const memoKey = `${i},${j}`;
    if (this.memo.has(memoKey)) {
      const memoValue = this.memo.get(memoKey);
      node.result = memoValue;
      node.status = 'memoized';
      this.addStep({
        type: 'memo-hit',
        currentNodeId: node.id,
        memoKey,
        memoValue,
        message: `Cache hit for LCS(${i}, ${j}): ${memoValue}`,
      });
      return memoValue;
    }

    let result: number;
    if (str1[i - 1] === str2[j - 1]) {
      const childNode = this.createNode(`LCS(${i - 1}, ${j - 1})`, [i - 1, j - 1]);
      node.children.push(childNode);
      result = 1 + this.lcsMemoized(str1, str2, i - 1, j - 1, childNode);
    } else {
      const childNode1 = this.createNode(`LCS(${i - 1}, ${j})`, [i - 1, j]);
      const childNode2 = this.createNode(`LCS(${i}, ${j - 1})`, [i, j - 1]);
      node.children.push(childNode1, childNode2);
      
      const result1 = this.lcsMemoized(str1, str2, i - 1, j, childNode1);
      const result2 = this.lcsMemoized(str1, str2, i, j - 1, childNode2);
      result = Math.max(result1, result2);
    }

    node.result = result;
    this.memo.set(memoKey, result);

    this.addStep({
      type: 'return',
      currentNodeId: node.id,
      memoKey,
      memoValue: result,
      message: `LCS(${i}, ${j}) = ${result}. Returning and caching.`,
    });

    return result;
  }

  private lcsTabulated(str1: string, str2: string): string {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1)
      .fill(0)
      .map(() => Array(n + 1).fill(0));
    this.table = dp;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const dependencies: ([number, number])[] = [];
        let message: string;

        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
          dependencies.push([i - 1, j - 1]);
          message = `Match: '${str1[i - 1]}'. dp[${i}][${j}] = 1 + dp[${i - 1}][${j - 1}] = ${dp[i][j]}`;
        } else {
          const prev1 = dp[i - 1][j];
          const prev2 = dp[i][j - 1];
          dependencies.push([i - 1, j]);
          dependencies.push([i, j - 1]);
          dp[i][j] = Math.max(prev1, prev2);
          message = `No match. dp[${i}][${j}] = max(dp[${i - 1}][${j}], dp[${i}][${j - 1}]) = max(${prev1}, ${prev2}) = ${dp[i][j]}`;
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

    // Backtrack to build the LCS string
    let lcs = '';
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (str1[i - 1] === str2[j - 1]) {
        lcs = str1[i - 1] + lcs;
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    this.addStep({
      type: 'solution',
      message: `LCS: "${lcs}" (length: ${lcs.length})`,
      tableValue: lcs,
    });

    return lcs;
  }
}
