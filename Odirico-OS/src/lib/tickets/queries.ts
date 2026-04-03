import { cache } from "react";

import { hasDemoSession } from "@/lib/demo-auth";
import { demoComments, demoEvents, demoIssues, demoTickets } from "@/lib/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const getDashboardSnapshot = cache(async () => {
  if (await hasDemoSession()) {
    return {
      tickets: demoTickets,
      issues: demoIssues,
      ticketsError: null,
      issuesError: null,
    };
  }

  const supabase = await createServerSupabaseClient();

  const [ticketsResult, issuesResult] = await Promise.all([
    supabase
      .from("tickets")
      .select(
        "id, client_name, pole_code, status, priority, designer_id, qa_owner_id, created_by, current_revision, days_in_qa, created_at, updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("ticket_issues")
      .select("id, title, severity, ticket_id")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return {
    tickets: ticketsResult.data ?? [],
    issues: issuesResult.data ?? [],
    ticketsError: ticketsResult.error,
    issuesError: issuesResult.error,
  };
});

export const getTicketDetail = cache(async (ticketId: string) => {
  if (await hasDemoSession()) {
    return {
      ticket: demoTickets.find((ticket) => ticket.id === ticketId) ?? null,
      issues: demoIssues.filter((issue) => issue.ticket_id === ticketId),
      comments: demoComments.filter((comment) => comment.ticket_id === ticketId),
      events: demoEvents.filter((event) => event.ticket_id === ticketId),
      error: null,
    };
  }

  const supabase = await createServerSupabaseClient();

  const [ticketResult, issuesResult, commentsResult, eventsResult] =
    await Promise.all([
      supabase
        .from("tickets")
        .select("*")
        .eq("id", ticketId)
        .single(),
      supabase
        .from("ticket_issues")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false }),
      supabase
        .from("ticket_comments")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true }),
      supabase
        .from("ticket_events")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true }),
    ]);

  return {
    ticket: ticketResult.data,
    issues: issuesResult.data ?? [],
    comments: commentsResult.data ?? [],
    events: eventsResult.data ?? [],
    error:
      ticketResult.error ??
      issuesResult.error ??
      commentsResult.error ??
      eventsResult.error,
  };
});
