import type { MessageDisplay, ChatInfoDisplay, SearchResult } from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _chalk: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _Table: any = null;

async function getChalk() {
  if (!_chalk) {
    _chalk = (await import("chalk")).default;
  }
  return _chalk;
}

async function getTable() {
  if (!_Table) {
    _Table = (await import("cli-table3")).default;
  }
  return _Table;
}

function formatTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export async function formatMessage(msg: MessageDisplay): Promise<string> {
  const chalk = await getChalk();
  const time = chalk.gray(formatTime(msg.date));
  const sender = msg.isOutgoing ? chalk.green.bold("You") : chalk.cyan.bold(msg.sender);
  const text = msg.text || "";
  const media = msg.media
    ? chalk.yellow(` [${msg.media}`) + chalk.gray(` · download ${msg.id}`) + chalk.yellow("]")
    : "";

  return `${time} ${sender}: ${text}${media}`;
}

export async function formatMessages(messages: MessageDisplay[]): Promise<void> {
  for (const msg of messages) {
    console.log(await formatMessage(msg));
  }
}

export async function formatChatInfo(info: ChatInfoDisplay): Promise<void> {
  const chalk = await getChalk();
  const Table = await getTable();

  const table = new Table({
    head: [chalk.cyan("Field"), chalk.cyan("Value")],
    colWidths: [20, 50],
    style: { head: [], border: [] },
  });

  table.push(["Title", chalk.white.bold(info.title)], ["Type", info.type], ["ID", info.id]);

  if (info.username) {
    table.push(["Username", `@${info.username}`]);
  }
  if (info.phone) {
    table.push(["Phone", info.phone]);
  }
  if (info.members !== undefined) {
    table.push(["Members", String(info.members)]);
  }

  console.log(table.toString());
}

export async function formatSearchResults(results: SearchResult[]): Promise<void> {
  const chalk = await getChalk();
  const Table = await getTable();

  if (results.length === 0) {
    console.log(chalk.yellow("No results found."));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan("ID"),
      chalk.cyan("Date"),
      chalk.cyan("Chat"),
      chalk.cyan("Sender"),
      chalk.cyan("Message"),
    ],
    colWidths: [10, 18, 18, 15, 40],
    style: { head: [], border: [] },
    wordWrap: true,
  });

  for (const r of results) {
    table.push([
      String(r.messageId),
      formatTime(r.date),
      r.chatTitle,
      r.sender,
      r.text.substring(0, 100),
    ]);
  }

  console.log(table.toString());
  console.log(chalk.gray(`\n${results.length} result(s) found.`));
}

export async function printSuccess(message: string): Promise<void> {
  const chalk = await getChalk();
  console.log(chalk.green(`✅ ${message}`));
}

export async function printError(message: string): Promise<void> {
  const chalk = await getChalk();
  console.error(chalk.red(`❌ ${message}`));
}

export async function printInfo(message: string): Promise<void> {
  const chalk = await getChalk();
  console.log(chalk.cyan(`ℹ️  ${message}`));
}

export async function printWarning(message: string): Promise<void> {
  const chalk = await getChalk();
  console.log(chalk.yellow(`⚠️  ${message}`));
}
