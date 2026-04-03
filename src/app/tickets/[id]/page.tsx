import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { requireUserContext } from "@/lib/auth/session";
import { getTicketDetail } from "@/lib/tickets/queries";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userContext = await requireUserContext();
  const { id } = await params;
  const detail = await getTicketDetail(id);

  if (!detail.ticket) {
    notFound();
  }

  return (
    <AppShell
      currentPath="/tickets"
      title={`Ticket ${detail.ticket.id}`}
      subtitle="Structured ticket detail with summary, issue tracking, and timeline context."
      userContext={userContext}
    >
      <section className="detail-grid">
        <article className="panel">
          <h2>Summary</h2>
          <p className="muted">
            {detail.ticket.client_name} · {detail.ticket.pole_code}
          </p>
          <p>Status: {detail.ticket.status}</p>
          <p>Priority: {detail.ticket.priority}</p>
          <p>Current revision: {detail.ticket.current_revision}</p>
        </article>

        <article className="panel">
          <h2>{userContext.isClientOnly ? "Milestone view" : "Issue count"}</h2>
          <strong>{userContext.isClientOnly ? detail.ticket.status : detail.issues.length}</strong>
          <p className="muted">
            {userContext.isClientOnly
              ? "Client-safe visibility hides internal note detail."
              : `Comments: ${detail.comments.length}`}
          </p>
          <p className="muted">
            {userContext.isClientOnly
              ? `Updated ${new Date(detail.ticket.updated_at).toLocaleDateString()}`
              : `Events: ${detail.events.length}`}
          </p>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>{userContext.isClientOnly ? "Visible status" : "Issues"}</h2>
          {userContext.isClientOnly ? (
            <ul className="ticket-list">
              <li>
                <div>
                  <strong>{detail.ticket.status}</strong>
                  <p className="muted">Client view excludes internal comments and team assignment details.</p>
                </div>
                <span>{detail.ticket.priority}</span>
              </li>
            </ul>
          ) : (
            <ul className="ticket-list">
              {detail.issues.map((issue) => (
                <li key={issue.id}>
                  <div>
                    <strong>{issue.title}</strong>
                    <p className="muted">
                      {issue.category} · {issue.severity}
                    </p>
                  </div>
                  <span>{issue.status}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>{userContext.isClientOnly ? "Milestones" : "Timeline"}</h2>
          <ul className="ticket-list">
            {detail.events.map((event) => (
              <li key={event.id}>
                <div>
                  <strong>{event.event_type}</strong>
                  <p className="muted">
                    {userContext.isClientOnly
                      ? "Status event available to client."
                      : JSON.stringify(event.payload)}
                  </p>
                </div>
                <span>{new Date(event.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </AppShell>
  );
}
