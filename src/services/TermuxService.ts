import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';
import { TermuxMessage } from '../types';

// Native Moduleの型定義（後で実装）
interface TermuxBridgeModule {
  connect: (socketPath: string) => Promise<boolean>;
  send: (message: string) => Promise<boolean>;
  startSession: (sessionId: string, apiKey: string, workingDir: string) => Promise<boolean>;
  sendInput: (sessionId: string, input: string) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
}

class TermuxService {
  private termuxBridge: TermuxBridgeModule | null = null;
  private eventEmitter: NativeEventEmitter | null = null;
  private listeners: EmitterSubscription[] = [];
  private messageHandlers: Map<string, (message: TermuxMessage) => void> = new Map();

  constructor() {
    // Native Moduleを初期化（後で実装）
    if (NativeModules.TermuxBridge) {
      this.termuxBridge = NativeModules.TermuxBridge;
      this.eventEmitter = new NativeEventEmitter(NativeModules.TermuxBridge);
    }
  }

  // 開発時のモック実装
  private get mockMode(): boolean {
    return this.termuxBridge === null || __DEV__;
  }

  async connect(): Promise<void> {
    if (this.mockMode) {
      console.log('[TermuxService] Mock mode: Connection established');
      this.handleMessage({
        type: 'SESSION_STARTED',
        sessionId: 'mock-session',
        pid: 12345
      });
      return;
    }

    const socketPath = '/data/data/com.termux/files/usr/tmp/claude-code.sock';
    await this.termuxBridge!.connect(socketPath);
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.eventEmitter) return;

    const dataListener = this.eventEmitter.addListener(
      'TermuxSocketData',
      (data: string) => {
        try {
          const message: TermuxMessage = JSON.parse(data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse Termux data:', error);
        }
      }
    );

    const errorListener = this.eventEmitter.addListener(
      'TermuxSocketError',
      (error: string) => {
        console.error('Termux socket error:', error);
        this.handleMessage({
          type: 'ERROR',
          error: error
        });
      }
    );

    this.listeners.push(dataListener, errorListener);
  }

  async startSession(sessionId: string, apiKey: string, workingDir: string = '/storage/emulated/0'): Promise<void> {
    if (this.mockMode) {
      console.log(`[TermuxService] Mock mode: Starting session ${sessionId}`);
      setTimeout(() => {
        this.handleMessage({
          type: 'SESSION_STARTED',
          sessionId,
          pid: Math.floor(Math.random() * 10000)
        });
      }, 1000);
      return;
    }

    await this.termuxBridge!.startSession(sessionId, apiKey, workingDir);
  }

  async sendInput(sessionId: string, input: string): Promise<void> {
    if (this.mockMode) {
      console.log(`[TermuxService] Mock mode: Sending input: ${input}`);
      // モックレスポンス
      setTimeout(() => {
        this.handleMessage({
          type: 'OUTPUT',
          sessionId,
          data: `Mock response for: ${input}\n`,
          timestamp: new Date().toISOString()
        });
      }, 500);
      return;
    }

    await this.termuxBridge!.sendInput(sessionId, input);
  }

  onMessage(sessionId: string, handler: (message: TermuxMessage) => void): void {
    this.messageHandlers.set(sessionId, handler);
  }

  private handleMessage(message: TermuxMessage): void {
    // セッション固有のハンドラー
    if (message.sessionId) {
      const handler = this.messageHandlers.get(message.sessionId);
      if (handler) {
        handler(message);
      }
    }

    // グローバルハンドラー
    const globalHandler = this.messageHandlers.get('*');
    if (globalHandler) {
      globalHandler(message);
    }
  }

  async disconnect(): Promise<void> {
    this.listeners.forEach(listener => listener.remove());
    this.listeners = [];
    this.messageHandlers.clear();

    if (!this.mockMode && this.termuxBridge) {
      await this.termuxBridge.disconnect();
    }
  }
}

export default new TermuxService();