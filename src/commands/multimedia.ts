import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { Api } from "telegram";
import { withClient } from "../client.js";
import { getDownloadDir } from "../config.js";
import { printSuccess, printError, printInfo } from "../formatter.js";
import { isJsonMode, outputResult } from "../output.js";

export async function sendPhoto(peer: string, filePath: string): Promise<void> {
  if (!fs.existsSync(filePath)) {
    if (isJsonMode()) {
      outputResult({ ok: false, error: `File not found: ${filePath}` });
    } else {
      await printError(`File not found: ${filePath}`);
    }
    return;
  }

  await withClient(async (client) => {
    const result = await client.sendFile(peer, {
      file: filePath,
      forceDocument: false,
    });
    if (isJsonMode()) {
      outputResult({ ok: true, action: "send_photo", peer, file: filePath, messageId: result.id });
    } else {
      await printSuccess(`Photo sent to ${peer}`);
    }
  });
}

export async function sendVideo(peer: string, filePath: string): Promise<void> {
  if (!fs.existsSync(filePath)) {
    if (isJsonMode()) {
      outputResult({ ok: false, error: `File not found: ${filePath}` });
    } else {
      await printError(`File not found: ${filePath}`);
    }
    return;
  }

  await withClient(async (client) => {
    const result = await client.sendFile(peer, {
      file: filePath,
      forceDocument: false,
      attributes: [
        new Api.DocumentAttributeVideo({
          w: 0,
          h: 0,
          duration: 0,
          supportsStreaming: true,
        }),
      ],
    });
    if (isJsonMode()) {
      outputResult({ ok: true, action: "send_video", peer, file: filePath, messageId: result.id });
    } else {
      await printSuccess(`Video sent to ${peer}`);
    }
  });
}

export async function sendTextFile(peer: string, filePath: string): Promise<void> {
  if (!fs.existsSync(filePath)) {
    if (isJsonMode()) {
      outputResult({ ok: false, error: `File not found: ${filePath}` });
    } else {
      await printError(`File not found: ${filePath}`);
    }
    return;
  }

  await withClient(async (client) => {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    const chunkSize = 4096;
    let buffer = "";
    let sentCount = 0;

    for (const line of lines) {
      if (buffer.length + line.length + 1 > chunkSize) {
        await client.sendMessage(peer, { message: buffer });
        sentCount++;
        buffer = "";
      }
      buffer += (buffer ? "\n" : "") + line;
    }

    if (buffer) {
      await client.sendMessage(peer, { message: buffer });
      sentCount++;
    }

    if (isJsonMode()) {
      outputResult({
        ok: true,
        action: "send_text_file",
        peer,
        file: filePath,
        lines: lines.length,
        chunks: sentCount,
      });
    } else {
      await printSuccess(`Text file sent to ${peer} (${lines.length} lines)`);
    }
  });
}

export async function downloadMedia(
  msgId: number,
  options: { type?: string } = {}
): Promise<string | null> {
  return await withClient(async (client) => {
    const messages = await client.getMessages("me", {
      ids: [msgId],
    });

    if (!messages || messages.length === 0) {
      if (isJsonMode()) {
        outputResult({ ok: false, error: `Message ${msgId} not found.` });
      } else {
        await printError(`Message ${msgId} not found.`);
      }
      return null;
    }

    const msg = messages[0];
    if (!msg || !msg.media) {
      if (isJsonMode()) {
        outputResult({ ok: false, error: `Message ${msgId} has no media.` });
      } else {
        await printError(`Message ${msgId} has no media.`);
      }
      return null;
    }

    const downloadDir = getDownloadDir();
    const buffer = await client.downloadMedia(msg, {});

    if (!buffer) {
      if (isJsonMode()) {
        outputResult({ ok: false, error: "Failed to download media." });
      } else {
        await printError("Failed to download media.");
      }
      return null;
    }

    let ext = ".bin";
    if (msg.photo) ext = ".jpg";
    else if (msg.video) ext = ".mp4";
    else if (msg.audio) ext = ".mp3";
    else if (msg.document) {
      const doc = msg.document as Api.Document;
      const filenameAttr = doc.attributes?.find(
        (a: any) => a instanceof Api.DocumentAttributeFilename
      ) as Api.DocumentAttributeFilename | undefined;
      if (filenameAttr) {
        ext = path.extname(filenameAttr.fileName) || ".bin";
      }
    }

    const filename = `${msgId}_${Date.now()}${ext}`;
    const filePath = path.join(downloadDir, filename);

    if (Buffer.isBuffer(buffer)) {
      fs.writeFileSync(filePath, buffer);
    } else if (typeof buffer === "string") {
      fs.writeFileSync(filePath, buffer);
    }

    if (isJsonMode()) {
      outputResult({ ok: true, action: "download", messageId: msgId, filePath });
    } else {
      await printSuccess(`Downloaded to ${filePath}`);
    }
    return filePath;
  });
}

export async function viewMedia(msgId: number, options: { type?: string } = {}): Promise<void> {
  const filePath = await downloadMedia(msgId, options);
  if (!filePath) return;

  const platform = process.platform;
  let cmd: string;

  if (platform === "darwin") {
    cmd = `open "${filePath}"`;
  } else if (platform === "win32") {
    cmd = `start "" "${filePath}"`;
  } else {
    cmd = `xdg-open "${filePath}"`;
  }

  exec(cmd, (err) => {
    if (err) {
      printError(`Failed to open file: ${err.message}`);
    }
  });

  if (!isJsonMode()) {
    await printInfo(`Opening ${filePath}...`);
  }
}

export async function forwardMedia(msgId: number): Promise<void> {
  await withClient(async (client) => {
    const messages = await client.getMessages("me", { ids: [msgId] });
    if (!messages || messages.length === 0 || !messages[0]?.media) {
      if (isJsonMode()) {
        outputResult({ ok: false, error: `Message ${msgId} not found or has no media.` });
      } else {
        await printError(`Message ${msgId} not found or has no media.`);
      }
      return;
    }

    const msg = messages[0];
    const buffer = await client.downloadMedia(msg, {});

    if (buffer) {
      const result = await client.sendFile("me", {
        file: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as string),
        caption: msg.message || "",
      });
      if (isJsonMode()) {
        outputResult({
          ok: true,
          action: "forward_media",
          messageId: msgId,
          newMessageId: result.id,
        });
      } else {
        await printSuccess(`Media from message ${msgId} forwarded anonymously.`);
      }
    } else {
      if (isJsonMode()) {
        outputResult({ ok: false, error: "Failed to download media for forwarding." });
      } else {
        await printError("Failed to download media for forwarding.");
      }
    }
  });
}

export async function setProfilePhoto(filePath: string): Promise<void> {
  if (!fs.existsSync(filePath)) {
    if (isJsonMode()) {
      outputResult({ ok: false, error: `File not found: ${filePath}` });
    } else {
      await printError(`File not found: ${filePath}`);
    }
    return;
  }

  await withClient(async (client) => {
    const file = await client.uploadFile({
      file: fs.createReadStream(filePath) as any,
      workers: 1,
    });

    await client.invoke(
      new Api.photos.UploadProfilePhoto({
        file: file as any,
      })
    );
    if (isJsonMode()) {
      outputResult({ ok: true, action: "set_avatar", file: filePath });
    } else {
      await printSuccess("Profile photo updated!");
    }
  });
}
