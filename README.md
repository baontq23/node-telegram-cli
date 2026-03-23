# node-telegram-cli

A powerful CLI tool to access your Telegram account directly from the terminal. Send/read messages, manage groups, search conversations, and more — all via Telegram's MTProto protocol.

## Installation

```bash
npm install -g node-telegram-cli
```

**Requirements:** Node.js >= 20

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
ntg login

# 2. Send a message
ntg msg @username "Hello from CLI!"

# 3. Read recent conversations
ntg inbox

# 4. Read only unread private chats
ntg inbox --unread --private

# 5. Read messages from a specific chat
ntg inbox --chat @username --limit 20

# 6. Interactive real-time chat
ntg chat @username
# Type messages, press Enter to send. Type /exit to quit.
```

## All Commands

### Authentication

| Command      | Description                                                  |
| ------------ | ------------------------------------------------------------ |
| `ntg login`  | Log in with phone number + OTP. Saves session for future use |
| `ntg logout` | Log out and clear saved session                              |

---

### Messaging

| Command                    | Description                                        |
| -------------------------- | -------------------------------------------------- |
| `ntg msg <peer> <text>`    | Send a text message                                |
| `ntg fwd <user> <msg-id>`  | Forward a message to another user                  |
| `ntg chat <peer>`          | Start interactive real-time chat (`/exit` to quit) |
| `ntg mark-read <peer>`     | Mark all messages as read                          |
| `ntg delete-msg <msg-id>`  | Delete a message by ID                             |
| `ntg restore-msg <msg-id>` | Restore a deleted message (limited support)        |
| `ntg inbox [options]`      | View recent messages or conversations              |

**Message options:**

| Flag           | Description                                         |
| -------------- | --------------------------------------------------- |
| `-s, --silent` | Send silently (no notification sound for recipient) |

**Inbox options:**

| Flag                | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| `-c, --chat <peer>` | Show messages from a specific chat                          |
| `-l, --limit <n>`   | Number of items to show (default: 10)                       |
| `-u, --unread`      | Show only unread conversations                              |
| `-p, --private`     | Show only private (1-on-1) chats, exclude groups & channels |

**Examples:**

```bash
# Send a message
ntg msg @username "Hello!"

# Send silently (no notification sound)
ntg msg @username "Hello!" --silent

# All recent conversations
ntg inbox

# Only unread
ntg inbox -u

# Only private chats
ntg inbox -p

# Unread private chats only
ntg inbox -u -p

# Last 5 messages from a specific chat
ntg inbox -c @username -l 5
```

---

### Contacts

| Command                                    | Description                   |
| ------------------------------------------ | ----------------------------- |
| `ntg add-contact <phone> <first> <last>`   | Add a contact by phone number |
| `ntg rename-contact <user> <first> <last>` | Rename an existing contact    |

**Examples:**

```bash
ntg add-contact +84901234567 "Nguyen" "Van A"
ntg rename-contact @username "New" "Name"
```

---

### Multimedia

| Command                        | Description                              |
| ------------------------------ | ---------------------------------------- |
| `ntg send-photo <peer> <file>` | Send a photo                             |
| `ntg send-video <peer> <file>` | Send a video                             |
| `ntg send-file <peer> <file>`  | Send a text file as plain messages       |
| `ntg download <msg-id>`        | Download media from a message            |
| `ntg view <msg-id>`            | Download media & open with system viewer |
| `ntg fwd-media <msg-id>`       | Forward media anonymously (strip sender) |
| `ntg set-avatar <file>`        | Set your profile photo                   |

**Download/View options:**

| Flag                | Description                                  |
| ------------------- | -------------------------------------------- |
| `-t, --type <type>` | Media type: `photo`, `video`, `audio`, `doc` |

**Examples:**

```bash
ntg send-photo @username ./photo.jpg
ntg send-video @username ./video.mp4
ntg download 12345
ntg download 12345 --type photo
ntg view 12345
ntg set-avatar ./avatar.jpg
```

---

### Group Chat

| Command                               | Description                                   |
| ------------------------------------- | --------------------------------------------- |
| `ntg chat-info <chat>`                | Show group/channel info (members, type, etc.) |
| `ntg chat-add <chat> <user>`          | Add a user to a group                         |
| `ntg chat-kick <chat> <user>`         | Remove a user from a group                    |
| `ntg chat-rename <chat> <name>`       | Rename a group chat                           |
| `ntg create-group <topic> <users...>` | Create a new group with users                 |
| `ntg chat-set-photo <chat> <file>`    | Set group chat photo                          |

**Examples:**

```bash
ntg chat-info "My Group"
ntg chat-add "My Group" @newuser
ntg chat-kick "My Group" @baduser
ntg chat-rename "My Group" "New Group Name"
ntg create-group "Project Chat" @user1 @user2 @user3
ntg chat-set-photo "My Group" ./group-photo.jpg
```

---

### Search

| Command                       | Description                        |
| ----------------------------- | ---------------------------------- |
| `ntg search <peer> <pattern>` | Search messages in a specific chat |
| `ntg global-search <pattern>` | Search messages across all chats   |

**Examples:**

```bash
ntg search @username "meeting"
ntg global-search "password"
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

To reset everything: `ntg logout` or delete `~/.telegram-cli/`.

## Development

```bash
# Clone & install
git clone <repo-url> && cd node-telegram-cli
npm install

# Build
npm run build

# Test locally
npm link
ntg --help
```

## License

MIT
