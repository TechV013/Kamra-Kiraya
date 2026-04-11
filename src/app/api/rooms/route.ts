import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(
  req: NextRequest,
  context: any
) {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
  });
}
