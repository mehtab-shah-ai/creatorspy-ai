/**
 * Generic exponential-backoff retry helper.
 * Used by every external service call to handle rate limits and transient failures.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxRetries?: number; backoffBaseMs?: number; label?: string } = {},
): Promise<{ ok: true; value: T; attempts: number } | { ok: false; error: Error; attempts: number }> {
  const maxRetries = opts.maxRetries ?? 2;
  const base = opts.backoffBaseMs ?? 1200;
  const label = opts.label ?? "call";

  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const value = await fn();
      return { ok: true, value, attempts: attempt + 1 };
    } catch (e: any) {
      lastErr = e;
      // 4xx (non-429) usually means bad request — don't retry
      if (e?.status && e.status >= 400 && e.status < 500 && e.status !== 429) {
        break;
      }
      if (attempt < maxRetries) {
        const delay = base * Math.pow(2, attempt) + Math.random() * 200;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  return { ok: false, error: lastErr ?? new Error(`${label} failed`), attempts: maxRetries + 1 };
}

export async function withTimeout<T>(fn: () => Promise<T>, ms: number, label = "call"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    fn().then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
