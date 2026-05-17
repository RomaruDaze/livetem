# Design: Marketplace Screenshots & GIFs

**Date:** 2026-05-17  
**Status:** Approved

## Goal

Improve the LiveTem VS Code Marketplace listing by adding animated GIF screenshots that demonstrate the extension's key features, embedded in README.md using a demo-first layout.

## Assets

Four animated GIFs stored in `images/` at the repo root:

| File | Scene | Target length |
|---|---|---|
| `images/demo-editor.gif` | Main snippet editor — scroll list, click a snippet, edit body | ~6s |
| `images/demo-sidebar.gif` | Click LiveTem icon in activity bar → sidebar opens → click "Open Snippet Manager" | ~4s |
| `images/demo-command-palette.gif` | Cmd+Shift+P → type "snippet" → custom icon visible → Enter | ~3s |
| `images/demo-new-snippet.gif` | Click New Snippet → fill name/body → save | ~5s |

GIFs are created by the user via screen capture (F5 Extension Development Host + Kap or QuickTime+ffmpeg). Claude does not generate the GIF content.

## README Structure

Demo-first layout: hero GIF immediately after the description, then three feature GIFs in a table under the Features section.

```markdown
# LiveTem — Snippet Manager

A UI for creating and editing VS Code snippets.

![LiveTem demo](images/demo-editor.gif)

## Features

- Create and edit VS Code snippets with a built-in editor
- Manage snippet scope (global, workspace, language-specific)
- Syntax highlighting and language selection for snippet bodies
- Unsaved-changes indicators

| Sidebar Launcher | Command Palette | New Snippet |
|:---:|:---:|:---:|
| ![Sidebar launcher](images/demo-sidebar.gif) | ![Command palette](images/demo-command-palette.gif) | ![New snippet](images/demo-new-snippet.gif) |

## Usage

Open the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:

- **Snippet Manager: Open** — open the snippet manager panel
- **Snippet Manager: New Snippet** — create a new snippet

Or click the LiveTem icon in the activity bar to open the sidebar launcher.

## Requirements

VS Code 1.85.0 or later.
```

## Capture Guide (for user)

1. Press `F5` in VS Code to launch Extension Development Host
2. Set VS Code window to ~1280×800, crop to just the window when recording
3. Use **Kap** (free macOS app, exports GIF directly) or QuickTime → ffmpeg for conversion
4. ffmpeg conversion command (if using QuickTime .mov):
   ```bash
   ffmpeg -i input.mov -vf "fps=15,scale=800:-1:flags=lanczos,palettegen" palette.png
   ffmpeg -i input.mov -i palette.png -vf "fps=15,scale=800:-1:flags=lanczos,paletteuse" output.gif
   ```
5. Place finished GIFs in `images/` at the repo root

## Implementation Tasks

1. Create `images/` directory and add placeholder `.gitkeep`
2. Update `README.md` with the new demo-first structure (hero GIF + feature table)
3. Add `images/**` to `.vscodeignore` to exclude from VSIX package (keep package small)
4. User captures and drops in the 4 GIFs
5. Verify README renders correctly on GitHub preview before publishing
