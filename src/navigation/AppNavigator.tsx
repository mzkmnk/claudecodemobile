import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { TerminalScreen } from '../screens/TerminalScreen';
import { FilesScreen } from '../screens/FilesScreen';
import { GitScreen } from '../screens/GitScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TabBarIcon } from '../components/TabBarIcon';

const Tab = createBottomTabNavigator();

const getTabBarIcon = (route: { name: string }, color: string, size: number) => {
  return <TabBarIcon route={route} color={color} size={size} />;
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
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
    </NavigationContainer>
  );
};