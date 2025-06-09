# Tmux Quick Guide

## General Tmux Commands

### Sessions
- `tmux` - Start new session
- `tmux new -s name` - Start new named session
- `tmux ls` - List sessions
- `tmux attach -t name` - Attach to named session
- `tmux kill-session -t name` - Kill named session
- `Ctrl+b d` - Detach from session

### Windows
- `Ctrl+b c` - Create new window
- `Ctrl+b ,` - Rename current window
- `Ctrl+b w` - List windows
- `Ctrl+b n` - Next window
- `Ctrl+b p` - Previous window
- `Ctrl+b 0-9` - Switch to window by number
- `Ctrl+b &` - Kill current window

### Panes
- `Ctrl+b %` - Split vertically
- `Ctrl+b "` - Split horizontally
- `Ctrl+b o` - Switch to next pane
- `Ctrl+b ;` - Toggle last active pane
- `Ctrl+b x` - Kill current pane
- `Ctrl+b z` - Toggle pane zoom
- `Ctrl+b {` - Move pane left
- `Ctrl+b }` - Move pane right
- `Ctrl+b Space` - Toggle between layouts

### Copy Mode
- `Ctrl+b [` - Enter copy mode
- `q` - Exit copy mode
- `Space` - Start selection (in copy mode)
- `Enter` - Copy selection (in copy mode)
- `Ctrl+b ]` - Paste buffer

### Other Useful Commands
- `Ctrl+b ?` - List all key bindings
- `Ctrl+b :` - Enter command mode
- `Ctrl+b t` - Show time

## Your Custom Setup

### Pane Navigation (No Prefix Required)
- `Alt+←` - Select pane to the left
- `Alt+→` - Select pane to the right
- `Alt+↑` - Select pane above
- `Alt+↓` - Select pane below

### Window Navigation (No Prefix Required)
- `Ctrl+←` - Switch to previous window
- `Ctrl+→` - Switch to next window

These custom bindings allow for faster navigation without needing to use the prefix key (Ctrl+b).