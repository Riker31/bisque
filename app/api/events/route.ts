import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("bisque_events")
      .select("*")
      .gte("date", today)
      .lte("date", twoWeeks)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
