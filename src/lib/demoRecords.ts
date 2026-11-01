import { readDemoState, writeDemoState } from '@/lib/demoStore';

type Identified = { id: string };

const addedKey = (key: string) => `${key}:added`;
const overridesKey = (key: string) => `${key}:overrides`;

export function applyDemoRecords<T extends Identified>(base: T[], key: string): T[] {
  const added = readDemoState<T[]>(addedKey(key), () => []);
  const overrides = readDemoState<Record<string, Partial<T>>>(overridesKey(key), () => ({}));
  return [...base, ...added].map((record) => (overrides[record.id] ? { ...record, ...overrides[record.id] } : record));
}

export function addDemoRecord<T extends Identified>(key: string, record: T): void {
  const added = readDemoState<T[]>(addedKey(key), () => []);
  writeDemoState<T[]>(addedKey(key), [...added, record]);
}

export function updateDemoRecord<T extends Identified>(key: string, id: string, patch: Partial<T>): void {
  const added = readDemoState<T[]>(addedKey(key), () => []);
  if (added.some((record) => record.id === id)) {
    writeDemoState<T[]>(addedKey(key), added.map((record) => (record.id === id ? { ...record, ...patch } : record)));
    return;
  }
  const overrides = readDemoState<Record<string, Partial<T>>>(overridesKey(key), () => ({}));
  writeDemoState(overridesKey(key), { ...overrides, [id]: { ...overrides[id], ...patch } });
}

export function newDemoId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
