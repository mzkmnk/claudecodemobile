import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ScrollView,
  TextInput,
} from 'react-native';

export function TermuxIntentTest() {
  const [commandInput, setCommandInput] = useState('echo "Hello from Claude Code Mobile"');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testBasicIntent = async () => {
    try {
      addLog('Termuxアプリを起動しています...');
      
      // Termuxのパッケージ名
      const termuxPackage = 'com.termux';
      const url = `intent:#Intent;package=${termuxPackage};end`;
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        addLog('Termuxアプリの起動に成功しました');
      } else {
        addLog('エラー: Termuxアプリがインストールされていません');
        Alert.alert(
          'Termuxが見つかりません',
          'Termuxアプリをインストールしてください',
        );
      }
    } catch (error) {
      addLog(`エラー: ${error}`);
    }
  };

  const testRunCommandIntent = async () => {
    try {
      addLog(`コマンド実行を試みています: ${commandInput}`);
      
      // Termux:Taskerを使用したコマンド実行
      // 注: 実際にはTermux:Taskerプラグインが必要
      const termuxTaskerIntent = `am start -n com.termux/.app.TermuxActivity --es com.termux.execute.command "${commandInput}"`;
      
      addLog('注: この機能にはTermux:Taskerプラグインが必要です');
      addLog(`Intent URL: ${termuxTaskerIntent}`);
      
      // 実際の実装では、Native Moduleを使用してIntentを送信
      Alert.alert(
        'Intent情報',
        `以下のIntentを送信します:\n\n${termuxTaskerIntent}`,
        [
          {
            text: 'OK',
            onPress: () => addLog('Intent送信をシミュレートしました'),
          },
        ],
      );
    } catch (error) {
      addLog(`エラー: ${error}`);
    }
  };

  const testTermuxApiIntent = async () => {
    try {
      addLog('Termux:API経由でのアクセスをテスト中...');
      
      // Termux:APIのパッケージ名
      const termuxApiPackage = 'com.termux.api';
      const url = `intent:#Intent;package=${termuxApiPackage};end`;
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        addLog('Termux:APIが利用可能です');
        Alert.alert('成功', 'Termux:APIが検出されました');
      } else {
        addLog('Termux:APIがインストールされていません');
        Alert.alert(
          'Termux:APIが必要です',
          'Termux:APIをインストールしてください',
        );
      }
    } catch (error) {
      addLog(`エラー: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('ログをクリアしました');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Termux Intent起動テスト</Text>
        <Text style={styles.description}>
          Android IntentシステムでTermuxアプリと連携する機能をテストします
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>基本的な起動テスト</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={testBasicIntent}
        >
          <Text style={styles.buttonText}>Termuxを起動</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>コマンド実行テスト</Text>
        <TextInput
          style={styles.input}
          value={commandInput}
          onChangeText={setCommandInput}
          placeholder="実行するコマンド"
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={testRunCommandIntent}
        >
          <Text style={styles.buttonText}>コマンドを実行</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Termux:APIテスト</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={testTermuxApiIntent}
        >
          <Text style={styles.buttonText}>APIをチェック</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>実行ログ</Text>
          <TouchableOpacity onPress={clearLogs}>
            <Text style={styles.clearButton}>クリア</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.logContainer}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>{log}</Text>
          ))}
          {logs.length === 0 && (
            <Text style={styles.emptyLog}>ログはまだありません</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clearButton: {
    color: '#2196F3',
    fontSize: 14,
  },
  logContainer: {
    backgroundColor: '#1e1e1e',
    padding: 10,
    borderRadius: 6,
    minHeight: 150,
    maxHeight: 300,
  },
  logText: {
    color: '#00ff00',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  emptyLog: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
});