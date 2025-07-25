# Claude Code Mobile - Android版実装計画書

## 1. プロジェクト概要

### 1.1 ビジョン
AndroidデバイスでClaude Codeをローカル実行し、モバイルでの本格的なAI支援開発を実現する。

### 1.2 コアコンセプト
- **Termux連携**: バックエンドとしてTermuxを活用
- **モダンUI**: React Native + Hermesによる美しいインターフェース
- **完全ローカル実行**: インターネット接続不要（APIキー認証後）

### 1.3 差別化ポイント
- 市場初のClaude Codeモバイル実装
- Termuxを意識させないモダンなUI/UX
- Git worktree対応による並列開発

## 2. 技術アーキテクチャ

### 2.1 全体構成
```
┌─────────────────────────────────────────┐
│       React Native App (UI層)            │
│  ┌─────────────────────────────────┐    │
│  │  モダンなターミナルUI (xterm.js) │    │
│  │  ファイルエクスプローラー       │    │
│  │  Git管理画面                    │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Native Module (Kotlin)              │
│  - Termux通信ブリッジ                   │
│  - ファイルシステムアクセス             │
│  - プロセス管理                         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Termux (実行環境)                   │
│  - Node.js 18+                          │
│  - Claude Code CLI                      │
│  - Git                                  │
└─────────────────────────────────────────┘
```

### 2.2 技術スタック

#### フロントエンド
```yaml
Framework: React Native 0.74+
JavaScript Engine: Hermes
State Management: Zustand
Navigation: React Navigation v6
Terminal UI: react-native-webview + xterm.js
Styling: NativeWind (TailwindCSS for RN)
Animation: React Native Reanimated 3
Icons: react-native-vector-icons
Storage: @react-native-async-storage/async-storage
```

#### ネイティブ層
```yaml
Language: Kotlin 1.9+
Termux Integration: Custom Native Module
IPC: Unix Domain Socket / Broadcast Intent
File Access: Storage Access Framework
Security: EncryptedSharedPreferences
Background: WorkManager
```

#### 開発ツール
```yaml
Build: React Native CLI
Testing: Jest + React Native Testing Library
Linting: ESLint + Prettier
Type Checking: TypeScript 5.3+
CI/CD: GitHub Actions
Distribution: F-Droid + GitHub Releases
```

## 3. 主要機能実装

### 3.1 Termux連携

#### 3.1.1 初期セットアップフロー
```typescript
interface SetupFlow {
  steps: [
    'checkTermuxInstalled',
    'checkTermuxApiInstalled',
    'installNodeJs',
    'installClaudeCode',
    'configureEnvironment',
    'testConnection'
  ];
}

// SetupManager.ts
class SetupManager {
  async runSetup(): Promise<SetupResult> {
    // 1. Termuxインストール確認
    const termuxInstalled = await this.checkTermuxInstallation();
    if (!termuxInstalled) {
      return { 
        success: false, 
        action: 'INSTALL_TERMUX',
        message: 'TermuxをF-Droidからインストールしてください'
      };
    }
    
    // 2. 初期セットアップコマンド生成
    const setupScript = this.generateSetupScript();
    await Clipboard.setString(setupScript);
    
    // 3. Termux起動
    await Linking.openURL('termux://');
    
    // 4. 接続確認
    return await this.waitForConnection();
  }
  
  private generateSetupScript(): string {
    return `
#!/data/data/com.termux/files/usr/bin/bash
# Claude Code Mobile Setup Script

echo "Claude Code Mobile セットアップを開始します..."

# パッケージ更新
pkg update -y && pkg upgrade -y

# 必要なパッケージをインストール
pkg install -y nodejs-lts git openssh

# Claude Codeをインストール
npm install -g @anthropic-ai/claude-code

# IPCサーバーをセットアップ
mkdir -p ~/claude-code-mobile
cat > ~/claude-code-mobile/server.js << 'EOF'
const net = require('net');
const { spawn } = require('child_process');

const SOCKET_PATH = '/data/data/com.termux/files/usr/tmp/claude-code.sock';

// 既存のソケットを削除
require('fs').unlinkSync(SOCKET_PATH);

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const request = JSON.parse(data.toString());
    
    switch(request.type) {
      case 'EXECUTE':
        const proc = spawn('claude-code', request.args, {
          env: { ...process.env, ...request.env }
        });
        
        proc.stdout.on('data', (output) => {
          socket.write(JSON.stringify({
            type: 'OUTPUT',
            data: output.toString()
          }));
        });
        
        proc.stderr.on('data', (error) => {
          socket.write(JSON.stringify({
            type: 'ERROR',
            data: error.toString()
          }));
        });
        
        proc.on('close', (code) => {
          socket.write(JSON.stringify({
            type: 'EXIT',
            code: code
          }));
        });
        break;
    }
  });
});

server.listen(SOCKET_PATH);
console.log('Claude Code Mobile IPC Server started');
EOF

# サーバーを起動
node ~/claude-code-mobile/server.js &

echo "セットアップ完了！"
    `.trim();
  }
}
```

#### 3.1.2 Native Module実装
```kotlin
// TermuxBridgeModule.kt
package com.claudecodemobile.termux

import com.facebook.react.bridge.*
import java.net.Socket
import java.io.*
import android.net.LocalSocket
import android.net.LocalSocketAddress

class TermuxBridgeModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {
    
    private var socket: LocalSocket? = null
    private val socketPath = "/data/data/com.termux/files/usr/tmp/claude-code.sock"
    
    override fun getName() = "TermuxBridge"
    
    @ReactMethod
    fun connect(promise: Promise) {
        try {
            socket = LocalSocket()
            val address = LocalSocketAddress(socketPath, LocalSocketAddress.Namespace.FILESYSTEM)
            socket?.connect(address)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CONNECTION_ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun executeCommand(command: String, env: ReadableMap, promise: Promise) {
        try {
            val request = JSONObject().apply {
                put("type", "EXECUTE")
                put("args", JSONArray(command.split(" ")))
                put("env", convertEnvMap(env))
            }
            
            val writer = BufferedWriter(OutputStreamWriter(socket?.outputStream))
            writer.write(request.toString())
            writer.flush()
            
            // レスポンスをイベントで送信
            val reader = BufferedReader(InputStreamReader(socket?.inputStream))
            thread {
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    val response = JSONObject(line)
                    sendEvent("TermuxOutput", response.toString())
                }
            }
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("EXECUTION_ERROR", e.message)
        }
    }
    
    private fun sendEvent(eventName: String, data: String) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, data)
    }
}
```

### 3.2 モダンUI実装

#### 3.2.1 メイン画面構成
```typescript
// MainScreen.tsx
const MainScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'files' | 'git'>('terminal');
  const { theme } = useTheme();
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ヘッダー */}
      <Header />
      
      {/* コンテンツエリア */}
      <View style={styles.content}>
        {activeTab === 'terminal' && <TerminalView />}
        {activeTab === 'files' && <FileExplorer />}
        {activeTab === 'git' && <GitManager />}
      </View>
      
      {/* ボトムナビゲーション */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </SafeAreaView>
  );
};
```

#### 3.2.2 ターミナルUI
```typescript
// TerminalView.tsx
const TerminalView: React.FC = () => {
  const webViewRef = useRef<WebView>(null);
  const { executeCommand } = useTermux();
  
  const terminalHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/xterm@5.3.0/css/xterm.css" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0a0e27;
    }
    #terminal {
      width: 100vw;
      height: 100vh;
    }
  </style>
</head>
<body>
  <div id="terminal"></div>
  <script src="https://unpkg.com/xterm@5.3.0/lib/xterm.js"></script>
  <script src="https://unpkg.com/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
  <script src="https://unpkg.com/xterm-addon-web-links@0.9.0/lib/xterm-addon-web-links.js"></script>
  <script>
    const term = new Terminal({
      theme: {
        background: '#0a0e27',
        foreground: '#a9b1d6',
        cursor: '#c0caf5',
        black: '#32344a',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#ad8ee6',
        cyan: '#449dab',
        white: '#9699a8',
        brightBlack: '#444b6a',
        brightRed: '#ff7a93',
        brightGreen: '#b9f27c',
        brightYellow: '#ff9e64',
        brightBlue: '#7da6ff',
        brightMagenta: '#bb9af7',
        brightCyan: '#0db9d7',
        brightWhite: '#acb0d0'
      },
      fontFamily: '"Cascadia Code", "Fira Code", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block'
    });
    
    const fitAddon = new FitAddon.FitAddon();
    const webLinksAddon = new WebLinksAddon.WebLinksAddon();
    
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    
    term.open(document.getElementById('terminal'));
    fitAddon.fit();
    
    // React Nativeとの通信
    term.onData(data => {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'input',
        data: data
      }));
    });
    
    window.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'output') {
        term.write(message.data);
      }
    });
    
    // リサイズ対応
    window.addEventListener('resize', () => fitAddon.fit());
  </script>
</body>
</html>
  `;
  
  return (
    <View style={styles.terminalContainer}>
      <WebView
        ref={webViewRef}
        source={{ html: terminalHTML }}
        onMessage={handleMessage}
        style={styles.webview}
        scrollEnabled={false}
      />
      
      {/* クイックアクションバー */}
      <QuickActionBar />
    </View>
  );
};
```

### 3.3 ファイル管理

#### 3.3.1 ファイルエクスプローラー
```typescript
// FileExplorer.tsx
interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

const FileExplorer: React.FC = () => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  
  const loadDirectory = async (path: string) => {
    const result = await TermuxBridge.executeCommand(`ls -la ${path}`);
    // パース処理
    return parseDirectoryListing(result);
  };
  
  return (
    <View style={styles.explorer}>
      <FlatList
        data={fileTree}
        renderItem={({ item }) => (
          <FileItem 
            file={item}
            onPress={() => handleFilePress(item)}
            isSelected={item.path === selectedFile}
          />
        )}
        keyExtractor={item => item.path}
      />
    </View>
  );
};
```

### 3.4 Git統合

#### 3.4.1 Git操作UI
```typescript
// GitManager.tsx
const GitManager: React.FC = () => {
  const [branches, setBranches] = useState<string[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('');
  const [worktrees, setWorktrees] = useState<Worktree[]>([]);
  
  const createWorktree = async (branch: string) => {
    const path = `/storage/emulated/0/ClaudeCode/worktrees/${branch}`;
    await TermuxBridge.executeCommand(
      `git worktree add ${path} ${branch}`
    );
    await refreshWorktrees();
  };
  
  return (
    <ScrollView style={styles.gitContainer}>
      {/* 現在のブランチ */}
      <View style={styles.currentBranch}>
        <Text style={styles.label}>Current Branch</Text>
        <Text style={styles.branchName}>{currentBranch}</Text>
      </View>
      
      {/* Worktree管理 */}
      <View style={styles.worktreeSection}>
        <Text style={styles.sectionTitle}>Worktrees</Text>
        {worktrees.map(wt => (
          <WorktreeItem 
            key={wt.path}
            worktree={wt}
            onSwitch={() => switchWorktree(wt)}
          />
        ))}
        <Button 
          title="Add Worktree"
          onPress={showAddWorktreeDialog}
        />
      </View>
      
      {/* コミット作成 */}
      <CommitCreator onCommit={createCommit} />
    </ScrollView>
  );
};
```

## 4. 実装フェーズ

### Phase 1: 基盤構築
- [ ] React Nativeプロジェクトセットアップ
- [ ] Termux連携Native Module実装
- [ ] 基本的なUI構築
- [ ] Termuxインストール・セットアップフロー

### Phase 2: コア機能
- [ ] ターミナルUI (xterm.js統合)
- [ ] Claude Code実行機能
- [ ] ファイルエクスプローラー
- [ ] 基本的なGit操作

### Phase 3: 高度な機能
- [ ] Git worktree対応
- [ ] マルチセッション管理
- [ ] コード補完・提案機能
- [ ] プロジェクトテンプレート

### Phase 4: 最適化・公開
- [ ] パフォーマンス最適化
- [ ] UIポリッシュ
- [ ] F-Droid申請準備
- [ ] ドキュメント作成

## 5. セキュリティ考慮事項

### 5.1 APIキー管理
```kotlin
// SecureStorage.kt
class SecureStorage(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
    
    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "claude_code_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
    
    fun saveApiKey(key: String) {
        sharedPreferences.edit().putString("api_key", key).apply()
    }
    
    fun getApiKey(): String? {
        return sharedPreferences.getString("api_key", null)
    }
}
```

### 5.2 通信セキュリティ
- Unix Domain Socketによるローカル通信
- 外部ネットワーク通信の暗号化
- セッショントークンの定期更新

## 6. 配布戦略

### 6.1 F-Droid
- メインの配布チャネル
- 完全なオープンソース要件を満たす
- 自動更新サポート

### 6.2 GitHub Releases
- APK直接ダウンロード
- ベータ版・開発版の配布
- 詳細なリリースノート

### 6.3 将来的な検討
- Google Play Store（制限付き版）
- 独自のF-Droidリポジトリ

## 7. 制限事項と対策

### 7.1 Androidバージョン制限
- Android 7.0以上が必要（Termux要件）
- 2026年以降のTermux動作は不確実

### 7.2 対策
- クラウドフォールバック機能の準備
- ユーザーへの明確な通知
- 代替ソリューションの調査継続

## 8. 成功指標

### 8.1 技術的指標
- Claude Code実行成功率 > 95%
- レスポンスタイム < 200ms
- クラッシュ率 < 0.1%

### 8.2 ユーザー指標
- 日次アクティブユーザー
- セッション継続時間
- 機能利用率

## 9. 今後の展望

### 9.1 短期（3-6ヶ月）
- Android版の安定リリース
- コミュニティフィードバックの収集
- バグ修正と改善

### 9.2 中期（6-12ヶ月）
- iOS版の開発（クラウドベース）
- プラグインシステム
- チーム機能

### 9.3 長期（1年以上）
- エンタープライズ版
- 独自のAIモデル統合
- クロスプラットフォーム完全対応