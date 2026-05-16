import * as vscode from 'vscode';
import { SnippetProvider, getVSCodeSnippetsDir } from './SnippetProvider';
import { PanelManager } from './PanelManager';

export function activate(context: vscode.ExtensionContext): void {
  const workspaceDir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    ? vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, '.vscode').fsPath
    : undefined;

  const provider = new SnippetProvider(getVSCodeSnippetsDir(), workspaceDir);
  const manager = PanelManager.getOrCreate(context.extensionUri, provider);

  context.subscriptions.push(
    vscode.commands.registerCommand('livetem.open',    () => manager.open(false)),
    vscode.commands.registerCommand('livetem.openNew', () => manager.open(true)),
    { dispose: () => manager.dispose() }
  );
}

export function deactivate(): void {}
