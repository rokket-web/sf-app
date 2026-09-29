import { query } from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await query<{ now: string }>("SELECT now()");
    return Response.json({ ok: true, dbTime: rows[0].now });
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
