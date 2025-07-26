// グローバルモック設定
global.__DEV__ = true;

// react-native-vector-iconsのモック
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// WebViewのモック
jest.mock('react-native-webview', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('WebView'),
    WebView: () => React.createElement('WebView'),
  };
});

// Safe Area Contextのモック
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// React Navigationのモック
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useIsFocused: () => true,
  };
});