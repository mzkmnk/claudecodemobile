import type { Config } from 'jest';

const esModules = [
  '@babel',
  '@react-native',
  '@react-native-community',
  '@react-navigation',
  'react-native',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-webview',
  'react-native-vector-icons',
  '@react-native-vector-icons',
  'react-native-gesture-handler'
].join('|');

const config: Config = {
  verbose: true,
  preset: 'react-native',
  transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
  },
};

export default config;