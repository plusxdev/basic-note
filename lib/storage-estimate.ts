export interface StorageInfo {
  usage: number;
  quota: number;
  percent: number;
}

export async function estimateStorage(): Promise<StorageInfo | null> {
  if (typeof navigator === "undefined") return null;
  if (!navigator.storage?.estimate) return null;
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    const percent = quota > 0 ? (usage / quota) * 100 : 0;
    return { usage, quota, percent };
  } catch {
    return null;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export const STORAGE_THRESHOLDS = [25, 50, 75] as const;
