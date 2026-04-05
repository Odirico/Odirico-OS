import { AppShell } from "@/components/layout/app-shell";
import { TicketWorkspace } from "@/components/tickets/ticket-workspace";
import { requireUserContext } from "@/lib/auth/session";
import { getDashboardSnapshot } from "@/lib/tickets/queries";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const userContext = await requireUserContext();
  const snapshot = await getDashboardSnapshot();

  return (
    <AppShell
      currentPath="/tickets"
      title="PoleQA Ticket System"
      subtitle="Working queue for review cycles, issue handling, and documentation-heavy field workflows."
      userContext={userContext}
    >
      <TicketWorkspace
        initialIssues={snapshot.issues}
        initialTickets={snapshot.tickets}
        screen="tickets"
        userContext={userContext}
      />
    </AppShell>
  );
}
