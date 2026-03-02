'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCountdown, formatMatchDate } from '@/lib/web3-helpers';
import { STATE_LABELS, STATE_COLORS } from '@/lib/contracts';

interface Match {
  id: string; sport: 'cricket' | 'football'; format: string;
  team_home: string; team_away: string; team_home_logo: string; team_away_logo: string;
  league: string; starts_at: string; status: string;
}
interface Contest {
  id: string; match_id: string; entry_fee: number; max_participants: number;
  participant_count: number; prize_pool: number; tier: string; state: number;
  commit_deadline: string; match?: Match;
}

const TIER_STYLES: Record<string, { gradient: string; label: string }> = {
  beginner:     { gradient: 'from-emerald-600/20 to-emerald-900/10', label: 'Beginner' },
  standard:     { gradient: 'from-blue-600/20 to-blue-900/10', label: 'Standard' },
  pro:          { gradient: 'from-purple-600/20 to-purple-900/10', label: 'Pro' },
  head_to_head: { gradient: 'from-red-600/20 to-red-900/10', label: 'H2H' },
};

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState<'all' | 'cricket' | 'football'>('all');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    loadContests();
    const i = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  async function loadContests() {
    try {
      const { data } = await supabase
        .from('contests')
        .select('*, match:matches(*)')
        .eq('state', 0)
        .order('created_at', { ascending: false });
      setContests(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  // Group by match
  const grouped = useMemo(() => {
    const filtered = sportFilter === 'all' ? contests : contests.filter(c => c.match?.sport === sportFilter);
    const map = new Map<string, { match: Match; contests: Contest[] }>();
    for (const c of filtered) {
      if (!c.match) continue;
      if (!map.has(c.match_id)) map.set(c.match_id, { match: c.match, contests: [] });
      map.get(c.match_id)!.contests.push(c);
    }
    return Array.from(map.values()).sort((a, b) =>
      new Date(a.match.starts_at).getTime() - new Date(b.match.starts_at).getTime()
    );
  }, [contests, sportFilter]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
      {/* Noise + glow */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-40" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }} />

      <div className="max-w-[1000px] mx-auto px-5 py-8 relative z-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold tracking-tight" style={{ fontFamily: 'Teko, sans-serif' }}>CONTESTS</h1>
            <p className="text-white/30 text-sm mt-1">Pick a match, build your team, win USDC</p>
          </div>
          <div className="flex gap-1.5">
            {(['all', 'cricket', 'football'] as const).map(s => (
              <button key={s} onClick={() => setSportFilter(s)}
                className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                  sportFilter === s
                    ? 'bg-[#00FF87]/[0.08] text-[#00FF87] border border-[#00FF87]/20'
                    : 'bg-white/[0.025] text-white/25 border border-transparent'
                }`}>
                {s === 'all' ? 'All Sports' : s === 'cricket' ? '🏏 Cricket' : '⚽ Football'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-[#00FF87]/30 border-t-[#00FF87] rounded-full animate-spin" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-24 text-white/25">
            <div className="text-5xl mb-4">{sportFilter === 'cricket' ? '🏏' : sportFilter === 'football' ? '⚽' : '🎯'}</div>
            <p>No open contests right now. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ match, contests: matchContests }) => {
              const deadline = Math.floor(new Date(match.starts_at).getTime() / 1000);
              const cd = formatCountdown(deadline);
              const isLive = ['live', 'inplay'].includes(match.status?.toLowerCase() || '');

              return (
                <div key={match.id} className="rounded-2xl border border-white/[0.05] overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.012)' }}>
                  {/* Match header */}
                  <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm">{match.sport === 'cricket' ? '🏏' : '⚽'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold" style={{ fontFamily: 'Teko, sans-serif' }}>
                            {match.team_home}
                          </span>
                          <span className="text-white/10 text-sm" style={{ fontFamily: 'Teko, sans-serif' }}>VS</span>
                          <span className="text-lg font-bold" style={{ fontFamily: 'Teko, sans-serif' }}>
                            {match.team_away}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/20 uppercase tracking-wider">
                          {match.league} · {match.format}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {isLive ? (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 font-bold animate-pulse">● LIVE</span>
                      ) : (
                        <div>
                          <div className="text-[9px] text-white/20 uppercase tracking-wider">Starts in</div>
                          <div className="text-lg font-bold text-yellow-400 tabular-nums" style={{ fontFamily: 'Teko, sans-serif' }}>{cd}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contest cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.03]">
                    {matchContests.map(c => {
                      const tier = TIER_STYLES[c.tier] || TIER_STYLES.standard;
                      const fillPct = (c.participant_count / c.max_participants) * 100;

                      return (
                        <Link key={c.id} href={`/contests/${c.id}`}
                          className={`block p-4 bg-[#0A0A0B] hover:bg-white/[0.02] transition-all group`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-gradient-to-r ${tier.gradient} text-white/70`}>
                              {tier.label}
                            </span>
                            <span className="text-[10px] text-white/15">{c.participant_count}/{c.max_participants}</span>
                          </div>

                          <div className="text-2xl font-bold text-[#00FF87] mb-1" style={{ fontFamily: 'Teko, sans-serif' }}>
                            ${c.entry_fee}
                          </div>
                          <div className="text-[10px] text-white/20 mb-3">
                            Prize Pool: <span className="text-white/50 font-semibold">${c.prize_pool}</span>
                          </div>

                          {/* Fill bar */}
                          <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden mb-2">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${fillPct}%`,
                                background: fillPct > 80 ? '#ef4444' : fillPct > 50 ? '#FBBF24' : '#00FF87',
                              }} />
                          </div>
                          <div className="text-[10px] text-white/15">
                            {c.max_participants - c.participant_count} spots left
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
