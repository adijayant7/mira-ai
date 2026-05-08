export type Role = 'user' | 'assistant';
export type ModelId = 'mira-core' | 'mira-pro' | 'mira-ultra';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  model: ModelId;
}

export interface MiraSettings {
  theme: 'light' | 'dark';
  model: ModelId;
  accentColor: string;
}

export const MODEL_LABELS: Record<ModelId, string> = {
  'mira-core': 'MIRA Core',
  'mira-pro': 'MIRA Pro',
  'mira-ultra': 'MIRA Ultra',
};
