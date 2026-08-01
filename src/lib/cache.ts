export const clientCache = new Map<string, { data: any, timestamp: number }>();

export async function withClientCache<T>(key: string, fetcher: () => Promise<T>, ttl = 30000): Promise<T> {
  const now = Date.now();
  const cached = clientCache.get(key);
  if (cached && now - cached.timestamp < ttl) {
    return cached.data;
  }
  const data = await fetcher();
  clientCache.set(key, { data, timestamp: now });
  return data;
}

export function invalidateClientCache(keyPrefix?: string) {
  if (!keyPrefix) {
    clientCache.clear();
    return;
  }
  for (const key of clientCache.keys()) {
    if (key.startsWith(keyPrefix)) clientCache.delete(key);
  }
}
