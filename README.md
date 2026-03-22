# telegram-cli-tool

A powerful CLI tool to access your Telegram account directly from the terminal. Send/read messages, manage groups, search conversations, and more — all via Telegram's MTProto protocol.

## Installation

```bash
npm install -g telegram-cli-tool
```

**Requirements:** Node.js ≥ 18

## Prerequisites

You need Telegram API credentials:

1. Go to [my.telegram.org](https://my.telegram.org)
2. Log in with your phone number
3. Navigate to **API development tools**
4. Create a new application
5. Copy `api_id` and `api_hash`

## Quick Start

```bash
# 1. Login (first time only — will ask for api_id, api_hash, phone, OTP)
telegram login

# 2. Send a message
telegram msg @username "Hello from CLI!"

# 3. Read recent conversations
telegram inbox

# 4. Read only unread private chats
telegram inbox --unread --private

# 5. Read messages from a specific chat
telegram inbox --chat @username --limit 20

# 6. Interactive real-time chat
telegram chat @username
# Type messages, press Enter to send. Type /exit to quit.
```

## All Commands

### 🔐 Authentication

| Command           | Description                                                  |
| ----------------- | ------------------------------------------------------------ |
| `telegram login`  | Log in with phone number + OTP. Saves session for future use |
| `telegram logout` | Log out and clear saved session                              |

---

### 💬 Messaging

| Command                         | Description                                        |
| ------------------------------- | -------------------------------------------------- |
| `telegram msg <peer> <text>`    | Send a text message                                |
| `telegram fwd <user> <msg-id>`  | Forward a message to another user                  |
| `telegram chat <peer>`          | Start interactive real-time chat (`/exit` to quit) |
| `telegram mark-read <peer>`     | Mark all messages as read                          |
| `telegram delete-msg <msg-id>`  | Delete a message by ID                             |
| `telegram restore-msg <msg-id>` | Restore a deleted message (limited support)        |
| `telegram inbox [options]`      | View recent messages or conversations              |

**Inbox options:**

| Flag                | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| `-c, --chat <peer>` | Show messages from a specific chat                          |
| `-l, --limit <n>`   | Number of items to show (default: 10)                       |
| `-u, --unread`      | Show only unread conversations                              |
| `-p, --private`     | Show only private (1-on-1) chats, exclude groups & channels |

**Examples:**

```bash
# All recent conversations
telegram inbox

# Only unread
telegram inbox -u

# Only private chats
telegram inbox -p

# Unread private chats only
telegram inbox -u -p

# Last 5 messages from a specific chat
telegram inbox -c @username -l 5
```

---

### 👤 Contacts

| Command                                         | Description                   |
| ----------------------------------------------- | ----------------------------- |
| `telegram add-contact <phone> <first> <last>`   | Add a contact by phone number |
| `telegram rename-contact <user> <first> <last>` | Rename an existing contact    |

**Examples:**

```bash
telegram add-contact +84901234567 "Nguyen" "Van A"
telegram rename-contact @username "New" "Name"
```

---

### 📎 Multimedia

| Command                             | Description                              |
| ----------------------------------- | ---------------------------------------- |
| `telegram send-photo <peer> <file>` | Send a photo                             |
| `telegram send-video <peer> <file>` | Send a video                             |
| `telegram send-file <peer> <file>`  | Send a text file as plain messages       |
| `telegram download <msg-id>`        | Download media from a message            |
| `telegram view <msg-id>`            | Download media & open with system viewer |
| `telegram fwd-media <msg-id>`       | Forward media anonymously (strip sender) |
| `telegram set-avatar <file>`        | Set your profile photo                   |

**Download/View options:**

| Flag                | Description                                  |
| ------------------- | -------------------------------------------- |
| `-t, --type <type>` | Media type: `photo`, `video`, `audio`, `doc` |

**Examples:**

```bash
telegram send-photo @username ./photo.jpg
telegram send-video @username ./video.mp4
telegram download 12345
telegram download 12345 --type photo
telegram view 12345
telegram set-avatar ./avatar.jpg
```

---

### 👥 Group Chat

| Command                                    | Description                                   |
| ------------------------------------------ | --------------------------------------------- |
| `telegram chat-info <chat>`                | Show group/channel info (members, type, etc.) |
| `telegram chat-add <chat> <user>`          | Add a user to a group                         |
| `telegram chat-kick <chat> <user>`         | Remove a user from a group                    |
| `telegram chat-rename <chat> <name>`       | Rename a group chat                           |
| `telegram create-group <topic> <users...>` | Create a new group with users                 |
| `telegram chat-set-photo <chat> <file>`    | Set group chat photo                          |

**Examples:**

```bash
telegram chat-info "My Group"
telegram chat-add "My Group" @newuser
telegram chat-kick "My Group" @baduser
telegram chat-rename "My Group" "New Group Name"
telegram create-group "Project Chat" @user1 @user2 @user3
telegram chat-set-photo "My Group" ./group-photo.jpg
```

---

### 🔍 Search

| Command                            | Description                        |
| ---------------------------------- | ---------------------------------- |
| `telegram search <peer> <pattern>` | Search messages in a specific chat |
| `telegram global-search <pattern>` | Search messages across all chats   |

**Examples:**

```bash
telegram search @username "meeting"
telegram global-search "password"
```

---

## Peer Format

The `<peer>` argument accepts multiple formats:

| Format       | Example        | Description                      |
| ------------ | -------------- | -------------------------------- |
| `@username`  | `@johndoe`     | Telegram username                |
| Phone number | `+84901234567` | International format             |
| `me`         | `me`           | Your own Saved Messages          |
| Chat title   | `"My Group"`   | Group/channel title (use quotes) |

## Session & Config

All data is stored in `~/.telegram-cli/`:

```
~/.telegram-cli/
├── config.json     # API credentials & session string
└── downloads/      # Downloaded media files
```

To reset everything: `telegram logout` or delete `~/.telegram-cli/`.

## Development

```bash
# Clone & install
git clone <repo-url> && cd telegram-cli
npm install

# Build
npm run build

# Test locally
npm link
telegram --help
```

## Release Process

```bash
# Bump version and auto-publish via CI
npm version patch    # or minor / major
git push --follow-tags
# → GitHub Actions will build + publish to npm automatically
```

## CI/CD

| Workflow      | Trigger       | What it does                         |
| ------------- | ------------- | ------------------------------------ |
| `ci.yml`      | Every push/PR | Type check + build                   |
| `publish.yml` | Tag `v*.*.*`  | Build + npm publish + GitHub Release |

> **Setup:** Add `NPM_TOKEN` secret to your GitHub repository settings (Settings → Secrets → Actions).

## License

MIT
