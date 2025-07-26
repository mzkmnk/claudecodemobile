import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface VerificationItem {
  id: string;
  title: string;
  description: string;
  onPress: () => void;
}

export function TechVerificationScreen() {
  const navigation = useNavigation();

  const verificationItems: VerificationItem[] = [
    {
      id: 'termux-intent',
      title: 'Termux Intent起動テスト',
      description: 'Intent経由でTermuxアプリを起動する',
      onPress: () => {
        navigation.navigate('TermuxIntentTest' as never);
      },
    },
    {
      id: 'termux-command',
      title: 'Termuxコマンド実行テスト',
      description: 'Termuxでコマンドを実行してみる',
      onPress: () => {
        navigation.navigate('TermuxCommandTest' as never);
      },
    },
    {
      id: 'xterm-webview',
      title: 'xterm.js WebView統合テスト',
      description: 'WebViewでxterm.jsが正常に動作するか確認',
      onPress: () => {
        navigation.navigate('XtermWebViewTest' as never);
      },
    },
    {
      id: 'native-module',
      title: 'Native Module作成練習',
      description: '簡単なNative Moduleを作成してテスト',
      onPress: () => {
        navigation.navigate('NativeModuleTest' as never);
      },
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>技術検証</Text>
        <Text style={styles.subtitle}>
          各技術要素の動作確認を行います
        </Text>
      </View>

      <View style={styles.itemsContainer}>
        {verificationItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.item}
            onPress={item.onPress}
            activeOpacity={0.8}
          >
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          注意: これらのテストは実機での動作確認が推奨されます
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  itemsContainer: {
    padding: 15,
  },
  item: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
  },
  info: {
    padding: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});