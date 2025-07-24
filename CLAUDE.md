# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Claude Code Mobile - AndroidデバイスでClaude Codeをローカル実行するためのモバイルアプリケーション。React Native + Termux連携により、モバイルでの本格的なAI支援開発を実現します。

## Current State

- 調査フェーズ完了、実装計画策定済み
- Android版にフォーカスした開発を開始予定
- React Native + Hermes + Termux連携アーキテクチャ
- 詳細な実装計画は `.claude/plan/` ディレクトリ参照

## Project Structure

```
claudecodemobile/
├── .claude/
│   ├── plan/              # 実装計画書
│   │   ├── android-implementation-plan.md
│   │   ├── development-roadmap.md
│   │   └── technical-decisions.md
│   └── research/          # 調査結果
├── src/                   # (予定) React Nativeソースコード
├── android/               # (予定) Androidネイティブコード
└── README.md
```

## Development Commands (予定)

```bash
# 開発環境起動
npm start

# Android実行
npm run android

# テスト実行
npm test

# ビルド
npm run build:android
```

## Key Technologies

- **Frontend**: React Native + Hermes
- **State Management**: Zustand
- **Terminal UI**: xterm.js + WebView
- **Native Integration**: Kotlin Native Modules
- **Backend**: Termux (ローカル実行環境)

## Language Settings / 言語設定

**IMPORTANT / 重要**: In this project, Claude Code must ALWAYS respond in Japanese. Technical terms can remain in English.

このプロジェクトでは、Claude Codeは**必ず**日本語で返答してください。技術用語は英語のままで問題ありません。

### Examples / 例:

- ✅ 「componentを作成しました」
- ✅ 「TypeScriptの型定義を追加しました」
- ❌ "I've created a new component"
- ❌ "Added TypeScript type definitions"