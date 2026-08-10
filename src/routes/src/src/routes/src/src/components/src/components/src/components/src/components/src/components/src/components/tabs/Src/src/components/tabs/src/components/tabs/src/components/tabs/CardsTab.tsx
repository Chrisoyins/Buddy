import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Plus, Clock, Check, X } from "lucide-react";

type Card = { id: string; card_type: string; card_number: string; holder_name: string; expiry: string; cvv: string; credit_limit: number; status: string; };
type App = { id: string; card_type: string; requested_limit: number; status: string; reason: string | null; created_at: string };

export function CardsTab({ session }: { session: Session }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [open, setOpen] = useState(false);

  async function load() {
    const [{ data: c }, { data: a }] = await Promise.all([
      supabase.from("cards").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
      supabase.from("card_applications").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
    ]);
    setCards((c as Card[] | null) ?? []);
    setApps((a as App[] | null) ?? []);
  }
  useEffect(() => { load(); }, [session.user.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your cards</h2>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Apply
        </button>
      </div>

      {cards.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center">
          <CreditCard className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">You don't have any cards yet. Apply to get started.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => <BankCardVisual key={c.id} c={c} />)}
      </div>

      {apps.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Applications</h3>
          <div className="glass divide-y divide-border/50 rounded-2xl">
            {apps.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-4">
                <StatusIcon s={a.status} />
                <div className="flex-1">
                  <div className="text-sm font-medium capitalize">{a.card_type} card · limit ${Number(a.requested_limit).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}{a.reason ? ` · ${a.reason}` : ""}</div>
                </div>
                <span className="text-xs font-medium capitalize text-muted-foreground">{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {open && <ApplyModal onClose={() => { setOpen(false); load(); }} userId={session.user.id} />}
    </div>
  );
}

function StatusIcon({ s }: { s: string }) {
  if (s === "approved") return <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/15 text-success"><Check className="h-4 w-4" /></div>;
  if (s === "rejected") return <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/15 text-destructive"><X className="h-4 w-4" /></div>;
  return <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary"><Clock className="h-4 w-4" /></div>;
}

function BankCardVisual({ c }: { c: Card }) {
  const num = c.card_number.match(/.{1,4}/g)?.join(" ") ?? c.card_number;
  return (
    <div className="bank-card relative overflow-hidden rounded-2xl p-5 text-white">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-white/60">{c.card_type}</span>
        <span className="text-sm font-semibold">Nimbus</span>
      </div>
      <div className="mt-8 font-mono text-lg tracking-widest">{num}</div>
      <div className="mt-4 flex justify-between text-xs">
        <div><div className="text-white/50">Holder</div><div className="font-medium uppercase">{c.holder_name}</div></div>
        <div><div className="text-white/50">Expires</div><div className="font-medium">{c.expiry}</div></div>
        <div><div className="text-white/50">CVV</div><div className="font-medium">{c.cvv}</div></div>
      </div>
      {c.credit_limit > 0 && (<div className="mt-3 text-xs text-white/70">Limit ${Number(c.credit_limit).toLocaleString()}</div>)}
    </div>
  );
}

function ApplyModal({ onClose, userId }: { onClose: () => void; userId: string }) {
  const [type, setType] = useState<"debit" | "credit" | "platinum">("debit");
  const [limit, setLimit] = useState("1000");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("card_applications").insert({ user_id: userId, card_type: type, requested_limit: Number(limit) });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Application submitted");
    onClose();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass w-full max-w-md rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold">Apply for a card</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Card type</div>
            <div className="grid grid-cols-3 gap-2">
              {(["debit", "credit", "platinum"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setType(t)} className={`rounded-xl border py-2 text-sm capitalize ${type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{t}</button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Requested limit</span>
            <input required type="number" min="0" step="100" value={limit} onChange={(e) => setLimit(e.target.value)} className="w-full rounded-xl border border-border bg-input px-4 py-3 outline-none focus:border-ring" />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-3 font-medium">Cancel</button>
            <button disabled={loading} className="flex-1 rounded-xl py-3 font-semibold text-primary-foreground" style={{ background: "var(--gradient-brand)" }}>{loading ? "Submitting…" : "Submit"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
