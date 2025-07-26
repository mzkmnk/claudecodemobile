import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();

  const settingItems = [
    {
      title: '技術検証',
      description: '開発中の機能をテスト',
      onPress: () => navigation.navigate('TechVerification' as never),
    },
    {
      title: 'Termux設定',
      description: 'Termux連携の設定（開発予定）',
      onPress: () => {},
    },
    {
      title: 'APIキー管理',
      description: 'Claude APIキーの設定（開発予定）',
      onPress: () => {},
    },
    {
      title: 'テーマ設定',
      description: 'アプリのテーマをカスタマイズ（開発予定）',
      onPress: () => {},
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>設定</Text>
      </View>
      
      {settingItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.settingItem}
          onPress={item.onPress}
          disabled={!item.onPress}
        >
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Text style={styles.settingDescription}>{item.description}</Text>
          </View>
          <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1e3a',
  },
  headerTitle: {
    color: '#a9b1d6',
    fontSize: 24,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1e3a',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: '#a9b1d6',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#565f89',
    fontSize: 14,
  },
  arrow: {
    color: '#565f89',
    fontSize: 18,
    marginLeft: 10,
  },
});