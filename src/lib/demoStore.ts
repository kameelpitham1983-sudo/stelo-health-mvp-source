const DEMO_PREFIX = 'stelo-demo:';

export function readDemoState<T>(key: string, fallback: () => T): T {
  try {
    const raw = sessionStorage.getItem(DEMO_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback();
  } catch {
    return fallback();
  }
}

export function writeDemoState<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(DEMO_PREFIX + key, JSON.stringify(value));
  } catch {
    return;
  }
}
