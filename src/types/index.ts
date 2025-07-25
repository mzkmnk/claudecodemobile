// 基本的な型定義
export interface TermuxMessage {
  type: 'OUTPUT' | 'ERROR' | 'SESSION_STARTED' | 'PROCESS_EXIT' | 'SERVER_ERROR';
  sessionId?: string;
  data?: string;
  code?: number;
  pid?: number;
  error?: string;
  timestamp?: string;
}

export interface ClaudeSession {
  id: string;
  isActive: boolean;
  workingDirectory: string;
  messages: ClaudeMessage[];
}

export interface ClaudeMessage {
  id: string;
  type: 'message' | 'code' | 'tool' | 'error' | 'text';
  role?: 'user' | 'assistant';
  content: any;
  timestamp: string;
  formatted: boolean;
}

export interface NavigationScreens {
  Terminal: undefined;
  Files: undefined;
  Git: undefined;
  Settings: undefined;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  modified?: string;
}

export type TabScreen = 'terminal' | 'files' | 'git' | 'settings';