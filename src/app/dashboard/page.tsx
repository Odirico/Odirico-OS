import { AppShell } from "@/components/layout/app-shell";
import { TicketWorkspace } from "@/components/tickets/ticket-workspace";
import { requireUserContext } from "@/lib/auth/session";
import { getDashboardSnapshot } from "@/lib/tickets/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userContext = await requireUserContext();
  const snapshot = await getDashboardSnapshot();

  return (
    <AppShell
      currentPath="/dashboard"
      title="PoleQA Operations"
      subtitle="Role-aware workspace for inspections, tickets, and project execution across infrastructure teams."
      userContext={userContext}
    >
      <TicketWorkspace
        initialIssues={snapshot.issues}
        initialTickets={snapshot.tickets}
        screen="dashboard"
        userContext={userContext}
      />
    </AppShell>
  );
}
