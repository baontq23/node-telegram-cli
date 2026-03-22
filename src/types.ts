export interface TelegramConfig {
  apiId: number;
  apiHash: string;
  sessionString: string;
  downloadDir: string;
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
