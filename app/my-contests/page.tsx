'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { arbitrum } from 'viem/chains';
import { supabase } from '@/lib/supabase';
import { CONTEST_ABI, STATE_LABELS, STATE_COLORS, ContestState } from '@/lib/contracts';
import { formatMatchDate } from '@/lib/web3-helpers';

interface UserEntry {
  id: string; contest_id: string; commitment_hash: string;
  lineup_revealed: boolean; player_ids: number[];
  captain_index: number; vc_index: number; captain_id: number; vc_id: number; salt: string;
  total_points: number | null; rank: number | null;
  reward: number | null; claimed: boolean; created_at: string;
  contest: {
    id: string; contract_address: string; entry_fee: number;
    prize_pool: number; max_participants: number; participant_count: number;
    state: number; tier: string;
    match: {
      sport: string; format: string; team_home: string; team_away: string;
      league: string; starts_at: string; status: string;
    };
  };
}

export default function MyContestsPage() {
  const { authenticated, user, login } = usePrivy();
  const { wallets } = useWallets();
  const [entries, setEntries] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playerCache, setPlayerCache] = useState<Record<number, { name: string; position: string; team: string }>>({});

  useEffect(() => {
    if (user?.wallet?.address) loadEntries();
    else setLoading(false);
  }, [user?.wallet?.address]);

  async function loadEntries() {
    try {
      const { data } = await supabase
        .from('user_contests')
        .select('*, contest:contests(*, match:matches(*))')
        .eq('user_address', user?.wallet?.address?.toLowerCase())
        .order('created_at', { ascending: false });
      setEntries(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  async function toggleExpand(entry: UserEntry) {
    if (expandedId === entry.id) { setExpandedId(null); return; }
    setExpandedId(entry.id);
    const missing = entry.player_ids.filter(id => !playerCache[id]);
    if (missing.length > 0) {
      const { data } = await supabase
        .from('players')
        .select('sportmonks_id, name, position, team')
        .in('sportmonks_id', missing);
      if (data) {
        const newCache = { ...playerCache };
        data.forEach(p => { newCache[p.sportmonks_id] = { name: p.name, position: p.position, team: p.team }; });
        setPlayerCache(newCache);
      }
    }
  }

  async function revealLineup(entry: UserEntry) {
    const wallet = wallets[0];
    if (!wallet) return;
    setActionId(entry.id);
    setActionStatus('Revealing lineup on-chain...');
    try {
      const provider = await wallet.getEthereumProvider();
      const wc = createWalletClient({ chain: arbitrum, transport: custom(provider) });
      const pc = createPublicClient({ chain: arbitrum, transport: http() });
      const ids = entry.player_ids.map(id => BigInt(id));
      const padded: [bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint] =
        [ids[0],ids[1],ids[2],ids[3],ids[4],ids[5],ids[6],ids[7],ids[8],ids[9],ids[10]];
      const tx = await wc.writeContract({
        address: entry.contest.contract_address as `0x${string}`,
        abi: CONTEST_ABI, functionName: 'revealLineup',
        args: [padded, BigInt(entry.captain_id), BigInt(entry.vc_id), entry.salt as `0x${string}`],
        account: user?.wallet?.address as `0x${string}`,
      });
      await pc.waitForTransactionReceipt({ hash: tx });
      await supabase.from('user_contests').update({ lineup_revealed: true }).eq('id', entry.id);
      setActionStatus('');
      loadEntries();
    } catch (err: any) {
      setActionStatus(`Error: ${err.message?.slice(0, 80)}`);
    } finally { setActionId(null); }
  }

  async function claimReward(entry: UserEntry) {
    const wallet = wallets[0];
    if (!wallet) return;
    setActionId(entry.id);
    setActionStatus('Claiming reward...');
    try {
      const provider = await wallet.getEthereumProvider();
      const wc = createWalletClient({ chain: arbitrum, transport: custom(provider) });
      const pc = createPublicClient({ chain: arbitrum, transport: http() });
      const fn = entry.contest.state === ContestState.CANCELLED ? 'claimRefund' : 'claimReward';
      const tx = await wc.writeContract({
        address: entry.contest.contract_address as `0x${string}`,
        abi: CONTEST_ABI, functionName: fn, args: [],
        account: user?.wallet?.address as `0x${string}`,
      });
      await pc.waitForTransactionReceipt({ hash: tx });
      await supabase.from('user_contests').update({ claimed: true }).eq('id', entry.id);
      setActionStatus('');
      loadEntries();
    } catch (err: any) {
      setActionStatus(`Error: ${err.message?.slice(0, 80)}`);
    } finally { setActionId(null); }
  }

  const active = entries.filter(e => [0, 1, 2].includes(e.contest.state));
  const completed = entries.filter(e => [3, 4].includes(e.contest.state));
  const display = tab === 'active' ? active : completed;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-white/30 mb-4">Connect your wallet to view your contests</p>
          <button onClick={login} className="px-6 py-3 bg-[#00FF87] text-black rounded-xl font-bold text-lg" style={{ fontFamily: 'Teko, sans-serif' }}>
            CONNECT WALLET
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
      <div className="fixed inset-0 pointer-events-none z-50 opacity-40" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }} />

      <div className="max-w-[900px] mx-auto px-5 py-8 relative z-10">
        <h1 className="text-5xl font-bold tracking-tight" style={{ fontFamily: 'Teko, sans-serif' }}>MY CONTESTS</h1>
        <p className="text-white/30 text-sm mt-1 mb-6">Track lineups, reveal when ready, claim winnings</p>

        <div className="flex gap-1.5 mb-6">
          {(['active', 'completed'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                tab === t ? 'bg-[#00FF87]/[0.08] text-[#00FF87] border border-[#00FF87]/20' : 'bg-white/[0.025] text-white/25 border border-transparent'
              }`}>
              {t === 'active' ? `Active (${active.length})` : `Completed (${completed.length})`}
            </button>
          ))}
        </div>

        {actionStatus && (
          <div className={`rounded-lg p-3 px-4 mb-4 text-[13px] ${actionStatus.startsWith('Error') ? 'bg-red-500/10 text-red-400' : 'bg-[#00FF87]/[0.04] text-white/50'}`}>
            {actionStatus}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#00FF87]/30 border-t-[#00FF87] rounded-full animate-spin" />
          </div>
        ) : display.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{tab === 'active' ? '🏏' : '📊'}</div>
            <p className="text-white/25 mb-4">{tab === 'active' ? 'No active contests' : 'No completed contests yet'}</p>
            {tab === 'active' && (
              <Link href="/contests" className="inline-block px-6 py-3 bg-[#00FF87] text-black rounded-xl font-bold text-lg" style={{ fontFamily: 'Teko, sans-serif' }}>
                JOIN A CONTEST →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {display.map(entry => {
              const { contest } = entry;
              const { match } = contest;
              const stateLabel = STATE_LABELS[contest.state] || 'Unknown';
              const stateColor = STATE_COLORS[contest.state] || '#888';
              const needsReveal = !entry.lineup_revealed && contest.state >= ContestState.COMMIT_CLOSED && contest.state < ContestState.SETTLED;
              const canClaim = contest.state === ContestState.SETTLED && !entry.claimed && (entry.reward ?? 0) > 0;
              const canRefund = contest.state === ContestState.CANCELLED && !entry.claimed;
              const isLive = ['live', 'inplay', '1st innings', '2nd innings'].includes(match.status?.toLowerCase() || '');

              return (
                <div key={entry.id} className="rounded-xl border border-white/[0.05] bg-white/[0.015] overflow-hidden">
                  <div className="p-5 cursor-pointer hover:bg-white/[0.01] transition" onClick={() => toggleExpand(entry)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{match.sport === 'cricket' ? '🏏' : '⚽'}</span>
                      <span className="text-[10px] text-white/20 uppercase tracking-wider">{match.league} · {match.format}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: stateColor + '20', color: stateColor }}>{stateLabel}</span>
                      {isLive && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-bold animate-pulse">● LIVE</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/15">{formatMatchDate(match.starts_at)}</span>
                      <span className="text-white/20 text-xs">{expandedId === entry.id ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'Teko, sans-serif' }}>
                    {match.team_home} <span className="text-white/15">vs</span> {match.team_away}
                  </h3>

                  <div className="flex items-center gap-5 flex-wrap">
                    <div><span className="text-[10px] text-white/20">Entry</span><span className="ml-1.5 text-sm font-bold text-[#00FF87]">${contest.entry_fee}</span></div>
                    <div><span className="text-[10px] text-white/20">Pool</span><span className="ml-1.5 text-sm font-bold">${contest.prize_pool}</span></div>
                    {entry.total_points !== null && <div><span className="text-[10px] text-white/20">Points</span><span className="ml-1.5 text-sm font-bold text-[#00FF87]">{entry.total_points}</span></div>}
                    {entry.rank !== null && <div><span className="text-[10px] text-white/20">Rank</span><span className="ml-1.5 text-sm font-bold text-yellow-400">#{entry.rank}</span></div>}
                    {entry.reward !== null && entry.reward > 0 && <div><span className="text-[10px] text-white/20">Reward</span><span className="ml-1.5 text-sm font-bold text-[#00FF87]">${entry.reward}</span></div>}
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <span className="text-[10px] px-3 py-1 rounded-lg bg-white/[0.03] text-white/25">✅ Committed</span>
                    {entry.lineup_revealed && <span className="text-[10px] px-3 py-1 rounded-lg bg-white/[0.03] text-white/25">✅ Revealed</span>}
                    {entry.claimed && <span className="text-[10px] px-3 py-1 rounded-lg bg-[#00FF87]/10 text-[#00FF87]">✅ Claimed</span>}
                    <div className="flex-1" />
                    {isLive && (
                      <Link href={`/contests/${entry.contest_id}/live`}
                        className="px-4 py-2 rounded-lg bg-red-500/15 text-red-400 text-[12px] font-bold hover:bg-red-500/25 transition">
                        Watch Live →
                      </Link>
                    )}
                    {needsReveal && (
                      <button onClick={(e) => { e.stopPropagation(); revealLineup(entry); }} disabled={actionId === entry.id}
                        className="px-5 py-2 rounded-lg bg-yellow-400 text-black text-[12px] font-bold disabled:opacity-50">
                        {actionId === entry.id ? 'Revealing...' : 'Reveal Lineup'}
                      </button>
                    )}
                    {canClaim && (
                      <button onClick={(e) => { e.stopPropagation(); claimReward(entry); }} disabled={actionId === entry.id}
                        className="px-5 py-2 rounded-lg bg-[#00FF87] text-black text-[12px] font-bold disabled:opacity-50">
                        {actionId === entry.id ? 'Claiming...' : `Claim $${entry.reward}`}
                      </button>
                    )}
                    {canRefund && (
                      <button onClick={(e) => { e.stopPropagation(); claimReward(entry); }} disabled={actionId === entry.id}
                        className="px-5 py-2 rounded-lg bg-red-400/80 text-black text-[12px] font-bold disabled:opacity-50">
                        {actionId === entry.id ? 'Refunding...' : 'Claim Refund'}
                      </button>
                    )}
                  </div>
                  </div>

                  {expandedId === entry.id && (
                    <div className="border-t border-white/[0.05] bg-white/[0.01] px-5 py-4">
                      <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3 font-semibold">Your Lineup</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {entry.player_ids.map((pid, idx) => {
                          const p = playerCache[pid];
                          const isCaptain = pid === entry.captain_id || idx === entry.captain_index;
                          const isVC = pid === entry.vc_id || idx === entry.vc_index;
                          return (
                            <div key={pid} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                              isCaptain ? 'bg-[#00FF87]/[0.06] border border-[#00FF87]/20' :
                              isVC ? 'bg-yellow-400/[0.04] border border-yellow-400/15' :
                              'bg-white/[0.02] border border-white/[0.03]'
                            }`}>
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-semibold truncate">
                                  {p?.name || `Player #${pid}`}
                                  {isCaptain && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-[#00FF87]/20 text-[#00FF87] font-bold">C</span>}
                                  {isVC && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 font-bold">VC</span>}
                                </div>
                                {p && <div className="text-[10px] text-white/25">{p.position} · {p.team}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
