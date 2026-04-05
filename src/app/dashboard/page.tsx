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
      title="PoleQA Workspace"
      subtitle="Live inspection and QA/QC operations inside the broader Odirico OS platform."
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
