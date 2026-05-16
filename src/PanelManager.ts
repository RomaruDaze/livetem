import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SnippetProvider } from './SnippetProvider';
import { WebviewMessage } from './types';

export class PanelManager {
  private static instance?: PanelManager;
  private panel?: vscode.WebviewPanel;

  private constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly provider: SnippetProvider
  ) {}

  static getOrCreate(extensionUri: vscode.Uri, provider: SnippetProvider): PanelManager {
    if (!PanelManager.instance) {
      PanelManager.instance = new PanelManager(extensionUri, provider);
    }
    return PanelManager.instance;
  }

  open(startNew = false): void {
    if (this.panel) {
      this.panel.reveal();
      if (startNew) { this.panel.webview.postMessage({ type: 'startNew' }); }
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'livetemSnippetManager',
      'Snippet Manager',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'webview', 'dist')],
        retainContextWhenHidden: true,
      }
    );

    this.panel.webview.html = this.getHtml(this.panel.webview);

    this.panel.webview.onDidReceiveMessage(async (msg: WebviewMessage) => {
      if (msg.type === 'save') {
        try {
          // Resolve source path for new snippets (source is empty string when isNew)
          const snippet = msg.snippet.source
            ? msg.snippet
            : { ...msg.snippet, source: this.provider.resolveSourcePath(msg.snippet.scope) };
          const saved = await this.provider.saveSnippet(snippet, msg.previousName);
          this.panel?.webview.postMessage({ type: 'saved', snippet: saved });
        } catch (e) {
          this.panel?.webview.postMessage({ type: 'error', message: String(e) });
        }
      } else if (msg.type === 'delete') {
        try {
          await this.provider.deleteSnippet(msg.name, msg.source);
          this.panel?.webview.postMessage({ type: 'deleted', id: msg.id });
        } catch (e) {
          this.panel?.webview.postMessage({ type: 'error', message: String(e) });
        }
      }
    });

    this.panel.onDidDispose(() => {
      this.panel = undefined;
      PanelManager.instance = undefined;
    });

    this.sendInit();

    if (startNew) {
      // Delay to let React mount before sending startNew
      setTimeout(() => this.panel?.webview.postMessage({ type: 'startNew' }), 300);
    }
  }

  dispose(): void {
    this.panel?.dispose();
  }

  private async sendInit(): Promise<void> {
    try {
      const snippets = await this.provider.getAllSnippets();
      this.panel?.webview.postMessage({ type: 'init', snippets });
    } catch (e) {
      this.panel?.webview.postMessage({ type: 'error', message: String(e) });
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const distPath = path.join(this.extensionUri.fsPath, 'webview', 'dist');
    let html: string;
    try {
      html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
    } catch {
      vscode.window.showErrorMessage('Snippet Manager: webview build not found. Run `npm run build:webview` first.');
      return '<html><body>Build not found. Run npm run build:webview.</body></html>';
    }

    const distUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'webview', 'dist')
    );

    // Rewrite relative asset paths to webview URIs
    html = html.replace(/(src|href)="\.\//g, `$1="${distUri}/`);

    // Monaco requires unsafe-eval for its JIT compiler
    const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-eval'; worker-src blob:;">`;
    html = html.replace('</head>', `${csp}\n</head>`);

    return html;
  }
}
