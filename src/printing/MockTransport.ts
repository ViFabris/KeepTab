import type { PrinterTransport, TransportResult } from './PrinterTransport';

/** Records the exact bytes that a future USB transport will receive. */
export class MockTransport implements PrinterTransport {
  readonly jobs: Uint8Array[] = [];
  nextError: string | null = null;

  async send(bytes: Uint8Array): Promise<TransportResult> {
    this.jobs.push(new Uint8Array(bytes));
    if (this.nextError) {
      const error = this.nextError;
      this.nextError = null;
      return { ok: false, error };
    }
    return { ok: true };
  }

  get lastJob(): Uint8Array | null {
    return this.jobs.at(-1) ?? null;
  }
}
