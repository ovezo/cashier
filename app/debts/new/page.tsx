import { Suspense } from "react";
import { DebtForm } from "@/components/debts/DebtForm";

export default function NewDebtPage() {
  return (
    <Suspense>
      <DebtForm />
    </Suspense>
  );
}
