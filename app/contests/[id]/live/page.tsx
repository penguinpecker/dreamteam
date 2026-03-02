'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from '@/lib/supabase';
import { CRICKET_POSITIONS, FOOTBALL_POSITIONS } from '@/lib/web3-helpers';

interface LivePlayer {
  sportmonks_id: number; name: string; team: string; position: string;
  points: number; is_captain: boolean; is_vc: boolean;
}
interface LeaderboardEntry {
  user_address: string; total_points: number; rank: number; reward: number | null; claimed: boolean;
}

export default function LiveScoringPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = usePrivy();
  const contestId = params.id as string;

  const [contest, setContest] = useState<any>(null);
  const [myPlayers, setMyPlayers] = useState<LivePlayer[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myTotal, setMyTotal] = useState(0);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => { loadData(); }, [contestId]);

  useEffect(() => {
    const i = setInterval(loadData, 30000);
    return () => clearInterval(i);
  }, [contestId, user?.wallet?.address]);

  async function loadData() {
    try {
      const { data: c } = await supabase
        .from('contests').select('*, match:matches(*)').eq('id', contestId).single();
      if (!c) return;
      setContest(c);

      if (user?.wallet?.address) {
        const { data: uc } = await supabase
          .from('user_contests')
          .select('*')
          .eq('contest_id', contestId)
          .eq('user_address', user.wallet.address.toLowerCase())
          .single();

        if (uc) {
          const { data: scores } = await supabase
            .from('live_scores')
            .select('*')
            .eq('match_id', c.match_id)
            .in('player_id', uc.player_ids || []);

          const mapped = (scores || []).map((s: any) => ({
            sportmonks_id: s.player_id,
            name: s.player_name || `Player #${s.player_id}`,
            team: s.team || '',
            position: s.position || '',
            points: s.points || 0,
            is_captain: uc.player_ids.indexOf(s.player_id) === uc.captain_index,
            is_vc: uc.player_ids.indexOf(s.player_id) === uc.vc_index,
          }));
          mapped.sort((a: LivePlayer, b: LivePlayer) => {
            const aP = a.points * (a.is_captain ? 2 : a.is_vc ? 1.5 : 1);
            const bP = b.points * (b.is_captain ? 2 : b.is_vc ? 1.5 : 1);
            return bP - aP;
          });
          setMyPlayers(mapped);
          setMyTotal(mapped.reduce((s: number, p: LivePlayer) =>
            s + p.points * (p.is_captain ? 2 : p.is_vc ? 1.5 : 1), 0));
        }
      }

      const { data: lb } = await supabase
        .from('user_contests')
        .select('user_address, total_points, rank, reward, claimed')
        .eq('contest_id', contestId)
        .not('total_points', 'is', null)
        .order('rank', { ascending: true })
        .limit(50);
      setLeaderboard(lb || []);

      if (user?.wallet?.address && lb) {
        const me = lb.find((e: any) => e.user_address === user.wallet!.address!.toLowerCase());
        if (me) setMyRank(me.rank);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00FF87]/30 border-t-[#00FF87] rounded-full animate-spin" />
    </div>
  );

  const match = contest?.match;
  const sport = match?.sport || 'cricket';
  const positions = sport === 'cricket' ? CRICKET_POSITIONS : FOOTBALL_POSITIONS;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
      <div className="fixed inset-0 pointer-events-none z-50 opacity-40" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }} />

      <div className="max-w-[1000px] mx-auto px-5 py-6 relative z-10">
        {/* Header */}
        <button onClick={() => router.push('/my-contests')} className="text-white/25 text-[13px] mb-4 flex items-center gap-1 hover:text-white/50 transition">
          ← Back to My Contests
        </button>

        {match && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 font-bold animate-pulse">● LIVE</span>
                <span className="text-[10px] text-white/20 uppercase tracking-wider">{match.league} · {match.format}</span>
              </div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'Teko, sans-serif' }}>
                {match.team_home} <span className="text-white/20">vs</span> {match.team_away}
              </h1>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-white/20 uppercase tracking-wider">Your Score</div>
              <div className="text-4xl font-bold text-[#00FF87]" style={{ fontFamily: 'Teko, sans-serif' }}>{myTotal.toFixed(1)}</div>
              {myRank && <div className="text-xs text-yellow-400 font-bold">Rank #{myRank}</div>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* My Players */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-3 text-white/50" style={{ fontFamily: 'Teko, sans-serif' }}>YOUR LINEUP</h2>
            <div className="space-y-[3px]">
              {myPlayers.map(p => {
                const pos = positions[p.position] || { short: '?', color: '#888' };
                const mult = p.is_captain ? 2 : p.is_vc ? 1.5 : 1;
                const effective = p.points * mult;

                return (
                  <div key={p.sportmonks_id} className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
                    style={{
                      background: p.is_captain ? 'rgba(0,255,135,0.04)' : p.is_vc ? 'rgba(251,191,36,0.04)' : 'rgba(255,255,255,0.015)',
                      border: p.is_captain ? '1px solid rgba(0,255,135,0.12)' : p.is_vc ? '1px solid rgba(251,191,36,0.12)' : '1px solid rgba(255,255,255,0.04)',
                    }}>
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-[11px] font-bold text-white/25">
                      {p.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-white/85">{p.name}</span>
                        <span className="text-[10px] px-1.5 py-[2px] rounded font-bold" style={{ background: pos.color + '15', color: pos.color }}>{pos.short}</span>
                        {p.is_captain && <span className="text-[9px] px-2 py-[2px] rounded-full bg-[#00FF87] text-black font-extrabold">C</span>}
                        {p.is_vc && <span className="text-[9px] px-2 py-[2px] rounded-full bg-yellow-400 text-black font-extrabold">VC</span>}
                      </div>
                      <span className="text-[10px] text-white/20">{p.team}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold" style={{ fontFamily: 'Teko, sans-serif', color: effective > 0 ? '#00FF87' : effective < 0 ? '#ef4444' : 'rgba(255,255,255,0.3)' }}>
                        {effective > 0 ? '+' : ''}{effective.toFixed(1)}
                      </div>
                      {mult > 1 && (
                        <div className="text-[9px] text-white/15">{p.points} × {mult}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              {myPlayers.length === 0 && (
                <div className="text-center py-12 text-white/20 text-sm">
                  No live scores yet. Updates every 30 seconds.
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-white/50" style={{ fontFamily: 'Teko, sans-serif' }}>LEADERBOARD</h2>
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] overflow-hidden">
              <div className="grid grid-cols-[32px_1fr_60px] gap-2 px-3 py-2 text-[9px] text-white/15 uppercase tracking-wider border-b border-white/[0.04]">
                <span>#</span><span>Player</span><span className="text-right">Points</span>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {leaderboard.map((e, i) => {
                  const isMe = e.user_address === user?.wallet?.address?.toLowerCase();
                  return (
                    <div key={e.user_address}
                      className={`grid grid-cols-[32px_1fr_60px] gap-2 px-3 py-2 text-[12px] border-b border-white/[0.02] ${isMe ? 'bg-[#00FF87]/[0.04]' : ''}`}>
                      <span className={`font-bold ${i < 3 ? 'text-yellow-400' : 'text-white/20'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : e.rank}
                      </span>
                      <span className={`font-mono truncate ${isMe ? 'text-[#00FF87] font-bold' : 'text-white/40'}`}>
                        {isMe ? 'You' : `${e.user_address.slice(0, 6)}...${e.user_address.slice(-4)}`}
                      </span>
                      <span className="text-right font-bold text-white/60">{e.total_points}</span>
                    </div>
                  );
                })}
                {leaderboard.length === 0 && (
                  <div className="text-center py-8 text-white/15 text-[11px]">No scores yet</div>
                )}
              </div>
            </div>
            <div className="text-[10px] text-white/10 mt-2 text-center">Updates every 30s</div>
          </div>
        </div>
      </div>
    </div>
  );
}
