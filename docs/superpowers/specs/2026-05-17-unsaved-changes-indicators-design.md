# Unsaved-Changes Indicators Design

**Date:** 2026-05-17
**Status:** Approved

## Overview

Two visual indicators signal unsaved edits:

1. **Save button** — disabled and muted when the draft matches the saved snippet; enabled and bright when the user has made changes.
2. **Sidebar dot** — a yellow `●` on the snippet's row in the sidebar while it has unsaved edits, matching the existing new-snippet preview-row dot.

## Dirty Detection

`EditorPane` computes `isDirty` locally:

- Always `true` when `isNew` (new snippet is always unsaved until committed).
- `true` when any of `prefix`, `description`, `scope`, or `body` (`body.join('\n')`) differ between `draft` and the saved `snippet` prop.
- `false` when draft fields exactly match the saved snippet, or when no snippet is loaded (`draft === null`).

A `useEffect([draft, isNew, snippet])` fires `onDirtyChange?.(isDirty)` whenever the computed value changes.

## Data Flow

`EditorPane → App → SnippetList` (same pattern as `onDraftChange`).

1. `EditorPane` gains `onDirtyChange?: (isDirty: boolean) => void` (optional prop).
2. `App` adds `const [dirtySnippetId, setDirtySnippetId] = useState<string | null>(null)`.
   - `onDirtyChange` wires to a handler: sets `dirtySnippetId` to `state.selectedId` when `isDirty` is true, null when false.
   - Clears automatically on navigation: snippet or `isNew` change → `isDirty` recomputes false → callback fires null.
3. `SnippetList` receives `dirtySnippetId?: string | null` and renders the dot on the matching row.

## Save Button

- **Dirty:** normal `.btn-primary` appearance (no change from current).
- **Clean:** `disabled` attribute set; CSS renders with `opacity: 0.4` and `cursor: default`.
- The Duplicate and Delete buttons are unaffected — always at their normal state.

## Sidebar Dot

- Uses the existing `.preview-dot` class (`--vscode-gitDecoration-modifiedResourceForeground`, yellow `●`).
- Shown on the snippet row whose `id` matches `dirtySnippetId`.
- When the dot is shown, the scope badge (`.snippet-scope-badge`) is hidden on that row — they occupy the same slot and would be redundant.
- The new-snippet preview row (`isNew`) already has its own dot via `draftPreview` — no change needed there.
- Dot disappears when the user navigates away (EditorPane resets → `isDirty` false → `dirtySnippetId` null).

## Edge Cases

| Scenario | Behaviour |
|---|---|
| User edits prefix, then reverts it | `isDirty` returns false → Save re-disables, dot disappears |
| User navigates to another snippet without saving | EditorPane resets → `isDirty` false → dot gone, Save disabled on new selection until edited |
| New snippet (`isNew`) | `isDirty` always true; preview row already has dot; Save button always enabled |
| No snippet selected | `draft === null` → `isDirty` false; Save disabled |

## Files Changed

| File | Change |
|---|---|
| `webview/src/EditorPane.tsx` | Add `onDirtyChange` prop; compute `isDirty`; `disabled={!isDirty}` on Save button |
| `webview/src/App.tsx` | Add `dirtySnippetId` state; wire `onDirtyChange`; pass `dirtySnippetId` to SnippetList |
| `webview/src/SnippetList.tsx` | Add `dirtySnippetId` prop; render `.preview-dot` and hide `.snippet-scope-badge` on dirty row |
| `webview/src/app.css` | Add `.btn-primary:disabled` style (opacity 0.4, cursor default) |
