// backend/src/interfaces/ISmsProvider.ts
export interface ISmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  sent: boolean;
  provider: string;
}

export interface ISmsPayload {
  to: string;
  message: string;
}

export interface ISmsProvider {
  readonly name: string;
  send(payload: ISmsPayload): Promise<ISmsResult>;
}
