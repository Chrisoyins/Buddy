import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Wallet, Send, CreditCard, Shield, Home, Landmark, MessageCircle } from "lucide-react";
import { HomeTab } from "./tabs/HomeTab";
import { TransferTab } from "./tabs/TransferTab";
import { CardsTab } from "./tabs/CardsTab";
import { AdminTab } from "./tabs/AdminTab";
import { DepositTab } from "./tabs/DepositTab";
import { SupportTab } from "./tabs/SupportTab";
import { toast } from "sonner";

type Tab = "home" | "deposit" | "transfer" | "cards" | "support" | "admin";

export function Dashboard({ session }: { session: Session }) {
  const [tab, setTab] = useState<Tab>("home");
  const [isAdmin, setIsAdmin] = useState(false);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", session.user.id),
        supabase.from("profiles").select("full_name").eq("id", session.user.id).maybeSingle(),
      ]);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
      setFullName(profile?.full_name || session.user.email || "");
    })();
  }, [session.user.id, session.user.email]);

  async function signOut() { await supabase.auth.signOut(); toast.success("Signed out"); }

  const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "deposit", label: "Deposit", icon: Landmark },
    { id: "transfer", label: "Send", icon: Send },
    { id: "cards", label: "Cards", icon: CreditCard },
    { id: "support", label: "Support", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-20 glass border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">Nimbus Bank</div>
              <div className="text-xs text-muted-foreground">Hi, {fullName.split(" ")[0] || "there"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button onClick={() => setTab("admin")} className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${tab === "admin" ? "bg-accent text-accent-foreground" : "border border-accent/50 text-accent hover:bg-accent/10"}`}>
                <Shield className="h-4 w-4" /> Admin
              </button>
            )}
            <button onClick={signOut} className="rounded-xl p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6">
        {tab === "home" && <HomeTab session={session} />}
        {tab === "deposit" && <DepositTab isAdmin={isAdmin} />}
        {tab === "transfer" && <TransferTab />}
        {tab === "cards" && <CardsTab session={session} />}
        {tab === "support" && <SupportTab session={session} />}
        {tab === "admin" && isAdmin && <AdminTab />}
      </main>

      <nav className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2">
        <div className="glass flex gap-1 rounded-2xl p-1.5 shadow-2xl">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex min-w-[72px] flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs font-medium transition ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon className="h-4 w-4" />{t.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
