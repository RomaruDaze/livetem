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
