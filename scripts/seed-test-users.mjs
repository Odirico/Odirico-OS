import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

function loadEnv(envPath) {
  const content = readFileSync(envPath, "utf8");

  return Object.fromEntries(
    content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
      }),
  );
}

const env = loadEnv(resolve(process.cwd(), ".env.local"));

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase URL or service role key in .env.local");
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const usersToSeed = [
  {
    email: "pm.test@poleqa.local",
    password: "Test1234!",
    displayName: "Pat Morgan",
    roles: ["pm"],
    teams: ["Alpha", "Bravo"],
    profileRole: "admin",
  },
  {
    email: "qc.test@poleqa.local",
    password: "Test1234!",
    displayName: "Quinn Carter",
    roles: ["qc"],
    teams: ["Alpha", "Bravo"],
    profileRole: "qa",
  },
  {
    email: "designer.test@poleqa.local",
    password: "Test1234!",
    displayName: "Avery Stone",
    roles: ["designer"],
    teams: ["Alpha"],
    profileRole: "designer",
  },
  {
    email: "hybrid.test@poleqa.local",
    password: "Test1234!",
    displayName: "Riley Brooks",
    roles: ["qc", "designer"],
    teams: ["Alpha", "Charlie"],
    profileRole: "qa",
  },
  {
    email: "client.test@poleqa.local",
    password: "Test1234!",
    displayName: "Client View",
    roles: ["client"],
    teams: ["Alpha"],
    profileRole: "viewer",
  },
];

const { data: existingUsersResult, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 200,
});

if (listError) {
  throw listError;
}

const existingUsersByEmail = new Map(
  (existingUsersResult?.users ?? [])
    .filter((user) => user.email)
    .map((user) => [user.email.toLowerCase(), user]),
);

const seededUsers = [];

for (const definition of usersToSeed) {
  const existingUser = existingUsersByEmail.get(definition.email.toLowerCase());

  const payload = {
    email: definition.email,
    password: definition.password,
    email_confirm: true,
    app_metadata: {
      roles: definition.roles,
      teams: definition.teams,
      display_name: definition.displayName,
    },
    user_metadata: {
      full_name: definition.displayName,
    },
  };

  const result = existingUser
    ? await supabase.auth.admin.updateUserById(existingUser.id, payload)
    : await supabase.auth.admin.createUser(payload);

  if (result.error || !result.data.user) {
    throw result.error ?? new Error(`Unable to create ${definition.email}`);
  }

  seededUsers.push({
    ...definition,
    id: result.data.user.id,
  });
}

const profiles = seededUsers.map((user) => ({
  id: user.id,
  full_name: user.displayName,
  role: user.profileRole,
}));

const { error: profileError } = await supabase.from("profiles").upsert(profiles, {
  onConflict: "id",
});

if (profileError) {
  throw profileError;
}

const pmUser = seededUsers.find((user) => user.roles.includes("pm"));
const qcUser = seededUsers.find((user) => user.email === "qc.test@poleqa.local");
const designerUser = seededUsers.find((user) => user.email === "designer.test@poleqa.local");
const hybridUser = seededUsers.find((user) => user.email === "hybrid.test@poleqa.local");

if (!pmUser || !qcUser || !designerUser || !hybridUser) {
  throw new Error("Expected seeded PM/QC/designer users were not created.");
}

const tickets = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    client_name: "Greenline Utilities",
    pole_code: "PL-88421",
    status: "In QA",
    priority: "HIGH",
    designer_id: designerUser.id,
    qa_owner_id: qcUser.id,
    created_by: pmUser.id,
    current_revision: 3,
    days_in_qa: 2.4,
    created_at: "2026-04-01T14:00:00.000Z",
    updated_at: "2026-04-02T12:30:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    client_name: "North Ridge Fiber",
    pole_code: "PL-77410",
    status: "Issues Found",
    priority: "MED",
    designer_id: hybridUser.id,
    qa_owner_id: qcUser.id,
    created_by: pmUser.id,
    current_revision: 2,
    days_in_qa: 4.1,
    created_at: "2026-03-30T10:15:00.000Z",
    updated_at: "2026-04-02T11:00:00.000Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    client_name: "Prairie Electric Co-op",
    pole_code: "PL-66192",
    status: "Submitted",
    priority: "LOW",
    designer_id: designerUser.id,
    qa_owner_id: hybridUser.id,
    created_by: pmUser.id,
    current_revision: 1,
    days_in_qa: 1.2,
    created_at: "2026-03-29T09:00:00.000Z",
    updated_at: "2026-04-01T16:45:00.000Z",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    client_name: "Summit Broadband",
    pole_code: "PL-90315",
    status: "Rework",
    priority: "HIGH",
    designer_id: hybridUser.id,
    qa_owner_id: qcUser.id,
    created_by: pmUser.id,
    current_revision: 4,
    days_in_qa: 6.8,
    created_at: "2026-03-27T08:30:00.000Z",
    updated_at: "2026-04-02T09:20:00.000Z",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    client_name: "Metro Power Build",
    pole_code: "PL-51108",
    status: "Approved",
    priority: "MED",
    designer_id: designerUser.id,
    qa_owner_id: hybridUser.id,
    created_by: pmUser.id,
    current_revision: 2,
    days_in_qa: 3.1,
    created_at: "2026-03-26T09:20:00.000Z",
    updated_at: "2026-04-01T08:55:00.000Z",
  },
];

const ticketIssues = [
  {
    id: "66666666-6666-4666-8666-666666666661",
    ticket_id: tickets[0].id,
    title: "Material list reference differs from latest field package",
    severity: "HIGH",
    status: "Open",
    category: "Materials",
    assigned_to: designerUser.id,
    created_at: "2026-04-02T08:00:00.000Z",
  },
  {
    id: "66666666-6666-4666-8666-666666666662",
    ticket_id: tickets[1].id,
    title: "BM attachment missing in upload package",
    severity: "MED",
    status: "In Progress",
    category: "Documents",
    assigned_to: hybridUser.id,
    created_at: "2026-04-01T15:20:00.000Z",
  },
];

const ticketComments = [
  {
    id: "77777777-7777-4777-8777-777777777771",
    ticket_id: tickets[0].id,
    author_id: qcUser.id,
    body: "Flagged because the material list and field package no longer match.",
    created_at: "2026-04-02T08:10:00.000Z",
  },
  {
    id: "77777777-7777-4777-8777-777777777772",
    ticket_id: tickets[1].id,
    author_id: hybridUser.id,
    body: "BM is being regenerated and will be reattached before end of day.",
    created_at: "2026-04-02T10:05:00.000Z",
  },
];

const ticketEvents = [
  {
    id: "88888888-8888-4888-8888-888888888881",
    ticket_id: tickets[0].id,
    actor_id: pmUser.id,
    event_type: "ticket_created",
    payload: { status: "Submitted" },
    created_at: "2026-04-01T14:00:00.000Z",
  },
  {
    id: "88888888-8888-4888-8888-888888888882",
    ticket_id: tickets[0].id,
    actor_id: qcUser.id,
    event_type: "status_changed",
    payload: { from: "Submitted", to: "In QA" },
    created_at: "2026-04-01T14:30:00.000Z",
  },
  {
    id: "88888888-8888-4888-8888-888888888883",
    ticket_id: tickets[1].id,
    actor_id: hybridUser.id,
    event_type: "issue_logged",
    payload: { issueId: "BM-missing" },
    created_at: "2026-04-02T08:00:00.000Z",
  },
];

const { error: ticketsError } = await supabase.from("tickets").upsert(tickets, {
  onConflict: "id",
});
if (ticketsError) throw ticketsError;

const { error: issuesError } = await supabase.from("ticket_issues").upsert(ticketIssues, {
  onConflict: "id",
});
if (issuesError) throw issuesError;

const { error: commentsError } = await supabase.from("ticket_comments").upsert(ticketComments, {
  onConflict: "id",
});
if (commentsError) throw commentsError;

const { error: eventsError } = await supabase.from("ticket_events").upsert(ticketEvents, {
  onConflict: "id",
});
if (eventsError) throw eventsError;

console.table(
  seededUsers.map((user) => ({
    email: user.email,
    password: user.password,
    roles: user.roles.join(", "),
    teams: user.teams.join(", "),
  })),
);
