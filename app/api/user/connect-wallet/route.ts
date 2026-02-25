import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Missing Supabase env vars");
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

export async function POST(req: NextRequest) {
  const { walletAddress, referredBy } = await req.json();

  if (!walletAddress) {
    return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
  }

  // ALWAYS normalize to lowercase for consistent lookups
  const normalized = walletAddress.toLowerCase();

  const sb = getSupabase();

  // First try to find existing user (case-insensitive)
  const { data: existing } = await sb
    .from("users")
    .select("*")
    .ilike("wallet_address", normalized)
    .maybeSingle();

  if (existing) {
    // User exists — return them
    return NextResponse.json({ user: existing });
  }

  // New user — insert
  const insertData: any = {
    wallet_address: normalized,
  };

  if (referredBy) {
    insertData.referred_by = referredBy;
  }

  const { data, error } = await sb
    .from("users")
    .insert(insertData)
    .select()
    .maybeSingle();

  if (error) {
    // If unique constraint error, try to fetch again
    if (error.code === "23505") {
      const { data: retryData } = await sb
        .from("users")
        .select("*")
        .ilike("wallet_address", normalized)
        .maybeSingle();
      return NextResponse.json({ user: retryData });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
