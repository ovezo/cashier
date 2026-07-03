"use client";

import { use } from "react";
import { DebtEntryForm } from "@/components/debts/DebtEntryForm";

export default function DebtLendMorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DebtEntryForm debtId={id} kind="lend" />;
}
