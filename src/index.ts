import { Command } from "commander";
import { login, logout } from "./auth.js";
import { hasSession } from "./config.js";
import { disconnectClient } from "./client.js";
import { setJsonMode } from "./output.js";
import {
  sendMessage,
  forwardMessage,
  deleteMessage,
  restoreMessage,
  markRead,
  getInbox,
} from "./commands/messaging.js";
import { addContact, renameContact } from "./commands/contacts.js";
import {
  sendPhoto,
  sendVideo,
  sendTextFile,
  downloadMedia,
  viewMedia,
  forwardMedia,
  setProfilePhoto,
} from "./commands/multimedia.js";
import {
  chatInfo,
  chatAddUser,
  chatDelUser,
  renameChat,
  createGroup,
  chatSetPhoto,
} from "./commands/group.js";
import { search, globalSearch } from "./commands/search.js";
import { startChatSession } from "./interactive.js";
import { printError } from "./formatter.js";

const program = new Command();

program
  .name("ntg")
  .description(
    "CLI tool to access your Telegram account via MTProto. Send/read messages, manage groups, search, and more."
  )
  .version("0.1.0")
  .option("-j, --json", "Output results as JSON (for automation & AI agents)")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.json) {
      setJsonMode(true);
    }
  });

// ─── Authentication ──────────────────────────────────────────────
program
  .command("login")
  .description("Log in to your Telegram account")
  .action(async () => {
    try {
      await login();
    } catch (err: any) {
      await printError(`Login failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("logout")
  .description("Log out and clear saved session")
  .action(async () => {
    await logout();
  });

// ─── Helper: ensure logged in ────────────────────────────────────
function requireAuth() {
  if (!hasSession()) {
    console.error('❌ Not logged in. Run "telegram login" first.');
    process.exit(1);
  }
}

// ─── Messaging ───────────────────────────────────────────────────
program
  .command("msg <peer> <text>")
  .description("Send a message to a peer")
  .action(async (peer: string, text: string) => {
    requireAuth();
    await sendMessage(peer, text);
    await disconnectClient();
  });

program
  .command("fwd <user> <msgId>")
  .description("Forward a message to a user")
  .action(async (user: string, msgId: string) => {
    requireAuth();
    await forwardMessage(user, parseInt(msgId, 10));
    await disconnectClient();
  });

program
  .command("chat <peer>")
  .description("Start an interactive chat session (type /exit to quit)")
  .action(async (peer: string) => {
    requireAuth();
    await startChatSession(peer);
    await disconnectClient();
  });

program
  .command("mark-read <peer>")
  .description("Mark all messages as read in a chat")
  .action(async (peer: string) => {
    requireAuth();
    await markRead(peer);
    await disconnectClient();
  });

program
  .command("delete-msg <msgId>")
  .description("Delete a message by ID")
  .action(async (msgId: string) => {
    requireAuth();
    await deleteMessage(parseInt(msgId, 10));
    await disconnectClient();
  });

program
  .command("restore-msg <msgId>")
  .description("Restore a deleted message (limited support)")
  .action(async (msgId: string) => {
    requireAuth();
    await restoreMessage(parseInt(msgId, 10));
    await disconnectClient();
  });

program
  .command("inbox")
  .description("View recent messages or conversations")
  .option("-c, --chat <peer>", "Show messages from specific chat")
  .option("-l, --limit <number>", "Number of messages/chats to show", "10")
  .option("-u, --unread", "Show only unread conversations")
  .option("-p, --private", "Show only private (1-on-1) chats, exclude groups/channels")
  .action(
    async (options: { chat?: string; limit?: string; unread?: boolean; private?: boolean }) => {
      requireAuth();
      await getInbox({
        chat: options.chat,
        limit: parseInt(options.limit || "10", 10),
        unread: options.unread,
        private: options.private,
      });
      await disconnectClient();
    }
  );

// ─── Contacts ────────────────────────────────────────────────────
program
  .command("add-contact <phone> <firstName> <lastName>")
  .description("Add a contact by phone number")
  .action(async (phone: string, firstName: string, lastName: string) => {
    requireAuth();
    await addContact(phone, firstName, lastName);
    await disconnectClient();
  });

program
  .command("rename-contact <user> <firstName> <lastName>")
  .description("Rename a contact")
  .action(async (user: string, firstName: string, lastName: string) => {
    requireAuth();
    await renameContact(user, firstName, lastName);
    await disconnectClient();
  });

// ─── Multimedia ──────────────────────────────────────────────────
program
  .command("send-photo <peer> <file>")
  .description("Send a photo to a peer")
  .action(async (peer: string, file: string) => {
    requireAuth();
    await sendPhoto(peer, file);
    await disconnectClient();
  });

program
  .command("send-video <peer> <file>")
  .description("Send a video to a peer")
  .action(async (peer: string, file: string) => {
    requireAuth();
    await sendVideo(peer, file);
    await disconnectClient();
  });

program
  .command("send-file <peer> <file>")
  .description("Send a text file as plain messages")
  .action(async (peer: string, file: string) => {
    requireAuth();
    await sendTextFile(peer, file);
    await disconnectClient();
  });

program
  .command("download <msgId>")
  .description("Download media from a message")
  .option("-t, --type <type>", "Media type: photo, video, audio, doc")
  .action(async (msgId: string, options: { type?: string }) => {
    requireAuth();
    await downloadMedia(parseInt(msgId, 10), options);
    await disconnectClient();
  });

program
  .command("view <msgId>")
  .description("Download media and open with system viewer")
  .option("-t, --type <type>", "Media type: photo, video, audio, doc")
  .action(async (msgId: string, options: { type?: string }) => {
    requireAuth();
    await viewMedia(parseInt(msgId, 10), options);
    await disconnectClient();
  });

program
  .command("fwd-media <msgId>")
  .description("Forward media anonymously (strip sender info)")
  .action(async (msgId: string) => {
    requireAuth();
    await forwardMedia(parseInt(msgId, 10));
    await disconnectClient();
  });

program
  .command("set-avatar <file>")
  .description("Set your profile photo")
  .action(async (file: string) => {
    requireAuth();
    await setProfilePhoto(file);
    await disconnectClient();
  });

// ─── Group Chat ──────────────────────────────────────────────────
program
  .command("chat-info <chat>")
  .description("Show information about a chat/group/channel")
  .action(async (chat: string) => {
    requireAuth();
    await chatInfo(chat);
    await disconnectClient();
  });

program
  .command("chat-add <chat> <user>")
  .description("Add a user to a group")
  .action(async (chat: string, user: string) => {
    requireAuth();
    await chatAddUser(chat, user);
    await disconnectClient();
  });

program
  .command("chat-kick <chat> <user>")
  .description("Remove a user from a group")
  .action(async (chat: string, user: string) => {
    requireAuth();
    await chatDelUser(chat, user);
    await disconnectClient();
  });

program
  .command("chat-rename <chat> <newName>")
  .description("Rename a group chat")
  .action(async (chat: string, newName: string) => {
    requireAuth();
    await renameChat(chat, newName);
    await disconnectClient();
  });

program
  .command("create-group <topic> <users...>")
  .description("Create a new group chat with users")
  .action(async (topic: string, users: string[]) => {
    requireAuth();
    await createGroup(topic, users);
    await disconnectClient();
  });

program
  .command("chat-set-photo <chat> <file>")
  .description("Set group chat photo")
  .action(async (chat: string, file: string) => {
    requireAuth();
    await chatSetPhoto(chat, file);
    await disconnectClient();
  });

// ─── Search ──────────────────────────────────────────────────────
program
  .command("search <peer> <pattern>")
  .description("Search messages in a specific chat")
  .action(async (peer: string, pattern: string) => {
    requireAuth();
    await search(peer, pattern);
    await disconnectClient();
  });

program
  .command("global-search <pattern>")
  .description("Search messages across all chats")
  .action(async (pattern: string) => {
    requireAuth();
    await globalSearch(pattern);
    await disconnectClient();
  });

// ─── Run ─────────────────────────────────────────────────────────
program.parse(process.argv);
