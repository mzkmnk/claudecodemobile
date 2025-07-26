import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useTermux } from '../hooks/useTermux';

interface TerminalViewProps {
  sessionId?: string;
}

export const TerminalView: React.FC<TerminalViewProps> = () => {
  const webViewRef = useRef<WebView>(null);
  const { activeSession, sendCommand } = useTermux();
  const [isReady, setIsReady] = useState(false);

  // メッセージ表示の更新
  useEffect(() => {
    if (!isReady || !activeSession) return;

    const lastMessage = activeSession.messages[activeSession.messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      writeToTerminal(lastMessage.content);
    }
  }, [activeSession, isReady]);

  const writeToTerminal = (data: string) => {
    if (!webViewRef.current) return;
    
    const script = `
      if (window.term) {
        window.term.write(${JSON.stringify(data)});
      }
    `;
    webViewRef.current.injectJavaScript(script);
  };

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'ready':
          setIsReady(true);
          writeToTerminal('Claude Code Mobile Terminal initialized\\r\\n$ ');
          break;
          
        case 'input':
          await sendCommand(message.data);
          break;
          
        default:
          console.log('Unknown terminal message:', message);
      }
    } catch (error) {
      console.error('Failed to handle terminal message:', error);
    }
  };

  const terminalHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/xterm@5.3.0/css/xterm.css" />
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0a0e27;
      font-family: 'Space Mono', monospace;
    }
    #terminal {
      width: 100vw;
      height: 100vh;
    }
  </style>
</head>
<body>
  <div id="terminal"></div>
  <script src="https://unpkg.com/xterm@5.3.0/lib/xterm.js"></script>
  <script src="https://unpkg.com/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
  <script src="https://unpkg.com/xterm-addon-web-links@0.9.0/lib/xterm-addon-web-links.js"></script>
  <script>
    // Terminal初期化
    const term = new Terminal({
      theme: {
        background: '#0a0e27',
        foreground: '#a9b1d6',
        cursor: '#c0caf5',
        black: '#32344a',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#ad8ee6',
        cyan: '#449dab',
        white: '#9699a8',
        brightBlack: '#444b6a',
        brightRed: '#ff7a93',
        brightGreen: '#b9f27c',
        brightYellow: '#ff9e64',
        brightBlue: '#7da6ff',
        brightMagenta: '#bb9af7',
        brightCyan: '#0db9d7',
        brightWhite: '#acb0d0'
      },
      fontFamily: '"Space Mono", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      allowTransparency: true
    });
    
    // アドオンの読み込み
    const fitAddon = new FitAddon.FitAddon();
    const webLinksAddon = new WebLinksAddon.WebLinksAddon();
    
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    
    // ターミナルを開く
    term.open(document.getElementById('terminal'));
    fitAddon.fit();
    
    // グローバルに公開
    window.term = term;
    
    // コマンドライン処理
    let currentLine = '';
    
    term.onData(data => {
      // 特殊キーの処理
      if (data === '\\r') { // Enter
        if (currentLine.trim()) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'input',
            data: currentLine.trim()
          }));
        }
        term.write('\\r\\n');
        currentLine = '';
      } else if (data === '\\u007F') { // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write('\\b \\b');
        }
      } else if (data >= ' ') { // 通常の文字
        currentLine += data;
        term.write(data);
      }
    });
    
    // リサイズ対応
    window.addEventListener('resize', () => {
      fitAddon.fit();
    });
    
    // React Nativeに準備完了を通知
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'ready'
    }));
  </script>
</body>
</html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: terminalHTML }}
        onMessage={handleMessage}
        style={styles.webview}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="compatibility"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});