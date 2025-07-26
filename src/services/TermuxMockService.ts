/**
 * Termuxモックサービス
 * エミュレーターや開発環境でTermuxが利用できない場合の代替実装
 */
export class TermuxMockService {
  private mockResponses: Record<string, string> = {
    'pwd': '/data/data/com.termux/files/home',
    'ls': 'Documents\nDownloads\nstorage',
    'echo $PATH': '/data/data/com.termux/files/usr/bin',
    'node --version': 'v18.19.0',
    'claude-code': 'Claude Code v1.0.0 (Mock Mode)',
  };

  async executeCommand(command: string): Promise<{
    output: string;
    exitCode: number;
    error?: string;
  }> {
    // コマンドのシミュレーション
    await this.simulateDelay();
    
    const output = this.mockResponses[command] || 
      `Mock: Command "${command}" executed\n\n[This is a simulated response]`;
    
    return {
      output,
      exitCode: 0,
    };
  }

  async isTermuxInstalled(): Promise<boolean> {
    // 開発環境では常にfalseを返す
    return false;
  }

  async startSession(sessionId: string): Promise<void> {
    console.log(`Mock: Starting session ${sessionId}`);
  }

  private async simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}

export const termuxMockService = new TermuxMockService();