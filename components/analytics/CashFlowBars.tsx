"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { EXPENSE_COLOR, INCOME_COLOR } from "@/lib/palette";
import { formatAmount } from "@/lib/format";

interface Row {
  label: string;
  income: number;
  expense: number;
}

export function CashFlowBars({ rows, currency }: { rows: Row[]; currency: string }) {
  return (
    <div className="h-[140px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} barGap={3} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#8A8578", fontFamily: "var(--font-mono)" }} />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
            formatter={(value) => formatAmount(Number(value ?? 0), currency)}
            contentStyle={{ borderRadius: 10, borderColor: "#E2DED2", fontSize: 12 }}
          />
          <Bar dataKey="income" fill={INCOME_COLOR} radius={[3, 3, 0, 0]} maxBarSize={10} />
          <Bar dataKey="expense" fill={EXPENSE_COLOR} radius={[3, 3, 0, 0]} maxBarSize={10} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
