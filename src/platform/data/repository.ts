import { memoryStore } from "@/platform/data/memory-store";

export interface Repository<T extends { id: string }> {
  list(): T[];
  get(id: string): T | undefined;
  require(id: string): T;
  update(id: string, patch: (record: T) => T): T;
}

/**
 * Tools depend on `Repository<T>`, never on the storage mechanism. Swapping the
 * in-memory adapter for a Prisma/HTTP adapter later is a one-file change per
 * tool and no change to actions, pages or tests.
 */
export function inMemoryRepository<T extends { id: string }>(key: string, seed: () => T[]): Repository<T> {
  const records = memoryStore<T[]>(key, seed);

  return {
    list: () => [...records],
    get: (id) => records.find((record) => record.id === id),
    require(id) {
      const record = records.find((candidate) => candidate.id === id);
      if (!record) throw new Error(`${key}: no record ${id}`);
      return record;
    },
    update(id, patch) {
      const index = records.findIndex((record) => record.id === id);
      if (index === -1) throw new Error(`${key}: no record ${id}`);
      const next = patch(records[index]);
      records[index] = next;
      return next;
    },
  };
}
