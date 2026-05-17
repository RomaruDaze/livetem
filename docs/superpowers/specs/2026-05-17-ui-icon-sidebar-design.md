# LiveTem UI — Command Palette Icon & Activity Bar Sidebar

**Date:** 2026-05-17
**Status:** Approved

## Overview

Two UI improvements to the LiveTem VS Code extension:
1. A custom SVG icon shown next to commands in the command palette
2. A LiveTem entry in the VS Code activity bar that launches the snippet manager

## Feature 1: Command Palette Icon

### Goal
Show the LiveTem `</>` brand mark next to `Snippet Manager: Open` and `Snippet Manager: New Snippet` in the command palette.

### Implementation

**New file:** `media/icon.svg`

- 16×16 SVG
- Uses `currentColor` fill — no hardcoded colors, no background rectangle
- Draws the `</>` symbol (two angle brackets + diagonal slash) matching the brand mark in `icon.png`
- Works in both VS Code light and dark themes automatically

**`package.json` change:**

Add an `icon` field to each command contribution:

```json
"commands": [
  {
    "command": "livetem.open",
    "title": "Snippet Manager: Open",
    "icon": "media/icon.svg"
  },
  {
    "command": "livetem.openNew",
    "title": "Snippet Manager: New Snippet",
    "icon": "media/icon.svg"
  }
]
```

### Constraints
- VS Code command icons must be SVG (PNG is not supported)
- `currentColor` is required so VS Code can apply theme colors
- No background fill — icon must be transparent

---

## Feature 2: Activity Bar Sidebar Launcher

### Goal
Add a LiveTem icon to the VS Code activity bar (left side tab strip). Clicking it opens a panel with two buttons that launch the existing full-tab snippet manager. The sidebar is a launcher only — the full React UI stays in the editor tab.

### Implementation

All changes are in `package.json` — no TypeScript code required.

**Step 1: Register an activity bar container**

```json
"viewsContainers": {
  "activitybar": [
    {
      "id": "livetem-sidebar",
      "title": "LiveTem",
      "icon": "media/icon.svg"
    }
  ]
}
```

**Step 2: Register a tree view inside the container**

```json
"views": {
  "livetem-sidebar": [
    {
      "id": "livetem.launcherView",
      "name": "Snippet Manager"
    }
  ]
}
```

**Step 3: Populate the view with a welcome message and buttons**

```json
"viewsWelcome": [
  {
    "view": "livetem.launcherView",
    "contents": "Manage your VS Code snippets with LiveTem.\n[Open Snippet Manager](command:livetem.open)\n[New Snippet](command:livetem.openNew)"
  }
]
```

VS Code renders `[label](command:...)` tokens as native clickable buttons in the welcome view.

### Behavior
- The LiveTem icon appears in the activity bar alongside Explorer, Search, etc.
- Clicking the icon opens the sidebar panel showing the welcome message and two buttons
- "Open Snippet Manager" triggers `livetem.open` → opens the full-tab panel as before
- "New Snippet" triggers `livetem.openNew` → opens the full-tab panel with new snippet mode
- The existing command palette commands are unchanged

### Constraints
- `viewsWelcome` only renders when the tree view has no items — since we register no `TreeDataProvider`, the view is always empty, so the welcome content always shows
- The activity bar icon uses the same `media/icon.svg` as the command palette icon

---

## Files Changed

| File | Change |
|------|--------|
| `media/icon.svg` | New — 16×16 SVG icon |
| `package.json` | Add `icon` to commands; add `viewsContainers`, `views`, `viewsWelcome` |

## Files Unchanged

- `src/extension.ts` — no changes
- `src/PanelManager.ts` — no changes
- All webview source files — no changes
