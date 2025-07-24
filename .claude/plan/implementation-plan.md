# Claude Code Mobile 実装計画書

## 1. プロジェクト概要

### 1.1 ビジョン
モバイルデバイスでClaude Codeのフル機能を提供し、開発者がどこでも高度なAI支援開発を行えるようにする。

### 1.2 コアコンセプト
- **iOS**: devContainerによるクラウド実行
- **Android**: Termux統合によるローカル実行（2026年まで）
- **共通**: React Native + Hermesによるクロスプラットフォーム実装

## 2. 技術スタック

### 2.1 フロントエンド
```
React Native + Hermes
├── UI Framework: React Native 0.74+
├── JavaScript Engine: Hermes
├── State Management: Zustand
├── Navigation: React Navigation v6
├── Terminal UI: react-native-webview + xterm.js
├── Styling: NativeWind (TailwindCSS for React Native)
└── Animation: React Native Reanimated 3
```

### 2.2 ネイティブモジュール
```
iOS
├── Swift 5.9+
├── WebSocket: URLSession
├── Keychain: KeychainAccess
├── File System: Document Provider
└── Push Notifications: UserNotifications

Android
├── Kotlin 1.9+
├── Termux Integration: Custom Native Module
├── WebSocket: OkHttp
├── Secure Storage: EncryptedSharedPreferences
└── File System: Storage Access Framework
```

### 2.3 バックエンド（iOS向け）
```
Node.js + TypeScript
├── Framework: Fastify
├── WebSocket: Socket.io
├── Container: Docker + AWS ECS/Fargate
├── Session Storage: Redis
├── File Storage: AWS EFS
├── Authentication: JWT + AWS Cognito
└── Monitoring: OpenTelemetry
```

### 2.4 開発ツール
```
Build & Deploy
├── Metro: React Native bundler
├── EAS Build: Expo Application Services
├── Fastlane: iOS/Android自動化
├── GitHub Actions: CI/CD
└── Sentry: エラー監視
```

## 3. アーキテクチャ設計

### 3.1 全体アーキテクチャ
```
┌─────────────────────────────────────────┐
│          React Native App               │
│  ┌────────────┬────────────────────┐   │
│  │  共通UI    │  Platform Bridge   │   │
│  └────────────┴────────────────────┘   │
│         ↓              ↓                │
│  ┌─────────────┐ ┌─────────────────┐  │
│  │iOS Module   │ │Android Module   │  │
│  └─────────────┘ └─────────────────┘  │
└─────────────────────────────────────────┘
         ↓                    ↓
   AWS Backend           Termux/Local
```

### 3.2 モジュール構成
```
src/
├── app/                    # メインアプリケーション
│   ├── navigation/        # 画面遷移
│   ├── screens/          # 画面コンポーネント
│   └── hooks/            # カスタムフック
├── features/              # 機能別モジュール
│   ├── terminal/         # ターミナル機能
│   ├── editor/           # コードエディタ
│   ├── git/              # Git操作
│   ├── auth/             # 認証
│   └── session/          # セッション管理
├── core/                  # コア機能
│   ├── api/              # API通信
│   ├── storage/          # データ永続化
│   ├── platform/         # プラットフォーム別実装
│   └── utils/            # ユーティリティ
├── ui/                    # UI コンポーネント
│   ├── components/       # 再利用可能コンポーネント
│   ├── theme/            # テーマ設定
│   └── animations/       # アニメーション
└── native/                # ネイティブモジュール
    ├── ios/              # iOS固有実装
    └── android/          # Android固有実装
```

## 4. 主要機能の実装詳細

### 4.1 ターミナル機能

#### 4.1.1 ターミナルエミュレータ
```typescript
// Terminal Component
interface TerminalProps {
  sessionId: string;
  onCommand: (command: string) => void;
  onResize: (cols: number, rows: number) => void;
}

// xterm.js統合
const TerminalView: React.FC = () => {
  return (
    <WebView
      source={{ uri: 'terminal.html' }}
      onMessage={handleTerminalMessage}
      injectedJavaScript={terminalInitScript}
    />
  );
};
```

#### 4.1.2 コマンド処理フロー
```
User Input → Terminal UI → Platform Bridge → 
  iOS: WebSocket → Backend → Claude Code
  Android: Native Module → Termux → Claude Code
```

### 4.2 セッション管理

#### 4.2.1 セッション状態
```typescript
interface Session {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'suspended';
  lastActivity: Date;
  workspaceId: string;
  platform: 'ios' | 'android';
  // iOS specific
  containerId?: string;
  websocketUrl?: string;
  // Android specific
  termuxSessionId?: number;
}
```

#### 4.2.2 セッション永続化
- iOS: CloudKit + Keychain
- Android: EncryptedSharedPreferences + Room DB

### 4.3 ファイルシステム

#### 4.3.1 仮想ファイルシステム
```typescript
interface VirtualFileSystem {
  // ファイル操作
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  
  // ディレクトリ操作
  readDir(path: string): Promise<FileInfo[]>;
  createDir(path: string): Promise<void>;
  
  // 同期
  sync(): Promise<void>;
}
```

#### 4.3.2 プラットフォーム別実装
- **iOS**: Document Provider Extension + iCloud Drive
- **Android**: Storage Access Framework + 内部ストレージ

### 4.4 Git統合

#### 4.4.1 Git操作
```typescript
interface GitManager {
  clone(url: string, branch?: string): Promise<void>;
  checkout(branch: string): Promise<void>;
  commit(message: string): Promise<void>;
  push(): Promise<void>;
  pull(): Promise<void>;
  
  // Worktree対応
  addWorktree(path: string, branch: string): Promise<void>;
  removeWorktree(path: string): Promise<void>;
  listWorktrees(): Promise<Worktree[]>;
}
```

#### 4.4.2 実装方式
- **iOS**: libgit2 または GitHub API
- **Android**: Termux内のgitコマンド直接実行

### 4.5 AI機能統合

#### 4.5.1 Claude Code通信
```typescript
interface ClaudeCodeClient {
  // セッション管理
  startSession(apiKey: string): Promise<void>;
  endSession(): Promise<void>;
  
  // コマンド実行
  sendCommand(command: string): Promise<void>;
  onOutput(callback: (output: string) => void): void;
  
  // ファイル操作通知
  notifyFileChange(path: string, action: 'create' | 'update' | 'delete'): void;
}
```

### 4.6 プッシュ通知

#### 4.6.1 通知タイプ
- タスク完了通知
- エラー発生通知
- セッションタイムアウト警告
- Git操作完了通知

## 5. iOS固有実装

### 5.1 devContainer管理

#### 5.1.1 コンテナライフサイクル
```swift
class DevContainerManager {
    enum ContainerState {
        case provisioning
        case running
        case idle
        case suspended
        case terminated
    }
    
    func provisionContainer(spec: ContainerSpec) async throws -> Container
    func suspendContainer(_ container: Container) async throws
    func resumeContainer(_ container: Container) async throws
    func terminateContainer(_ container: Container) async throws
}
```

#### 5.1.2 AWS統合
```typescript
// ECS Task Definition
{
  "family": "claude-code-mobile",
  "taskRoleArn": "arn:aws:iam::xxx:role/claude-code-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [{
    "name": "claude-code",
    "image": "claude-code-mobile:latest",
    "portMappings": [{
      "containerPort": 8080,
      "protocol": "tcp"
    }],
    "environment": [
      {"name": "NODE_ENV", "value": "production"}
    ],
    "mountPoints": [{
      "sourceVolume": "workspace",
      "containerPath": "/workspace"
    }]
  }]
}
```

### 5.2 WebSocket通信

#### 5.2.1 接続管理
```swift
class WebSocketManager: NSObject {
    private var task: URLSessionWebSocketTask?
    
    func connect(to url: URL) {
        task = URLSession.shared.webSocketTask(with: url)
        task?.resume()
        receiveMessage()
    }
    
    private func receiveMessage() {
        task?.receive { [weak self] result in
            switch result {
            case .success(let message):
                self?.handleMessage(message)
                self?.receiveMessage()
            case .failure(let error):
                self?.handleError(error)
            }
        }
    }
}
```

## 6. Android固有実装

### 6.1 Termux統合

#### 6.1.1 Native Module実装
```kotlin
class TermuxModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {
    
    override fun getName() = "TermuxBridge"
    
    @ReactMethod
    fun executeCommand(command: String, promise: Promise) {
        try {
            val intent = Intent().apply {
                setClassName("com.termux", "com.termux.app.RunCommandService")
                action = "com.termux.RUN_COMMAND"
                putExtra("com.termux.RUN_COMMAND_PATH", "/data/data/com.termux/files/usr/bin/claude-code")
                putExtra("com.termux.RUN_COMMAND_ARGUMENTS", arrayOf(command))
            }
            reactApplicationContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("TERMUX_ERROR", e.message)
        }
    }
}
```

#### 6.1.2 プロセス間通信
```kotlin
// Unix Domain Socket通信
class TermuxIPCClient {
    private val socketPath = "/data/data/com.termux/files/usr/tmp/claude-code.sock"
    
    fun sendMessage(message: String): String {
        val socket = LocalSocket()
        socket.connect(LocalSocketAddress(socketPath))
        // 通信処理
        return response
    }
}
```

### 6.2 ローカルファイルアクセス

#### 6.2.1 Storage Access Framework
```kotlin
class FileSystemModule(reactContext: ReactApplicationContext) {
    @ReactMethod
    fun openDocumentTree(promise: Promise) {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
        currentActivity?.startActivityForResult(intent, REQUEST_CODE)
    }
    
    @ReactMethod
    fun readFile(uri: String, promise: Promise) {
        try {
            val inputStream = contentResolver.openInputStream(Uri.parse(uri))
            val content = inputStream?.bufferedReader()?.readText()
            promise.resolve(content)
        } catch (e: Exception) {
            promise.reject("FILE_ERROR", e.message)
        }
    }
}
```

## 7. UI/UX設計

### 7.1 画面構成

#### 7.1.1 メイン画面
```
┌─────────────────────────────┐
│      Session Tabs           │
├─────────────────────────────┤
│                             │
│      Terminal View          │
│                             │
├─────────────────────────────┤
│    Quick Actions Bar        │
└─────────────────────────────┘
```

#### 7.1.2 画面一覧
1. **スプラッシュ画面**
2. **認証画面**（APIキー入力）
3. **セッション一覧**
4. **ターミナル画面**（メイン）
5. **ファイルエクスプローラー**
6. **Git操作画面**
7. **設定画面**

### 7.2 コンポーネント設計

#### 7.2.1 ターミナルコンポーネント
```typescript
// TerminalScreen.tsx
const TerminalScreen: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>();
  
  return (
    <SafeAreaView style={styles.container}>
      <SessionTabs 
        sessions={sessions}
        activeId={activeSessionId}
        onSwitch={setActiveSessionId}
      />
      <TerminalView 
        sessionId={activeSessionId}
        onCommand={handleCommand}
      />
      <QuickActionsBar 
        onAction={handleQuickAction}
      />
    </SafeAreaView>
  );
};
```

### 7.3 テーマ・スタイリング

#### 7.3.1 カラーパレット
```typescript
const theme = {
  colors: {
    // ダークテーマ（デフォルト）
    background: '#0d1117',
    surface: '#161b22',
    primary: '#58a6ff',
    secondary: '#8b949e',
    error: '#f85149',
    success: '#56d364',
    warning: '#d29922',
    
    // ターミナルカラー
    terminal: {
      background: '#0d1117',
      foreground: '#c9d1d9',
      cursor: '#58a6ff',
      selection: '#264f78',
    }
  }
};
```

## 8. セキュリティ実装

### 8.1 認証情報管理

#### 8.1.1 APIキー保護
```typescript
// iOS: Keychain
import * as Keychain from 'react-native-keychain';

// Android: EncryptedSharedPreferences
import EncryptedStorage from 'react-native-encrypted-storage';

class SecureStorage {
  async setApiKey(key: string): Promise<void> {
    if (Platform.OS === 'ios') {
      await Keychain.setInternetCredentials(
        'claude-code-mobile',
        'api-key',
        key,
        { accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET }
      );
    } else {
      await EncryptedStorage.setItem('api_key', key);
    }
  }
}
```

### 8.2 通信セキュリティ

#### 8.2.1 エンドツーエンド暗号化
```typescript
// WebSocket通信の暗号化
class SecureWebSocket {
  private aesKey: CryptoKey;
  
  async encrypt(message: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    return await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: this.generateIV() },
      this.aesKey,
      data
    );
  }
}
```

## 9. パフォーマンス最適化

### 9.1 React Native最適化

#### 9.1.1 Hermes設定
```javascript
// android/app/build.gradle
android {
  ...
  defaultConfig {
    ...
  }
  
  // Hermes有効化
  hermesEnabled = true
}

// ios/Podfile
use_react_native!(
  :hermes_enabled => true
)
```

#### 9.1.2 メモリ管理
```typescript
// 大きなファイルの遅延読み込み
const FileViewer: React.FC<{ path: string }> = ({ path }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadFile = async () => {
      // チャンク読み込み
      const chunks = await readFileInChunks(path, 1024 * 64); // 64KB chunks
      setContent(chunks.join(''));
      setLoading(false);
    };
    
    loadFile();
    
    return () => {
      // メモリクリーンアップ
      setContent('');
    };
  }, [path]);
};
```

### 9.2 ネットワーク最適化

#### 9.2.1 WebSocket再接続
```typescript
class ReconnectingWebSocket {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('maxReconnectAttemptsReached');
      return;
    }
    
    const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, timeout);
  }
}
```

## 10. テスト戦略

### 10.1 テストピラミッド
```
         E2E Tests
       (Detox/Appium)
      /              \
    Integration Tests  
   (React Native Testing Library)
   /                    \
  Unit Tests              
 (Jest + React Testing)    
```

### 10.2 テストカバレッジ目標
- ユニットテスト: 80%以上
- 統合テスト: 主要フローの70%以上
- E2Eテスト: クリティカルパスの100%

## 11. デプロイメント

### 11.1 ビルド設定

#### 11.1.1 環境別設定
```typescript
// config/env.ts
export const config = {
  development: {
    apiUrl: 'http://localhost:3000',
    wsUrl: 'ws://localhost:3000',
  },
  staging: {
    apiUrl: 'https://staging.claudecodemobile.com',
    wsUrl: 'wss://staging.claudecodemobile.com',
  },
  production: {
    apiUrl: 'https://api.claudecodemobile.com',
    wsUrl: 'wss://api.claudecodemobile.com',
  }
};
```

### 11.2 CI/CD パイプライン

#### 11.2.1 GitHub Actions
```yaml
name: Build and Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      
  build-ios:
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build iOS
        run: |
          cd ios
          pod install
          xcodebuild -workspace ClaudeCodeMobile.xcworkspace \
            -scheme ClaudeCodeMobile \
            -configuration Release
            
  build-android:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Android
        run: |
          cd android
          ./gradlew assembleRelease
```

## 12. 監視とアナリティクス

### 12.1 エラー監視
- Sentry統合
- カスタムエラーハンドリング
- クラッシュレポート

### 12.2 使用状況分析
- セッション時間
- 機能使用頻度
- パフォーマンスメトリクス

## 13. 今後の拡張計画

### 13.1 機能拡張
- 音声入力サポート
- コード補完機能
- マルチユーザー対応
- プラグインシステム

### 13.2 プラットフォーム拡張
- iPad最適化
- Apple Watch連携
- Web版（PWA）