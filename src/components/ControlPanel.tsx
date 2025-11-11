import React from 'react';
import { FaPlay, FaPause, FaStepBackward, FaStepForward, FaUndo } from 'react-icons/fa';

interface ControlPanelProps {
  isPlaying: boolean;
  speed: number;
  currentStep: number;
  totalSteps: number;
  onPlayPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onStepForward: () => void;
  onStepBackward: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isPlaying,
  speed,
  currentStep,
  totalSteps,
  onPlayPause,
  onReset,
  onSpeedChange,
  onStepForward,
  onStepBackward,
}) => {
  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  return (
    <>
      <div className="playback-controls">
        <button
          className="control-btn"
          onClick={onStepBackward}
          disabled={currentStep === 0}
          title="Previous Step"
        >
          <FaStepBackward />
        </button>
        <button
          className="control-btn primary"
          onClick={onPlayPause}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <button
          className="control-btn"
          onClick={onStepForward}
          disabled={currentStep >= totalSteps - 1}
          title="Next Step"
        >
          <FaStepForward />
        </button>
        <button
          className="control-btn"
          onClick={onReset}
          title="Reset Visualization"
        >
          <FaUndo />
        </button>
      </div>

      <div className="progress-section">
        <div className="progress-text">
          Step: {currentStep + 1} / {totalSteps}
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="speed-control">
        <label htmlFor="speed-slider">Speed</label>
        <input
          id="speed-slider"
          type="range"
          min="50"
          max="2000"
          step="50"
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
        />
        <span>{speed}ms</span>
      </div>
    </>
  );
};
