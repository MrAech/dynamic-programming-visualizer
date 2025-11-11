import React, { useState, useEffect, useCallback } from 'react';

export interface ProblemConfig {
  id: string;
  name: string;
  description: string;
  inputs: InputField[];
}

export interface InputField {
  name: string;
  label: string;
  type: 'number' | 'text' | 'array';
  placeholder?: string;
  defaultValue?: any;
}

interface ProblemSelectorProps {
  problems: ProblemConfig[];
  selectedProblem: string;
  onProblemChange: (problemId: string) => void;
  onSubmit: (inputs: any) => void;
}

export const ProblemSelector: React.FC<ProblemSelectorProps> = ({
  problems,
  selectedProblem,
  onProblemChange,
  onSubmit,
}) => {
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const currentProblem = problems.find(p => p.id === selectedProblem);

  useEffect(() => {
    if (currentProblem) {
      const defaultInputs = currentProblem.inputs.reduce((acc, input) => {
        let value = input.defaultValue;
        if (input.type === 'array' && typeof value === 'string') {
          value = value.split(',').map(v => {
            const num = parseFloat(v.trim());
            return isNaN(num) ? v.trim() : num;
          });
        } else if (input.type === 'number' && typeof value === 'string') {
          value = parseInt(value, 10);
        }
        acc[input.name] = value;
        return acc;
      }, {} as Record<string, any>);
      setInputs(defaultInputs);
    }
  }, [currentProblem]);

  const handleInputChange = useCallback((name: string, value: string, type: InputField['type']) => {
    setInputs(prev => {
      const newInputs = { ...prev };
      if (type === 'number') {
        newInputs[name] = parseInt(value, 10) || 0;
      } else if (type === 'array') {
        newInputs[name] = value.split(',').map(v => {
          const num = parseFloat(v.trim());
          return isNaN(num) ? v.trim() : num;
        });
      } else {
        newInputs[name] = value;
      }
      return newInputs;
    });
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(inputs);
  }, [inputs, onSubmit]);

  const getInputDisplayValue = (name: string, type: InputField['type']): string => {
    const value = inputs[name];
    if (value === undefined || value === null) return '';
    if (type === 'array' && Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  return (
    <div className="problem-selector">
      <div className="problem-list">
        {problems.map(problem => (
          <button
            key={problem.id}
            className={`problem-btn ${selectedProblem === problem.id ? 'active' : ''}`}
            onClick={() => onProblemChange(problem.id)}
          >
            {problem.name}
          </button>
        ))}
      </div>

      {currentProblem && (
        <div className="problem-config">
          <h3>{currentProblem.name}</h3>
          <p className="problem-description">{currentProblem.description}</p>
          
          <form onSubmit={handleSubmit}>
            {currentProblem.inputs.map(input => (
              <div key={input.name} className="input-group">
                <label htmlFor={input.name}>{input.label}</label>
                <input
                  id={input.name}
                  type={input.type === 'number' ? 'number' : 'text'}
                  placeholder={input.placeholder}
                  value={getInputDisplayValue(input.name, input.type)}
                  onChange={(e) => handleInputChange(input.name, e.target.value, input.type)}
                />
              </div>
            ))}
            <button type="submit" className="submit-btn">
              Visualize
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
