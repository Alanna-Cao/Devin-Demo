const globalStore = globalThis as unknown as {
  __platformStore?: Map<string, unknown>;
};

/**
 * Process-wide state for the POC's mocked data. Keyed on `globalThis` so the
 * Next.js dev server's module reloading does not reset seeded data mid-demo.
 *
 * Production: delete this file; repositories talk to the real datastore.
 */
export function memoryStore<T>(key: string, create: () => T): T {
  globalStore.__platformStore ??= new Map<string, unknown>();
  if (!globalStore.__platformStore.has(key)) {
    globalStore.__platformStore.set(key, create());
  }
  return globalStore.__platformStore.get(key) as T;
}

/** Test helper: drops all in-memory state. */
export function resetMemoryStore(): void {
  globalStore.__platformStore = new Map<string, unknown>();
}
