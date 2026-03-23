export interface TelegramConfig {
  downloadDir: string;
}

export interface SecureConfig {
  apiId: number;
  apiHash: string;
  sessionString: string;
}

export interface MessageDisplay {
  id: number;
  date: Date;
  sender: string;
  text: string;
  media?: string;
  isOutgoing: boolean;
}

export interface ChatInfoDisplay {
  id: string;
  title: string;
  type: "user" | "group" | "channel";
  members?: number;
  username?: string;
  phone?: string;
}

export interface SearchResult {
  messageId: number;
  date: Date;
  sender: string;
  text: string;
  chatTitle: string;
}
