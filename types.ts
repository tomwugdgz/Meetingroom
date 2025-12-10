export interface Role {
  id: string;
  name: string;
  title: string;
  avatar: string; // URL or Initials
  systemPrompt: string;
  isExpert?: boolean;
  color?: string;
}

export interface Message {
  id: string;
  roleId: string; // 'user' or Role ID
  roleName: string;
  content: string;
  timestamp: number;
}

export interface MeetingSummary {
  topic: string;
  keyPoints: string[];
  actionItems: { task: string; owner: string; status: 'Pending' | 'InProgress' | 'Done' }[];
  conclusion: string;
  decisionTree?: { step: string; options: string[] }[];
}

export type ViewState = 'setup' | 'meeting';
