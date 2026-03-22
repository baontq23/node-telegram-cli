import { Api } from "telegram";
import { withClient } from "../client.js";
import { formatMessages, printSuccess, printError } from "../formatter.js";
import { isJsonMode, output, outputResult } from "../output.js";
import type { MessageDisplay } from "../types.js";

function toMessageDisplay(msg: any): MessageDisplay {
  const sender = msg.sender?.firstName || msg.sender?.title || msg.sender?.username || "Unknown";

  let mediaType: string | undefined;
  if (msg.photo) mediaType = "Photo";
  else if (msg.video) mediaType = "Video";
  else if (msg.document) mediaType = "Document";
  else if (msg.audio) mediaType = "Audio";
  else if (msg.voice) mediaType = "Voice";
  else if (msg.sticker) mediaType = "Sticker";

  return {
    id: msg.id,
    date: new Date((msg.date || 0) * 1000),
    sender,
    text: msg.message || "",
    media: mediaType,
    isOutgoing: !!msg.out,
  };
}

export async function sendMessage(peer: string, text: string): Promise<void> {
  await withClient(async (client) => {
    const result = await client.sendMessage(peer, { message: text });
    if (isJsonMode()) {
      outputResult({ ok: true, messageId: result.id, peer, text });
    } else {
      await printSuccess(`Message sent to ${peer}`);
    }
  });
}

export async function forwardMessage(user: string, msgId: number): Promise<void> {
  await withClient(async (client) => {
    await client.forwardMessages(user, {
      messages: [msgId],
      fromPeer: "me",
    });
    if (isJsonMode()) {
      outputResult({ ok: true, action: "forward", messageId: msgId, to: user });
    } else {
      await printSuccess(`Message ${msgId} forwarded to ${user}`);
    }
  });
}

export async function deleteMessage(msgId: number): Promise<void> {
  await withClient(async (client) => {
    await client.invoke(
      new Api.messages.DeleteMessages({
        id: [msgId],
        revoke: true,
      })
    );
    if (isJsonMode()) {
      outputResult({ ok: true, action: "delete", messageId: msgId });
    } else {
      await printSuccess(`Message ${msgId} deleted`);
    }
  });
}

export async function restoreMessage(msgId: number): Promise<void> {
  if (isJsonMode()) {
    outputResult({
      ok: false,
      error: "Message restoration is not reliably supported by Telegram API.",
    });
  } else {
    await printError(
      "Message restoration is not reliably supported by Telegram API. " +
        "Deleted messages can only be recovered within a very short window."
    );
  }
}

export async function markRead(peer: string): Promise<void> {
  await withClient(async (client) => {
    await client.markAsRead(peer);
    if (isJsonMode()) {
      outputResult({ ok: true, action: "mark_read", peer });
    } else {
      await printSuccess(`Marked all messages as read in ${peer}`);
    }
  });
}

export async function getInbox(options: {
  chat?: string;
  limit?: number;
  unread?: boolean;
  private?: boolean;
}): Promise<void> {
  const limit = options.limit || 10;
  const peer = options.chat || undefined;

  await withClient(async (client) => {
    if (peer) {
      // Get messages from specific chat
      const messages = await client.getMessages(peer, { limit });
      const displays = messages.map(toMessageDisplay);

      await output(
        displays.reverse().map((m) => ({
          id: m.id,
          date: m.date.toISOString(),
          sender: m.sender,
          text: m.text,
          media: m.media || null,
          isOutgoing: m.isOutgoing,
        })),
        async () => {
          const chalk = (await import("chalk")).default;
          console.log(chalk.cyan.bold(`\n📨 Messages from ${peer} (last ${limit}):\n`));
          await formatMessages(displays.reverse());
        }
      );
    } else {
      // Fetch more dialogs to ensure we have enough after filtering
      const fetchLimit = options.unread || options.private ? limit * 5 : limit;
      const dialogs = await client.getDialogs({ limit: fetchLimit });

      let filtered = dialogs;

      // Filter: only private (1-on-1 user chats)
      if (options.private) {
        filtered = filtered.filter((d) => {
          const entity = d.entity;
          return entity?.className === "User" && !(entity as any).bot;
        });
      }

      // Filter: only unread
      if (options.unread) {
        filtered = filtered.filter((d) => (d.unreadCount || 0) > 0);
      }

      // Apply final limit
      filtered = filtered.slice(0, limit);

      // Build structured data for both JSON and human output
      const dialogData = filtered.map((dialog) => {
        const entity = dialog.entity as any;
        const displayName = dialog.title || entity?.firstName || "Unknown";
        const unread = dialog.unreadCount || 0;
        const lastMsg = dialog.message?.message || "";
        const date = dialog.message?.date ? new Date(dialog.message.date * 1000) : null;

        let peer = "";
        let peerType: "username" | "phone" | "id" = "id";
        if (entity?.username) {
          peer = `@${entity.username}`;
          peerType = "username";
        } else if (entity?.phone) {
          peer = `+${entity.phone}`;
          peerType = "phone";
        } else if (entity?.id) {
          peer = String(entity.id);
          peerType = "id";
        }

        const type =
          entity?.className === "User"
            ? "user"
            : entity?.className === "Channel"
              ? entity?.megagroup
                ? "group"
                : "channel"
              : "group";

        return {
          name: displayName,
          peer,
          peerType,
          type,
          unreadCount: unread,
          lastMessage: lastMsg,
          date: date ? date.toISOString() : null,
        };
      });

      await output(dialogData, async () => {
        const chalk = (await import("chalk")).default;

        const filterDesc = [options.private ? "private" : "", options.unread ? "unread" : ""]
          .filter(Boolean)
          .join(", ");

        const title = filterDesc
          ? `📨 ${filterDesc.charAt(0).toUpperCase() + filterDesc.slice(1)} conversations:`
          : "📨 Recent conversations:";

        console.log(chalk.cyan.bold(`\n${title}\n`));

        if (dialogData.length === 0) {
          console.log(chalk.gray("  No conversations match the filter.\n"));
          return;
        }

        for (const d of dialogData) {
          const unreadBadge = d.unreadCount > 0 ? chalk.red.bold(` (${d.unreadCount} unread)`) : "";
          const peerLabel = d.peer
            ? chalk.cyan(` [${d.peerType === "id" ? `id:${d.peer}` : d.peer}]`)
            : "";
          const dateStr = d.date ? chalk.gray(new Date(d.date).toLocaleString()) : "";

          console.log(`${chalk.white.bold(d.name)}${peerLabel}${unreadBadge} ${dateStr}`);
          if (d.lastMessage) {
            console.log(
              `  ${chalk.gray(d.lastMessage.substring(0, 80))}${d.lastMessage.length > 80 ? "..." : ""}`
            );
          }
          console.log();
        }
      });
    }
  });
}
