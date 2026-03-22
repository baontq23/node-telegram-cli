import bigInt from "big-integer";
import { Api } from "telegram";
import { withClient } from "../client.js";
import { formatSearchResults, printError } from "../formatter.js";
import { isJsonMode, output, outputResult } from "../output.js";
import type { SearchResult } from "../types.js";

export async function search(peer: string, pattern: string): Promise<void> {
  await withClient(async (client) => {
    try {
      const entity = await client.getEntity(peer);

      const result = await client.invoke(
        new Api.messages.Search({
          peer: entity,
          q: pattern,
          filter: new Api.InputMessagesFilterEmpty(),
          minDate: 0,
          maxDate: 0,
          offsetId: 0,
          addOffset: 0,
          limit: 20,
          maxId: 0,
          minId: 0,
          hash: bigInt(0),
        })
      );

      const messages = (result as any).messages || [];
      const results: SearchResult[] = messages.map((msg: any) => {
        const senderName = msg.fromId?.userId ? `User ${msg.fromId.userId}` : "Unknown";

        return {
          messageId: msg.id,
          date: new Date((msg.date || 0) * 1000),
          sender: senderName,
          text: msg.message || "[media]",
          chatTitle: peer,
        };
      });

      await output(
        results.map((r) => ({
          messageId: r.messageId,
          date: r.date.toISOString(),
          sender: r.sender,
          text: r.text,
          chat: r.chatTitle,
        })),
        async () => {
          const chalk = (await import("chalk")).default;
          console.log(chalk.cyan.bold(`\n🔍 Search results for "${pattern}" in ${peer}:\n`));
          await formatSearchResults(results);
        }
      );
    } catch (err: any) {
      if (isJsonMode()) {
        outputResult({ ok: false, error: err.message });
      } else {
        await printError(`Search failed: ${err.message}`);
      }
    }
  });
}

export async function globalSearch(pattern: string): Promise<void> {
  await withClient(async (client) => {
    try {
      const result = await client.invoke(
        new Api.messages.SearchGlobal({
          q: pattern,
          filter: new Api.InputMessagesFilterEmpty(),
          minDate: 0,
          offsetRate: 0,
          offsetPeer: new Api.InputPeerEmpty(),
          offsetId: 0,
          limit: 20,
        })
      );

      const messages = (result as any).messages || [];
      const chats = (result as any).chats || [];
      const users = (result as any).users || [];

      const chatMap = new Map<string, string>();
      for (const c of chats) {
        chatMap.set(String(c.id), c.title || `Chat ${c.id}`);
      }
      for (const u of users) {
        chatMap.set(
          String(u.id),
          u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : `User ${u.id}`
        );
      }

      const results: SearchResult[] = messages.map((msg: any) => {
        const chatId = msg.peerId?.channelId || msg.peerId?.chatId || msg.peerId?.userId;
        const chatTitle = chatMap.get(String(chatId)) || `Chat ${chatId}`;
        const senderId = msg.fromId?.userId;
        const senderName = senderId
          ? chatMap.get(String(senderId)) || `User ${senderId}`
          : "Unknown";

        return {
          messageId: msg.id,
          date: new Date((msg.date || 0) * 1000),
          sender: senderName,
          text: msg.message || "[media]",
          chatTitle,
        };
      });

      await output(
        results.map((r) => ({
          messageId: r.messageId,
          date: r.date.toISOString(),
          sender: r.sender,
          text: r.text,
          chat: r.chatTitle,
        })),
        async () => {
          const chalk = (await import("chalk")).default;
          console.log(chalk.cyan.bold(`\n🔍 Global search results for "${pattern}":\n`));
          await formatSearchResults(results);
        }
      );
    } catch (err: any) {
      if (isJsonMode()) {
        outputResult({ ok: false, error: err.message });
      } else {
        await printError(`Global search failed: ${err.message}`);
      }
    }
  });
}
