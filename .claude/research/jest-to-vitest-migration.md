# Jest から Vitest への移行調査

## 概要

React NativeプロジェクトにおけるJestからVitestへの移行可能性について調査した結果をまとめます。

## 現在の状況

### React Native 0.80.2 のテスト環境
- デフォルトテストランナー: Jest
- 設定: `jest.config.js`
- React Native専用preset: `@react-native/babel-preset`

## Vitestの特徴

### メリット
1. **高速**: ESMネイティブサポート、並列実行
2. **設定が少ない**: Viteベースでゼロコンフィグ
3. **TypeScript対応**: ネイティブサポート
4. **HMR対応**: テストのホットリロード
5. **Jest互換API**: 移行が容易

### デメリット
1. **React Native非対応**: 現時点でReact Nativeのサポートなし
2. **Node環境限定**: ブラウザ/DOMテストに特化
3. **プリセット不足**: React Native固有の設定が必要

## 技術的課題

### 1. React Native環境の特殊性
```javascript
// React Nativeでは以下のようなモックが必要
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: jest.fn(),
  },
  NativeModules: {
    TermuxBridge: {
      connect: jest.fn(),
    },
  },
}));
```

### 2. Metro Bundlerとの統合
- VitestはViteベース、React NativeはMetro使用
- トランスパイル設定の違い

### 3. Native Moduleのモック
- React Native固有のNative Moduleモックが困難
- Platform固有のテストが複雑

## 移行評価

### 現時点での結論: **非推奨**

理由：
1. React Nativeの公式サポートがない
2. 既存のエコシステムとの互換性問題
3. 移行コストに見合うメリットが少ない

## 代替案

### 1. Jest最適化
```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
  testPathIgnorePatterns: ['\\.snap$', '<rootDir>/node_modules/'],
  cacheDirectory: '.jest/cache',
  // パフォーマンス改善
  maxWorkers: '50%',
  testTimeout: 10000,
};
```

### 2. React Native Testing Library
```bash
npm install --save-dev @testing-library/react-native
```

より良いテスト体験のため、React Native Testing Libraryの活用を推奨。

### 3. Fast Refresh活用
開発中のテスト実行にはJestのwatchモードを使用：
```bash
npm test -- --watch
```

## 推奨アプローチ

### 1. Jestを継続使用
- React Nativeエコシステムとの親和性
- 豊富なドキュメントとサポート
- 安定性

### 2. テストパフォーマンス改善
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
  }
}
```

### 3. TDD実践のための設定
```javascript
// jest.setup.js
import '@testing-library/jest-native/extend-expect';

// グローバルモック
global.__DEV__ = true;

// タイムアウト設定
jest.setTimeout(10000);
```

## まとめ

現時点ではReact NativeプロジェクトでのVitest使用は推奨されません。Jestを使用し、以下のベストプラクティスに従うことを推奨：

1. React Native Testing Libraryの活用
2. 適切なモック戦略
3. TDDサイクルの実践
4. パフォーマンス最適化設定

将来的にVitestがReact Nativeをサポートした場合、再評価の価値があります。