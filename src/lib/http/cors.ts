import { NextResponse } from "next/server";

import { getAllowedOrigins } from "@/lib/env";

export function buildCorsHeaders(origin: string | null) {
  const allowedOrigins = getAllowedOrigins();
  const allowedOrigin =
    origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Origin": allowedOrigin,
    Vary: "Origin",
  };
}

export function handleOptions(origin: string | null) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(origin),
  });
}
