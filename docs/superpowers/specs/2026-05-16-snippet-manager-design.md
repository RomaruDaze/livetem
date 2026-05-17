# VS Code Snippet Manager Extension — Design Spec
**Date:** 2026-05-16

## Overview

A VS Code extension that provides a rich UI for creating and editing VS Code snippets (live templates). Replaces the hassle of manually editing JSON snippet files — especially for multi-line snippets — with a split-pane editor tab backed by Monaco and a live preview.

---

## Goals

- Create, edit, and delete snippets across all three scope types: Global, Workspace, and language-specific
- No more hand-editing JSON files or fighting with multi-line body formatting
- Live preview of what a snippet expands to as you type
- Stays out of the way — opens on demand via Command Palette

## Non-Goals

- Snippet sharing or syncing across machines
- Importing/exporting snippet files
- Snippet search inside the editor (VS Code's built-in IntelliSense handles that)

---

## Architecture

Two sides communicate via VS Code's postMessage API:

```
┌─────────────────────────────────────────┐
│  VS Code Extension Host (Node.js)       │
│  SnippetProvider — reads/writes .json   │
│  PanelManager   — opens the webview tab │
└────────────────┬────────────────────────┘
                 │ postMessage / onMessage
┌────────────────▼────────────────────────┐
│  Webview (React + Vite, TypeScript)     │
│  SnippetList │ EditorPane    │ Preview  │
└─────────────────────────────────────────┘
```

**Extension host** handles all filesystem access. The webview has no direct disk access.

**Webview** is a bundled React app (Vite) loaded into a VS Code WebviewPanel. It renders the full UI and communicates with the host via `vscode.postMessage` / `window.addEventListener('message')`.

---

## Snippet File Mapping

| Scope | File location |
|---|---|
| Global | `<vscode-user-data>/snippets/global.code-snippets` |
| Workspace | `.vscode/<vscode.workspace.name>.code-snippets` |
| Language (e.g. JS) | `<vscode-user-data>/snippets/javascript.json` |

Language snippet files are discovered by scanning the user snippets directory for `.json` files (excluding `global.code-snippets`). The filename (without extension) maps to the language identifier.

---

## Message Protocol

All messages are typed objects passed between host and webview.

### Host → Webview

```ts
{ type: 'init';    snippets: Snippet[] }
{ type: 'saved';   snippet: Snippet }
{ type: 'deleted'; id: string }
{ type: 'error';   message: string }
```

### Webview → Host

```ts
{ type: 'save';   snippet: Snippet }
{ type: 'delete'; id: string }
```

### Snippet shape

```ts
interface Snippet {
  id: string;          // generated UUID, not stored in file
  name: string;        // key in the JSON file
  prefix: string;      // trigger shortcut
  description: string;
  body: string[];      // array of lines (VS Code format)
  scope: string;       // 'global' | 'workspace' | language id
  source: string;      // absolute path to the .json file
}
```

---

## UI Components

```
App
├── Toolbar          — search input, scope filter dropdown, "+ New" button
├── SnippetList      — flat scrollable list, one row per snippet
│   └── SnippetRow   — prefix → description, scope badge, click to select
└── EditorPane       — shown when a snippet is selected or new
    ├── FieldRow     — prefix (text input), description (text input), scope (select)
    ├── BodyEditor   — Monaco editor, language set to "plaintext" with snippet syntax
    ├── Preview      — live rendered output, tab stops replaced with italicised placeholder text
    └── ActionBar    — Save, Delete, Duplicate buttons
```

**Toolbar:** Search filters the list client-side (no round-trip). Scope dropdown options: All, Global, Workspace, then one entry per detected language file. `+ New` clears EditorPane and pre-selects scope based on current filter.

**SnippetList:** Flat list sorted by prefix alphabetically within each render (no grouping). Clicking a row loads it into EditorPane. Active row highlighted.

**EditorPane:** Only shown when a snippet is selected or `+ New` is clicked. Hidden state shows an empty placeholder ("Select a snippet or create a new one").

**BodyEditor:** Monaco editor instance. Language mode: `plaintext`. Tab stops (`$1`, `$2`, `${1:placeholder}`, `$0`) are not validated — user types them freely. Editor height: fixed at ~200px with vertical scroll.

**Preview:** Reads Monaco content on change. Replaces `${N:label}` with `<em>label</em>` and bare `$N` with `<em>cursorN</em>`. Renders body lines joined by `\n` in a styled `<pre>` block. Updates on every keystroke (debounced 150ms).

**ActionBar:**
- **Save** — sends `save` message to host; button shows spinner until `saved` confirmation
- **Delete** — shows inline confirmation ("Delete this snippet?" with Confirm / Cancel) before sending `delete`
- **Duplicate** — copies current snippet into EditorPane as a new snippet with prefix `copy-of-<prefix>`; does not auto-save

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Malformed snippet JSON file | Skip the file, show a dismissible warning banner at top of webview listing which file was skipped |
| Save fails (e.g. permission denied) | Show inline error in ActionBar: "Save failed: \<message\>". Editor is not cleared. |
| Duplicate prefix within same scope | Show inline warning below prefix field: "Another snippet uses this prefix." Allow save — VS Code permits duplicates. |
| No workspace open | Workspace scope option hidden from filter and scope selector |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Extension runtime | TypeScript, VS Code Extension API |
| Webview bundler | Vite |
| Webview framework | React 18 |
| Body editor | `@monaco-editor/react` |
| Styling | CSS Modules or plain CSS (no Tailwind — no build complexity needed) |
| Testing | Vitest for `SnippetProvider` unit tests; manual testing for webview UI |

---

## Extension Entry Points

- **Command:** `livetem.open` — "Snippet Manager: Open" — opens the WebviewPanel
- **Command:** `livetem.openNew` — "Snippet Manager: New Snippet" — opens the panel and immediately triggers `+ New`
- The panel is a singleton — running the command when already open focuses the existing panel

---

## Project Structure

```
livetem/
├── src/
│   ├── extension.ts          — activation, command registration
│   ├── PanelManager.ts       — creates/manages the WebviewPanel singleton
│   ├── SnippetProvider.ts    — reads/writes snippet files, handles messages
│   └── types.ts              — shared Snippet interface
├── webview/
│   ├── src/
│   │   ├── main.tsx          — React entry point
│   │   ├── App.tsx           — root component, message bus
│   │   ├── SnippetList.tsx
│   │   ├── EditorPane.tsx
│   │   ├── BodyEditor.tsx    — Monaco wrapper
│   │   └── Preview.tsx
│   ├── index.html
│   └── vite.config.ts
├── package.json
└── tsconfig.json
```
