# QueDesk

A personal productivity app built for queue-based task management — Today, This Week, Backlog, and Inbox — with nested tasks and promotable subtasks.

## Stack

- **Tauri 2** — Windows-first desktop shell (tray, widgets in later phases)
- **React + TypeScript** — UI
- **Tailwind CSS** — styling, dark/light themes
- **SQLite** — local database (`quedesk.db` in app data)

## Prerequisites

### Windows (primary)

1. [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Desktop development with C++)
2. [Rust](https://www.rust-lang.org/tools/install) (`rustup`)
3. [Node.js](https://nodejs.org/) 20+

### macOS (secondary)

1. Xcode Command Line Tools: `xcode-select --install`
2. Rust + Node.js (same as above)

Full list: [Tauri prerequisites](https://tauri.app/start/prerequisites/)

## Development

```bash
npm install
npm run tauri dev
```

On first launch, QueDesk starts **minimized to the system tray**. Left-click the tray icon or use **Show QueDesk** from the menu to open the window. Closing the window hides it to the tray — use **Quit QueDesk** to exit.

## Build (Windows installer)

```bash
npm run tauri build
```

Output: `src-tauri/target/release/bundle/` (`.msi` on Windows, `.dmg` on macOS).

## Phase 3 (current)

- [x] Task side panel — click a task to open details on the right
- [x] Expand to full view for long notes
- [x] Markdown notes with Write / Preview tabs
- [x] Focus mode — Today only, minimal UI, hide completed toggle

## Roadmap

| Phase | Focus |
|-------|--------|
| 4 | Widgets (Today + quick capture) |
| 5 | Voice capture (OpenAI) |
| 6 | Outlook + Teams integration |

## Database location

SQLite file: `quedesk.db` under the OS app config directory for `com.carlozuffi.quedesk`:

- **Windows:** `%APPDATA%\com.carlozuffi.quedesk\`
- **macOS:** `~/Library/Application Support/com.carlozuffi.quedesk/`
