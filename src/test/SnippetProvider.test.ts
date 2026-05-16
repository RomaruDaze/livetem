import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { SnippetProvider } from '../SnippetProvider';
import { Snippet } from '../types';

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

  it('reads named .code-snippets files from snippetsDir as global scope', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'mytweaks.code-snippets'),
      JSON.stringify({
        'debug': { prefix: 'dbg', body: ['console.debug($1);'], description: 'debug log' }
      })
    );
    const provider = new SnippetProvider(tmpDir);
    const snippets = await provider.getAllSnippets();
    expect(snippets).toHaveLength(1);
    expect(snippets[0].scope).toBe('global');
    expect(snippets[0].prefix).toBe('dbg');
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

  it('removes the old key when previousName differs from snippet.name', async () => {
    const filePath = path.join(tmpDir, 'global.code-snippets');
    await fs.writeFile(filePath, JSON.stringify({
      'old name': { prefix: 'on', body: ['old'], description: '' },
    }));
    const provider = new SnippetProvider(tmpDir);
    await provider.saveSnippet(
      { id: 'x', name: 'new name', prefix: 'nn', description: '', body: ['new'], scope: 'global', source: filePath },
      'old name'
    );
    const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    expect(content['old name']).toBeUndefined();
    expect(content['new name']).toBeDefined();
  });

  it('does not remove any key when previousName equals snippet.name', async () => {
    const filePath = path.join(tmpDir, 'global.code-snippets');
    await fs.writeFile(filePath, JSON.stringify({
      'same': { prefix: 'sm', body: ['same'], description: '' },
    }));
    const provider = new SnippetProvider(tmpDir);
    await provider.saveSnippet(
      { id: 'x', name: 'same', prefix: 'sm2', description: '', body: ['same'], scope: 'global', source: filePath },
      'same'
    );
    const content = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    expect(content['same'].prefix).toBe('sm2');
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
