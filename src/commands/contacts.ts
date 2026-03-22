import bigInt from "big-integer";
import { Api } from "telegram";
import { withClient } from "../client.js";
import { printSuccess, printError } from "../formatter.js";
import { isJsonMode, outputResult } from "../output.js";

export async function addContact(
  phone: string,
  firstName: string,
  lastName: string
): Promise<void> {
  await withClient(async (client) => {
    const result = await client.invoke(
      new Api.contacts.ImportContacts({
        contacts: [
          new Api.InputPhoneContact({
            clientId: bigInt(Math.floor(Math.random() * 1000000)),
            phone,
            firstName,
            lastName,
          }),
        ],
      })
    );

    if (result.imported.length > 0) {
      if (isJsonMode()) {
        outputResult({ ok: true, action: "add_contact", phone, firstName, lastName });
      } else {
        await printSuccess(`Contact added: ${firstName} ${lastName} (${phone})`);
      }
    } else {
      if (isJsonMode()) {
        outputResult({ ok: false, error: "Failed to add contact. Phone may not be registered." });
      } else {
        await printError(
          "Failed to add contact. The phone number may not be registered on Telegram."
        );
      }
    }
  });
}

export async function renameContact(
  user: string,
  firstName: string,
  lastName: string
): Promise<void> {
  await withClient(async (client) => {
    try {
      const entity = await client.getEntity(user);
      if (!(entity instanceof Api.User)) {
        if (isJsonMode()) {
          outputResult({ ok: false, error: "Peer is not a user." });
        } else {
          await printError("Peer is not a user.");
        }
        return;
      }

      await client.invoke(
        new Api.contacts.AddContact({
          id: entity,
          firstName,
          lastName,
          phone: (entity as Api.User).phone || "",
        })
      );
      if (isJsonMode()) {
        outputResult({ ok: true, action: "rename_contact", user, firstName, lastName });
      } else {
        await printSuccess(`Contact renamed to ${firstName} ${lastName}`);
      }
    } catch (err: any) {
      if (isJsonMode()) {
        outputResult({ ok: false, error: err.message });
      } else {
        await printError(`Failed to rename contact: ${err.message}`);
      }
    }
  });
}
