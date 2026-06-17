/** One active agent run per sandbox project at a time. */
const locks = new Map<string, Promise<void>>();

export async function withSandboxLock<T>(
  projectId: string,
  fn: () => Promise<T>
): Promise<T> {
  const key = projectId.trim() || "VaultCap";
  const prev = locks.get(key) ?? Promise.resolve();

  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  const chain = prev.then(() => gate);
  locks.set(key, chain);

  await prev;

  try {
    return await fn();
  } finally {
    release();
    if (locks.get(key) === chain) {
      locks.delete(key);
    }
  }
}
