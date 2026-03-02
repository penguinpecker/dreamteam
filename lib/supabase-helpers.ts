import { supabase } from '@/lib/supabase';

// ── Matches ──────────────────────────────────────
export async function getUpcomingMatches(sport?: 'cricket' | 'football') {
  let q = supabase
    .from('matches')
    .select('*')
    .in('status', ['upcoming', 'not_started', 'NS'])
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true });
  if (sport) q = q.eq('sport', sport);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getLiveMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .in('status', ['live', 'inplay', '1st Innings', '2nd Innings', 'Innings Break'])
    .order('starts_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ── Contests ─────────────────────────────────────
export async function getContestsForMatch(matchId: string) {
  const { data, error } = await supabase
    .from('contests')
    .select('*')
    .eq('match_id', matchId)
    .order('entry_fee', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getAllOpenContests() {
  const { data, error } = await supabase
    .from('contests')
    .select('*, match:matches(*)')
    .eq('state', 0)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getContestById(id: string) {
  const { data, error } = await supabase
    .from('contests')
    .select('*, match:matches(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ── Players ──────────────────────────────────────
export async function getPlayersForMatch(matchId: string) {
  const { data, error } = await supabase
    .from('match_players')
    .select('*, player:players(*)')
    .eq('match_id', matchId)
    .eq('is_playing', true)
    .order('credit_value', { ascending: false });
  if (error) throw error;
  return (data || []).map((mp: any) => ({
    sportmonks_id: mp.player.sportmonks_id,
    name: mp.player.name,
    image_url: mp.player.image_url,
    team: mp.player.team,
    position: mp.player.position,
    credit_value: mp.credit_value || mp.player.credit_value,
  }));
}

// ── User Contests ────────────────────────────────
export async function getUserContests(userAddress: string) {
  const { data, error } = await supabase
    .from('user_contests')
    .select('*, contest:contests(*, match:matches(*))')
    .eq('user_address', userAddress.toLowerCase())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function hasUserJoinedContest(userAddress: string, contestId: string) {
  const { data } = await supabase
    .from('user_contests')
    .select('id')
    .eq('user_address', userAddress.toLowerCase())
    .eq('contest_id', contestId)
    .single();
  return !!data;
}

// ── Live Scores ──────────────────────────────────
export async function getLiveScores(matchId: string) {
  const { data, error } = await supabase
    .from('live_scores')
    .select('*')
    .eq('match_id', matchId)
    .order('points', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getLeaderboard(contestId: string) {
  const { data, error } = await supabase
    .from('user_contests')
    .select('user_address, total_points, rank, reward, claimed')
    .eq('contest_id', contestId)
    .not('total_points', 'is', null)
    .order('rank', { ascending: true })
    .limit(50);
  if (error) throw error;
  return data || [];
}
