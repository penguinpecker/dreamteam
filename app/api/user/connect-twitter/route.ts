import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { walletAddress, twitterHandle, refCode } = await req.json();

    if (!walletAddress || !twitterHandle) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (!existing) {
      const { data, error } = await supabase
        .from("users")
        .insert({
          wallet_address: walletAddress,
          twitter_handle: twitterHandle,
          ref_code: refCode,
        })
        .select()
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ user: data });
    }

    // Update with twitter info
    const { data, error } = await supabase
      .from("users")
      .update({
        twitter_handle: twitterHandle,
        ref_code: existing.ref_code || refCode,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", walletAddress)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Now create the referral record if this user was referred
    if (data?.referred_by) {
      // Find the referrer
      const { data: referrer } = await supabase
        .from("users")
        .select("id")
        .eq("ref_code", data.referred_by)
        .maybeSingle();

      if (referrer) {
        // Check if referral already exists
        const { data: existingRef } = await supabase
          .from("referrals")
          .select("id")
          .eq("referrer_id", referrer.id)
          .eq("referred_id", data.id)
          .maybeSingle();

        if (!existingRef) {
          await supabase.from("referrals").insert({
            referrer_id: referrer.id,
            referred_id: data.id,
          });
        }
      }
    }

    return NextResponse.json({ user: data });
  } catch (err: any) {
    console.error("connect-twitter error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
