import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';

const XTERM_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css" />
  <style>
    body { 
      margin: 0; 
      padding: 10px; 
      background: #1e1e1e;
      overflow: hidden;
    }
    #terminal { 
      width: 100%; 
      height: 100vh;
    }
  </style>
</head>
<body>
  <div id="terminal"></div>
  <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
  <script>
    let term;
    let fitAddon;

    function initTerminal() {
      term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#cccccc',
          cursor: '#ffffff',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
        }
      });

      fitAddon = new FitAddon.FitAddon();
      term.loadAddon(fitAddon);
      
      term.open(document.getElementById('terminal'));
      fitAddon.fit();

      // ウェルカムメッセージ
      term.writeln('\\x1b[1;32mxterm.js WebView統合テスト\\x1b[0m');
      term.writeln('');
      term.writeln('このターミナルはWebView内で動作しています。');
      term.writeln('以下のテストが可能です:');
      term.writeln('  - テキスト入力と表示');
      term.writeln('  - ANSIカラーコード');
      term.writeln('  - カーソル制御');
      term.writeln('');
      term.write('$ ');

      // 入力処理
      term.onData(data => {
        // React Nativeに入力を送信
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'input',
          data: data
        }));
        
        // エコーバック（実際の実装では削除）
        term.write(data);
        
        if (data === '\\r') {
          term.write('\\n$ ');
        }
      });

      // リサイズ処理
      window.addEventListener('resize', () => {
        fitAddon.fit();
      });
    }

    // React Nativeからのメッセージ受信
    window.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'write':
            term.write(message.data);
            break;
          case 'writeln':
            term.writeln(message.data);
            break;
          case 'clear':
            term.clear();
            break;
          case 'reset':
            term.reset();
            break;
          case 'resize':
            fitAddon.fit();
            break;
        }
      } catch (error) {
        console.error('Message parsing error:', error);
      }
    });

    // 初期化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initTerminal);
    } else {
      initTerminal();
    }

    // デバッグ情報をReact Nativeに送信
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'ready',
      info: {
        userAgent: navigator.userAgent,
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    }));
  </script>
</body>
</html>
`;

export function XtermWebViewTest() {
  const webViewRef = useRef<WebView>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const sendToTerminal = (type: string, data?: string) => {
    if (webViewRef.current) {
      const message = JSON.stringify({ type, data });
      webViewRef.current.postMessage(message);
      addLog(`送信: ${type} ${data ? `- ${data}` : ''}`);
    }
  };

  const testCommands = [
    {
      label: 'テキスト出力',
      action: () => sendToTerminal('writeln', 'Hello from React Native!'),
    },
    {
      label: 'カラーテスト',
      action: () => {
        sendToTerminal('writeln', '\\x1b[31m赤色のテキスト\\x1b[0m');
        sendToTerminal('writeln', '\\x1b[32m緑色のテキスト\\x1b[0m');
        sendToTerminal('writeln', '\\x1b[34m青色のテキスト\\x1b[0m');
      },
    },
    {
      label: 'プログレスバー',
      action: () => {
        sendToTerminal('write', 'Loading: [');
        let progress = 0;
        const interval = setInterval(() => {
          if (progress < 20) {
            sendToTerminal('write', '=');
            progress++;
          } else {
            sendToTerminal('writeln', '] Complete!');
            clearInterval(interval);
          }
        }, 100);
      },
    },
    {
      label: '画面クリア',
      action: () => sendToTerminal('clear'),
    },
    {
      label: 'リセット',
      action: () => sendToTerminal('reset'),
    },
    {
      label: 'リサイズ',
      action: () => sendToTerminal('resize'),
    },
  ];

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      addLog(`受信: ${message.type} ${message.data ? `- ${message.data}` : ''}`);
      
      if (message.type === 'ready') {
        setIsLoaded(true);
        addLog('xterm.js の初期化が完了しました');
        if (message.info) {
          addLog(`画面サイズ: ${message.info.screenSize.width}x${message.info.screenSize.height}`);
        }
      } else if (message.type === 'input') {
        addLog(`ユーザー入力: ${JSON.stringify(message.data)}`);
      }
    } catch (error) {
      addLog(`エラー: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.controlPanel}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>xterm.js WebView統合テスト</Text>
          <Text style={styles.description}>
            WebView内でxterm.jsが正常に動作するかテストします
          </Text>
          <Text style={styles.status}>
            ステータス: {isLoaded ? '✅ 接続済み' : '⏳ 初期化中...'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>テストコマンド</Text>
          <View style={styles.commandButtons}>
            {testCommands.map((cmd, index) => (
              <TouchableOpacity
                key={index}
                style={styles.commandButton}
                onPress={cmd.action}
                disabled={!isLoaded}
              >
                <Text style={styles.commandButtonText}>{cmd.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通信ログ</Text>
          <View style={styles.logContainer}>
            {logs.slice(-10).map((log, index) => (
              <Text key={index} style={styles.logText}>{log}</Text>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.terminalContainer}>
        <Text style={styles.terminalHeader}>Terminal (xterm.js)</Text>
        <WebView
          ref={webViewRef}
          source={{ html: XTERM_HTML }}
          style={styles.webView}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            addLog(`WebViewエラー: ${nativeEvent.description}`);
          }}
        />
      </View>
    </View>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  controlPanel: {
    flex: 1,
    maxHeight: height * 0.4,
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
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  status: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  commandButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  commandButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  commandButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  logContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 6,
    maxHeight: 120,
  },
  logText: {
    fontSize: 11,
    color: '#333',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  terminalContainer: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    minHeight: height * 0.4,
  },
  terminalHeader: {
    backgroundColor: '#2d2d2d',
    color: '#fff',
    padding: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  webView: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
});