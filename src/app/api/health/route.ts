import { jsonOk } from "@/lib/http/response";

export async function GET() {
  return jsonOk({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
