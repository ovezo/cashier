"use client";

import { use } from "react";
import { DebtEntryForm } from "@/components/debts/DebtEntryForm";

export default function DebtRepaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DebtEntryForm debtId={id} kind="repayment" />;
}
