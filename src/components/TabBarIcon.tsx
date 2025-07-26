import React from 'react';
import Icon from '@react-native-vector-icons/material-icons';

interface TabBarIconProps {
  route: { name: string };
  color: string;
  size: number;
}

export const TabBarIcon: React.FC<TabBarIconProps> = ({ route, color, size }) => {

  const getIconName = (routeName: string): 'terminal' | 'folder' | 'source' | 'settings' | 'help' => {
    switch (routeName) {
      case 'Terminal':
        return 'terminal';
      case 'Files':
        return 'folder';
      case 'Git':
        return 'source';
      case 'Settings':
        return 'settings';
      default:
        return 'help';
    }
  }

  return <Icon name={getIconName(route.name)} size={size} color={color} />;
};