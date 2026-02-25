import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const { walletAddress, twitterHandle, refCode } = await req.json();

  if (!walletAddress || !twitterHandle) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("users")
    .update({
      twitter_handle: twitterHandle,
      ref_code: refCode,
      updated_at: new Date().toISOString(),
    })
    .eq("wallet_address", walletAddress)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data?.referred_by) {
    const { data: referrer } = await supabase
      .from("users")
      .select("id")
      .eq("ref_code", data.referred_by)
      .single();

    if (referrer) {
      await supabase.from("referrals").insert({
        referrer_id: referrer.id,
        referred_id: data.id,
      }).single();
    }
  }

  return NextResponse.json({ user: data });
}
