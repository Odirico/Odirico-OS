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
      title="Project Management Platform"
      subtitle="Role-aware visibility layer with separate PM, QC, designer, client, and project-type perspectives."
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
