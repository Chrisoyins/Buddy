import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff } from "lucide-react";

type Tx = { id: string; from_user: string | null; to_user: string | null; amount: number; kind: string; note: string | null; created_at: string; };

export function HomeTab({ session }: { session: Session }) {
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [show, setShow] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: prof }, { data: tx }] = await Promise.all([
        supabase.from("profiles").select("balance").eq("id", session.user.id).maybeSingle(),
        supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(20),
      ]);
      setBalance(Number(prof?.balance ?? 0));
      setTxs((tx as Tx[] | null) ?? []);
    }
    load();
    const ch = supabase.channel("home")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `id=eq.${session.user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session.user.id]);

  return (
    <div className="space-y-6">
      <div className="bank-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-white/60">Available balance</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="font-display text-4xl font-bold text-white sm:text-5xl">
                {show ? `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "••••••"}
              </div>
              <button onClick={() => setShow((s) => !s)} className="rounded-full p-2 text-white/70 hover:bg-white/10">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="text-right text-white/70">
            <div className="text-xs uppercase tracking-widest">Nimbus</div>
            <div className="text-xs">•• {session.user.id.slice(-4).toUpperCase()}</div>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full opacity-30" style={{ background: "var(--gradient-brand)" }} />
      </div>

      <div>
        <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent activity</h2>
        <div className="glass rounded-2xl divide-y divide-border/50">
          {txs.length === 0 && (<div className="p-6 text-center text-sm text-muted-foreground">No transactions yet</div>)}
          {txs.map((t) => {
            const incoming = t.to_user === session.user.id;
            return (
              <div key={t.id} className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${incoming ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                  {incoming ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {t.kind === "admin_fund" ? "Deposit from Nimbus" : t.kind === "card_fee" ? "Card fee" : incoming ? "Received" : "Sent"}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{t.note || new Date(t.created_at).toLocaleString()}</div>
                </div>
                <div className={`text-sm font-semibold ${incoming ? "text-success" : ""}`}>
                  {incoming ? "+" : "−"}${Number(t.amount).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
