import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { walletAddress, referredBy } = await req.json();

  if (!walletAddress) {
    return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
  }

  // Check if user already exists
  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("wallet_address", walletAddress)
    .single();

  if (existing) {
    return NextResponse.json({ user: existing });
  }

  // Insert new user (queue_position auto-assigned by trigger)
  const { data, error } = await supabase
    .from("users")
    .insert({
      wallet_address: walletAddress,
      referred_by: referredBy || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
