import { create } from 'zustand';
import { ClaudeSession, ClaudeMessage } from '../types';

interface ClaudeStore {
  // セッション管理
  sessions: Map<string, ClaudeSession>;
  activeSessionId: string | null;
  
  // UI状態
  isConnected: boolean;
  isLoading: boolean;
  
  // アクション
  addSession: (session: ClaudeSession) => void;
  setActiveSession: (sessionId: string) => void;
  addMessage: (sessionId: string, message: ClaudeMessage) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  clearSessions: () => void;
}

export const useClaudeStore = create<ClaudeStore>((set) => ({
  sessions: new Map(),
  activeSessionId: null,
  isConnected: false,
  isLoading: false,

  addSession: (session) => {
    set((state) => {
      const newSessions = new Map(state.sessions);
      newSessions.set(session.id, session);
      return { sessions: newSessions };
    });
  },

  setActiveSession: (sessionId) => {
    set({ activeSessionId: sessionId });
  },

  addMessage: (sessionId, message) => {
    set((state) => {
      const newSessions = new Map(state.sessions);
      const session = newSessions.get(sessionId);
      if (session) {
        session.messages.push(message);
        newSessions.set(sessionId, session);
      }
      return { sessions: newSessions };
    });
  },

  setConnected: (connected) => {
    set({ isConnected: connected });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  clearSessions: () => {
    set({ sessions: new Map(), activeSessionId: null });
  },
}));