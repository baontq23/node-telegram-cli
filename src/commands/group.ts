import * as fs from "fs";
import { Api } from "telegram";
import { withClient } from "../client.js";
import { formatChatInfo, printSuccess, printError } from "../formatter.js";
import type { ChatInfoDisplay } from "../types.js";
import { isJsonMode, output, outputResult } from "../output.js";

export async function chatInfo(chat: string): Promise<void> {
  await withClient(async (client) => {
    try {
      const entity = await client.getEntity(chat);

      if (entity instanceof Api.Chat || entity instanceof Api.Channel) {
        const fullChat = await client.invoke(
          entity instanceof Api.Channel
            ? new Api.channels.GetFullChannel({ channel: entity })
            : new Api.messages.GetFullChat({ chatId: entity.id })
        );

        const chatData = entity instanceof Api.Channel ? entity : entity;
        const info: ChatInfoDisplay = {
          id: String(chatData.id),
          title: chatData.title,
          type: entity instanceof Api.Channel ? (entity.megagroup ? "group" : "channel") : "group",
          members: (fullChat.fullChat as any).participantsCount,
          username: (entity as any).username || undefined,
        };

        await output(info, async () => {
          await formatChatInfo(info);
        });
      } else if (entity instanceof Api.User) {
        const info = {
          id: String(entity.id),
          title: `${entity.firstName || ""} ${entity.lastName || ""}`.trim(),
          type: "user" as const,
          username: entity.username || undefined,
          phone: entity.phone || undefined,
        };

        await output(info, async () => {
          await formatChatInfo(info);
        });
      } else {
        if (isJsonMode()) {
          outputResult({ ok: false, error: "Unknown entity type." });
        } else {
          await printError("Unknown entity type.");
        }
      }
    } catch (err: any) {
      if (isJsonMode()) {
        outputResult({ ok: false, error: err.message });
      } else {
        await printError(`Failed to get chat info: ${err.message}`);
      }
    }
  });
}

export async function chatAddUser(chat: string, user: string): Promise<void> {
  await withClient(async (client) => {
    try {
      const chatEntity = await client.getEntity(chat);
      const userEntity = await client.getEntity(user);

      if (chatEntity instanceof Api.Channel) {
        await client.invoke(
          new Api.channels.InviteToChannel({
            channel: chatEntity,
            users: [userEntity as Api.User],
          })
        );
      } else if (chatEntity instanceof Api.Chat) {
        await client.invoke(
          new Api.messages.AddChatUser({
            chatId: chatEntity.id,
            userId: userEntity as Api.User,
            fwdLimit: 100,
          })
        );
      } else {
        if (isJsonMode()) {
          outputResult({ ok: false, error: "Peer is not a group or channel." });
        } else {
          await printError("Peer is not a group or channel.");
        }
        return;
      }

      if (isJsonMode()) {
        outputResult({ ok: true, action: "chat_add_user", chat, user });
      } else {
        await printSuccess(`Added ${user} to ${chat}`);
      }
    } catch (err: any) {
      if (isJsonMode()) {
        outputResult({ ok: false, error: err.message });
      } else {
        await printError(`Failed to add user: ${err.message}`);
      }
    }
  });
}

export async function chatDelUser(chat: string, user: string): Promise<void> {
  await withClient(async (client) => {
    try {
      const chatEntity = await client.getEntity(chat);
      const userEntity = await client.getEntity(user);

      if (chatEntity instanceof Api.Channel) {
        await client.invoke(
          new Api.channels.EditBanned({
            channel: chatEntity,
            participant: userEntity as Api.User,
            bannedRights: new Api.ChatBannedRights({
              untilDate: 0,
              viewMessages: true,
              sendMessages: true,
              sendMedia: true,
              sendStickers: true,
              sendGifs: true,
              sendGames: true,
              sendInline: true,
              embedLinks: true,
            }),
          })
        );
      } else if (chatEntity instanceof Api.Chat) {
        await client.invoke(
          new Api.messages.DeleteChatUser({
            chatId: chatEntity.id,
            userId: userEntity as Api.User,
          })
        );
      } else {
        if (isJsonMode()) {
          outputResult({ ok: false, error: "Peer is not a group or channel." });
        } else {
          await printError("Peer is not a group or channel.");
        }
        return;
      }

      if (isJsonMode()) {
        outputResult({ ok: true, action: "chat_kick_user", chat, user });
      } else {
        await printSuccess(`Removed ${user} from ${chat}`);
      }
    } catch (err: any) {
      if (isJsonMode()) {
        outputResult({ ok: false, error: err.message });
      } else {
        await printError(`Failed to remove user: ${err.message}`);
      }
    }
  });
}

export async function renameChat(chat: string, newName: string): Promise<void> {
  await withClient(async (client) => {
    try {
      const entity = await client.getEntity(chat);

      if (entity instanceof Api.Channel) {
        await client.invoke(
          new Api.channels.EditTitle({
            channel: entity,
            title: newName,
          })
        );
      } else if (entity instanceof Api.Chat) {
        await client.invoke(
          new Api.messages.EditChatTitle({
            chatId: entity.id,
            title: newName,
          })
        );
      } else {
        if (isJsonMode()) {
          outputResult({ ok: false, error: "Peer is not a group or channel." });
        } else {
          await printError("Peer is not a group or channel.");
        }
        return;
      }

      if (isJsonMode()) {
        outputResult({ ok: true, action: "rename_chat", chat, newName });
      } else {
        await printSuccess(`Chat renamed to "${newName}"`);
      }
    } catch (err: any) {
      if (isJsonMode()) {
        outputResult({ ok: false, error: err.message });
      } else {
        await printError(`Failed to rename chat: ${err.message}`);
      }
    }
  });
}

export async function createGroup(topic: string, users: string[]): Promise<void> {
  await withClient(async (client) => {
    try {
      const userEntities: Api.User[] = [];
      for (const u of users) {
        const entity = await client.getEntity(u);
        if (entity instanceof Api.User) {
          userEntities.push(entity);
        }
      }

      if (userEntities.length === 0) {
        if (isJsonMode()) {
          outputResult({ ok: false, error: "No valid users found." });
        } else {
          await printError("No valid users found.");
        }
        return;
      }

      await client.invoke(
        new Api.messages.CreateChat({
          title: topic,
          users: userEntities,
        })
      );

      if (isJsonMode()) {
        outputResult({
          ok: true,
          action: "create_group",
          title: topic,
          memberCount: userEntities.length,
        });
      } else {
        await printSuccess(`Group "${topic}" created with ${userEntities.length} user(s).`);
      }
    } catch (err: any) {
      if (isJsonMode()) {
        outputResult({ ok: false, error: err.message });
      } else {
        await printError(`Failed to create group: ${err.message}`);
      }
    }
  });
}

export async function chatSetPhoto(chat: string, filePath: string): Promise<void> {
  if (!fs.existsSync(filePath)) {
    if (isJsonMode()) {
      outputResult({ ok: false, error: `File not found: ${filePath}` });
    } else {
      await printError(`File not found: ${filePath}`);
    }
    return;
  }

  await withClient(async (client) => {
    try {
      const entity = await client.getEntity(chat);
      const file = await client.uploadFile({
        file: fs.createReadStream(filePath) as any,
        workers: 1,
      });

      const inputPhoto = new Api.InputChatUploadedPhoto({
        file: file as any,
      });

      if (entity instanceof Api.Channel) {
        await client.invoke(
          new Api.channels.EditPhoto({
            channel: entity,
            photo: inputPhoto,
          })
        );
      } else if (entity instanceof Api.Chat) {
        await client.invoke(
          new Api.messages.EditChatPhoto({
            chatId: entity.id,
            photo: inputPhoto,
          })
        );
      } else {
        if (isJsonMode()) {
          outputResult({ ok: false, error: "Peer is not a group or channel." });
        } else {
          await printError("Peer is not a group or channel.");
        }
        return;
      }

      if (isJsonMode()) {
        outputResult({ ok: true, action: "set_chat_photo", chat, file: filePath });
      } else {
        await printSuccess(`Chat photo updated for ${chat}`);
      }
    } catch (err: any) {
      if (isJsonMode()) {
        outputResult({ ok: false, error: err.message });
      } else {
        await printError(`Failed to set chat photo: ${err.message}`);
      }
    }
  });
}
