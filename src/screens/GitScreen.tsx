import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const GitScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Git管理（開発予定）</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#a9b1d6',
    fontSize: 16,
  },
});