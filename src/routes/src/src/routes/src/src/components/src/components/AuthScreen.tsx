import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

export function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created — welcome!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--gradient-brand)" }}>
            <Wallet className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Nimbus Bank</h1>
          <p className="mt-2 text-sm text-muted-foreground">Banking, reimagined for the modern world.</p>
        </div>
        <div className="glass rounded-2xl p-6 shadow-2xl">
          <div className="mb-6 flex gap-2 rounded-xl bg-secondary p-1">
            <button onClick={() => setMode("signin")} className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Sign in</button>
            <button onClick={() => setMode("signup")} className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Create account</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field label="Full name">
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder="Jane Doe" />
              </Field>
            )}
            <Field label="Email">
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
            </Field>
            <button type="submit" disabled={loading} className="w-full rounded-xl py-3 font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-50" style={{ background: "var(--gradient-brand)" }}>
              {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>
          {mode === "signup" && (<p className="mt-4 text-center text-xs text-muted-foreground">The very first account created becomes the bank admin.</p>)}
        </div>
      </div>
      <style>{`
        .input { width: 100%; padding: 0.75rem 1rem; border-radius: 0.75rem; background: var(--input); color: var(--foreground); border: 1px solid var(--border); outline: none; transition: border-color .15s, box-shadow .15s; }
        .input:focus { border-color: var(--ring); box-shadow: 0 0 0 3px oklch(0.82 0.16 195 / 0.2); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
