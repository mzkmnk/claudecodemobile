# Claude Code UI 双方向通信実装分析

## 概要

Claude Code UIプロジェクトがどのようにClaude Codeとの双方向通信を実装し、データを正規化してフロントエンドに表示しているかを調査した結果をまとめます。

## 1. 主要な実装パターン

### 1.1 基本アーキテクチャ
```
Claude CLI → child_process → Node.js Server → WebSocket → React Frontend
```

### 1.2 データフロー
1. Claude CLIをchild_processでspawn
2. stdout/stderrからJSONL形式でデータ受信
3. 各行をJSONとしてパース
4. WebSocketでフロントエンドにストリーミング
5. Reactでメッセージタイプ別に表示

## 2. バックエンド実装

### 2.1 Claude CLIプロセスの起動

```javascript
// siteboon/claudecodeui の実装例
const { spawn } = require('child_process');
const readline = require('readline');

class ClaudeSession {
  constructor(sessionId, workingDir, apiKey) {
    this.sessionId = sessionId;
    this.workingDir = workingDir;
    this.apiKey = apiKey;
    this.messages = [];
    this.isActive = false;
  }

  start() {
    // Claude CLIを起動（JSONストリーミングモード）
    this.process = spawn('claude', ['chat', '--json-stream'], {
      cwd: this.workingDir,
      env: {
        ...process.env,
        CLAUDE_API_KEY: this.apiKey
      }
    });

    this.isActive = true;
    this.setupOutputHandlers();
  }

  setupOutputHandlers() {
    // stdout用のreadlineインターフェース
    const rlOut = readline.createInterface({
      input: this.process.stdout,
      crlfDelay: Infinity
    });

    // 各行をJSONとしてパース
    rlOut.on('line', (line) => {
      try {
        const data = JSON.parse(line);
        this.handleClaudeOutput(data);
      } catch (e) {
        // JSON以外の出力（デバッグメッセージなど）
        this.handleRawOutput(line);
      }
    });

    // エラー出力も同様に処理
    const rlErr = readline.createInterface({
      input: this.process.stderr,
      crlfDelay: Infinity
    });

    rlErr.on('line', (line) => {
      this.handleErrorOutput(line);
    });

    // プロセス終了ハンドリング
    this.process.on('close', (code) => {
      this.isActive = false;
      this.onClose(code);
    });
  }

  handleClaudeOutput(data) {
    // JSONデータの構造を正規化
    const message = this.normalizeMessage(data);
    this.messages.push(message);
    this.emit('message', message);
  }

  normalizeMessage(rawData) {
    // Claude出力の正規化
    return {
      id: rawData.id || generateId(),
      type: rawData.type || 'message',
      role: rawData.role || 'assistant',
      content: rawData.content || '',
      timestamp: new Date().toISOString(),
      metadata: {
        model: rawData.model,
        usage: rawData.usage,
        stopReason: rawData.stop_reason
      }
    };
  }
}
```

### 2.2 WebSocketサーバー実装

```javascript
// WebSocketでフロントエンドと通信
const WebSocket = require('ws');
const express = require('express');

class ClaudeWebSocketServer {
  constructor(port) {
    this.app = express();
    this.server = require('http').createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    this.sessions = new Map();
    
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('Client connected');
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleClientMessage(ws, data);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        }
      });

      ws.on('close', () => {
        // セッションクリーンアップ
        this.cleanupClientSessions(ws);
      });
    });
  }

  async handleClientMessage(ws, data) {
    switch (data.type) {
      case 'start_session':
        await this.startSession(ws, data);
        break;
      
      case 'send_message':
        await this.sendToClaude(ws, data);
        break;
      
      case 'stop_session':
        await this.stopSession(ws, data.sessionId);
        break;
    }
  }

  async startSession(ws, data) {
    const session = new ClaudeSession(
      data.sessionId,
      data.workingDir,
      data.apiKey
    );

    // セッションイベントをWebSocketに転送
    session.on('message', (message) => {
      ws.send(JSON.stringify({
        type: 'claude_message',
        sessionId: session.sessionId,
        message: message
      }));
    });

    session.on('error', (error) => {
      ws.send(JSON.stringify({
        type: 'session_error',
        sessionId: session.sessionId,
        error: error
      }));
    });

    session.start();
    this.sessions.set(data.sessionId, { session, ws });

    ws.send(JSON.stringify({
      type: 'session_started',
      sessionId: data.sessionId
    }));
  }

  async sendToClaude(ws, data) {
    const sessionData = this.sessions.get(data.sessionId);
    if (!sessionData) {
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Session not found'
      }));
      return;
    }

    // Claude CLIに入力を送信
    sessionData.session.process.stdin.write(data.message + '\n');
  }
}
```

### 2.3 出力データの正規化

```javascript
// 様々な形式のClaude出力を統一フォーマットに変換
class MessageNormalizer {
  static normalize(rawOutput) {
    // ストリーミングテキスト
    if (typeof rawOutput === 'string') {
      return {
        type: 'text',
        content: rawOutput,
        formatted: false
      };
    }

    // JSON応答
    if (rawOutput.type === 'message') {
      return {
        type: 'message',
        role: rawOutput.role,
        content: this.parseContent(rawOutput.content),
        formatted: true
      };
    }

    // コードブロック
    if (rawOutput.type === 'code_block') {
      return {
        type: 'code',
        language: rawOutput.language || 'plaintext',
        content: rawOutput.content,
        filename: rawOutput.filename,
        formatted: true
      };
    }

    // ツール使用（ファイル操作など）
    if (rawOutput.type === 'tool_use') {
      return {
        type: 'tool',
        tool: rawOutput.tool_name,
        input: rawOutput.input,
        output: rawOutput.output,
        formatted: true
      };
    }

    // エラー
    if (rawOutput.type === 'error') {
      return {
        type: 'error',
        message: rawOutput.message,
        stack: rawOutput.stack,
        formatted: true
      };
    }

    // デフォルト
    return {
      type: 'unknown',
      data: rawOutput,
      formatted: false
    };
  }

  static parseContent(content) {
    if (typeof content === 'string') {
      // Markdownのコードブロックを検出
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = codeBlockRegex.exec(content)) !== null) {
        // コードブロック前のテキスト
        if (match.index > lastIndex) {
          parts.push({
            type: 'text',
            content: content.slice(lastIndex, match.index)
          });
        }

        // コードブロック
        parts.push({
          type: 'code',
          language: match[1] || 'plaintext',
          content: match[2]
        });

        lastIndex = match.index + match[0].length;
      }

      // 残りのテキスト
      if (lastIndex < content.length) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex)
        });
      }

      return parts.length > 0 ? parts : [{ type: 'text', content }];
    }

    return content;
  }
}
```

## 3. フロントエンド実装

### 3.1 WebSocket接続とメッセージ処理

```typescript
// React フロントエンドの実装例
import { useEffect, useState, useCallback } from 'react';

interface ClaudeMessage {
  id: string;
  type: 'message' | 'code' | 'tool' | 'error';
  role?: 'user' | 'assistant';
  content: any;
  timestamp: string;
  formatted: boolean;
}

export function useClaudeSession(sessionId: string) {
  const [messages, setMessages] = useState<ClaudeMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:8080');
    
    websocket.onopen = () => {
      setIsConnected(true);
      // セッション開始
      websocket.send(JSON.stringify({
        type: 'start_session',
        sessionId: sessionId,
        workingDir: '/path/to/project',
        apiKey: getApiKey()
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleServerMessage(data);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      setIsConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [sessionId]);

  const handleServerMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'claude_message':
        setMessages(prev => [...prev, data.message]);
        break;
      
      case 'session_error':
        console.error('Session error:', data.error);
        break;
      
      case 'session_started':
        console.log('Session started successfully');
        break;
    }
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify({
        type: 'send_message',
        sessionId: sessionId,
        message: message
      }));
    }
  }, [ws, isConnected, sessionId]);

  return { messages, sendMessage, isConnected };
}
```

### 3.2 メッセージ表示コンポーネント

```tsx
// メッセージタイプ別の表示コンポーネント
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';

interface MessageDisplayProps {
  message: ClaudeMessage;
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
  switch (message.type) {
    case 'message':
      return <MessageContent message={message} />;
    
    case 'code':
      return <CodeBlock message={message} />;
    
    case 'tool':
      return <ToolUsage message={message} />;
    
    case 'error':
      return <ErrorDisplay message={message} />;
    
    default:
      return <RawDisplay message={message} />;
  }
};

const MessageContent: React.FC<{ message: ClaudeMessage }> = ({ message }) => {
  const renderContent = (content: any) => {
    if (Array.isArray(content)) {
      return content.map((part, index) => {
        if (part.type === 'text') {
          return (
            <ReactMarkdown key={index}>
              {part.content}
            </ReactMarkdown>
          );
        } else if (part.type === 'code') {
          return (
            <SyntaxHighlighter
              key={index}
              language={part.language}
              style={vscDarkPlus}
            >
              {part.content}
            </SyntaxHighlighter>
          );
        }
        return null;
      });
    }

    if (typeof content === 'string') {
      return <ReactMarkdown>{content}</ReactMarkdown>;
    }

    return <pre>{JSON.stringify(content, null, 2)}</pre>;
  };

  return (
    <div className={`message ${message.role}`}>
      <div className="message-header">
        <span className="role">{message.role}</span>
        <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
      </div>
      <div className="message-content">
        {renderContent(message.content)}
      </div>
    </div>
  );
};

const CodeBlock: React.FC<{ message: ClaudeMessage }> = ({ message }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="language">{message.language}</span>
        {message.filename && <span className="filename">{message.filename}</span>}
        <button onClick={handleCopy} className="copy-button">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={message.language}
        style={vscDarkPlus}
        showLineNumbers
      >
        {message.content}
      </SyntaxHighlighter>
    </div>
  );
};

const ToolUsage: React.FC<{ message: ClaudeMessage }> = ({ message }) => {
  return (
    <div className="tool-usage">
      <div className="tool-header">
        <span className="tool-icon">🔧</span>
        <span className="tool-name">{message.tool}</span>
      </div>
      <div className="tool-input">
        <strong>Input:</strong>
        <pre>{JSON.stringify(message.input, null, 2)}</pre>
      </div>
      {message.output && (
        <div className="tool-output">
          <strong>Output:</strong>
          <pre>{message.output}</pre>
        </div>
      )}
    </div>
  );
};
```

### 3.3 ターミナル風UI実装

```tsx
// ターミナル風のUIコンポーネント
import React, { useRef, useEffect } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalViewProps {
  onInput: (data: string) => void;
  className?: string;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ onInput, className }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (terminalRef.current && !terminal.current) {
      // ターミナル初期化
      terminal.current = new Terminal({
        theme: {
          background: '#1e1e1e',
          foreground: '#cccccc',
          cursor: '#ffffff',
          selection: '#264f78',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
        },
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        cursorBlink: true,
      });

      fitAddon.current = new FitAddon();
      terminal.current.loadAddon(fitAddon.current);

      terminal.current.open(terminalRef.current);
      fitAddon.current.fit();

      // 入力ハンドリング
      terminal.current.onData(onInput);
    }

    // リサイズ対応
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (terminal.current) {
        terminal.current.dispose();
      }
    };
  }, [onInput]);

  // 外部からターミナルに書き込むメソッド
  const write = useCallback((data: string) => {
    if (terminal.current) {
      terminal.current.write(data);
    }
  }, []);

  // 外部に公開
  useImperativeHandle(ref, () => ({
    write,
    clear: () => terminal.current?.clear(),
    focus: () => terminal.current?.focus(),
  }));

  return <div ref={terminalRef} className={className} />;
};
```

## 4. ストリーミングとバッファリング

### 4.1 ストリーミング処理

```javascript
// ストリーミング出力のバッファリングと処理
class StreamingProcessor {
  constructor() {
    this.buffer = '';
    this.incompleteJson = '';
  }

  processChunk(chunk) {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    
    // 最後の不完全な行を保持
    this.buffer = lines.pop() || '';
    
    const messages = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        // 不完全なJSONの処理
        const fullLine = this.incompleteJson + line;
        const data = JSON.parse(fullLine);
        this.incompleteJson = '';
        messages.push(data);
      } catch (e) {
        // JSONが不完全な場合はバッファに追加
        this.incompleteJson += line;
      }
    }
    
    return messages;
  }

  flush() {
    const remaining = this.buffer + this.incompleteJson;
    this.buffer = '';
    this.incompleteJson = '';
    
    if (remaining.trim()) {
      try {
        return [JSON.parse(remaining)];
      } catch (e) {
        return [{ type: 'raw', content: remaining }];
      }
    }
    
    return [];
  }
}
```

### 4.2 レート制限とバックプレッシャー

```javascript
// 大量の出力に対するレート制限
class RateLimitedEmitter extends EventEmitter {
  constructor(maxEventsPerSecond = 30) {
    super();
    this.queue = [];
    this.lastEmitTime = 0;
    this.minInterval = 1000 / maxEventsPerSecond;
    this.processing = false;
  }

  emitThrottled(event, data) {
    this.queue.push({ event, data, timestamp: Date.now() });
    
    if (!this.processing) {
      this.processQueue();
    }
  }

  async processQueue() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastEmit = now - this.lastEmitTime;
      
      if (timeSinceLastEmit < this.minInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minInterval - timeSinceLastEmit)
        );
      }
      
      const { event, data } = this.queue.shift();
      this.emit(event, data);
      this.lastEmitTime = Date.now();
    }
    
    this.processing = false;
  }
}
```

## 5. エラーハンドリングと再接続

### 5.1 自動再接続実装

```typescript
// WebSocket自動再接続
class ReconnectingWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  
  constructor(private url: string) {
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.onOpen();
      };

      this.ws.onmessage = (event) => {
        this.onMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onError(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.onClose();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.onMaxReconnectAttemptsReached();
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms...`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  send(data: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      console.error('WebSocket is not connected');
      this.queueMessage(data);
    }
  }

  // オーバーライド可能なイベントハンドラ
  protected onOpen() {}
  protected onMessage(data: string) {}
  protected onError(error: Event) {}
  protected onClose() {}
  protected onMaxReconnectAttemptsReached() {}
  protected queueMessage(data: string) {}
}
```

## 6. 実装のベストプラクティス

### 6.1 メモリ管理
- メッセージ履歴の上限設定（例：最新1000件のみ保持）
- 大きな出力のチャンク処理
- 不要なセッションの自動クリーンアップ

### 6.2 パフォーマンス最適化
- Virtual scrollingでの大量メッセージ表示
- Web Workerでの重い処理（構文ハイライトなど）
- デバウンス/スロットリングの適切な使用

### 6.3 セキュリティ
- APIキーの安全な管理
- XSS対策（ユーザー入力のサニタイズ）
- WebSocketの認証とセッション管理

## まとめ

Claude Code UIの実装では、以下の要素が重要です：

1. **データの正規化**: 様々な形式の出力を統一フォーマットに変換
2. **ストリーミング処理**: リアルタイムでの出力表示
3. **エラーハンドリング**: 接続エラーやプロセスエラーの適切な処理
4. **UI/UX**: ターミナル風UIとリッチなメッセージ表示の両立
5. **パフォーマンス**: 大量の出力に対する最適化

これらの実装パターンを参考に、モバイルアプリでも同様の機能を実現できます。