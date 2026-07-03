import type { Account, Category } from "./types";
import { createId } from "./id";

export function seedAccounts(): Account[] {
  return [
    { id: createId(), name: "TMT Wallet", currency: "TMT", isPrimary: true, exchangeRateToPrimary: 1, openingBalance: 0 },
  ];
}

export function seedCategories(): Category[] {
  const income: Array<[string, string, string]> = [
    ["Salary", "💷", "cat-1"],
    ["Freelance", "💼", "cat-3"],
    ["Gifts", "🎁", "cat-4"],
    ["Other Income", "➕", "cat-6"],
  ];
  const expense: Array<[string, string, string]> = [
    ["Food", "🛒", "cat-2"],
    ["Rent", "🏠", "cat-1"],
    ["Transport", "🚌", "cat-3"],
    ["Utilities", "💡", "cat-4"],
    ["Entertainment", "🎬", "cat-5"],
    ["Shopping", "🛍️", "cat-2"],
    ["Health", "💊", "cat-3"],
    ["Other", "⋯", "cat-6"],
  ];
  return [
    ...income.map(([name, icon, color]) => ({ id: createId(), name, icon, color, type: "income" as const })),
    ...expense.map(([name, icon, color]) => ({ id: createId(), name, icon, color, type: "expense" as const })),
  ];
}
