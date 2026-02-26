// Simple pass-through — no distributed lock needed for this app
export async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  return fn();
}
