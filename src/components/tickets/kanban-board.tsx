type Ticket = {
  id: string;
  client_name: string;
  pole_code: string;
  status: string;
  priority: string;
  days_in_qa: number;
};

type KanbanBoardProps = {
  tickets: Ticket[];
};

const columns = [
  "Submitted",
  "In QA",
  "Issues Found",
  "Rework",
  "Approved",
  "Rejected",
];

export function KanbanBoard({ tickets }: KanbanBoardProps) {
  return (
    <div className="kanban-grid">
      {columns.map((column) => {
        const columnTickets = tickets.filter((ticket) => ticket.status === column);

        return (
          <section className="kanban-column" key={column}>
            <div className="kanban-column-header">
              <h2>{column}</h2>
              <span>{columnTickets.length}</span>
            </div>

            <div className="kanban-stack">
              {columnTickets.length === 0 ? (
                <div className="empty-card">No tickets</div>
              ) : (
                columnTickets.map((ticket) => (
                  <article className="ticket-card" key={ticket.id}>
                    <div className="ticket-card-top">
                      <strong>{ticket.id}</strong>
                      <span className={`priority-pill priority-${ticket.priority.toLowerCase()}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p>{ticket.client_name}</p>
                    <p>{ticket.pole_code}</p>
                    <small>{ticket.days_in_qa.toFixed(1)} days in QA</small>
                  </article>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
