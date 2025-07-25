# Unix Domain Socket実装調査

## 概要

Termuxとの通信にUnix Domain Socketを使用する実装方法について、既存プロジェクトの調査結果と実装例をまとめます。

## 既存プロジェクトの調査結果

### 1. Claude Code UIプロジェクトの実装パターン

#### WebSocketによるストリーミング実装が主流
既存のClaude Code UIプロジェクトは主にWebSocketを使用していますが、これはブラウザベースのため。モバイルアプリではUnix Domain Socketの方が適しています。

```javascript
// Claude Code UIの実装例（参考）
const { spawn } = require('child_process');
const readline = require('readline');

// Claude CLIを起動
const claude = spawn('claude', ['chat', '--json']);

// readlineでストリーム処理
const rl = readline.createInterface({
  input: claude.stdout,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const data = JSON.parse(line);
    // JSON形式のデータ処理
  } catch (e) {
    // 通常のテキスト出力
  }
});
```

### 2. child_processの出力受け取り方法

#### ストリーミング方式（推奨）
```javascript
const { spawn } = require('child_process');

const claude = spawn('claude-code', [], {
  env: { ...process.env, ANTHROPIC_API_KEY: apiKey }
});

// stdout（標準出力）のストリーミング
claude.stdout.on('data', (chunk) => {
  // リアルタイムで出力を受け取る
  const output = chunk.toString();
  console.log('Output:', output);
});

// stderr（エラー出力）
claude.stderr.on('data', (chunk) => {
  console.error('Error:', chunk.toString());
});

// プロセス終了
claude.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
});
```

#### バッファリング方式
```javascript
const { exec } = require('child_process');

exec('claude-code "create a function"', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  console.log(`Output: ${stdout}`);
  console.error(`Errors: ${stderr}`);
});
```

## Unix Domain Socket実装

### 1. Termux側サーバー実装

```javascript
// ~/claude-code-mobile/server.js
const net = require('net');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SOCKET_PATH = '/data/data/com.termux/files/usr/tmp/claude-code.sock';

// 既存のソケットファイルを削除
if (fs.existsSync(SOCKET_PATH)) {
  fs.unlinkSync(SOCKET_PATH);
}

// 現在のClaude Codeプロセスを管理
const sessions = new Map();

const server = net.createServer((socket) => {
  console.log('Client connected');
  let sessionId = null;
  let claudeProcess = null;
  
  socket.on('data', (data) => {
    try {
      const request = JSON.parse(data.toString());
      
      switch (request.type) {
        case 'START_SESSION':
          sessionId = request.sessionId;
          const apiKey = request.apiKey;
          
          // Claude Codeプロセスを起動
          claudeProcess = spawn('claude-code', [], {
            env: {
              ...process.env,
              ANTHROPIC_API_KEY: apiKey
            },
            cwd: request.workingDirectory || process.env.HOME
          });
          
          sessions.set(sessionId, claudeProcess);
          
          // 標準出力をクライアントに転送
          claudeProcess.stdout.on('data', (output) => {
            socket.write(JSON.stringify({
              type: 'OUTPUT',
              sessionId: sessionId,
              data: output.toString(),
              timestamp: new Date().toISOString()
            }));
          });
          
          // エラー出力
          claudeProcess.stderr.on('data', (error) => {
            socket.write(JSON.stringify({
              type: 'ERROR',
              sessionId: sessionId,
              data: error.toString(),
              timestamp: new Date().toISOString()
            }));
          });
          
          // プロセス終了
          claudeProcess.on('close', (code) => {
            socket.write(JSON.stringify({
              type: 'PROCESS_EXIT',
              sessionId: sessionId,
              code: code,
              timestamp: new Date().toISOString()
            }));
            sessions.delete(sessionId);
          });
          
          // 接続成功を通知
          socket.write(JSON.stringify({
            type: 'SESSION_STARTED',
            sessionId: sessionId,
            pid: claudeProcess.pid
          }));
          break;
          
        case 'SEND_INPUT':
          const process = sessions.get(request.sessionId);
          if (process && process.stdin.writable) {
            process.stdin.write(request.data + '\n');
          }
          break;
          
        case 'STOP_SESSION':
          const processToStop = sessions.get(request.sessionId);
          if (processToStop) {
            processToStop.kill('SIGTERM');
            sessions.delete(request.sessionId);
          }
          break;
      }
    } catch (error) {
      socket.write(JSON.stringify({
        type: 'SERVER_ERROR',
        error: error.message
      }));
    }
  });
  
  socket.on('end', () => {
    console.log('Client disconnected');
    // クリーンアップ
    if (claudeProcess) {
      claudeProcess.kill('SIGTERM');
    }
  });
  
  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

server.listen(SOCKET_PATH, () => {
  console.log(`Server listening on ${SOCKET_PATH}`);
  // ソケットファイルの権限を設定
  fs.chmodSync(SOCKET_PATH, '666');
});

// グレースフルシャットダウン
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  sessions.forEach((process) => {
    process.kill('SIGTERM');
  });
  server.close();
  if (fs.existsSync(SOCKET_PATH)) {
    fs.unlinkSync(SOCKET_PATH);
  }
  process.exit(0);
});
```

### 2. React Native側 Native Module実装

```kotlin
// android/app/src/main/java/com/claudecodemobile/modules/TermuxSocketModule.kt
package com.claudecodemobile.modules

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.net.LocalSocket
import android.net.LocalSocketAddress
import java.io.*
import org.json.JSONObject
import kotlin.concurrent.thread

class TermuxSocketModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {
    
    private var socket: LocalSocket? = null
    private var reader: BufferedReader? = null
    private var writer: BufferedWriter? = null
    private var isConnected = false
    private var readThread: Thread? = null
    
    override fun getName() = "TermuxSocket"
    
    @ReactMethod
    fun connect(socketPath: String, promise: Promise) {
        try {
            socket = LocalSocket()
            val address = LocalSocketAddress(
                socketPath,
                LocalSocketAddress.Namespace.FILESYSTEM
            )
            socket?.connect(address)
            
            reader = BufferedReader(InputStreamReader(socket?.inputStream))
            writer = BufferedWriter(OutputStreamWriter(socket?.outputStream))
            
            isConnected = true
            startReadThread()
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CONNECT_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun send(message: String, promise: Promise) {
        if (!isConnected || writer == null) {
            promise.reject("NOT_CONNECTED", "Socket is not connected")
            return
        }
        
        try {
            writer?.write(message)
            writer?.newLine()
            writer?.flush()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SEND_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun startSession(sessionId: String, apiKey: String, workingDir: String, promise: Promise) {
        val request = JSONObject().apply {
            put("type", "START_SESSION")
            put("sessionId", sessionId)
            put("apiKey", apiKey)
            put("workingDirectory", workingDir)
        }
        
        send(request.toString(), promise)
    }
    
    @ReactMethod
    fun sendInput(sessionId: String, input: String, promise: Promise) {
        val request = JSONObject().apply {
            put("type", "SEND_INPUT")
            put("sessionId", sessionId)
            put("data", input)
        }
        
        send(request.toString(), promise)
    }
    
    private fun startReadThread() {
        readThread = thread {
            try {
                var line: String?
                while (isConnected && reader?.readLine().also { line = it } != null) {
                    line?.let {
                        sendEvent("TermuxSocketData", it)
                    }
                }
            } catch (e: Exception) {
                sendEvent("TermuxSocketError", e.message ?: "Unknown error")
            }
        }
    }
    
    private fun sendEvent(eventName: String, data: String) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, data)
    }
    
    @ReactMethod
    fun disconnect(promise: Promise) {
        try {
            isConnected = false
            readThread?.interrupt()
            reader?.close()
            writer?.close()
            socket?.close()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("DISCONNECT_ERROR", e.message, e)
        }
    }
}
```

### 3. React Native JavaScript側の実装

```typescript
// src/services/TermuxSocketService.ts
import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';

const { TermuxSocket } = NativeModules;
const termuxSocketEmitter = new NativeEventEmitter(TermuxSocket);

interface SocketMessage {
  type: 'OUTPUT' | 'ERROR' | 'SESSION_STARTED' | 'PROCESS_EXIT' | 'SERVER_ERROR';
  sessionId?: string;
  data?: string;
  code?: number;
  pid?: number;
  error?: string;
  timestamp?: string;
}

class TermuxSocketService {
  private listeners: EmitterSubscription[] = [];
  private messageHandlers: Map<string, (message: SocketMessage) => void> = new Map();
  
  async connect(): Promise<void> {
    const socketPath = '/data/data/com.termux/files/usr/tmp/claude-code.sock';
    await TermuxSocket.connect(socketPath);
    
    // データ受信リスナー
    const dataListener = termuxSocketEmitter.addListener(
      'TermuxSocketData',
      (data: string) => {
        try {
          const message: SocketMessage = JSON.parse(data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse socket data:', error);
        }
      }
    );
    
    // エラーリスナー
    const errorListener = termuxSocketEmitter.addListener(
      'TermuxSocketError',
      (error: string) => {
        console.error('Socket error:', error);
      }
    );
    
    this.listeners.push(dataListener, errorListener);
  }
  
  async startSession(sessionId: string, apiKey: string, workingDir: string = '/storage/emulated/0'): Promise<void> {
    await TermuxSocket.startSession(sessionId, apiKey, workingDir);
  }
  
  async sendInput(sessionId: string, input: string): Promise<void> {
    await TermuxSocket.sendInput(sessionId, input);
  }
  
  onMessage(sessionId: string, handler: (message: SocketMessage) => void): void {
    this.messageHandlers.set(sessionId, handler);
  }
  
  private handleMessage(message: SocketMessage): void {
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
    await TermuxSocket.disconnect();
  }
}

export default new TermuxSocketService();
```

### 4. 使用例

```typescript
// src/screens/TerminalScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import TermuxSocketService from '../services/TermuxSocketService';

const TerminalScreen: React.FC = () => {
  const [output, setOutput] = useState<string[]>([]);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // ソケット接続
        await TermuxSocketService.connect();
        
        // メッセージハンドラー設定
        TermuxSocketService.onMessage(sessionId, (message) => {
          switch (message.type) {
            case 'OUTPUT':
              setOutput(prev => [...prev, message.data || '']);
              break;
            case 'ERROR':
              console.error('Claude error:', message.data);
              break;
            case 'SESSION_STARTED':
              console.log('Session started with PID:', message.pid);
              break;
            case 'PROCESS_EXIT':
              console.log('Process exited with code:', message.code);
              break;
          }
        });
        
        // セッション開始
        const apiKey = await SecureStorage.getApiKey();
        await TermuxSocketService.startSession(sessionId, apiKey, '/storage/emulated/0/ClaudeCode');
        
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    };
    
    initializeSession();
    
    return () => {
      TermuxSocketService.disconnect();
    };
  }, [sessionId]);
  
  const sendCommand = async (command: string) => {
    await TermuxSocketService.sendInput(sessionId, command);
  };
  
  return (
    <View>
      {/* ターミナルUI */}
    </View>
  );
};
```

## 重要な考慮事項

### 1. 権限とセキュリティ
- Termuxのソケットファイルへのアクセス権限が必要
- APIキーは暗号化して送信
- セッション管理でリソースリークを防ぐ

### 2. エラーハンドリング
- ソケット切断時の再接続処理
- Claude Codeプロセスの異常終了対応
- タイムアウト処理

### 3. パフォーマンス
- 大量の出力に対するバッファリング
- UIの更新頻度の制御
- メモリ使用量の監視

### 4. 既知の問題
- Node.jsのchild_processでClaude CLIを実行すると、ストリームJSON出力でスタールする可能性
- 長時間使用時のspawn例外（EBADF）への対応が必要

## まとめ

Unix Domain Socketを使用することで、Termuxとの効率的な双方向通信が可能になります。既存のClaude Code UIプロジェクトはWebSocketを使用していますが、モバイルアプリではUnix Domain Socketの方が適しています。実装時は、適切なエラーハンドリングとリソース管理が重要です。