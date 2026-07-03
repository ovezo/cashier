import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Account, Category, Debt, DebtEntry, DebtStatus, RecurringRule, Transaction } from "./types";
import { createId } from "./id";
import { seedAccounts, seedCategories } from "./seed";
import { dueDatesUpTo } from "./recurring";
import { todayIso } from "./format";
import { toPrimary } from "./currency";

/** Entries can each be in a different currency (a different wallet chosen each time), so the
 * status is computed by converting everything to the primary currency first. */
function recomputeDebtStatus(debt: Debt, accounts: Account[]): DebtStatus {
  let principal = 0;
  let repaid = 0;
  for (const e of debt.entries) {
    const converted = toPrimary(e.amount, accounts.find((a) => a.id === e.accountId));
    if (e.kind === "lend") principal += converted;
    else repaid += converted;
  }
  if (principal <= 0 || repaid >= principal - 1e-9) return "paid";
  if (repaid > 0) return "partially_paid";
  return "outstanding";
}

interface CashierState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  debts: Debt[];
  recurringRules: RecurringRule[];
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  seedIfEmpty: () => void;

  // accounts
  addAccount: (input: Omit<Account, "id" | "isPrimary">) => void;
  updateAccount: (id: string, patch: Partial<Omit<Account, "id">>) => void;
  deleteAccount: (id: string) => void;
  setPrimaryAccount: (id: string) => void;

  // categories
  addCategory: (input: Omit<Category, "id">) => void;
  updateCategory: (id: string, patch: Partial<Omit<Category, "id">>) => void;
  deleteCategory: (id: string) => void;

  // transactions
  addTransaction: (input: Omit<Transaction, "id" | "status"> & { status?: Transaction["status"] }) => void;
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, "id">>) => void;
  deleteTransaction: (id: string) => void;
  confirmTransaction: (id: string) => void;
  skipTransaction: (id: string) => void;

  // debts
  addDebt: (input: { direction: Debt["direction"]; person: string; amount: number; accountId: string; date: string; note: string }) => string;
  updateDebt: (id: string, patch: Partial<Omit<Debt, "id" | "entries">>) => void;
  /** Manual repayment or "borrowed/lent more" entry from the debt detail screen — also posts a linked wallet transaction. */
  addDebtEntry: (debtId: string, input: { kind: DebtEntry["kind"]; amount: number; accountId: string; date: string; note: string }) => void;
  deleteDebt: (id: string) => void;

  // recurring
  addRecurringRule: (input: Omit<RecurringRule, "id">) => string;
  updateRecurringRule: (id: string, patch: Partial<Omit<RecurringRule, "id">>) => void;
  deleteRecurringRule: (id: string) => void;
  toggleRecurringActive: (id: string) => void;
  generatePending: () => void;

  resetAllData: () => void;
  importData: (data: Partial<Pick<CashierState, "accounts" | "categories" | "transactions" | "debts" | "recurringRules">>) => void;
}

export const useCashierStore = create<CashierState>()(
  persist(
    (set, get) => ({
      // Deterministic (empty) on both server and pre-hydration client render, so SSR output
      // always matches the first client paint. `seedIfEmpty` populates real defaults — with
      // a random account id — only once hydration has confirmed there's no persisted data.
      accounts: [],
      categories: [],
      transactions: [],
      debts: [],
      recurringRules: [],
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      seedIfEmpty: () =>
        set((s) => (s.accounts.length === 0 && s.categories.length === 0 ? { accounts: seedAccounts(), categories: seedCategories() } : s)),

      addAccount: (input) =>
        set((s) => ({ accounts: [...s.accounts, { ...input, id: createId(), isPrimary: s.accounts.length === 0 }] })),

      updateAccount: (id, patch) =>
        set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),

      deleteAccount: (id) =>
        set((s) => {
          const remaining = s.accounts.filter((a) => a.id !== id);
          const removedWasPrimary = s.accounts.find((a) => a.id === id)?.isPrimary;
          if (removedWasPrimary && remaining.length > 0 && !remaining.some((a) => a.isPrimary)) {
            remaining[0] = { ...remaining[0], isPrimary: true, exchangeRateToPrimary: 1 };
          }
          return { accounts: remaining };
        }),

      setPrimaryAccount: (id) =>
        set((s) => {
          const newPrimary = s.accounts.find((a) => a.id === id);
          if (!newPrimary || newPrimary.isPrimary) return s;
          // newPrimary.exchangeRateToPrimary is currently "1 newPrimary = x oldPrimary".
          // Every other account's rate was expressed relative to the old primary, so
          // re-express each one relative to the new primary: rateToNewPrimary = rateToOldPrimary / x.
          const oldPrimaryPerNewPrimary = newPrimary.exchangeRateToPrimary || 1;
          return {
            accounts: s.accounts.map((a) => {
              if (a.id === id) return { ...a, isPrimary: true, exchangeRateToPrimary: 1 };
              const rebased = a.exchangeRateToPrimary / oldPrimaryPerNewPrimary;
              return { ...a, isPrimary: false, exchangeRateToPrimary: Math.round(rebased * 1e6) / 1e6 };
            }),
          };
        }),

      addCategory: (input) => set((s) => ({ categories: [...s.categories, { ...input, id: createId() }] })),

      updateCategory: (id, patch) =>
        set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

      deleteCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      addTransaction: (input) =>
        set((s) => ({
          transactions: [...s.transactions, { ...input, id: createId(), status: input.status ?? "confirmed" }],
        })),

      updateTransaction: (id, patch) =>
        set((s) => ({ transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      deleteTransaction: (id) => set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

      confirmTransaction: (id) => {
        const tx = get().transactions.find((t) => t.id === id);
        if (!tx) return;
        set((s) => {
          const transactions = s.transactions.map((t) => (t.id === id ? { ...t, status: "confirmed" as const } : t));
          if (!tx.linkedDebtId) return { transactions };
          // The transaction already exists (it's `tx` itself) — just record the debt bookkeeping,
          // don't post another linked transaction.
          const debts = s.debts.map((d) => {
            if (d.id !== tx.linkedDebtId) return d;
            const entry: DebtEntry = { id: createId(), kind: "repayment", amount: tx.amount, accountId: tx.accountId, date: tx.date, note: tx.note };
            const updated = { ...d, entries: [...d.entries, entry] };
            return { ...updated, status: recomputeDebtStatus(updated, s.accounts) };
          });
          return { transactions, debts };
        });
      },

      skipTransaction: (id) => set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

      addDebt: (input) => {
        const id = createId();
        const entry: DebtEntry = { id: createId(), kind: "lend", amount: input.amount, accountId: input.accountId, date: input.date, note: input.note };
        const debt: Debt = { id, direction: input.direction, person: input.person, status: "outstanding", entries: [entry], createdAt: input.date };
        const tx: Transaction = {
          id: createId(),
          type: input.direction === "owed_to_me" ? "expense" : "income",
          amount: input.amount,
          accountId: input.accountId,
          note: input.note || (input.direction === "owed_to_me" ? `Lent to ${input.person}` : `Borrowed from ${input.person}`),
          date: input.date,
          status: "confirmed",
          linkedDebtId: id,
        };
        set((s) => ({ debts: [...s.debts, debt], transactions: [...s.transactions, tx] }));
        return id;
      },

      updateDebt: (id, patch) =>
        set((s) => ({ debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),

      addDebtEntry: (debtId, input) => {
        const debt = get().debts.find((d) => d.id === debtId);
        if (!debt) return;
        const entry: DebtEntry = { id: createId(), kind: input.kind, amount: input.amount, accountId: input.accountId, date: input.date, note: input.note };
        const isLend = input.kind === "lend";
        const txType = isLend
          ? debt.direction === "owed_to_me"
            ? "expense"
            : "income"
          : debt.direction === "owed_to_me"
            ? "income"
            : "expense";
        const defaultNote = isLend
          ? debt.direction === "owed_to_me"
            ? `Lent more to ${debt.person}`
            : `Borrowed more from ${debt.person}`
          : debt.direction === "owed_to_me"
            ? `Repayment from ${debt.person}`
            : `Repayment to ${debt.person}`;
        const tx: Transaction = {
          id: createId(),
          type: txType,
          amount: input.amount,
          accountId: input.accountId,
          note: input.note || defaultNote,
          date: input.date,
          status: "confirmed",
          linkedDebtId: debtId,
        };
        set((s) => ({
          debts: s.debts.map((d) => {
            if (d.id !== debtId) return d;
            const updated = { ...d, entries: [...d.entries, entry] };
            return { ...updated, status: recomputeDebtStatus(updated, s.accounts) };
          }),
          transactions: [...s.transactions, tx],
        }));
      },

      deleteDebt: (id) => set((s) => ({ debts: s.debts.filter((d) => d.id !== id) })),

      addRecurringRule: (input) => {
        const id = createId();
        set((s) => ({ recurringRules: [...s.recurringRules, { ...input, id }] }));
        return id;
      },

      updateRecurringRule: (id, patch) =>
        set((s) => ({ recurringRules: s.recurringRules.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),

      deleteRecurringRule: (id) => set((s) => ({ recurringRules: s.recurringRules.filter((r) => r.id !== id) })),

      toggleRecurringActive: (id) =>
        set((s) => ({ recurringRules: s.recurringRules.map((r) => (r.id === id ? { ...r, active: !r.active } : r)) })),

      generatePending: () => {
        const today = todayIso();
        const rules = get().recurringRules;
        const newTransactions: Transaction[] = [];
        const updatedRules: RecurringRule[] = rules.map((rule) => {
          if (!rule.active) return rule;
          const { due, newNextDueDate } = dueDatesUpTo(rule.nextDueDate, rule.frequency, today);
          if (due.length === 0) return rule;

          for (const dueDate of due) {
            if (rule.kind === "transaction") {
              newTransactions.push({
                id: createId(),
                type: rule.txType ?? "expense",
                amount: rule.amount,
                accountId: rule.accountId,
                categoryIds: rule.categoryIds,
                note: rule.note,
                date: dueDate,
                status: "pending",
                recurringId: rule.id,
              });
            } else if (rule.kind === "debt" && rule.linkedDebtId) {
              const debt = get().debts.find((d) => d.id === rule.linkedDebtId);
              if (!debt) continue;
              newTransactions.push({
                id: createId(),
                type: debt.direction === "owed_to_me" ? "income" : "expense",
                amount: rule.amount,
                accountId: rule.accountId,
                note: rule.note || `Instalment · ${debt.person}`,
                date: dueDate,
                status: "pending",
                recurringId: rule.id,
                linkedDebtId: debt.id,
              });
            }
          }
          return { ...rule, nextDueDate: newNextDueDate };
        });

        if (newTransactions.length > 0) {
          set((s) => ({
            transactions: [...s.transactions, ...newTransactions],
            recurringRules: updatedRules,
          }));
        }
      },

      resetAllData: () =>
        set({
          accounts: seedAccounts(),
          categories: seedCategories(),
          transactions: [],
          debts: [],
          recurringRules: [],
        }),

      importData: (data) =>
        set((s) => ({
          accounts: data.accounts ?? s.accounts,
          categories: data.categories ?? s.categories,
          transactions: data.transactions ?? s.transactions,
          debts: data.debts ?? s.debts,
          recurringRules: data.recurringRules ?? s.recurringRules,
        })),
    }),
    {
      name: "cashier-data",
      version: 1,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
