import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface TabBarIconProps {
  route: { name: string };
  color: string;
  size: number;
}

export const TabBarIcon: React.FC<TabBarIconProps> = ({ route, color, size }) => {
  let iconName: string;

  switch (route.name) {
    case 'Terminal':
      iconName = 'terminal';
      break;
    case 'Files':
      iconName = 'folder';
      break;
    case 'Git':
      iconName = 'source';
      break;
    case 'Settings':
      iconName = 'settings';
      break;
    default:
      iconName = 'help';
  }

  return <Icon name={iconName} size={size} color={color} />;
};