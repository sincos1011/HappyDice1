export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;

export interface RollResult {
  id: string;
  values: DieValue[];
  sum: number;
  timestamp: number;
  aiNarrative?: string;
}

export interface DieProps {
  value: DieValue;
  rolling: boolean;
  delay?: number;
  duration?: number;
}