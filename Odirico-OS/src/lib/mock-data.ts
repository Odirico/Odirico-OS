import type { Database } from "@/types/database";

type TicketRow = Database["public"]["Tables"]["tickets"]["Row"];
type IssueRow = Database["public"]["Tables"]["ticket_issues"]["Row"];
type CommentRow = Database["public"]["Tables"]["ticket_comments"]["Row"];
type EventRow = Database["public"]["Tables"]["ticket_events"]["Row"];

const DEMO_DESIGNER_ID = "00000000-0000-4000-8000-000000000002";
const DEMO_QA_ID = "00000000-0000-4000-8000-000000000003";
const DEMO_CREATOR_ID = "00000000-0000-4000-8000-000000000001";

export const demoTickets: TicketRow[] = [
  {
    id: "QA-1001",
    client_name: "Greenline Utilities",
    pole_code: "PL-88421",
    status: "In QA",
    priority: "HIGH",
    designer_id: DEMO_DESIGNER_ID,
    qa_owner_id: DEMO_QA_ID,
    created_by: DEMO_CREATOR_ID,
    current_revision: 3,
    days_in_qa: 2.4,
    created_at: "2026-04-01T14:00:00.000Z",
    updated_at: "2026-04-02T12:30:00.000Z",
  },
  {
    id: "QA-1002",
    client_name: "North Ridge Fiber",
    pole_code: "PL-77410",
    status: "Issues Found",
    priority: "MED",
    designer_id: DEMO_DESIGNER_ID,
    qa_owner_id: DEMO_QA_ID,
    created_by: DEMO_CREATOR_ID,
    current_revision: 2,
    days_in_qa: 4.1,
    created_at: "2026-03-30T10:15:00.000Z",
    updated_at: "2026-04-02T11:00:00.000Z",
  },
  {
    id: "QA-1003",
    client_name: "Prairie Electric Co-op",
    pole_code: "PL-66192",
    status: "Approved",
    priority: "LOW",
    designer_id: DEMO_DESIGNER_ID,
    qa_owner_id: DEMO_QA_ID,
    created_by: DEMO_CREATOR_ID,
    current_revision: 1,
    days_in_qa: 1.2,
    created_at: "2026-03-29T09:00:00.000Z",
    updated_at: "2026-04-01T16:45:00.000Z",
  },
  {
    id: "QA-1004",
    client_name: "Summit Broadband",
    pole_code: "PL-90315",
    status: "Rework",
    priority: "HIGH",
    designer_id: DEMO_DESIGNER_ID,
    qa_owner_id: DEMO_QA_ID,
    created_by: DEMO_CREATOR_ID,
    current_revision: 4,
    days_in_qa: 6.8,
    created_at: "2026-03-27T08:30:00.000Z",
    updated_at: "2026-04-02T09:20:00.000Z",
  },
];

export const demoIssues: IssueRow[] = [
  {
    id: "ISS-2001",
    ticket_id: "QA-1001",
    title: "Guying attachment height conflicts with field notes",
    severity: "HIGH",
    status: "Open",
    category: "Structural",
    assigned_to: DEMO_DESIGNER_ID,
    created_at: "2026-04-02T08:00:00.000Z",
  },
  {
    id: "ISS-2002",
    ticket_id: "QA-1002",
    title: "Span annotation missing on revised sheet",
    severity: "MED",
    status: "In Progress",
    category: "Drafting",
    assigned_to: DEMO_DESIGNER_ID,
    created_at: "2026-04-01T15:20:00.000Z",
  },
];

export const demoComments: CommentRow[] = [
  {
    id: "COM-3001",
    ticket_id: "QA-1001",
    author_id: DEMO_QA_ID,
    body: "Flagged for pole class mismatch against construction package.",
    created_at: "2026-04-02T08:10:00.000Z",
  },
  {
    id: "COM-3002",
    ticket_id: "QA-1001",
    author_id: DEMO_DESIGNER_ID,
    body: "Reviewing latest survey photos and preparing revision 4.",
    created_at: "2026-04-02T10:05:00.000Z",
  },
];

export const demoEvents: EventRow[] = [
  {
    id: "EVT-4001",
    ticket_id: "QA-1001",
    actor_id: DEMO_CREATOR_ID,
    event_type: "ticket_created",
    payload: { status: "Submitted" },
    created_at: "2026-04-01T14:00:00.000Z",
  },
  {
    id: "EVT-4002",
    ticket_id: "QA-1001",
    actor_id: DEMO_QA_ID,
    event_type: "status_changed",
    payload: { from: "Submitted", to: "In QA" },
    created_at: "2026-04-01T14:30:00.000Z",
  },
  {
    id: "EVT-4003",
    ticket_id: "QA-1001",
    actor_id: DEMO_QA_ID,
    event_type: "issue_logged",
    payload: { issueId: "ISS-2001" },
    created_at: "2026-04-02T08:00:00.000Z",
  },
];
