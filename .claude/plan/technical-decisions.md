# 技術的意思決定記録

## 1. プラットフォーム選択

### 決定: Android優先開発
**理由**:
- Termuxによるローカル実行が可能
- iOSは技術的制限が多い
- 市場に競合が存在しない

**代替案**:
- iOS優先 → 却下（ローカル実行不可）
- 両プラットフォーム同時 → 却下（リソース分散）

## 2. フレームワーク選択

### 決定: React Native + Hermes
**理由**:
- クロスプラットフォーム対応（将来のiOS版）
- Hermesによるパフォーマンス向上
- 豊富なエコシステム

**代替案**:
- Flutter → UIカスタマイズ性で劣る
- Native (Kotlin) → iOS版開発時に再実装必要
- Ionic → パフォーマンス懸念

## 3. ターミナルUI

### 決定: xterm.js + WebView
**理由**:
- 最も成熟したターミナルエミュレータ
- カスタマイズ性が高い
- Web標準技術

**代替案**:
- 自作ターミナル → 開発コスト大
- Native TextView → 機能不足

## 4. Termux連携方式

### 決定: ハイブリッドアプローチ
**内容**:
1. 初期: Intent/クリップボード経由
2. 将来: Unix Domain Socket

**理由**:
- 段階的な実装が可能
- ユーザー体験の向上
- 技術的リスクの分散

## 5. 状態管理

### 決定: Zustand
**理由**:
- 軽量（8KB）
- TypeScript完全対応
- React Hooksベース
- 学習曲線が緩やか

**代替案**:
- Redux → ボイラープレート多い
- MobX → 複雑
- Context API → パフォーマンス懸念

## 6. スタイリング

### 決定: NativeWind (TailwindCSS for RN)
**理由**:
- 開発速度向上
- 一貫性のあるデザインシステム
- レスポンシブ対応容易

**代替案**:
- StyleSheet → 冗長
- Styled Components → バンドルサイズ
- Emotion → React Native対応が限定的

## 7. ナビゲーション

### 決定: React Navigation v6
**理由**:
- デファクトスタンダード
- TypeScript対応
- 豊富なドキュメント

## 8. セキュリティ

### 決定: EncryptedSharedPreferences
**理由**:
- Android標準
- 実装が簡単
- 十分なセキュリティレベル

**代替案**:
- 独自暗号化 → 実装リスク
- Keystore直接利用 → 複雑

## 9. 配布方法

### 決定: F-Droid メイン
**理由**:
- Termuxと同じ配布チャネル
- オープンソース要件に適合
- Google Play制限を回避

**代替案**:
- Google Play → 動的コード実行で却下される
- 独自配布 → 信頼性の問題

## 10. ビルドツール

### 決定: React Native CLI
**理由**:
- 完全なカスタマイズ性
- Native Module開発に必須

**代替案**:
- Expo → Native Module制限
- EAS Build → 後で追加検討

## 11. テスト戦略

### 決定: Jest + React Native Testing Library
**理由**:
- React Native標準
- 豊富なマッチャー
- スナップショットテスト

## 12. CI/CD

### 決定: GitHub Actions
**理由**:
- GitHubとの統合
- 無料枠で十分
- マトリックスビルド対応

## 13. エラー監視

### 決定: Sentry (将来導入)
**理由**:
- React Native完全対応
- 詳細なエラー情報
- パフォーマンス監視

## 14. アナリティクス

### 決定: 最初は実装しない
**理由**:
- プライバシー重視
- 初期は不要
- 後から追加可能

## 15. 開発言語

### 決定: TypeScript
**理由**:
- 型安全性
- IDE サポート
- リファクタリング容易

## 技術的制約

### Termux依存
- 2026年以降の動作は不確実
- 代替策: クラウド版の準備

### Android制限
- 動的コード実行の制限強化
- サイドローディング制限

### パフォーマンス
- React Native WebViewのオーバーヘッド
- 大規模プロジェクトでの動作

## 将来の技術検討

### 中期（6ヶ月）
- WebAssembly統合
- ローカルLLM実行
- P2P同期

### 長期（1年以上）
- 独自ランタイム
- ブラウザ拡張版
- デスクトップ版

## 決定プロセス

1. 技術調査
2. プロトタイプ作成
3. パフォーマンステスト
4. 最終決定
5. 定期的な見直し

これらの決定は、調査結果とベストプラクティスに基づいています。
開発の進行に応じて、必要に応じて見直しを行います。