import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  NativeModules,
  Platform,
} from 'react-native';

interface TestResult {
  test: string;
  result: string;
  success: boolean;
  timestamp: string;
}

export function NativeModuleTest() {
  const [results, setResults] = useState<TestResult[]>([]);

  const addResult = (test: string, result: string, success: boolean) => {
    setResults(prev => [{
      test,
      result,
      success,
      timestamp: new Date().toLocaleTimeString(),
    }, ...prev]);
  };

  const testExistingModules = () => {
    try {
      const modules = Object.keys(NativeModules);
      addResult(
        'ネイティブモジュール一覧',
        `検出されたモジュール数: ${modules.length}\n` +
        `主要モジュール: ${modules.slice(0, 10).join(', ')}...`,
        true
      );
    } catch (error) {
      addResult('ネイティブモジュール一覧', `エラー: ${error}`, false);
    }
  };

  const testMockModule = async () => {
    try {
      // モックのNative Module（実際には存在しない）
      const TestModule = NativeModules.TestModule;
      
      if (!TestModule) {
        addResult(
          'TestModuleアクセス',
          'TestModuleは存在しません（正常）\n' +
          '実際のNative Module作成が必要です',
          true
        );
        return;
      }

      // もしモジュールが存在した場合のテスト
      const result = await TestModule.getDeviceInfo();
      addResult('TestModule.getDeviceInfo', JSON.stringify(result), true);
    } catch (error) {
      addResult('TestModuleアクセス', `エラー: ${error}`, false);
    }
  };

  const showModuleCreationGuide = () => {
    const kotlinCode = `
// android/app/src/main/java/com/claudecodemobile/TestModule.kt
package com.claudecodemobile

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments

class TestModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {
    
    override fun getName(): String {
        return "TestModule"
    }
    
    @ReactMethod
    fun getDeviceInfo(promise: Promise) {
        try {
            val map: WritableMap = Arguments.createMap()
            map.putString("platform", "Android")
            map.putString("model", android.os.Build.MODEL)
            map.putString("version", android.os.Build.VERSION.RELEASE)
            map.putDouble("timestamp", System.currentTimeMillis().toDouble())
            
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun multiply(a: Double, b: Double, promise: Promise) {
        promise.resolve(a * b)
    }
}
    `.trim();

    addResult(
      'Native Module作成ガイド',
      `以下の手順でNative Moduleを作成します:\n\n` +
      `1. Kotlinファイルを作成\n` +
      `2. ReactPackageに登録\n` +
      `3. MainApplicationで初期化\n\n` +
      `サンプルコード:\n${kotlinCode.substring(0, 200)}...`,
      true
    );

    Alert.alert(
      'Native Module作成手順',
      '1. android/app/src/main/java/com/claudecodemobile/にTestModule.ktを作成\n' +
      '2. TestModulePackage.ktを作成してモジュールを登録\n' +
      '3. MainApplication.ktのgetPackages()に追加\n' +
      '4. アプリを再ビルド',
      [{ text: 'OK' }]
    );
  };

  const testTermuxBridgeDesign = () => {
    const design = `
TermuxBridge設計案:

1. インターフェース定義
   - executeCommand(command: String): Promise<String>
   - startSession(sessionId: String): Promise<Boolean>
   - stopSession(sessionId: String): Promise<Boolean>
   - sendInput(sessionId: String, input: String): Promise<Boolean>

2. 実装方法
   - Intent経由でTermux:Taskerと通信
   - BroadcastReceiverで結果を受信
   - WebSocketでリアルタイム通信

3. セキュリティ考慮事項
   - コマンドのサニタイズ
   - 権限の適切な管理
   - セッションの暗号化
    `.trim();

    addResult('TermuxBridge設計', design, true);
  };

  const createSampleFiles = () => {
    const files = [
      {
        name: 'TestModule.kt',
        path: 'android/app/src/main/java/com/claudecodemobile/TestModule.kt',
        created: false,
      },
      {
        name: 'TestModulePackage.kt',
        path: 'android/app/src/main/java/com/claudecodemobile/TestModulePackage.kt',
        created: false,
      },
      {
        name: 'TermuxBridge.kt',
        path: 'android/app/src/main/java/com/claudecodemobile/TermuxBridge.kt',
        created: false,
      },
    ];

    addResult(
      'サンプルファイル作成',
      `以下のファイルを作成する必要があります:\n` +
      files.map(f => `- ${f.name}\n  ${f.path}`).join('\n'),
      true
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Native Module作成練習</Text>
        <Text style={styles.description}>
          React NativeのNative Moduleを作成する練習を行います。
          {Platform.OS === 'android' ? ' (Android)' : ' (iOS)'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>基本テスト</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={testExistingModules}
          >
            <Text style={styles.buttonText}>既存モジュール確認</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={testMockModule}
          >
            <Text style={styles.buttonText}>TestModuleアクセス</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Native Module作成</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.createButton]}
            onPress={showModuleCreationGuide}
          >
            <Text style={styles.buttonText}>作成ガイドを表示</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.designButton]}
            onPress={testTermuxBridgeDesign}
          >
            <Text style={styles.buttonText}>TermuxBridge設計</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={createSampleFiles}
          >
            <Text style={styles.buttonText}>サンプルファイル</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>実装チェックリスト</Text>
        <View style={styles.checklist}>
          <Text style={styles.checkItem}>□ Kotlinファイルの作成</Text>
          <Text style={styles.checkItem}>□ ReactPackageの実装</Text>
          <Text style={styles.checkItem}>□ MainApplicationへの登録</Text>
          <Text style={styles.checkItem}>□ TypeScript型定義の作成</Text>
          <Text style={styles.checkItem}>□ JSインターフェースの実装</Text>
          <Text style={styles.checkItem}>□ エラーハンドリング</Text>
          <Text style={styles.checkItem}>□ 単体テストの作成</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>テスト結果</Text>
        {results.length === 0 ? (
          <Text style={styles.noResults}>まだテストを実行していません</Text>
        ) : (
          results.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={[styles.resultTitle, !result.success && styles.errorTitle]}>
                  {result.test}
                </Text>
                <Text style={styles.resultTime}>{result.timestamp}</Text>
              </View>
              <Text style={[styles.resultText, !result.success && styles.errorText]}>
                {result.result}
              </Text>
            </View>
          ))
        )}
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
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  designButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  checklist: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  checkItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontFamily: 'monospace',
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
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  errorTitle: {
    color: '#d32f2f',
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
  },
  resultText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  errorText: {
    color: '#d32f2f',
  },
});