"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { Label, TextInput } from "@/components/ui/Field";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function submit() {
    setError("");
    if (!email.trim() || !password) {
      setError("Enter an email and password.");
      return;
    }
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setCheckEmail(true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
  }

  async function continueWithGoogle() {
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  if (checkEmail) {
    return (
      <div className="flex flex-col items-center px-4 pt-16 text-center">
        <div className="font-serif text-lg font-bold">Cashier</div>
        <h1 className="mt-6 font-serif text-xl font-semibold">Check your email</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">
          We sent a confirmation link to <b className="text-ink">{email}</b>. Open it on this device to finish creating your account.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 pt-10">
      <div className="text-center font-serif text-lg font-bold">Cashier</div>
      <h1 className="mt-6 text-center font-serif text-xl font-semibold">
        {mode === "signin" ? "Sign in to sync" : "Create an account"}
      </h1>
      <p className="mt-1.5 text-center text-[12.5px] text-ink-faint">
        Optional — Cashier works fully offline without an account.
      </p>

      <div className="mt-6">
        <Segmented
          value={mode}
          onChange={(v) => {
            setMode(v);
            setError("");
          }}
          options={[
            { value: "signin", label: "Sign in" },
            { value: "signup", label: "Sign up" },
          ]}
        />
      </div>

      <div className="mt-5">
        <Label>Email</Label>
        <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
      </div>
      <div className="mt-4">
        <Label>Password</Label>
        <TextInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      </div>

      {error && <p className="mt-3 text-[12.5px] text-expense">{error}</p>}

      <div className="mt-5">
        <Button onClick={submit} disabled={loading}>
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
        </Button>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-[11px] uppercase tracking-wide text-ink-faint">or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <div className="mt-5">
        <Button variant="outline" onClick={continueWithGoogle}>
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
