import * as readline from "readline";
import { withClient } from "./client.js";
import { formatMessage } from "./formatter.js";
import type { MessageDisplay } from "./types.js";
import { NewMessage } from "telegram/events/index.js";
import type { NewMessageEvent } from "telegram/events/index.js";

export async function startChatSession(peer: string): Promise<void> {
  const chalk = (await import("chalk")).default;

  await withClient(async (client) => {
    const entity = await client.getEntity(peer);
    const entityName =
      (entity as any).title || (entity as any).firstName || (entity as any).username || peer;

    console.log(chalk.cyan.bold(`\n💬 Chat session with ${entityName}`));
    console.log(chalk.gray("Type your message and press Enter to send."));
    console.log(chalk.gray("Type /exit or /quit to end the session.\n"));

    // Show last 5 messages for context
    const recentMessages = await client.getMessages(entity, { limit: 5 });
    if (recentMessages.length > 0) {
      console.log(chalk.gray("--- Recent messages ---"));
      const displays = recentMessages
        .map(
          (msg: any): MessageDisplay => ({
            id: msg.id,
            date: new Date((msg.date || 0) * 1000),
            sender: msg.sender?.firstName || msg.sender?.title || msg.sender?.username || "Unknown",
            text: msg.message || "",
            isOutgoing: !!msg.out,
          })
        )
        .reverse();

      for (const d of displays) {
        console.log(await formatMessage(d));
      }
      console.log(chalk.gray("--- End of history ---\n"));
    }

    // Listen for incoming messages
    const handler = async (event: NewMessageEvent) => {
      const msg = event.message;
      if (!msg) return;

      // Only show messages from this peer
      const msgPeerId = msg.peerId;
      if (!msgPeerId) return;

      const display: MessageDisplay = {
        id: msg.id,
        date: new Date((msg.date || 0) * 1000),
        sender: (msg.sender as any)?.firstName || (msg.sender as any)?.title || "Them",
        text: msg.message || "",
        isOutgoing: !!msg.out,
      };

      if (!msg.out) {
        console.log(await formatMessage(display));
      }
    };

    client.addEventHandler(handler, new NewMessage({ chats: [entity] }));

    // Interactive readline loop
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.green("You: "),
    });

    rl.prompt();

    await new Promise<void>((resolve) => {
      rl.on("line", async (line) => {
        const trimmed = line.trim();

        if (trimmed === "/exit" || trimmed === "/quit") {
          console.log(chalk.yellow("\n👋 Chat session ended.\n"));
          rl.close();
          resolve();
          return;
        }

        if (!trimmed) {
          rl.prompt();
          return;
        }

        try {
          await client.sendMessage(entity, { message: trimmed });
        } catch (err: any) {
          console.error(chalk.red(`Failed to send: ${err.message}`));
        }

        rl.prompt();
      });

      rl.on("close", () => {
        resolve();
      });
    });

    client.removeEventHandler(handler, new NewMessage({}));
  });
}
