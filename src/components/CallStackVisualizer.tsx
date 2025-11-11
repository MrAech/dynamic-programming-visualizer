import React, { createRef, type RefObject } from 'react';
import type { DPStep } from '../types';

interface CallStackVisualizerProps {
  stack: DPStep[];
  stackFrameRefs: React.MutableRefObject<Map<string, RefObject<HTMLDivElement>>>;
}

export const CallStackVisualizer: React.FC<CallStackVisualizerProps> = ({ stack, stackFrameRefs }) => {
  if (stack.length === 0) {
    return <div className="empty-state">Call stack is empty.</div>;
  }

  return (
    <div className="call-stack-container">
      <div className="call-stack">
        {stack.slice().reverse().map((step, index) => {
          const id = step.currentNodeId!;
          if (!stackFrameRefs.current.has(id)) {
            stackFrameRefs.current.set(id, createRef<HTMLDivElement>());
          }
          const ref = stackFrameRefs.current.get(id)!;

          return (
            <div
              key={id}
              ref={ref}
              className={`stack-frame ${index === 0 ? 'active' : ''}`}
            >
              {step.message}
            </div>
          );
        })}
      </div>
    </div>
  );
};
