import React, { useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TerminalView } from '../components/TerminalView';
import { useTermux } from '../hooks/useTermux';

export const TerminalScreen: React.FC = () => {
  const { activeSession, createSession, isConnected, isLoading, error } = useTermux();

  useEffect(() => {
    // 初回起動時にセッションを作成
    const shouldInitialize = isConnected && !activeSession && !isLoading;
    if (shouldInitialize) {
      const init = async () => {
        try {
          // TODO: 実際のAPIキーを設定画面から取得
          const mockApiKey = 'mock-api-key';
          const workingDir = '/storage/emulated/0/ClaudeCode';
          
          await createSession(mockApiKey, workingDir);
        } catch (err) {
          console.error('Failed to initialize session:', err);
          Alert.alert(
            'セッション作成エラー',
            'セッションの作成に失敗しました。設定を確認してください。'
          );
        }
      };
      init();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, activeSession, isLoading]);

  useEffect(() => {
    if (error) {
      Alert.alert('エラー', error);
    }
  }, [error]);


  if (!isConnected) {
    return (
      <View style={[styles.container, styles.centered]}>
        {/* TODO: 接続中のローディング表示 */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TerminalView sessionId={activeSession?.id} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});