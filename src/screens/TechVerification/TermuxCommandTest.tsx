import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';

interface CommandResult {
  command: string;
  output: string;
  timestamp: string;
  success: boolean;
}

export function TermuxCommandTest() {
  const [commandInput, setCommandInput] = useState('ls -la');
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<CommandResult[]>([]);

  const executeCommand = async () => {
    if (!commandInput.trim()) {
      Alert.alert('エラー', 'コマンドを入力してください');
      return;
    }

    setIsExecuting(true);

    try {
      // 実際のTermuxコマンド実行はNative Moduleが必要
      // ここではシミュレーション
      const mockResult: CommandResult = {
        command: commandInput,
        output: `[モック] コマンド "${commandInput}" を実行しました\n\n` +
               `実際の実装では、Native Moduleを通じてTermuxプロセスと通信します。\n` +
               `必要な実装:\n` +
               `1. Native Module (TermuxBridge) の作成\n` +
               `2. Termux:Tasker APIとの連携\n` +
               `3. プロセス間通信の確立`,
        timestamp: new Date().toLocaleTimeString(),
        success: true,
      };

      setResults(prev => [mockResult, ...prev]);
      
      // 実際の実装のためのガイドを表示
      if (commandInput.includes('claude')) {
        Alert.alert(
          'Claude Code実行',
          'Claude Codeを実行するには:\n\n' +
          '1. Termuxでclaude-codeをインストール\n' +
          '2. APIキーを設定\n' +
          '3. Native Moduleでプロセスを管理',
        );
      }
    } catch (error) {
      const errorResult: CommandResult = {
        command: commandInput,
        output: `エラー: ${error}`,
        timestamp: new Date().toLocaleTimeString(),
        success: false,
      };
      setResults(prev => [errorResult, ...prev]);
    } finally {
      setIsExecuting(false);
    }
  };

  const testCommands = [
    { label: 'ディレクトリ一覧', command: 'ls -la' },
    { label: '現在のパス', command: 'pwd' },
    { label: 'システム情報', command: 'uname -a' },
    { label: 'プロセス一覧', command: 'ps aux' },
    { label: 'Claude Code起動', command: 'claude-code' },
    { label: 'Node.jsバージョン', command: 'node --version' },
  ];

  const clearResults = () => {
    setResults([]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Termuxコマンド実行テスト</Text>
        <Text style={styles.description}>
          Termuxでコマンドを実行し、結果を取得する機能をテストします
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>コマンド入力</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={commandInput}
            onChangeText={setCommandInput}
            placeholder="実行するコマンドを入力"
            placeholderTextColor="#999"
            editable={!isExecuting}
          />
          <TouchableOpacity
            style={[styles.executeButton, isExecuting && styles.disabledButton]}
            onPress={executeCommand}
            disabled={isExecuting}
          >
            <Text style={styles.executeButtonText}>
              {isExecuting ? '実行中...' : '実行'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickCommands}>
          <Text style={styles.quickCommandsTitle}>クイックコマンド:</Text>
          <View style={styles.commandButtons}>
            {testCommands.map((cmd, index) => (
              <TouchableOpacity
                key={index}
                style={styles.commandButton}
                onPress={() => setCommandInput(cmd.command)}
              >
                <Text style={styles.commandButtonText}>{cmd.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>実行結果</Text>
          <TouchableOpacity onPress={clearResults}>
            <Text style={styles.clearButton}>クリア</Text>
          </TouchableOpacity>
        </View>
        
        {results.length === 0 ? (
          <Text style={styles.noResults}>まだコマンドを実行していません</Text>
        ) : (
          results.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultCommand}>$ {result.command}</Text>
                <Text style={styles.resultTime}>{result.timestamp}</Text>
              </View>
              <View style={[styles.resultOutput, !result.success && styles.errorOutput]}>
                <Text style={styles.resultText}>{result.output}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>実装メモ</Text>
        <Text style={styles.note}>
          実際のTermuxコマンド実行には以下が必要です:{'\n\n'}
          • Native Module (TermuxBridge) の実装{'\n'}
          • Termux:Tasker プラグインとの連携{'\n'}
          • Runtime.exec() またはProcessBuilderの使用{'\n'}
          • 適切な権限設定とセキュリティ対策
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
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  executeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    borderRadius: 6,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  executeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickCommands: {
    marginTop: 15,
  },
  quickCommandsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  commandButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  commandButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  commandButtonText: {
    fontSize: 12,
    color: '#1976d2',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clearButton: {
    color: '#2196F3',
    fontSize: 14,
  },
  noResults: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  resultItem: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  resultCommand: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'monospace',
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
  },
  resultOutput: {
    padding: 10,
    backgroundColor: '#1e1e1e',
  },
  errorOutput: {
    backgroundColor: '#3c1e1e',
  },
  resultText: {
    fontSize: 12,
    color: '#00ff00',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  note: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});