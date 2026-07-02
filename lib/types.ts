export type Frequency = "daily" | "weekly" | "biweekly" | "monthly" | "yearly";

export type TxType = "income" | "expense";

export interface Account {
  id: string;
  name: string;
  currency: string; // ISO 4217 code, e.g. GBP
  isPrimary: boolean;
  /** Rate FROM this currency TO the primary currency. Primary account is always 1. */
  exchangeRateToPrimary: number;
}

export interface Category {
  id: string;
  name: string;
  type: TxType;
  color: string; // one of the --color-cat-* tokens
  icon: string; // emoji
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  accountId: string;
  /** Absent for transactions generated from a debt-repayment recurring rule. */
  categoryId?: string;
  note: string;
  date: string; // ISO date (yyyy-MM-dd)
  status: "confirmed" | "pending";
  recurringId?: string;
  linkedDebtId?: string;
}

export interface Repayment {
  id: string;
  amount: number;
  date: string;
}

export type DebtDirection = "owed_to_me" | "i_owe";
export type DebtStatus = "outstanding" | "partially_paid" | "paid";

export interface Debt {
  id: string;
  direction: DebtDirection;
  person: string;
  principal: number;
  accountId: string;
  note: string;
  status: DebtStatus;
  repayments: Repayment[];
  recurringId?: string;
  createdAt: string;
}

export interface RecurringRule {
  id: string;
  kind: "transaction" | "debt";
  frequency: Frequency;
  startDate: string;
  nextDueDate: string;
  amount: number;
  accountId: string;
  note: string;
  active: boolean;
  // kind === "transaction"
  txType?: TxType;
  categoryId?: string;
  // kind === "debt"
  linkedDebtId?: string;
}
