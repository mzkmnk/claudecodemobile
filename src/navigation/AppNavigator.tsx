import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import { TerminalScreen } from '../screens/TerminalScreen';
import { FilesScreen } from '../screens/FilesScreen';
import { GitScreen } from '../screens/GitScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TabBarIcon } from '../components/TabBarIcon';

// 技術検証画面
import { TechVerificationScreen } from '../screens/TechVerification/TechVerificationScreen';
import { TermuxIntentTest } from '../screens/TechVerification/TermuxIntentTest';
import { TermuxCommandTest } from '../screens/TechVerification/TermuxCommandTest';
import { XtermWebViewTest } from '../screens/TechVerification/XtermWebViewTest';
import { NativeModuleTest } from '../screens/TechVerification/NativeModuleTest';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const getTabBarIcon = (route: { name: string }, color: string, size: number) => {
  return <TabBarIcon route={route} color={color} size={size} />;
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => getTabBarIcon(route, color, size),
        tabBarActiveTintColor: '#7aa2f7',
        tabBarInactiveTintColor: '#565f89',
        tabBarStyle: {
          backgroundColor: '#1a1b26',
          borderTopColor: '#292e42',
        },
        headerStyle: {
          backgroundColor: '#1a1b26',
        },
        headerTintColor: '#a9b1d6',
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Terminal"
        component={TerminalScreen}
        options={{ title: 'ターミナル' }}
      />
      <Tab.Screen
        name="Files"
        component={FilesScreen}
        options={{ title: 'ファイル' }}
      />
      <Tab.Screen
        name="Git"
        component={GitScreen}
        options={{ title: 'Git' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: '設定' }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1b26',
          },
          headerTintColor: '#a9b1d6',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TechVerification"
          component={TechVerificationScreen}
          options={{ title: '技術検証' }}
        />
        <Stack.Screen
          name="TermuxIntentTest"
          component={TermuxIntentTest}
          options={{ title: 'Termux Intent起動テスト' }}
        />
        <Stack.Screen
          name="TermuxCommandTest"
          component={TermuxCommandTest}
          options={{ title: 'Termuxコマンド実行テスト' }}
        />
        <Stack.Screen
          name="XtermWebViewTest"
          component={XtermWebViewTest}
          options={{ title: 'xterm.js WebView統合テスト' }}
        />
        <Stack.Screen
          name="NativeModuleTest"
          component={NativeModuleTest}
          options={{ title: 'Native Module作成練習' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};