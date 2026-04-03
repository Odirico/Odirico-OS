import type { NextRequest } from "next/server";

import { buildCorsHeaders, handleOptions } from "@/lib/http/cors";
import { jsonError, jsonOk } from "@/lib/http/response";
import { getRequestIdentity } from "@/lib/http/request";
import { DEMO_USER, hasDemoSession } from "@/lib/demo-auth";
import { demoTickets } from "@/lib/mock-data";
import { logInfo, logWarn } from "@/lib/monitoring/logger";
import { assertRateLimit } from "@/lib/rate-limit/upstash";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ticketCreateSchema } from "@/lib/validation/tickets";
import type { Database } from "@/types/database";

type TicketInsert = Database["public"]["Tables"]["tickets"]["Insert"];

export function OPTIONS(request: NextRequest) {
  return handleOptions(request.headers.get("origin"));
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (await hasDemoSession()) {
    return jsonOk(
      {
        tickets: demoTickets,
      },
      {
        headers: buildCorsHeaders(origin),
      },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Unauthorized.", 401, { headers: buildCorsHeaders(origin) });
  }

  const { data, error } = await supabase
    .from("tickets")
    .select("id, client_name, pole_code, status, priority, days_in_qa, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    logWarn("tickets.list_failed", { message: error.message, userId: user.id });
    return jsonError("Unable to load tickets.", 500, {
      headers: buildCorsHeaders(origin),
    });
  }

  return jsonOk(
    {
      tickets: data,
    },
    {
      headers: buildCorsHeaders(origin),
    },
  );
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const identity = getRequestIdentity(request);
  const rateLimit = await assertRateLimit(identity, "ticket-create");

  if (!rateLimit.success) {
    return jsonError("Too many ticket creation attempts.", 429, {
      headers: buildCorsHeaders(origin),
    });
  }

  const payload = await request.json().catch(() => null);
  const parsed = ticketCreateSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError("Invalid ticket payload.", 400, {
      headers: buildCorsHeaders(origin),
    });
  }

  if (await hasDemoSession()) {
    const ticket = {
      id: `DEMO-${Date.now()}`,
      client_name: parsed.data.client,
      pole_code: parsed.data.pole,
      status: "Submitted",
      priority: parsed.data.priority,
      designer_id: parsed.data.designerId,
      qa_owner_id: parsed.data.qaOwnerId,
      created_by: DEMO_USER.id,
      current_revision: 1,
      days_in_qa: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return jsonOk(
      {
        ticket,
      },
      {
        status: 201,
        headers: buildCorsHeaders(origin),
      },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Unauthorized.", 401, { headers: buildCorsHeaders(origin) });
  }

  const ticketInsert: TicketInsert = {
    client_name: parsed.data.client,
    pole_code: parsed.data.pole,
    designer_id: parsed.data.designerId,
    qa_owner_id: parsed.data.qaOwnerId,
    priority: parsed.data.priority,
    created_by: user.id,
  };

  const ticketsTable = supabase.from("tickets") as any;

  const { data, error } = await ticketsTable
    .insert(ticketInsert)
    .select("*")
    .single();

  if (error) {
    logWarn("tickets.create_failed", {
      message: error.message,
      userId: user.id,
    });
    return jsonError("Unable to create ticket.", 500, {
      headers: buildCorsHeaders(origin),
    });
  }

  logInfo("tickets.created", {
    ticketId: data.id,
    userId: user.id,
  });

  return jsonOk(
    {
      ticket: data,
    },
    {
      status: 201,
      headers: buildCorsHeaders(origin),
    },
  );
}
