# node-telegram-cli (ntg) — AI Agent Skill Guide

> CLI tool for Telegram via MTProto. Enables AI agents to send/read messages, manage groups, search conversations, and automate Telegram workflows.

**Repository:** [github.com/baontq23/node-telegram-cli](https://github.com/baontq23/node-telegram-cli)

## Installation

```bash
npm install -g node-telegram-cli
```

Verify installation:

```bash
ntg --version
```

## When to Use

Use `ntg` when the task requires:

- Sending or reading Telegram messages programmatically
- Monitoring Telegram inbox (unread, private, specific chat)
- Managing Telegram groups (create, add/remove users, rename)
- Searching Telegram messages/conversations
- Sending or downloading media files (photos, videos, documents)
- Automating any Telegram account interaction

## Prerequisites

- Node.js >= 20
- Must run `ntg login` once (interactive — requires phone + OTP)
- Session & credentials are stored securely via **OS Keychain** (macOS Keychain / Windows Credential Manager / Linux Secret Service)

## JSON Mode (Critical for AI Agents)

**Always use `--json` flag** for machine-readable output:

```bash
ntg --json inbox
ntg --json inbox --unread --private
ntg --json search @username "keyword"
ntg --json chat-info "Group Name"
```

All commands support `--json` as a **global flag** (before the subcommand or after).

### JSON Output Schema — `inbox`

```json
[
  {
    "name": "Contact Name",
    "peer": "@username",
    "peerType": "username",
    "type": "user",
    "unreadCount": 0,
    "lastMessage": "Hello!",
    "lastMessageId": 3189,
    "mediaType": null,
    "date": "2026-03-22T10:18:20.000Z"
  }
]
```

- `peerType`: `"username"` | `"phone"` | `"id"`
- `type`: `"user"` | `"group"` | `"channel"`
- `mediaType`: `"photo"` | `"video"` | `"document"` | `"audio"` | `"voice"` | `"sticker"` | `"location"` | `"contact"` | `"poll"` | `null`
- `lastMessage`: text/caption only (empty string if media-only message)
- `lastMessageId`: message ID, use with `ntg download <id>` to download media

### JSON Output Schema — `inbox --chat`

````json
[
  {
    "id": 3189,
    "date": "2026-03-23T03:04:59.000Z",
    "sender": "Contact Name",
    "text": "",
    "mediaType": "photo",
    "isOutgoing": false
  }
]

## Peer Format

The `<peer>` argument accepts:

| Format       | Example        | Use case                      |
| ------------ | -------------- | ----------------------------- |
| `@username`  | `@johndoe`     | Most reliable                 |
| Phone number | `+84901234567` | For contacts without username |
| `me`         | `me`           | Your own Saved Messages       |
| Chat title   | `"My Group"`   | Group/channel (use quotes)    |

## Command Reference

### Read Operations (Safe, No Side Effects)

```bash
# List recent conversations
ntg --json inbox

# Only unread conversations
ntg --json inbox --unread

# Only private (1-on-1) chats
ntg --json inbox --private

# Combine filters
ntg --json inbox --unread --private

# Messages from specific chat (last N messages)
ntg --json inbox --chat @username --limit 20

# Search in a specific chat
ntg --json search @username "keyword"

# Search across all chats
ntg --json global-search "keyword"

# Get group/channel info
ntg --json chat-info "Group Name"
````

### Write Operations (Has Side Effects)

```bash
# Send a text message
ntg msg @username "Hello from AI agent"

# Send silently (no notification sound for recipient)
ntg msg @username "status update" --silent

# Forward a message by ID
ntg fwd @recipient 12345

# Mark all messages as read
ntg mark-read @username

# Delete a message
ntg delete-msg 12345

# Send media
ntg send-photo @username ./photo.jpg
ntg send-video @username ./video.mp4
ntg send-file @username ./document.txt

# Download media from message (must specify --chat)
ntg download 12345 --chat @username
ntg download 12345 --chat @username --type photo

# View media (download + open with system viewer)
ntg view 12345 --chat @username

# Clean up all downloaded files
ntg clean-downloads
```

### Group Management

```bash
# Create a group
ntg create-group "Project Chat" @user1 @user2

# Add/remove users
ntg chat-add "My Group" @newuser
ntg chat-kick "My Group" @baduser

# Rename group
ntg chat-rename "My Group" "New Name"

# Set group photo
ntg chat-set-photo "My Group" ./photo.jpg
```

### Interactive (Not Suitable for AI Agents)

```bash
# Real-time chat session — requires human interaction
ntg chat @username
# Type /exit to quit
```

> **Warning:** `ntg chat` is interactive and blocks stdin. Do NOT use in automated pipelines.

## Common AI Agent Workflows

### 1. Check for new messages and respond

```bash
# Get unread private messages
INBOX=$(ntg --json inbox --unread --private)

# Parse JSON, extract peer, send reply
ntg msg @sender "Got your message, processing..."
```

### 2. Search and extract information

```bash
# Find messages containing a keyword
RESULTS=$(ntg --json global-search "meeting tomorrow")
```

### 3. Monitor a specific chat

```bash
# Get latest messages from a chat
ntg --json inbox --chat @group_name --limit 5
```

### 4. Send notification to a group

```bash
ntg msg "My Group" "Deployment completed successfully"
```

### 5. Download media from a chat

```bash
# List messages with media info
MSGS=$(ntg --json inbox --chat @username --limit 10)

# Download a specific media message by ID
ntg download 3189 --chat @username
# File saved to ~/.telegram-cli/downloads/3189_<timestamp>.jpg

# Clean up when done
ntg clean-downloads
```

## Error Handling

- Exit code `0` = success
- Exit code `1` = error (not logged in, peer not found, etc.)
- If not logged in, all commands fail with: `❌ Not logged in. Run "ntg login" first.`

## Session & Config

```
~/.telegram-cli/
├── config.json     # Non-sensitive settings only (downloadDir)
└── downloads/      # Downloaded media files
```

**Security:** API credentials and session token are stored securely via the OS Keychain, not in plaintext files.

Session persists until `ntg logout` is called. No re-login needed between commands.
