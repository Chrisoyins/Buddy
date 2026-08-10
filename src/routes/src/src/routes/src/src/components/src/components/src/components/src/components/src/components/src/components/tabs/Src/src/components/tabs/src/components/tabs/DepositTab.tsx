import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Landmark, Clock, CheckCircle2, XCircle } from "lucide-react";

const METHODS = [
  { id: "wire", label: "Wire transfer", fields: ["Bank name", "Routing number", "Account number", "Account holder"] },
  { id: "ach", label: "ACH", fields: ["Bank name", "Routing number", "Account number"] },
  { id: "paypal", label: "PayPal", fields: ["PayPal email"] },
  { id: "cashapp", label: "Cash App", fields: ["$Cashtag"] },
  { id: "zelle", label: "Zelle", fields: ["Zelle email or phone"] },
  { id: "applepay", label: "Apple Pay", fields: ["Apple Pay email"] },
  { id: "crypto", label: "Crypto (BTC/ETH/USDT)", fields: ["Network", "Wallet address"] },
  { id: "other", label: "Other", fields: ["Details"] },
] as const;

type Deposit = { id: string; method: string; amount: number; status: string; reference: string | null; account_details: Record<string, string>; created_at: string; admin_note: string | null; };

export function DepositTab({ isAdmin }: { isAdmin: boolean }) {
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("wire");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [details, setDetails] = useState<Record<string, string>>({});
  const [targetEmail, setTargetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mine, setMine] = useState<Deposit[]>([]);

  const meta = METHODS.find((m) => m.id === method)!;

  async function load() {
    const { data } = await supabase.from("deposits").select("*").order("created_at", { ascending: false }).limit(20);
    setMine((data as Deposit[] | null) ?? []);
  }
  useEffect(() => {
    load();
    const ch = supabase.channel("deposits").on("postgres_changes", { event: "*", schema: "public", table: "deposits" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    setLoading(true);

    let target: string | null = null;
    if (isAdmin && targetEmail.trim()) {
      const { data: prof } = await supabase.from("profiles").select("id").ilike("email", targetEmail.trim()).maybeSingle();
      if (!prof) { setLoading(false); return toast.error("Target user not found"); }
      target = prof.id;
    }

    const { error } = await supabase.rpc("request_deposit", {
      _target_user: target as string,
      _method: method,
      _amount: amt,
      _account_details: details,
      _reference: (reference || "") as string,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Deposit submitted — awaiting approval");
    setAmount(""); setReference(""); setDetails({}); setTargetEmail("");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="glass rounded-2xl p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
            <Landmark className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Deposit funds</h2>
            <p className="text-xs text-muted-foreground">Wire, ACH, PayPal, Cash App, Zelle, Apple Pay, crypto</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Method">
            <select value={method} onChange={(e) => { setMethod(e.target.value as typeof method); setDetails({}); }} className="input">
              {METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </Field>

          {isAdmin && (
            <Field label="Deposit into (admin only, blank = your account)">
              <input value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} className="input" placeholder="user@example.com" />
            </Field>
          )}

          <Field label="Amount (USD)">
            <input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" placeholder="0.00" />
          </Field>

          {meta.fields.map((f) => (
            <Field key={f} label={f}>
              <input required value={details[f] || ""} onChange={(e) => setDetails({ ...details, [f]: e.target.value })} className="input" placeholder={f} />
            </Field>
          ))}

          <Field label="Reference / note (optional)">
            <input value={reference} onChange={(e) => setReference(e.target.value)} className="input" placeholder="Confirmation #, memo…" maxLength={140} />
          </Field>

          <button disabled={loading} className="w-full rounded-xl py-3 font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-50" style={{ background: "var(--gradient-brand)" }}>
            {loading ? "Submitting…" : "Submit deposit"}
          </button>
        </form>
      </div>

      <div>
        <h3 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your deposits</h3>
        <div className="glass rounded-2xl divide-y divide-border/50">
          {mine.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No deposits yet</div>}
          {mine.map((d) => {
            const Icon = d.status === "approved" ? CheckCircle2 : d.status === "rejected" ? XCircle : Clock;
            const color = d.status === "approved" ? "text-success" : d.status === "rejected" ? "text-destructive" : "text-accent";
            return (
              <div key={d.id} className="flex items-center gap-3 p-4">
                <Icon className={`h-5 w-5 ${color}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium capitalize">{d.method} · ${Number(d.amount).toFixed(2)}</div>
                  <div className="truncate text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()} · {d.status}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`.input{width:100%;padding:.75rem 1rem;border-radius:.75rem;background:var(--input);color:var(--foreground);border:1px solid var(--border);outline:none}.input:focus{border-color:var(--ring);box-shadow:0 0 0 3px oklch(0.82 0.16 195 / 0.2)}`}</style>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>{children}</label>;
}
