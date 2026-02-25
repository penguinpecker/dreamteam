import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const refCode = req.nextUrl.searchParams.get("ref_code");
    const walletAddress = req.nextUrl.searchParams.get("wallet");

    if (!refCode && !walletAddress) {
      return NextResponse.json({ error: "ref_code or wallet required" }, { status: 400 });
    }

    // Find the referrer
    let referrer;
    if (refCode) {
      const { data } = await supabase
        .from("users")
        .select("id, wallet_address, twitter_handle, ref_code, queue_position")
        .eq("ref_code", refCode)
        .maybeSingle();
      referrer = data;
    } else {
      const { data } = await supabase
        .from("users")
        .select("id, wallet_address, twitter_handle, ref_code, queue_position")
        .eq("wallet_address", walletAddress!)
        .maybeSingle();
      referrer = data;
    }

    if (!referrer) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all users they referred
    const { data: referrals, error } = await supabase
      .from("referrals")
      .select(`
        created_at,
        referred:referred_id (
          wallet_address,
          twitter_handle,
          queue_position,
          created_at
        )
      `)
      .eq("referrer_id", referrer.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Referrals query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      referrer: {
        twitter_handle: referrer.twitter_handle,
        ref_code: referrer.ref_code,
        queue_position: referrer.queue_position,
      },
      total_referrals: referrals?.length || 0,
      referrals: referrals?.map((r: any) => ({
        wallet_address: r.referred?.wallet_address,
        twitter_handle: r.referred?.twitter_handle,
        queue_position: r.referred?.queue_position,
        joined_at: r.created_at,
      })) || [],
    });
  } catch (err: any) {
    console.error("referrals error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
