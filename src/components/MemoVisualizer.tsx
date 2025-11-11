import React, { createRef } from 'react';
import type { RefObject } from 'react';

interface MemoVisualizerProps {
  memo: Map<string, any>;
  highlightKey?: string;
  memoItemRefs: React.MutableRefObject<Map<string, RefObject<HTMLDivElement | null>>>;
}

export const MemoVisualizer: React.FC<MemoVisualizerProps> = ({ memo, highlightKey, memoItemRefs }) => {
  const entries = Array.from(memo.entries());
  
  return (
    <div className="memo-grid">
      {entries.map(([key, value]) => {
        if (!memoItemRefs.current.has(key)) {
          memoItemRefs.current.set(key, createRef<HTMLDivElement>());
        }
        const ref = memoItemRefs.current.get(key)!;

        return (
          <div
            key={key}
            ref={ref}
            className={`memo-item ${highlightKey === key ? 'flash' : ''}`}
          >
            <span className="memo-key">{key}</span>
            <span className="memo-arrow">→</span>
            <span className="memo-value">
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
