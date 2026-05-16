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
    // VS Code supports multi-prefix snippets; we take the first.
    // The UI is built around a single-prefix model.
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
      // If no workspace is open, fall back to user snippets dir.
      // The UI should hide 'workspace' scope when there is no workspace.
      const wsDir = this.workspaceDir ?? this.snippetsDir;
      return path.join(wsDir, 'workspace.code-snippets');
    }
    return path.join(this.snippetsDir, `${scope}.json`);
  }

  async getAllSnippets(): Promise<Snippet[]> {
    const results: Snippet[] = [];

    let files: string[] = [];
    try {
      files = await fs.readdir(this.snippetsDir);
    } catch {
      // snippetsDir doesn't exist — still process workspaceDir below
    }

    for (const file of files) {
      const filePath = path.join(this.snippetsDir, file);
      const isCodeSnippets = file.endsWith('.code-snippets');
      const isLanguage = file.endsWith('.json');
      if (!isCodeSnippets && !isLanguage) { continue; }

      const scope = isCodeSnippets ? 'global' : path.basename(file, '.json');
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const raw: RawSnippetFile = JSON.parse(content);
        results.push(...parseSnippetFile(raw, scope, filePath));
      } catch {
        // Malformed JSON — skip silently
      }
    }

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
}
