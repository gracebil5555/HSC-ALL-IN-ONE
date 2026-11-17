export interface QueuedMutation {
  id: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  payload?: unknown;
  createdAt: string;
  label?: string;
}

const STORAGE_KEY = "hsc_offline_mutations_v1";

export const OfflineMutationQueue = {
  getAll(): QueuedMutation[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  size(): number {
    return this.getAll().length;
  },

  enqueue(mutation: Omit<QueuedMutation, "id" | "createdAt">): QueuedMutation {
    const entry: QueuedMutation = {
      ...mutation,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    if (typeof window !== "undefined") {
      const current = this.getAll();
      current.push(entry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
    return entry;
  },

  remove(id: string): void {
    if (typeof window === "undefined") return;
    const next = this.getAll().filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  },

  async flush(
    executor: (mutation: QueuedMutation) => Promise<unknown>
  ): Promise<{ succeeded: number; failed: number }> {
    const queue = this.getAll();
    let succeeded = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        await executor(item);
        this.remove(item.id);
        succeeded += 1;
      } catch {
        failed += 1;
      }
    }

    return { succeeded, failed };
  },
};
