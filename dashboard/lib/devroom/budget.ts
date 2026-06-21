import { ensureDbReady, prisma } from "./db";

/** Daily AI spend ledger + hard budget cap. Money-critical: DB-backed so a
 * runaway loop cannot blow past the cap even across restarts. */

export const DAILY_CAP_USD = Number(process.env.DEVROOM_DAILY_BUDGET_USD || 5);

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export class BudgetExceededError extends Error {
  constructor(public spent: number, public cap: number) {
    super(
      `Daily AI budget reached ($${spent.toFixed(2)} / $${cap.toFixed(2)}). ` +
        `Raise DEVROOM_DAILY_BUDGET_USD or wait until tomorrow.`
    );
    this.name = "BudgetExceededError";
  }
}

export interface BudgetStatus {
  dateKey: string;
  costUsd: number;
  capUsd: number;
  tokens: number;
  runs: number;
  remainingUsd: number;
  overCap: boolean;
}

export async function budgetStatus(): Promise<BudgetStatus> {
  await ensureDbReady();
  const dateKey = todayKey();
  const row = await prisma.budgetDay.findUnique({ where: { dateKey } });
  const costUsd = row?.costUsd ?? 0;
  return {
    dateKey,
    costUsd: parseFloat(costUsd.toFixed(4)),
    capUsd: DAILY_CAP_USD,
    tokens: row?.tokens ?? 0,
    runs: row?.runs ?? 0,
    remainingUsd: parseFloat(Math.max(0, DAILY_CAP_USD - costUsd).toFixed(4)),
    overCap: costUsd >= DAILY_CAP_USD,
  };
}

/** Call BEFORE starting a paid run. Throws BudgetExceededError if over cap. */
export async function assertWithinBudget(): Promise<void> {
  const s = await budgetStatus();
  if (s.overCap) throw new BudgetExceededError(s.costUsd, s.capUsd);
}

/** Call AFTER a run completes to record actual spend. */
export async function recordSpend(tokens: number, costUsd: number): Promise<void> {
  await ensureDbReady();
  const dateKey = todayKey();
  await prisma.budgetDay.upsert({
    where: { dateKey },
    create: { dateKey, tokens, costUsd, runs: 1 },
    update: {
      tokens: { increment: tokens },
      costUsd: { increment: costUsd },
      runs: { increment: 1 },
    },
  });
}
