import type { SQLiteDatabase } from 'expo-sqlite';

import type { AppSettings } from '../types';
import { EscPosPrinter } from './EscPosPrinter';
import { MockTransport } from './MockTransport';

/** Compatibility wrapper for callers that need the real pipeline with an in-memory transport. */
export class MockPrinter extends EscPosPrinter {
  readonly mockTransport: MockTransport;

  constructor(db: SQLiteDatabase, settings: AppSettings, now: () => Date = () => new Date()) {
    const mockTransport = new MockTransport();
    super(db, settings, mockTransport, undefined, now);
    this.mockTransport = mockTransport;
  }
}
