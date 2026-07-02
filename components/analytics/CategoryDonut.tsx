"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { CAT_COLORS } from "@/lib/palette";
import { formatAmount } from "@/lib/format";

interface Row {
  categoryId: string;
  name: string;
  icon: string;
  amount: number;
  pct: number;
}

export function CategoryDonut({ rows, currency }: { rows: Row[]; currency: string }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-[13px] text-ink-faint">No data for this period yet.</p>;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-[112px] w-[112px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="amount" nameKey="name" innerRadius={26} outerRadius={56} stroke="none">
              {rows.map((r, i) => (
                <Cell key={r.categoryId} fill={CAT_COLORS[i % CAT_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        {rows.map((r, i) => (
          <div key={r.categoryId} className="flex items-center gap-2 text-[12px]">
            <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
            <span className="flex-1 truncate text-ink">{r.name}</span>
            <span className="font-mono text-ink-faint">{r.pct.toFixed(0)}%</span>
            <span className="tabular font-semibold">{formatAmount(r.amount, currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
