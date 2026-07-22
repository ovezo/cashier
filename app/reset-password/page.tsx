"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Label, TextInput } from "@/components/ui/Field";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setError("");
    if (password.length < 6) {
      setError("Use at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center px-4 pt-16 text-center">
        <div className="font-serif text-lg font-bold">Cashier</div>
        <h1 className="mt-6 font-serif text-xl font-semibold">Password updated</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">Your new password is saved. You can use it next time you sign in.</p>
        <div className="mt-6 w-full">
          <Button onClick={() => router.push("/more")}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 pt-2">
      <div className="flex items-center justify-between pt-2">
        <h2 className="font-serif text-xl font-semibold">Set a new password</h2>
        <button aria-label="Close" onClick={() => router.back()} className="text-ink-faint">
          <X size={20} />
        </button>
      </div>
      <p className="mt-1.5 text-[12.5px] text-ink-faint">Choose a new password for your account.</p>

      <div className="mt-5">
        <Label>New password</Label>
        <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
      </div>
      <div className="mt-4">
        <Label>Confirm new password</Label>
        <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
      </div>

      {error && <p className="mt-3 text-[12.5px] text-expense">{error}</p>}

      <div className="mt-5">
        <Button onClick={submit} disabled={loading}>
          {loading ? "Saving…" : "Save new password"}
        </Button>
      </div>
    </div>
  );
}
