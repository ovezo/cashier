import { addDays, addMonths, addWeeks, addYears, isAfter } from "date-fns";
import type { Frequency } from "./types";
import { toDateIso } from "./format";

export function advanceDate(dateIso: string, frequency: Frequency): string {
  const d = new Date(dateIso + "T00:00:00");
  let next: Date;
  switch (frequency) {
    case "daily":
      next = addDays(d, 1);
      break;
    case "weekly":
      next = addWeeks(d, 1);
      break;
    case "biweekly":
      next = addWeeks(d, 2);
      break;
    case "monthly":
      next = addMonths(d, 1);
      break;
    case "yearly":
      next = addYears(d, 1);
      break;
  }
  return toDateIso(next);
}

/**
 * Walk a recurring rule forward from its current due date up to (and including) `today`,
 * returning each due date that needs a pending instance plus the rule's new next-due-date.
 */
export function dueDatesUpTo(nextDueDate: string, frequency: Frequency, today: string): { due: string[]; newNextDueDate: string } {
  const due: string[] = [];
  let cursor = nextDueDate;
  const todayDate = new Date(today + "T00:00:00");
  let guard = 0;
  while (!isAfter(new Date(cursor + "T00:00:00"), todayDate) && guard < 1000) {
    due.push(cursor);
    cursor = advanceDate(cursor, frequency);
    guard += 1;
  }
  return { due, newNextDueDate: cursor };
}

export const frequencyLabel: Record<Frequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
  yearly: "Yearly",
};
