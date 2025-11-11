import React, { useState, useEffect } from 'react';
import type { DPStep } from '../types';

interface DPTableVisualizerProps {
  steps: DPStep[];
  currentStep: number;
  rowLabels?: (string | number)[];
  colLabel?: string;
}

export const DPTableVisualizer: React.FC<DPTableVisualizerProps> = ({ steps, currentStep, rowLabels = [], colLabel = 'Index' }) => {
  const [table, setTable] = useState<(number | string | null)[][]>([]);
  const [messages, setMessages] = useState<(string | null)[][]>([]);
  const [activeCell, setActiveCell] = useState<[number, number] | number | null>(null);
  const [dependencyCells, setDependencyCells] = useState<([number, number])[]>([]);
  const [is1D, setIs1D] = useState(false);
  const [dimensions, setDimensions] = useState({ rows: 1, cols: 1 });

  useEffect(() => {
    // Detect table dimensions from ALL steps (not just current)
    const tableStepsAll = steps.filter(s => s.type === 'table' && s.tableIndex !== undefined);
    
    if (tableStepsAll.length === 0) {
      // No steps yet, don't update dimensions
      return;
    }
    
    const sampleStep = tableStepsAll[0];
    
    let newIs1D = false;
    let numRows = 1;
    let numCols = 1;
    
    if (typeof sampleStep.tableIndex === 'number') {
      newIs1D = true;
      numRows = 1;
      // Find max index for column count from ALL table steps
      const maxIndex = tableStepsAll
        .filter(s => typeof s.tableIndex === 'number')
        .reduce((max, s) => Math.max(max, s.tableIndex as number), 0);
      numCols = maxIndex + 1;
    } else if (Array.isArray(sampleStep.tableIndex)) {
      // Find max dimensions from ALL table steps
      const maxRow = tableStepsAll
        .filter(s => Array.isArray(s.tableIndex))
        .reduce((max, s) => Math.max(max, (s.tableIndex as [number, number])[0]), 0);
      const maxCol = tableStepsAll
        .filter(s => Array.isArray(s.tableIndex))
        .reduce((max, s) => Math.max(max, (s.tableIndex as [number, number])[1]), 0);
      numRows = maxRow + 1;
      numCols = maxCol + 1;
    }
    
    setIs1D(newIs1D);
    setDimensions({ rows: numRows, cols: numCols });
  }, [steps]);

  useEffect(() => {
    const numRows = dimensions.rows;
    const numCols = dimensions.cols;
    const newTable: (number | string | null)[][] = Array(numRows).fill(null).map(() => Array(numCols).fill(null));
    const newMessages: (string | null)[][] = Array(numRows).fill(null).map(() => Array(numCols).fill(null));
    
    let active: [number, number] | number | null = null;
    let dependencies: ([number, number])[] = [];

    const tableSteps = steps.slice(0, currentStep + 1).filter(s => s.type === 'table' || s.type === 'solution');

    tableSteps.forEach(step => {
      if (step.type === 'table') {
        if (typeof step.tableIndex === 'number') {
          // 1D table
          const col = step.tableIndex;
          if (col < numCols) {
            newTable[0][col] = step.tableValue as number;
            newMessages[0][col] = step.message || null;
          }
        } else if (Array.isArray(step.tableIndex)) {
          // 2D table
          const [row, col] = step.tableIndex;
          if (row < numRows && col < numCols) {
            newTable[row][col] = step.tableValue as (number | string);
            newMessages[row][col] = step.message || null;
          }
        }
      }
    });

    const currentTableStep = steps[currentStep];
    if (currentTableStep && currentTableStep.type === 'table') {
      active = currentTableStep.tableIndex as ([number, number] | number);
      dependencies = (currentTableStep.dependencies as ([number, number])[]) || [];
    }
    
    setTable(newTable);
    setMessages(newMessages);
    setActiveCell(active);
    setDependencyCells(dependencies);

  }, [steps, currentStep, dimensions]);

  const getCellStatus = (row: number, col: number) => {
    if (typeof activeCell === 'number') {
      // 1D case
      if (row === 0 && col === activeCell) return 'active';
      // Check dependencies for 1D (they're stored as [0, index])
      if (dependencyCells.some(dep => dep[0] === 0 && dep[1] === col)) {
        return 'dependency';
      }
    } else if (activeCell && Array.isArray(activeCell)) {
      // 2D case
      if (activeCell[0] === row && activeCell[1] === col) return 'active';
      if (dependencyCells.some(dep => dep[0] === row && dep[1] === col)) {
        return 'dependency';
      }
    }
    return '';
  };

  // Render 1D table
  if (is1D) {
    return (
      <div className="dp-table-container">
        <table>
          <thead>
            <tr>
              {Array.from({ length: dimensions.cols }, (_, i) => i).map(i => <th key={i}>{i}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              {Array.from({ length: dimensions.cols }, (_, j) => j).map(j => (
                <td key={j} className={`dp-table-cell ${getCellStatus(0, j)}`}>
                  <div className="cell-content">
                    {table[0]?.[j] === Infinity ? '∞' : (table[0]?.[j] ?? '')}
                  </div>
                  {messages[0]?.[j] && <div className="tooltip">{messages[0]?.[j]}</div>}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // Render 2D table
  return (
    <div className="dp-table-container">
      <table>
        <thead>
          <tr>
            <th>{colLabel}</th>
            {Array.from({ length: dimensions.cols }, (_, i) => i).map(i => <th key={i}>{i}</th>)}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: dimensions.rows }, (_, i) => i).map(i => (
            <tr key={i}>
              <th>{rowLabels.length > 0 ? (rowLabels[i] || i) : i}</th>
              {Array.from({ length: dimensions.cols }, (_, j) => j).map(j => (
                <td key={j} className={`dp-table-cell ${getCellStatus(i, j)}`}>
                  <div className="cell-content">
                    {table[i]?.[j] === Infinity ? '∞' : (table[i]?.[j] ?? '')}
                  </div>
                  {messages[i]?.[j] && <div className="tooltip">{messages[i]?.[j]}</div>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
