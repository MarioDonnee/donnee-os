const cache = new Map<string, unknown>();

export function getCache<T>(key: string) {
  return (cache.get(key) as T | undefined) ?? null;
}

export function setCache<T>(key: string, value: T) {
  cache.set(key, value);
}
