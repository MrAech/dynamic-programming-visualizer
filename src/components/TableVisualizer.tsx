import React from 'react';

interface TableVisualizerProps {
  table: any[][];
  highlightCell?: [number, number] | number;
}

const formatValue = (value: any) => {
  if (value === undefined || value === null) return '';
  if (value === Infinity) return '∞';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const OneDTable: React.FC<{ row: any[], highlightCell?: number | [number, number] }> = ({ row, highlightCell }) => (
  <div className="table-1d">
    <table>
      <thead>
        <tr>
          {row.map((_, index) => (
            <th key={index} className="header-cell">{index}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {row.map((value, index) => {
            const isHighlighted = typeof highlightCell === 'number' && highlightCell === index;
            const isFilled = value !== undefined && value !== null;
            return (
              <td
                key={index}
                className={`table-cell ${isHighlighted ? 'highlighted' : ''} ${isFilled ? 'filled' : ''}`}
              >
                {formatValue(value)}
              </td>
            );
          })}
        </tr>
      </tbody>
    </table>
  </div>
);

const TwoDTable: React.FC<{ table: any[][], highlightCell?: number | [number, number] }> = ({ table, highlightCell }) => (
  <div className="table-2d">
    <table>
      <thead>
        <tr>
          <th />
          {table[0]?.map((_, colIndex) => (
            <th key={colIndex}>{colIndex}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.map((row, rowIndex) => (
          <tr key={rowIndex}>
            <th>{rowIndex}</th>
            {row.map((value, colIndex) => {
              const isHighlighted =
                Array.isArray(highlightCell) &&
                highlightCell[0] === rowIndex &&
                highlightCell[1] === colIndex;
              const isFilled = value !== undefined && value !== null;
              return (
                <td
                  key={colIndex}
                  className={`${isHighlighted ? 'highlighted' : ''} ${isFilled ? 'filled' : ''}`}
                >
                  {formatValue(value)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const TableVisualizer: React.FC<TableVisualizerProps> = ({ table, highlightCell }) => {
  if (!table || table.length === 0) {
    return null; // Empty state is handled by the parent
  }

  const is2D = table.length > 1 && table.every(row => Array.isArray(row));

  if (is2D) {
    return <TwoDTable table={table} highlightCell={highlightCell} />;
  }
  
  // Treat as 1D table
  return <OneDTable row={table[0] || []} highlightCell={highlightCell} />;
};
