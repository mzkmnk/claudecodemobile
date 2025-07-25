/**
 * Claude Code Mobile App
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1a1b26"
      />
      <AppNavigator />
    </>
  );
}

export default App;
