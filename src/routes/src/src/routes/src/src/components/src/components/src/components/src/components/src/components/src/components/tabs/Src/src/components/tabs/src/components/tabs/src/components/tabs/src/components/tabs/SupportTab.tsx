import type { Session } from "@supabase/supabase-js";
import { MessageCircle } from "lucide-react";
import { SupportChat } from "../SupportChat";

export function SupportTab({ session }: { session: Session }) {
  return (
    <div className="space-y-4">
      <div className="glass flex items-center gap-3 rounded-2xl p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Live support</h2>
          <p className="text-xs text-muted-foreground">Chat with a Nimbus agent in real time</p>
        </div>
      </div>
      <SupportChat threadUserId={session.user.id} me={session.user.id} isAdmin={false} />
    </div>
  );
}
