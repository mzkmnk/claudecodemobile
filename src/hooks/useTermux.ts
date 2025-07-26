import { useEffect, useState } from 'react';
import { useClaudeStore } from '../stores/useClaudeStore';
import TermuxService from '../services/TermuxService';
import { ClaudeMessage, ClaudeSession, TermuxMessage } from '../types';

export const useTermux = () => {
  const {
    sessions,
    activeSessionId,
    isConnected,
    isLoading,
    addSession,
    setActiveSession,
    addMessage,
    setConnected,
    setLoading,
  } = useClaudeStore();

  const [error, setError] = useState<string | null>(null);

  // 初期化
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await TermuxService.connect();
        setConnected(true);
        
        // グローバルメッセージハンドラーを設定
        TermuxService.onMessage('*', handleTermuxMessage);
        
      } catch (err) {
        console.error('Failed to initialize Termux:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setConnected(false);
      } finally {
        setLoading(false);
      }
    };
    
    init();
    return () => {
      TermuxService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeTermux = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await TermuxService.connect();
      setConnected(true);
      
      // グローバルメッセージハンドラーを設定
      TermuxService.onMessage('*', handleTermuxMessage);
      
    } catch (err) {
      console.error('Failed to initialize Termux:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTermuxMessage = (message: TermuxMessage) => {
    if (!message.sessionId) return;

    switch (message.type) {
      case 'SESSION_STARTED':
        console.log(`Session ${message.sessionId} started with PID: ${message.pid}`);
        break;
        
      case 'OUTPUT':
        const outputMessage: ClaudeMessage = {
          id: `msg-${Date.now()}`,
          type: 'text',
          role: 'assistant',
          content: message.data,
          timestamp: message.timestamp || new Date().toISOString(),
          formatted: false,
        };
        addMessage(message.sessionId, outputMessage);
        break;
        
      case 'ERROR':
        const errorMessage: ClaudeMessage = {
          id: `msg-${Date.now()}`,
          type: 'error',
          content: message.data || message.error,
          timestamp: message.timestamp || new Date().toISOString(),
          formatted: true,
        };
        addMessage(message.sessionId, errorMessage);
        break;
        
      case 'PROCESS_EXIT':
        console.log(`Process exited with code: ${message.code}`);
        break;
    }
  };

  const createSession = async (apiKey: string, workingDirectory: string = '/storage/emulated/0') => {
    try {
      setLoading(true);
      const sessionId = `session-${Date.now()}`;
      
      const newSession: ClaudeSession = {
        id: sessionId,
        isActive: true,
        workingDirectory,
        messages: [],
      };
      
      addSession(newSession);
      setActiveSession(sessionId);
      
      // セッション固有のメッセージハンドラーを設定
      TermuxService.onMessage(sessionId, handleTermuxMessage);
      
      // Termuxでセッションを開始
      await TermuxService.startSession(sessionId, apiKey, workingDirectory);
      
      return sessionId;
    } catch (err) {
      console.error('Failed to create session:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendCommand = async (command: string) => {
    if (!activeSessionId) {
      throw new Error('No active session');
    }
    
    try {
      // ユーザーの入力をメッセージとして追加
      const userMessage: ClaudeMessage = {
        id: `msg-${Date.now()}`,
        type: 'text',
        role: 'user',
        content: command,
        timestamp: new Date().toISOString(),
        formatted: false,
      };
      addMessage(activeSessionId, userMessage);
      
      // Termuxにコマンドを送信
      await TermuxService.sendInput(activeSessionId, command);
      
    } catch (err) {
      console.error('Failed to send command:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  const getActiveSession = (): ClaudeSession | null => {
    if (!activeSessionId) return null;
    return sessions.get(activeSessionId) || null;
  };

  return {
    // 状態
    sessions: Array.from(sessions.values()),
    activeSession: getActiveSession(),
    isConnected,
    isLoading,
    error,
    
    // アクション
    createSession,
    sendCommand,
    setActiveSession,
    initializeTermux,
  };
};