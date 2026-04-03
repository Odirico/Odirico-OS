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
      title="Ticket System"
      subtitle="Working queue optimized for lower data entry, due-date-driven urgency, and bulk folder intake."
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
