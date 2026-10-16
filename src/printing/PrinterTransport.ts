export type TransportResult = { ok: true } | { ok: false; error: string };

export interface PrinterTransport {
  send(bytes: Uint8Array): Promise<TransportResult>;
}
