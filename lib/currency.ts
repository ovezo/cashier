import type { Account } from "./types";

/** Convert an amount in `account`'s own currency into the primary currency. */
export function toPrimary(amount: number, account: Account | undefined): number {
  if (!account) return amount;
  return amount * account.exchangeRateToPrimary;
}

export function getPrimaryAccount(accounts: Account[]): Account | undefined {
  return accounts.find((a) => a.isPrimary) ?? accounts[0];
}

/** Default rate FROM `from`'s currency TO `to`'s currency, derived from each account's rate-to-primary. */
export function crossRate(from: Account | undefined, to: Account | undefined): number {
  if (!from || !to || !to.exchangeRateToPrimary) return 1;
  return from.exchangeRateToPrimary / to.exchangeRateToPrimary;
}
