# モバイルでのコード実行に関する調査結果

## 1. iOSアプリでのコード実行方法

### 既存のiOSアプリの実装方法

#### **Pythonista** （Python実行）
- Python 3.10をサポート（2025年現在）
- 独自のPythonランタイムを内蔵
- NumPy、matplotlib、pandasなどの主要ライブラリを含む
- iOS固有のモジュール（クリップボード、連絡先、写真アクセス等）
- App Storeで承認済み

#### **Scriptable** （JavaScript実行）
- JavaScriptCoreを使用してES6をサポート
- iOS ネイティブ機能との統合（ファイル、カレンダー、リマインダー等）
- ショートカットアプリとの連携
- システム全体で使用可能なスクリプト可能キーボード

#### **Play.js** （Node.js風環境）
- JavaScriptCoreベース
- Node.js APIの部分的な実装
- ローカルファイルシステムアクセス

#### **a-Shell** （Unix環境）
- **ネイティブARM64コンパイル**で高速動作
- Python、Lua、JavaScript、C/C++をサポート
- C/C++はWebAssemblyにコンパイル
- TeXサポート（texlive-2025）
- ffmpegなどのツールも利用可能

#### **iSH** （Linux環境）
- **x86エミュレーション**によるフルLinux環境
- BusyBoxベースのLinux環境
- 実際のLinuxバイナリを実行可能
- パフォーマンスは劣るが互換性は高い

### iOSでの技術的制限と回避方法

1. **JavaScriptCore利用**
   - Apple公式のJavaScriptエンジン
   - JITは使用不可（インタープリタモードのみ）
   - React Native、NativeScriptが採用

2. **WebAssembly**
   - a-ShellがC/C++コンパイルに使用
   - パフォーマンスとセキュリティのバランス

3. **独自ランタイム**
   - Pythonistaのようにインタープリタを内蔵
   - App Store審査で承認される必要あり

4. **node-jsc プロジェクト**
   - Node.jsをJavaScriptCoreで動かす試み
   - 完全なNode.js互換性を目指す

## 2. Androidでのコード実行

### **Termux** - 完全なLinux環境
- **Node.js 18+を直接実行可能**
- npmフルアクセス
- バックグラウンドサービスとして動作
- 制限なしのファイルシステムアクセス
- Git、SSH、その他の開発ツール利用可能

### Android vs iOS 比較

| 機能 | Android (Termux) | iOS |
|------|-----------------|-----|
| Node.js実行 | ✅ ネイティブ実行 | ❌ 不可能 |
| ファイルシステム | ✅ フルアクセス | ❌ サンドボックス制限 |
| バックグラウンド実行 | ✅ 制限なし | ⚠️ 制限あり |
| 動的コード生成 | ✅ 可能 | ❌ 禁止 |
| パッケージマネージャー | ✅ apt, npm等 | ❌ アプリ内蔵のみ |

## 3. Claude Code実装への影響

### iOS実装の現実的な選択肢

1. **ハイブリッドアプローチ（推奨）**
   ```
   iOS App (UI) ←→ WebSocket ←→ サーバー (Claude Code実行)
   ```
   - UIはネイティブまたはReact Native
   - 実際のClaude Code実行はサーバー側

2. **JavaScriptCore + バンドル**
   - WebpackでNode.jsコードをブラウザ互換に変換
   - 限定的な機能のみローカル実行
   - 完全な機能はサーバー依存

3. **a-Shell/iSHアプローチ**
   - WebAssemblyまたはエミュレーション
   - パフォーマンスと互換性のトレードオフ

### Android実装の可能性

**Termuxを使えば理論的にはClaude Codeをローカル実行可能**
- Node.js 18+が動作
- npmでのインストール可能
- ただし以下の課題：
  - Termux内からのUI制御の複雑さ
  - ユーザー体験の統一性
  - App Store（Google Play）の制限

## 4. 推奨実装戦略

### iOS向け
1. **フェーズ1**: サーバーベースの実装
   - React NativeでUI構築
   - WebSocketでサーバーと通信
   - ローカルはファイル管理とUI表示のみ

2. **フェーズ2**: 部分的なローカル実行
   - JavaScriptCoreで簡単なスクリプト実行
   - オフライン時の限定機能

### クロスプラットフォーム戦略
- **React Native + サーバーAPI**が最も現実的
- iOSとAndroidで同じコードベース
- 将来的にAndroidでTermux統合も検討可能

## 5. 結論

- **iOS**: Claude Codeの完全なローカル実行は**技術的に不可能**
- **Android**: Termuxを使えば**理論的には可能**だが、UX面で課題
- **推奨**: 両プラットフォームでサーバーベースの実装を採用
- **技術選択**: React Native + WebSocket + バックエンドAPI

既存のiOSアプリ（Pythonista、a-Shell等）は独自の方法で制限を回避しているが、Node.jsベースのClaude Codeには適用困難。