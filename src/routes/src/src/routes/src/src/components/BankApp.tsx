import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { AuthScreen } from "./AuthScreen";
import { Dashboard } from "./Dashboard";

export function BankApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  const content = useMemo(() => {
    if (session === undefined) {
      return (<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>);
    }
    if (!session) return <AuthScreen />;
    return <Dashboard session={session} />;
  }, [session]);
  return content;
}
