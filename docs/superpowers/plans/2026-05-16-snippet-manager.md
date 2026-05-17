# Snippet Manager Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VS Code extension with a split-pane webview UI for creating, editing, and deleting snippets across global, workspace, and language-specific scopes.

**Architecture:** Extension host (Node.js) reads/writes VS Code snippet JSON files and communicates with a React + Vite webview panel via postMessage. The webview renders a flat snippet list on the left and a Monaco-powered editor on the right with a live preview pane.

**Tech Stack:** TypeScript, VS Code Extension API, React 18, Vite, `@monaco-editor/react`, Vitest

---

## File Map

```
livetem/
├── package.json                        # extension manifest + root scripts
├── tsconfig.json                       # extension-side TS config
├── src/
│   ├── types.ts                        # Snippet interface + message protocol types
│   ├── extension.ts                    # activates extension, registers commands
│   ├── PanelManager.ts                 # singleton WebviewPanel lifecycle + HTML serving
│   ├── SnippetProvider.ts              # all file I/O: read/write/delete snippet JSON
│   └── test/
│       └── SnippetProvider.test.ts     # Vitest unit tests for SnippetProvider
├── webview/
│   ├── package.json                    # webview-only deps (React, Monaco, Vite)
│   ├── tsconfig.json                   # webview TS config
│   ├── vite.config.ts                  # Vite build config
│   ├── index.html                      # Vite entry HTML
│   └── src/
│       ├── main.tsx                    # React entry point
│       ├── App.tsx                     # root component, owns state + message bridge
│       ├── SnippetList.tsx             # flat list, search input, scope filter
│       ├── EditorPane.tsx              # right panel: fields + body editor + preview
│       ├── BodyEditor.tsx              # Monaco editor wrapper
│       ├── Preview.tsx                 # live snippet expansion preview
│       ├── types.ts                    # re-exports Snippet + message types for webview
│       └── app.css                     # VS Code theme variable–based styles
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `webview/package.json`
- Create: `webview/tsconfig.json`
- Create: `webview/vite.config.ts`
- Create: `webview/index.html`

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "livetem",
  "displayName": "LiveTem — Snippet Manager",
  "description": "A UI for creating and editing VS Code snippets",
  "version": "0.0.1",
  "publisher": "local",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Other"],
  "activationEvents": [],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      { "command": "livetem.open",    "title": "Snippet Manager: Open" },
      { "command": "livetem.openNew", "title": "Snippet Manager: New Snippet" }
    ]
  },
  "scripts": {
    "compile":       "tsc -p ./",
    "build:webview": "cd webview && npm run build",
    "build":         "npm run compile && npm run build:webview",
    "test":          "vitest run src/test",
    "vscode:prepublish": "npm run build"
  },
  "devDependencies": {
    "@types/node":   "^20.0.0",
    "@types/vscode": "^1.85.0",
    "typescript":    "^5.3.0",
    "vitest":        "^1.2.0"
  }
}
```

- [ ] **Step 2: Create root `tsconfig.json`**

```json
{
  "compilerOptions": {
    "module":  "commonjs",
    "target":  "ES2020",
    "lib":     ["ES2020"],
    "outDir":  "out",
    "rootDir": "src",
    "strict":  true,
    "sourceMap": true
  },
  "exclude": ["node_modules", "webview"]
}
```

- [ ] **Step 3: Create `webview/package.json`**

```json
{
  "name": "livetem-webview",
  "private": true,
  "scripts": {
    "build": "vite build",
    "dev":   "vite"
  },
  "dependencies": {
    "react":                 "^18.2.0",
    "react-dom":             "^18.2.0",
    "@monaco-editor/react":  "^4.6.0"
  },
  "devDependencies": {
    "@types/react":          "^18.2.0",
    "@types/react-dom":      "^18.2.0",
    "@vitejs/plugin-react":  "^4.2.0",
    "typescript":            "^5.3.0",
    "vite":                  "^5.0.0"
  }
}
```

- [ ] **Step 4: Create `webview/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target":  "ES2020",
    "lib":     ["ES2020", "DOM", "DOM.Iterable"],
    "module":  "ESNext",
    "moduleResolution": "bundler",
    "jsx":     "react-jsx",
    "strict":  true,
    "noEmit":  true
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Create `webview/vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});
```

Using `base: './'` so all built asset paths are relative — required for VS Code webview URI rewriting.

- [ ] **Step 6: Create `webview/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Snippet Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Install dependencies**

```bash
npm install
cd webview && npm install
```

- [ ] **Step 8: Create `src/` and `src/test/` directories, then verify compilation**

```bash
mkdir -p src/test
# Create a placeholder to verify TS compiles
echo 'export {};' > src/extension.ts
npm run compile
```

Expected: `out/extension.js` created with no errors.

- [ ] **Step 9: Commit**

```bash
git init
git add package.json tsconfig.json webview/package.json webview/tsconfig.json webview/vite.config.ts webview/index.html src/extension.ts
git commit -m "chore: scaffold extension and webview project structure"
```

---

## Task 2: Shared Types

**Files:**
- Create: `src/types.ts`
- Create: `webview/src/types.ts`

- [ ] **Step 1: Create `src/types.ts`**

```ts
export interface Snippet {
  id: string;
  name: string;
  prefix: string;
  description: string;
  body: string[];
  scope: string;
  source: string;
}

export type HostMessage =
  | { type: 'init';    snippets: Snippet[] }
  | { type: 'saved';   snippet: Snippet }
  | { type: 'deleted'; id: string }
  | { type: 'error';   message: string };

export type WebviewMessage =
  | { type: 'save';   snippet: Snippet }
  | { type: 'delete'; id: string };
```

- [ ] **Step 2: Create `webview/src/types.ts`** (identical re-export — keeps webview self-contained)

```ts
export interface Snippet {
  id: string;
  name: string;
  prefix: string;
  description: string;
  body: string[];
  scope: string;
  source: string;
}

export type HostMessage =
  | { type: 'init';    snippets: Snippet[] }
  | { type: 'saved';   snippet: Snippet }
  | { type: 'deleted'; id: string }
  | { type: 'error';   message: string };

export type WebviewMessage =
  | { type: 'save';   snippet: Snippet }
  | { type: 'delete'; id: string };
```

- [ ] **Step 3: Compile to verify no errors**

```bash
npm run compile
```

Expected: exits 0, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts webview/src/types.ts
git commit -m "feat: add shared Snippet and message protocol types"
```

---

## Task 3: SnippetProvider — Read Snippets

**Files:**
- Create: `src/SnippetProvider.ts`
- Create: `src/test/SnippetProvider.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/SnippetProvider.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { SnippetProvider } from '../SnippetProvider';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'livetem-test-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true });
});

describe('SnippetProvider.getAllSnippets', () => {
  it('returns empty array when snippets dir does not exist', async () => {
    const provider = new SnippetProvider(path.join(tmpDir, 'nonexistent'));
    const result = await provider.getAllSnippets();
    expect(result).toEqual([]);
  });

  it('reads global snippets from global.code-snippets', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'global.code-snippets'),
      JSON.stringify({
        'log': { prefix: 'cl', body: ['console.log($1);'], description: 'console.log' }
      })
    );
    const provider = new SnippetProvider(tmpDir);
    const snippets = await provider.getAllSnippets();
    expect(snippets).toHaveLength(1);
    expect(snippets[0].prefix).toBe('cl');
    expect(snippets[0].name).toBe('log');
    expect(snippets[0].scope).toBe('global');
    expect(snippets[0].body).toEqual(['console.log($1);']);
    expect(snippets[0].id).toBeTruthy();
  });

  it('reads language snippets from <lang>.json files', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'javascript.json'),
      JSON.stringify({
        'arrow fn': { prefix: 'fn', body: ['const $1 = () => {', '  $0', '}'], description: 'arrow function' }
      })
    );
    const provider = new SnippetProvider(tmpDir);
    const snippets = await provider.getAllSnippets();
    expect(snippets).toHaveLength(1);
    expect(snippets[0].scope).toBe('javascript');
  });

  it('skips malformed JSON files and does not throw', async () => {
    await fs.writeFile(path.join(tmpDir, 'broken.json'), 'not json {{{');
    const provider = new SnippetProvider(tmpDir);
    const snippets = await provider.getAllSnippets();
    expect(snippets).toEqual([]);
  });

  it('reads workspace snippets when workspacePath is provided', async () => {
    const workspaceDir = path.join(tmpDir, '.vscode');
    await fs.mkdir(workspaceDir);
    await fs.writeFile(
      path.join(workspaceDir, 'my-project.code-snippets'),
      JSON.stringify({
        'fetch': { prefix: 'api', body: ['fetch($1)'], description: 'fetch call' }
      })
    );
    const provider = new SnippetProvider(path.join(tmpDir, 'snippets'), workspaceDir);
    const snippets = await provider.getAllSnippets();
    expect(snippets).toHaveLength(1);
    expect(snippets[0].scope).toBe('workspace');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — `SnippetProvider` does not exist.

- [ ] **Step 3: Implement `SnippetProvider` read logic**

Create `src/SnippetProvider.ts`:

```ts
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { Snippet } from './types';

export function getVSCodeSnippetsDir(): string {
  switch (process.platform) {
    case 'win32':
      return path.join(process.env['APPDATA'] ?? os.homedir(), 'Code', 'User', 'snippets');
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'snippets');
    default:
      return path.join(os.homedir(), '.config', 'Code', 'User', 'snippets');
  }
}

interface RawSnippetFile {
  [name: string]: {
    prefix: string | string[];
    body: string | string[];
    description?: string;
  };
}

function parseSnippetFile(raw: RawSnippetFile, scope: string, filePath: string): Snippet[] {
  return Object.entries(raw).map(([name, entry]) => ({
    id: crypto.randomUUID(),
    name,
    prefix: Array.isArray(entry.prefix) ? entry.prefix[0] : entry.prefix,
    description: entry.description ?? '',
    body: Array.isArray(entry.body) ? entry.body : [entry.body],
    scope,
    source: filePath,
  }));
}

export class SnippetProvider {
  constructor(
    private readonly snippetsDir: string,
    private readonly workspaceDir?: string
  ) {}

  static create(workspaceDir?: string): SnippetProvider {
    return new SnippetProvider(getVSCodeSnippetsDir(), workspaceDir);
  }

  resolveSourcePath(scope: string): string {
    if (scope === 'global') {
      return path.join(this.snippetsDir, 'global.code-snippets');
    }
    if (scope === 'workspace') {
      const wsDir = this.workspaceDir ?? this.snippetsDir;
      return path.join(wsDir, 'workspace.code-snippets');
    }
    return path.join(this.snippetsDir, `${scope}.json`);
  }

  async getAllSnippets(): Promise<Snippet[]> {
    const results: Snippet[] = [];

    // Global + language snippets from snippetsDir
    let files: string[] = [];
    try {
      files = await fs.readdir(this.snippetsDir);
    } catch {
      // Directory doesn't exist yet — return empty
      return results;
    }

    for (const file of files) {
      const filePath = path.join(this.snippetsDir, file);
      const isGlobal = file === 'global.code-snippets';
      const isLanguage = file.endsWith('.json');
      if (!isGlobal && !isLanguage) { continue; }

      const scope = isGlobal ? 'global' : path.basename(file, '.json');
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const raw: RawSnippetFile = JSON.parse(content);
        results.push(...parseSnippetFile(raw, scope, filePath));
      } catch {
        // Malformed JSON — skip silently (callers decide how to surface this)
      }
    }

    // Workspace snippets
    if (this.workspaceDir) {
      try {
        const wsFiles = await fs.readdir(this.workspaceDir);
        for (const file of wsFiles) {
          if (!file.endsWith('.code-snippets')) { continue; }
          const filePath = path.join(this.workspaceDir, file);
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const raw: RawSnippetFile = JSON.parse(content);
            results.push(...parseSnippetFile(raw, 'workspace', filePath));
          } catch {
            // skip malformed
          }
        }
      } catch {
        // workspaceDir doesn't exist
      }
    }

    return results;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/SnippetProvider.ts src/test/SnippetProvider.test.ts
git commit -m "feat: add SnippetProvider with getAllSnippets"
```

---

## Task 4: SnippetProvider — Save and Delete

**Files:**
- Modify: `src/SnippetProvider.ts`
- Modify: `src/test/SnippetProvider.test.ts`

- [ ] **Step 1: Add failing tests for save and delete**

Append to `src/test/SnippetProvider.test.ts`:

```ts
describe('SnippetProvider.saveSnippet', () => {
  it('creates a new snippet file and writes the snippet', async () => {
    const provider = new SnippetProvider(tmpDir);
    const snippet: Snippet = {
      id: 'test-id',
      name: 'my log',
      prefix: 'ml',
      description: 'my log',
      body: ['console.log("hello");'],
      scope: 'global',
      source: path.join(tmpDir, 'global.code-snippets'),
    };
    const saved = await provider.saveSnippet(snippet);

    const content = JSON.parse(await fs.readFile(snippet.source, 'utf-8'));
    expect(content['my log']).toEqual({
      prefix: 'ml',
      body: ['console.log("hello");'],
      description: 'my log',
    });
    expect(saved.id).toBe('test-id');
  });

  it('merges into an existing snippet file without overwriting other snippets', async () => {
    const filePath = path.join(tmpDir, 'global.code-snippets');
    await fs.writeFile(filePath, JSON.stringify({ existing: { prefix: 'ex', body: ['existing'], description: '' } }));

    const provider = new SnippetProvider(tmpDir);
    await provider.saveSnippet({
      id: 'new-id', name: 'new', prefix: 'nw', description: '',
      body: ['new'], scope: 'global', source: filePath,
    });

    const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    expect(Object.keys(content)).toHaveLength(2);
    expect(content['existing'].prefix).toBe('ex');
    expect(content['new'].prefix).toBe('nw');
  });

  it('creates intermediate directories if they do not exist', async () => {
    const nestedDir = path.join(tmpDir, 'nested', 'dir');
    const provider = new SnippetProvider(nestedDir);
    const filePath = path.join(nestedDir, 'global.code-snippets');
    await provider.saveSnippet({
      id: 'x', name: 'x', prefix: 'x', description: '', body: ['x'], scope: 'global', source: filePath,
    });
    const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    expect(content['x']).toBeDefined();
  });
});

describe('SnippetProvider.deleteSnippet', () => {
  it('removes the named snippet from the file', async () => {
    const filePath = path.join(tmpDir, 'global.code-snippets');
    await fs.writeFile(filePath, JSON.stringify({
      keep: { prefix: 'k', body: ['k'], description: '' },
      remove: { prefix: 'r', body: ['r'], description: '' },
    }));
    const provider = new SnippetProvider(tmpDir);
    await provider.deleteSnippet('remove', filePath);

    const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    expect(content['keep']).toBeDefined();
    expect(content['remove']).toBeUndefined();
  });

  it('does nothing if the file does not exist', async () => {
    const provider = new SnippetProvider(tmpDir);
    await expect(provider.deleteSnippet('x', path.join(tmpDir, 'nonexistent.json'))).resolves.not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify new tests fail**

```bash
npm test
```

Expected: new save/delete tests FAIL — methods not defined.

- [ ] **Step 3: Implement `saveSnippet` and `deleteSnippet` in `src/SnippetProvider.ts`**

Add these two methods inside the `SnippetProvider` class, after `getAllSnippets`:

```ts
  async saveSnippet(snippet: Snippet): Promise<Snippet> {
    await fs.mkdir(path.dirname(snippet.source), { recursive: true });

    let existing: RawSnippetFile = {};
    try {
      existing = JSON.parse(await fs.readFile(snippet.source, 'utf-8'));
    } catch {
      // File doesn't exist yet — start fresh
    }

    existing[snippet.name] = {
      prefix: snippet.prefix,
      body: snippet.body,
      description: snippet.description,
    };

    await fs.writeFile(snippet.source, JSON.stringify(existing, null, 2), 'utf-8');
    return snippet;
  }

  async deleteSnippet(name: string, source: string): Promise<void> {
    let existing: RawSnippetFile = {};
    try {
      existing = JSON.parse(await fs.readFile(source, 'utf-8'));
    } catch {
      return; // File gone — nothing to do
    }

    delete existing[name];
    await fs.writeFile(source, JSON.stringify(existing, null, 2), 'utf-8');
  }
```

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/SnippetProvider.ts src/test/SnippetProvider.test.ts
git commit -m "feat: add saveSnippet and deleteSnippet to SnippetProvider"
```

---

## Task 5: PanelManager + Extension Entry Point

**Files:**
- Create: `src/PanelManager.ts`
- Modify: `src/extension.ts`

> No unit tests — these files depend on VS Code APIs not available in Vitest. Verified manually via Extension Development Host (F5).

- [ ] **Step 1: Create `src/PanelManager.ts`**

```ts
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
      'livetemnSnippetManager',
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
          const saved = await this.provider.saveSnippet(snippet);
          this.panel?.webview.postMessage({ type: 'saved', snippet: saved });
        } catch (e) {
          this.panel?.webview.postMessage({ type: 'error', message: String(e) });
        }
      } else if (msg.type === 'delete') {
        try {
          await this.provider.deleteSnippet(msg.snippet.name, msg.snippet.source);
          this.panel?.webview.postMessage({ type: 'deleted', id: msg.id });
        } catch (e) {
          this.panel?.webview.postMessage({ type: 'error', message: String(e) });
        }
      }
    });

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });

    // Send snippets once the webview is ready
    this.sendInit();

    if (startNew) {
      // Delay slightly to let React mount before sending startNew
      setTimeout(() => this.panel?.webview.postMessage({ type: 'startNew' }), 300);
    }
  }

  private async sendInit(): Promise<void> {
    const snippets = await this.provider.getAllSnippets();
    this.panel?.webview.postMessage({ type: 'init', snippets });
  }

  private getHtml(webview: vscode.Webview): string {
    const distPath = path.join(this.extensionUri.fsPath, 'webview', 'dist');
    let html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');

    const distUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'webview', 'dist')
    );

    // Rewrite relative asset paths to webview URIs
    html = html.replace(/(src|href)="\.\//g, `$1="${distUri}/`);

    // Inject CSP — Monaco requires unsafe-eval for its JIT compiler
    const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-eval'; worker-src blob:;">`;
    html = html.replace('</head>', `${csp}\n</head>`);

    return html;
  }
}
```

- [ ] **Step 2: Replace `src/extension.ts`**

```ts
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
    vscode.commands.registerCommand('livetem.openNew', () => manager.open(true))
  );
}

export function deactivate(): void {}
```

- [ ] **Step 3: Fix the `delete` message handler — `msg.snippet` and `msg.id` don't exist on the delete message type**

The `WebviewMessage` delete type is `{ type: 'delete'; id: string }`. The handler in PanelManager needs to look up the snippet by id to get the name/source. Update `SnippetProvider` to track snippet metadata, or change the delete message to carry name + source directly.

**Simplest fix:** Change the delete message to carry `name` and `source` instead of `id`. Update `src/types.ts`:

```ts
export type WebviewMessage =
  | { type: 'save';   snippet: Snippet }
  | { type: 'delete'; id: string; name: string; source: string };
```

And update the handler in `PanelManager.ts`:

```ts
} else if (msg.type === 'delete') {
  try {
    await this.provider.deleteSnippet(msg.name, msg.source);
    this.panel?.webview.postMessage({ type: 'deleted', id: msg.id });
  } catch (e) {
    this.panel?.webview.postMessage({ type: 'error', message: String(e) });
  }
}
```

Also update `webview/src/types.ts` to match:

```ts
export type WebviewMessage =
  | { type: 'save';   snippet: Snippet }
  | { type: 'delete'; id: string; name: string; source: string };
```

- [ ] **Step 4: Compile to check for errors**

```bash
npm run compile
```

Expected: exits 0, no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/PanelManager.ts src/extension.ts src/types.ts webview/src/types.ts
git commit -m "feat: add PanelManager and extension activation"
```

---

## Task 6: Webview Scaffold

**Files:**
- Create: `webview/src/main.tsx`
- Create: `webview/src/App.tsx` (shell only)
- Create: `webview/src/app.css`

- [ ] **Step 1: Create `webview/src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './app.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 2: Create `webview/src/App.tsx` (shell — wires message bridge and owns state)**

```tsx
import React, { useEffect, useReducer } from 'react';
import { Snippet, HostMessage } from './types';
import SnippetList from './SnippetList';
import EditorPane from './EditorPane';

// Acquire the VS Code API once at module level
declare const acquireVsCodeApi: () => { postMessage: (msg: unknown) => void };
const vscode = acquireVsCodeApi();

interface State {
  snippets: Snippet[];
  selectedId: string | null;
  isNew: boolean;
  error: string | null;
}

type Action =
  | { type: 'INIT';    snippets: Snippet[] }
  | { type: 'SAVED';   snippet: Snippet }
  | { type: 'DELETED'; id: string }
  | { type: 'SELECT';  id: string }
  | { type: 'NEW' }
  | { type: 'ERROR';   message: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT':
      return { ...state, snippets: action.snippets, error: null };
    case 'SAVED': {
      const exists = state.snippets.some(s => s.id === action.snippet.id);
      return {
        ...state,
        snippets: exists
          ? state.snippets.map(s => s.id === action.snippet.id ? action.snippet : s)
          : [...state.snippets, action.snippet],
        selectedId: action.snippet.id,
        isNew: false,
        error: null,
      };
    }
    case 'DELETED':
      return {
        ...state,
        snippets: state.snippets.filter(s => s.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
        error: null,
      };
    case 'SELECT':
      return { ...state, selectedId: action.id, isNew: false };
    case 'NEW':
      return { ...state, selectedId: null, isNew: true };
    case 'ERROR':
      return { ...state, error: action.message };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, {
    snippets: [], selectedId: null, isNew: false, error: null,
  });

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data as HostMessage;
      switch (msg.type) {
        case 'init':    dispatch({ type: 'INIT',    snippets: msg.snippets }); break;
        case 'saved':   dispatch({ type: 'SAVED',   snippet: msg.snippet });   break;
        case 'deleted': dispatch({ type: 'DELETED', id: msg.id });             break;
        case 'error':   dispatch({ type: 'ERROR',   message: msg.message });   break;
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const selected = state.snippets.find(s => s.id === state.selectedId) ?? null;

  return (
    <div className="app">
      {state.error && (
        <div className="error-banner" onClick={() => dispatch({ type: 'ERROR', message: '' })}>
          {state.error} ✕
        </div>
      )}
      <SnippetList
        snippets={state.snippets}
        selectedId={state.selectedId}
        onSelect={id => dispatch({ type: 'SELECT', id })}
        onNew={() => dispatch({ type: 'NEW' })}
      />
      <EditorPane
        snippet={selected}
        isNew={state.isNew}
        allSnippets={state.snippets}
        onSave={snippet => vscode.postMessage({ type: 'save', snippet })}
        onDelete={snippet => vscode.postMessage({ type: 'delete', id: snippet.id, name: snippet.name, source: snippet.source })}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create `webview/src/app.css`**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--vscode-editor-background);
  color: var(--vscode-foreground);
  font-family: var(--vscode-font-family);
  font-size: var(--vscode-font-size);
  height: 100vh;
  overflow: hidden;
}

.app {
  display: flex;
  height: 100vh;
  position: relative;
}

.error-banner {
  position: fixed;
  top: 0; left: 0; right: 0;
  background: var(--vscode-inputValidation-errorBackground);
  color: var(--vscode-inputValidation-errorForeground);
  border-bottom: 1px solid var(--vscode-inputValidation-errorBorder);
  padding: 6px 12px;
  cursor: pointer;
  z-index: 100;
  font-size: 12px;
}
```

- [ ] **Step 4: Build webview to verify no compile errors**

```bash
cd webview && npm run build
```

Expected: `webview/dist/` created with `index.html` and `assets/` directory. Ignore "SnippetList/EditorPane not found" errors — we'll add those next.

> If you get import errors for missing components, add empty stub files:
> ```bash
> echo "export default () => null;" > webview/src/SnippetList.tsx
> echo "export default () => null;" > webview/src/EditorPane.tsx
> ```

- [ ] **Step 5: Commit**

```bash
git add webview/src/main.tsx webview/src/App.tsx webview/src/app.css
git commit -m "feat: add webview scaffold with message bridge and state reducer"
```

---

## Task 7: SnippetList Component

**Files:**
- Create: `webview/src/SnippetList.tsx`

- [ ] **Step 1: Create `webview/src/SnippetList.tsx`**

```tsx
import React, { useState, useMemo } from 'react';
import { Snippet } from './types';

interface Props {
  snippets: Snippet[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export default function SnippetList({ snippets, selectedId, onSelect, onNew }: Props) {
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');

  const scopes = useMemo(() => {
    const set = new Set(snippets.map(s => s.scope));
    return ['all', 'global', 'workspace', ...Array.from(set).filter(s => s !== 'global' && s !== 'workspace').sort()];
  }, [snippets]);

  const filtered = useMemo(() => {
    return snippets
      .filter(s => scopeFilter === 'all' || s.scope === scopeFilter)
      .filter(s =>
        s.prefix.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.prefix.localeCompare(b.prefix));
  }, [snippets, search, scopeFilter]);

  return (
    <div className="snippet-list">
      <div className="list-toolbar">
        <input
          className="search-input"
          placeholder="Search snippets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="scope-select"
          value={scopeFilter}
          onChange={e => setScopeFilter(e.target.value)}
        >
          {scopes.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All scopes' : s}</option>
          ))}
        </select>
        <button className="new-btn" onClick={onNew}>+ New</button>
      </div>
      <div className="list-items">
        {filtered.length === 0 && (
          <div className="empty-state">No snippets found</div>
        )}
        {filtered.map(snippet => (
          <div
            key={snippet.id}
            className={`snippet-row ${snippet.id === selectedId ? 'active' : ''}`}
            onClick={() => onSelect(snippet.id)}
          >
            <span className="snippet-prefix">{snippet.prefix}</span>
            <span className="snippet-desc">{snippet.description || snippet.name}</span>
            <span className="snippet-scope-badge">{snippet.scope}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add SnippetList styles to `webview/src/app.css`**

Append to `app.css`:

```css
/* SnippetList */
.snippet-list {
  width: 240px;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  background: var(--vscode-sideBar-background);
  border-right: 1px solid var(--vscode-panel-border);
  height: 100vh;
}

.list-toolbar {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.search-input, .scope-select {
  width: 100%;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border, transparent);
  border-radius: 2px;
  padding: 4px 6px;
  font-size: 12px;
  outline: none;
}

.search-input:focus, .scope-select:focus {
  border-color: var(--vscode-focusBorder);
}

.new-btn {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: 2px;
  padding: 5px 8px;
  cursor: pointer;
  font-size: 12px;
  text-align: center;
}

.new-btn:hover { background: var(--vscode-button-hoverBackground); }

.list-items { flex: 1; overflow-y: auto; }

.snippet-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  border-left: 2px solid transparent;
}

.snippet-row:hover { background: var(--vscode-list-hoverBackground); }

.snippet-row.active {
  background: var(--vscode-list-activeSelectionBackground);
  color: var(--vscode-list-activeSelectionForeground);
  border-left-color: var(--vscode-focusBorder);
}

.snippet-prefix {
  font-weight: 600;
  color: var(--vscode-symbolIcon-functionForeground, #dcdcaa);
  flex-shrink: 0;
  font-size: 12px;
}

.snippet-desc {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  opacity: 0.8;
}

.snippet-scope-badge {
  font-size: 10px;
  padding: 1px 5px;
  background: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
  border-radius: 10px;
  flex-shrink: 0;
}

.empty-state {
  padding: 16px 10px;
  font-size: 12px;
  opacity: 0.5;
  text-align: center;
}
```

- [ ] **Step 3: Build to verify**

```bash
cd webview && npm run build
```

Expected: builds without errors.

- [ ] **Step 4: Commit**

```bash
git add webview/src/SnippetList.tsx webview/src/app.css
git commit -m "feat: add SnippetList with search and scope filter"
```

---

## Task 8: EditorPane Component

**Files:**
- Create: `webview/src/EditorPane.tsx`

- [ ] **Step 1: Create `webview/src/EditorPane.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import { Snippet } from './types';
import BodyEditor from './BodyEditor';
import Preview from './Preview';

interface Props {
  snippet: Snippet | null;
  isNew: boolean;
  allSnippets: Snippet[];
  onSave: (snippet: Snippet) => void;
  onDelete: (snippet: Snippet) => void;
}

const SCOPES = ['global', 'workspace', 'javascript', 'typescript', 'python', 'css', 'html', 'json'];

function emptySnippet(): Snippet {
  return { id: crypto.randomUUID(), name: '', prefix: '', description: '', body: [''], scope: 'global', source: '' };
}

export default function EditorPane({ snippet, isNew, allSnippets, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState<Snippet | null>(null);
  const [saveError, setSaveError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isNew) {
      setDraft(emptySnippet());
      setSaveError('');
      setConfirmDelete(false);
    } else if (snippet) {
      setDraft({ ...snippet });
      setSaveError('');
      setConfirmDelete(false);
    } else {
      setDraft(null);
    }
  }, [snippet, isNew]);

  if (!draft) {
    return (
      <div className="editor-pane editor-empty">
        <span>Select a snippet or click <strong>+ New</strong></span>
      </div>
    );
  }

  const hasDuplicatePrefix = allSnippets.some(
    s => s.prefix === draft.prefix && s.scope === draft.scope && s.id !== draft.id
  );

  function handleSave() {
    if (!draft.prefix.trim()) { setSaveError('Prefix is required.'); return; }
    if (!draft.name.trim())   { setSaveError('Name is required.');   return; }
    onSave(draft);
    setSaveError('');
  }

  function handleDuplicate() {
    setDraft({ ...draft, id: crypto.randomUUID(), prefix: `copy-of-${draft.prefix}`, name: `copy of ${draft.name}` });
  }

  return (
    <div className="editor-pane">
      <div className="field-row">
        <div className="field">
          <label>Prefix</label>
          <input
            value={draft.prefix}
            onChange={e => setDraft({ ...draft, prefix: e.target.value })}
            placeholder="e.g. fn"
          />
          {hasDuplicatePrefix && (
            <span className="field-warning">Another snippet uses this prefix.</span>
          )}
        </div>
        <div className="field field-wide">
          <label>Description</label>
          <input
            value={draft.description}
            onChange={e => setDraft({ ...draft, description: e.target.value })}
            placeholder="Short description"
          />
        </div>
        <div className="field">
          <label>Name (key)</label>
          <input
            value={draft.name}
            onChange={e => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. arrow function"
          />
        </div>
        <div className="field">
          <label>Scope</label>
          <select value={draft.scope} onChange={e => setDraft({ ...draft, scope: e.target.value })}>
            {SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="body-section">
        <label>Body</label>
        <BodyEditor
          value={draft.body.join('\n')}
          onChange={val => setDraft({ ...draft, body: val.split('\n') })}
        />
      </div>

      <div className="preview-section">
        <label>Preview</label>
        <Preview body={draft.body} />
      </div>

      <div className="action-bar">
        {saveError && <span className="save-error">{saveError}</span>}
        <button className="btn-primary" onClick={handleSave}>Save</button>
        <button className="btn-secondary" onClick={handleDuplicate}>Duplicate</button>
        {snippet && !isNew && (
          confirmDelete ? (
            <>
              <span className="delete-confirm-label">Delete this snippet?</span>
              <button className="btn-danger" onClick={() => { onDelete(snippet!); setConfirmDelete(false); }}>Confirm</button>
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </>
          ) : (
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
          )
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add EditorPane styles to `webview/src/app.css`**

Append to `app.css`:

```css
/* EditorPane */
.editor-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 12px;
  overflow-y: auto;
  height: 100vh;
}

.editor-empty {
  align-items: center;
  justify-content: center;
  opacity: 0.5;
  font-size: 13px;
}

.field-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 120px;
}

.field-wide { flex: 1; }

.field label, .body-section > label, .preview-section > label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  opacity: 0.6;
}

.field input, .field select {
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border, transparent);
  border-radius: 2px;
  padding: 4px 7px;
  font-size: 12px;
  outline: none;
}

.field input:focus, .field select:focus {
  border-color: var(--vscode-focusBorder);
}

.field-warning {
  font-size: 10px;
  color: var(--vscode-inputValidation-warningForeground);
}

.body-section, .preview-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--vscode-panel-border);
  flex-wrap: wrap;
}

.save-error {
  font-size: 11px;
  color: var(--vscode-inputValidation-errorForeground);
  flex: 1;
}

.delete-confirm-label {
  font-size: 12px;
  opacity: 0.8;
}

.btn-primary {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: 2px;
  padding: 5px 14px;
  cursor: pointer;
  font-size: 12px;
}

.btn-primary:hover { background: var(--vscode-button-hoverBackground); }

.btn-secondary {
  background: var(--vscode-button-secondaryBackground);
  color: var(--vscode-button-secondaryForeground);
  border: none;
  border-radius: 2px;
  padding: 5px 12px;
  cursor: pointer;
  font-size: 12px;
}

.btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }

.btn-danger {
  background: var(--vscode-inputValidation-errorBackground);
  color: var(--vscode-inputValidation-errorForeground);
  border: 1px solid var(--vscode-inputValidation-errorBorder);
  border-radius: 2px;
  padding: 5px 12px;
  cursor: pointer;
  font-size: 12px;
}
```

- [ ] **Step 3: Build to verify**

```bash
cd webview && npm run build
```

Expected: builds without errors (BodyEditor and Preview stubs will be needed — add empty stubs if not already present).

- [ ] **Step 4: Commit**

```bash
git add webview/src/EditorPane.tsx webview/src/app.css
git commit -m "feat: add EditorPane with field inputs and action bar"
```

---

## Task 9: BodyEditor Component (Monaco)

**Files:**
- Create: `webview/src/BodyEditor.tsx`

- [ ] **Step 1: Create `webview/src/BodyEditor.tsx`**

```tsx
import React from 'react';
import Editor from '@monaco-editor/react';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function BodyEditor({ value, onChange }: Props) {
  return (
    <div className="body-editor-wrap">
      <Editor
        height="200px"
        language="plaintext"
        theme="vs-dark"
        value={value}
        onChange={val => onChange(val ?? '')}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'off',
          fontSize: 13,
          lineNumbers: 'on',
          renderLineHighlight: 'none',
          overviewRulerLanes: 0,
          folding: false,
          padding: { top: 6, bottom: 6 },
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Add BodyEditor styles to `webview/src/app.css`**

Append to `app.css`:

```css
/* BodyEditor */
.body-editor-wrap {
  border: 1px solid var(--vscode-input-border, transparent);
  border-radius: 2px;
  overflow: hidden;
}

.body-editor-wrap:focus-within {
  border-color: var(--vscode-focusBorder);
}
```

- [ ] **Step 3: Build to verify Monaco bundles correctly**

```bash
cd webview && npm run build
```

Expected: build succeeds. Monaco adds ~2-4 MB to the bundle — this is expected.

- [ ] **Step 4: Commit**

```bash
git add webview/src/BodyEditor.tsx webview/src/app.css
git commit -m "feat: add Monaco body editor"
```

---

## Task 10: Preview Component

**Files:**
- Create: `webview/src/Preview.tsx`

- [ ] **Step 1: Create `webview/src/Preview.tsx`**

```tsx
import React, { useMemo } from 'react';

interface Props {
  body: string[];
}

function renderPreview(body: string[]): string {
  return body
    .join('\n')
    // ${N:label} → label (in italics via placeholder)
    .replace(/\$\{(\d+):([^}]+)\}/g, (_m, _n, label) => `‹${label}›`)
    // bare $N → ‹cursorN›
    .replace(/\$(\d+)/g, (_m, n) => `‹cursor${n}›`)
    // $0 → ‹end›
    .replace(/‹cursor0›/g, '‹end›');
}

export default function Preview({ body }: Props) {
  const rendered = useMemo(() => renderPreview(body), [body]);

  return (
    <pre className="preview-block">{rendered}</pre>
  );
}
```

- [ ] **Step 2: Add Preview styles to `webview/src/app.css`**

Append to `app.css`:

```css
/* Preview */
.preview-block {
  background: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.1));
  border-left: 3px solid var(--vscode-textBlockQuote-border, rgba(127,127,127,0.5));
  padding: 8px 12px;
  font-family: var(--vscode-editor-font-family, 'Courier New', monospace);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  border-radius: 0 2px 2px 0;
  color: var(--vscode-foreground);
  opacity: 0.85;
  min-height: 40px;
}
```

- [ ] **Step 3: Build to verify**

```bash
cd webview && npm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add webview/src/Preview.tsx webview/src/app.css
git commit -m "feat: add live snippet preview with tab stop rendering"
```

---

## Task 11: Manual Smoke Test

> Run the extension in the Extension Development Host and verify all features work end-to-end. No automated tests for the UI — follow this checklist.

- [ ] **Step 1: Do a full build**

```bash
npm run build
```

Expected: compiles extension to `out/`, builds webview to `webview/dist/`. No errors.

- [ ] **Step 2: Open the Extension Development Host**

In VS Code with the `livetem` folder open, press `F5`. A new VS Code window opens with the extension loaded.

- [ ] **Step 3: Open the Snippet Manager**

In the Extension Development Host window, open Command Palette (`Cmd+Shift+P`) and run `Snippet Manager: Open`.

Expected: A new editor tab opens titled "Snippet Manager". The left panel shows your existing snippets. The right panel shows "Select a snippet or click + New".

- [ ] **Step 4: Verify snippet list**

Expected:
- Your global snippets appear with correct prefix, description, and a "global" badge.
- Scope filter dropdown has "All scopes", "global", "workspace", and any language options.
- Search filters the list in real time.

- [ ] **Step 5: Select and edit an existing snippet**

Click any snippet in the list.

Expected:
- Fields populate with prefix, description, name, scope.
- Monaco editor shows the body with proper indentation.
- Preview pane renders the body with `‹placeholders›` for tab stops.

- [ ] **Step 6: Edit the body and verify live preview**

Change some text in the Monaco editor.

Expected: Preview updates within ~150ms of each keystroke.

- [ ] **Step 7: Create a new snippet**

Click `+ New`, fill in prefix `test1`, description `test snippet`, name `test`, scope `global`, body `console.log("$1");`. Click Save.

Expected:
- Snippet appears in the list.
- `~/.../Code/User/snippets/global.code-snippets` (or OS equivalent) contains the new entry.
- Try typing `test1` in a JS file to verify VS Code picks it up (may require reloading VS Code).

- [ ] **Step 8: Delete a snippet**

Select the `test1` snippet. Click Delete → Confirm.

Expected: snippet disappears from the list and is removed from the JSON file.

- [ ] **Step 9: Duplicate a snippet**

Select any snippet. Click Duplicate.

Expected: EditorPane fills with a copy, prefix prefixed with `copy-of-`. Click Save to confirm it saves as a new entry.

- [ ] **Step 10: Test `openNew` command**

Close the panel. Run `Snippet Manager: New Snippet` from Command Palette.

Expected: panel opens with EditorPane in "new" state (blank fields, ready to type).

- [ ] **Step 11: Final commit**

```bash
git add -A
git commit -m "feat: snippet manager extension complete — all smoke tests passing"
```

---

## Known Simplification

**Malformed JSON warning banner** (from spec): The `SnippetProvider` silently skips malformed files. The spec calls for a dismissible warning banner in the webview listing which files were skipped. This is intentionally deferred — for a personal tool where you control the snippet files, silent skipping is sufficient. To implement it later: change `getAllSnippets` to return `{ snippets: Snippet[], skippedFiles: string[] }`, include `skippedFiles` in the `init` message, and display a banner in `App.tsx` when `skippedFiles.length > 0`.
