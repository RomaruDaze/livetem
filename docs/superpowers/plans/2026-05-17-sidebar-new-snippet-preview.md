# Sidebar New-Snippet Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a live-updating unsaved-indicator row at the top of the snippet sidebar whenever the user is creating a new snippet, disappearing on save or navigation.

**Architecture:** `EditorPane` fires an `onDraftChange` callback on every draft change (only when `isNew`). `App` stores the result in a `useState<Snippet | null>` and passes it to `SnippetList`, which renders a non-interactive preview row pinned above the sorted list.

**Tech Stack:** React 18, TypeScript, VS Code CSS variables, no new dependencies.

---

### Task 1: Add CSS for the preview row

**Files:**
- Modify: `webview/src/app.css`

No test framework exists for the webview; verification is a clean `npm run build`.

- [ ] **Step 1: Add styles to `webview/src/app.css`**

Append after the `.empty-state` rule (around line 127):

```css
/* New-snippet preview row */
.snippet-row-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-left: 2px solid transparent;
  border-bottom: 1px solid var(--vscode-panel-border);
  cursor: default;
}

.preview-untitled {
  font-style: italic;
  opacity: 0.45;
}

.preview-dot {
  font-size: 11px;
  color: var(--vscode-gitDecoration-modifiedResourceForeground, #e2c08d);
  flex-shrink: 0;
  margin-left: auto;
}
```

- [ ] **Step 2: Verify build**

```bash
cd webview && npm run build
```

Expected: `✓ built in ~15s` with no errors.

- [ ] **Step 3: Commit**

```bash
git add webview/src/app.css
git commit -m "feat: add CSS for sidebar new-snippet preview row"
```

---

### Task 2: Add `onDraftChange` prop to EditorPane

**Files:**
- Modify: `webview/src/EditorPane.tsx`

- [ ] **Step 1: Extend the Props interface**

In `webview/src/EditorPane.tsx`, update the `Props` interface:

```typescript
interface Props {
  snippet: Snippet | null;
  isNew: boolean;
  allSnippets: Snippet[];
  onSave: (snippet: Snippet, previousName?: string) => void;
  onDelete: (snippet: Snippet) => void;
  onDraftChange?: (draft: Snippet | null) => void;
}
```

- [ ] **Step 2: Destructure the new prop**

Update the function signature:

```typescript
export default function EditorPane({ snippet, isNew, allSnippets, onSave, onDelete, onDraftChange }: Props) {
```

- [ ] **Step 3: Add the useEffect that fires onDraftChange**

Add this `useEffect` directly after the existing `useEffect([snippet, isNew])` block (around line 53):

```typescript
useEffect(() => {
  if (isNew && draft) {
    onDraftChange?.(draft);
  } else {
    onDraftChange?.(null);
  }
}, [draft, isNew]);
```

- [ ] **Step 4: Verify build**

```bash
cd webview && npm run build
```

Expected: `✓ built in ~15s` with no errors.

- [ ] **Step 5: Commit**

```bash
git add webview/src/EditorPane.tsx
git commit -m "feat: add onDraftChange prop to EditorPane"
```

---

### Task 3: Wire draftPreview in App

**Files:**
- Modify: `webview/src/App.tsx`

- [ ] **Step 1: Add the `draftPreview` state**

In `webview/src/App.tsx`, add a `useState` import for `useState` (it already imports `useEffect` and `useReducer` — add `useState` to the import) and declare the state inside `App`:

```typescript
import React, { useEffect, useReducer, useState } from 'react';
```

Inside the `App` function, after the `useReducer` line:

```typescript
const [draftPreview, setDraftPreview] = useState<Snippet | null>(null);
```

- [ ] **Step 2: Clear draftPreview when a snippet is saved or navigation leaves new mode**

The `EditorPane` `useEffect` already calls `onDraftChange(null)` whenever `isNew` becomes false, which covers saves and navigation. No reducer changes are needed.

- [ ] **Step 3: Wire onDraftChange and draftPreview into JSX**

Update the `EditorPane` usage in the return block:

```tsx
<EditorPane
  snippet={selected}
  isNew={state.isNew}
  allSnippets={state.snippets}
  onSave={(snippet, previousName) => vscode.postMessage({ type: 'save', snippet, previousName })}
  onDelete={snippet => vscode.postMessage({ type: 'delete', id: snippet.id, name: snippet.name, source: snippet.source })}
  onDraftChange={setDraftPreview}
/>
```

Update the `SnippetList` usage:

```tsx
<SnippetList
  snippets={state.snippets}
  selectedId={state.selectedId}
  draftPreview={draftPreview}
  onSelect={id => dispatch({ type: 'SELECT', id })}
  onNew={() => dispatch({ type: 'NEW' })}
/>
```

- [ ] **Step 4: Verify build**

```bash
cd webview && npm run build
```

Expected: TypeScript error on `SnippetList` because `draftPreview` prop is not yet in its interface — that's expected and will be fixed in Task 4.

- [ ] **Step 5: Do NOT commit yet** — Task 4 completes the wiring.

---

### Task 4: Render the preview row in SnippetList

**Files:**
- Modify: `webview/src/SnippetList.tsx`

- [ ] **Step 1: Add `draftPreview` to the Props interface**

```typescript
interface Props {
  snippets: Snippet[];
  selectedId: string | null;
  draftPreview?: Snippet | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}
```

- [ ] **Step 2: Destructure the new prop**

```typescript
export default function SnippetList({ snippets, selectedId, draftPreview, onSelect, onNew }: Props) {
```

- [ ] **Step 3: Render the preview row**

Inside the `list-items` div, add the preview row **before** the empty-state check and the mapped rows:

```tsx
<div className="list-items">
  {draftPreview && (
    <div className="snippet-row-preview" aria-label="Unsaved new snippet">
      {draftPreview.prefix
        ? <span className="snippet-prefix">{draftPreview.prefix}</span>
        : <span className="snippet-prefix preview-untitled">Untitled</span>
      }
      <span className="snippet-desc">{draftPreview.description}</span>
      <span className="preview-dot">●</span>
    </div>
  )}
  {filtered.length === 0 && !draftPreview && (
    <div className="empty-state">No snippets found</div>
  )}
  {filtered.map(snippet => (
    // ... existing row JSX unchanged
  ))}
</div>
```

Note: the empty-state guard adds `&& !draftPreview` so "No snippets found" does not show alongside the preview row on an empty list.

- [ ] **Step 4: Verify build — no TypeScript errors**

```bash
cd webview && npm run build
```

Expected: `✓ built in ~15s` with no errors.

- [ ] **Step 5: Commit both App and SnippetList together**

```bash
git add webview/src/App.tsx webview/src/SnippetList.tsx
git commit -m "feat: wire draftPreview through App into SnippetList preview row"
```

---

### Task 5: Manual smoke test

No automated test framework exists for the webview. Verify all spec scenarios by running the extension.

- [ ] **Step 1: Compile the extension and open the Extension Development Host**

```bash
npm run compile
```

Then press `F5` in VS Code to launch the Extension Development Host.

- [ ] **Step 2: Verify each scenario**

| Action | Expected |
|---|---|
| Click "+ New" | Preview row appears at top with *Untitled* in italic |
| Type a prefix (e.g. `fn`) | Row updates live to show `fn` |
| Type a description | Description appears in the small text next to prefix |
| Yellow `●` dot visible | Dot appears to the right |
| Active search in sidebar | Preview row stays pinned at top, ignores filter |
| Click a saved snippet | Preview row disappears immediately |
| Click "+ New" again, fill prefix, click Save | Preview row disappears; saved snippet appears in sorted list |
| Empty snippet list + click "+ New" | Preview row shows alone, no "No snippets found" text |

- [ ] **Step 3: Commit if all scenarios pass**

```bash
git add .
git commit -m "feat: sidebar new-snippet preview row complete"
```
