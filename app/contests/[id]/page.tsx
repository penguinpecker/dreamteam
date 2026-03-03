'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { arbitrum } from 'viem/chains';
import { supabase } from '@/lib/supabase';
import { ADDRESSES, USDC_ABI, CONTEST_ABI } from '@/lib/contracts';
import {
  computeLineupHash, generateSalt, parseUSDC,
  formatCountdown, formatMatchDate, validateTeam,
  CRICKET_POSITIONS, FOOTBALL_POSITIONS,
} from '@/lib/web3-helpers';

// ── Types ────────────────────────────────────────
interface Match {
  id: string; sport: 'cricket' | 'football'; format: string;
  team_home: string; team_away: string; team_home_logo: string; team_away_logo: string;
  league: string; starts_at: string;
}
interface ContestData {
  id: string; match_id: string; contract_address: string;
  entry_fee: number; max_participants: number; participant_count: number;
  prize_pool: number; tier: string; state: number;
  commit_deadline: string; reveal_deadline: string; match?: Match;
}
interface Player {
  sportmonks_id: number; name: string; image_url: string;
  team: string; position: string; credit_value: number;
}

// ── Team Colors ──────────────────────────────────
const TEAM_COLORS: Record<string, { bg: string; border: string; text: string }> = {};
function getTeamColor(team: string, idx: number) {
  if (!TEAM_COLORS[team]) {
    const presets = [
      { bg: 'rgba(19,80,152,0.12)', border: 'rgba(19,80,152,0.3)', text: '#4A90D9' },
      { bg: 'rgba(255,205,0,0.08)', border: 'rgba(255,205,0,0.25)', text: '#FFD700' },
    ];
    TEAM_COLORS[team] = presets[idx % 2];
  }
  return TEAM_COLORS[team];
}

// ── Page ─────────────────────────────────────────
export default function ContestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { authenticated, user, login } = usePrivy();
  const { wallets } = useWallets();
  const contestId = params.id as string;

  const [contest, setContest] = useState<ContestData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Player[]>([]);
  const [captainIdx, setCaptainIdx] = useState<number | null>(null);
  const [vcIdx, setVcIdx] = useState<number | null>(null);
  const [step, setStep] = useState<'select' | 'captain' | 'confirm'>('select');
  const [posFilter, setPosFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [sortBy, setSortBy] = useState('credit');
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [txStatus, setTxStatus] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [countdown, setCountdown] = useState('');

  // ── Load Data ──────────────────────────────────
  useEffect(() => { loadContest(); }, [contestId]);

  useEffect(() => {
    if (!contest?.commit_deadline) return;
    const tick = () => setCountdown(formatCountdown(Math.floor(new Date(contest.commit_deadline).getTime() / 1000)));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [contest?.commit_deadline]);

  useEffect(() => {
    if (!user?.wallet?.address || !contestId) return;
    supabase.from('user_contests').select('id').eq('contest_id', contestId).eq('user_address', user.wallet.address.toLowerCase()).single()
      .then(({ data }) => { if (data) setHasJoined(true); });
  }, [user?.wallet?.address, contestId]);

  async function loadContest() {
    try {
      const { data: c } = await supabase.from('contests').select('*, match:matches(*)').eq('id', contestId).single();
      if (!c) return;
      setContest(c);

      const { data: mp } = await supabase.from('match_players').select('*, player:players(*)').eq('match_id', c.match_id).eq('is_playing', true);
      setPlayers((mp || []).map((m: any) => ({
        sportmonks_id: m.player.sportmonks_id, name: m.player.name, image_url: m.player.image_url,
        team: m.player.team, position: m.player.position, credit_value: m.credit_value || m.player.credit_value,
      })));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  // ── Derived State ──────────────────────────────
  const sport = contest?.match?.sport || 'cricket';
  const positions = sport === 'cricket' ? CRICKET_POSITIONS : FOOTBALL_POSITIONS;

  const teams = useMemo(() => [...new Set(players.map(p => p.team))], [players]);

  const filtered = useMemo(() => {
    let list = players.filter(p => {
      if (posFilter !== 'all' && p.position !== posFilter) return false;
      if (teamFilter !== 'all' && p.team !== teamFilter) return false;
      return true;
    });
    if (sortBy === 'credit') list.sort((a, b) => b.credit_value - a.credit_value);
    if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'position') list.sort((a, b) => a.position.localeCompare(b.position));
    return list;
  }, [players, posFilter, teamFilter, sortBy]);

  const credits = selected.reduce((s, p) => s + p.credit_value, 0);
  const creditPct = Math.min((credits / 100) * 100, 100);

  const posCounts: Record<string, number> = {};
  selected.forEach(p => { posCounts[p.position] = (posCounts[p.position] || 0) + 1; });

  const teamCounts: Record<string, number> = {};
  selected.forEach(p => { teamCounts[p.team] = (teamCounts[p.team] || 0) + 1; });

  const validation = useMemo(() => validateTeam(selected, sport), [selected, sport]);

  function toggle(p: Player) {
    if (selected.find(s => s.sportmonks_id === p.sportmonks_id)) {
      setSelected(prev => prev.filter(s => s.sportmonks_id !== p.sportmonks_id));
    } else if (selected.length < 11) {
      setSelected(prev => [...prev, p]);
    }
  }
  function isSel(p: Player) { return !!selected.find(s => s.sportmonks_id === p.sportmonks_id); }

  // ── Submit Lineup ──────────────────────────────
  async function submitLineup() {
    if (!authenticated || !user?.wallet?.address || !contest) return;
    if (!contest.contract_address || contest.contract_address === 'pending' || !contest.contract_address.startsWith('0x')) {
      setTxStatus('Error: Contest contract not yet deployed on-chain. Check back soon.');
      return;
    }
    const wallet = wallets[0];
    if (!wallet) return;

    setTxLoading(true);
    setTxStatus('Preparing...');
    try {
      const provider = await wallet.getEthereumProvider();
      const wc = createWalletClient({ chain: arbitrum, transport: custom(provider) });
      const pc = createPublicClient({ chain: arbitrum, transport: http() });
      const addr = user.wallet.address as `0x${string}`;
      const contestAddr = contest.contract_address as `0x${string}`;
      const fee = parseUSDC(contest.entry_fee.toString());

      const ids = selected.map(p => BigInt(p.sportmonks_id));
      const captainId = BigInt(selected[captainIdx!].sportmonks_id);
      const vcId = BigInt(selected[vcIdx!].sportmonks_id);
      const salt = generateSalt();
      const commitment = computeLineupHash(ids, captainId, vcId, salt);

      setTxStatus('Approving USDC...');
      const allowance = await pc.readContract({ address: ADDRESSES.USDC, abi: USDC_ABI, functionName: 'allowance', args: [addr, contestAddr] });
      if (allowance < fee) {
        const tx = await wc.writeContract({ address: ADDRESSES.USDC, abi: USDC_ABI, functionName: 'approve', args: [contestAddr, fee], account: addr });
        await pc.waitForTransactionReceipt({ hash: tx });
      }

      setTxStatus('Committing lineup to Arbitrum...');
      const tx = await wc.writeContract({ address: contestAddr, abi: CONTEST_ABI, functionName: 'commitLineup', args: [commitment], account: addr });
      await pc.waitForTransactionReceipt({ hash: tx });

      setTxStatus('Saving...');
      await supabase.from('user_contests').insert({
        user_address: addr.toLowerCase(), contest_id: contestId, commitment_hash: commitment,
        player_ids: selected.map(p => p.sportmonks_id), captain_index: captainIdx, vc_index: vcIdx,
        captain_id: selected[captainIdx!].sportmonks_id, vc_id: selected[vcIdx!].sportmonks_id,
        salt, lineup_revealed: false, claimed: false,
      });

      // Update contest stats
      await supabase.rpc('increment_contest_stats', { cid: contestId, fee: contest!.entry_fee });

      setTxStatus('');
      setHasJoined(true);
      setContest(prev => prev ? { ...prev, participant_count: prev.participant_count + 1, prize_pool: prev.prize_pool + prev.entry_fee } : prev);
    } catch (err: any) {
      setTxStatus(`Error: ${err.message?.slice(0, 100)}`);
    } finally { setTxLoading(false); }
  }

  // ── Render ─────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00FF87]/30 border-t-[#00FF87] rounded-full animate-spin" />
    </div>
  );
  if (!contest?.match) return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-white/40">Contest not found</div>
  );

  const match = contest.match;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
      {/* Noise */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-40" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }} />
      <div className="fixed -top-[300px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,255,135,0.025) 0%, transparent 60%)' }} />

      {/* ── Match Header ──────────────────────── */}
      <div className="border-b border-white/5 relative z-10" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 100%)' }}>
        <div className="max-w-[1000px] mx-auto px-5 pt-5 pb-6">
          <button onClick={() => router.push('/contests')} className="text-white/25 text-[13px] mb-3 flex items-center gap-1 hover:text-white/50 transition">
            ← Back to Contests
          </button>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-white/20 uppercase tracking-[2px] font-semibold">
                  {sport === 'cricket' ? '🏏' : '⚽'} {match.league} · {match.format}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00FF87]/10 text-[#00FF87] font-bold">
                  ${contest.entry_fee} Entry
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5">
                  {match.team_home_logo && <img src={match.team_home_logo} alt="" className="w-11 h-11 rounded-lg" />}
                  <span className="text-[28px] font-bold" style={{ fontFamily: 'Teko, sans-serif' }}>{match.team_home}</span>
                </div>
                <span className="text-[18px] text-white/10 font-light" style={{ fontFamily: 'Teko, sans-serif' }}>VS</span>
                <div className="flex items-center gap-2.5">
                  {match.team_away_logo && <img src={match.team_away_logo} alt="" className="w-11 h-11 rounded-lg" />}
                  <span className="text-[28px] font-bold" style={{ fontFamily: 'Teko, sans-serif' }}>{match.team_away}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="text-right">
                <div className="text-[9px] text-white/20 uppercase tracking-[1.5px]">Prize Pool</div>
                <div className="text-[28px] font-bold" style={{ fontFamily: 'Teko, sans-serif' }}>${contest.prize_pool.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-white/20 uppercase tracking-[1.5px]">Deadline</div>
                <div className="text-[28px] font-bold text-yellow-400 tabular-nums" style={{ fontFamily: 'Teko, sans-serif' }}>{countdown || '...'}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-white/20 uppercase tracking-[1.5px]">Spots</div>
                <div className="text-[28px] font-bold text-white/50" style={{ fontFamily: 'Teko, sans-serif' }}>
                  {contest.participant_count}<span className="text-white/15">/{contest.max_participants}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Step Indicator ─────────────────────── */}
      <div className="border-b border-white/[0.03] relative z-10">
        <div className="max-w-[1000px] mx-auto px-5 py-3 flex items-center gap-1.5">
          {[
            { key: 'select' as const, label: 'Select Players', num: 1, done: selected.length === 11 },
            { key: 'captain' as const, label: 'Captain & VC', num: 2, done: captainIdx !== null && vcIdx !== null },
            { key: 'confirm' as const, label: 'Confirm & Pay', num: 3, done: hasJoined },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-1.5">
              {i > 0 && <div className={`w-8 h-px ${step === s.key || s.done ? 'bg-[#00FF87]/30' : 'bg-white/5'}`} />}
              <button
                onClick={() => {
                  if (s.key === 'select') setStep('select');
                  if (s.key === 'captain' && selected.length === 11) setStep('captain');
                  if (s.key === 'confirm' && captainIdx !== null && vcIdx !== null) setStep('confirm');
                }}
                className={`flex items-center gap-2 px-3.5 py-[7px] rounded-lg text-xs font-semibold transition-all ${
                  step === s.key ? 'bg-[#00FF87]/[0.08] text-[#00FF87] border border-[#00FF87]/20' :
                  s.done ? 'bg-[#00FF87]/[0.04] text-[#00FF87]/50 border border-transparent' :
                  'text-white/20 border border-transparent'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === s.key ? 'bg-[#00FF87] text-black' :
                  s.done ? 'bg-[#00FF87]/20 text-[#00FF87]' :
                  'bg-white/[0.06] text-white/20'
                }`}>
                  {s.done && step !== s.key ? '✓' : s.num}
                </span>
                {s.label}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Joined State ──────────────────────── */}
      {hasJoined && (
        <div className="max-w-[1000px] mx-auto px-5 py-16 text-center relative z-10">
          <div className="w-20 h-20 rounded-full bg-[#00FF87]/10 border-2 border-[#00FF87]/30 mx-auto mb-5 flex items-center justify-center text-4xl">✅</div>
          <h2 className="text-4xl font-bold text-[#00FF87] mb-2" style={{ fontFamily: 'Teko, sans-serif' }}>LINEUP COMMITTED!</h2>
          <p className="text-white/35 text-sm max-w-md mx-auto mb-6">Your team is locked on Arbitrum. Scores will be calculated after the match ends.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setHasJoined(false); setSelected([]); setCaptainIdx(null); setVcIdx(null); setStep('select'); }}
              className="px-6 py-3 rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/40 text-sm font-semibold hover:bg-white/[0.04] transition">
              Create Another Team
            </button>
            <button onClick={() => router.push('/my-contests')}
              className="px-7 py-3 rounded-lg bg-[#00FF87] text-black font-bold text-lg hover:bg-[#00FF87]/90 transition"
              style={{ fontFamily: 'Teko, sans-serif' }}>
              VIEW MY CONTESTS →
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ──────────────────────── */}
      {!hasJoined && (
        <div className="max-w-[1000px] mx-auto px-5 py-4 relative z-10">

          {/* ── STEP 1: Select Players ────────── */}
          {step === 'select' && (
            <>
              {/* Stats bar */}
              <div className="flex gap-3 mb-4">
                {/* Credit meter */}
                <div className="flex-1 bg-white/[0.015] border border-white/5 rounded-xl p-3 px-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[10px] text-white/25 uppercase tracking-wider">Credits</span>
                    <span className={`text-[13px] font-bold ${credits > 100 ? 'text-red-400' : ''}`}>
                      {credits.toFixed(1)} <span className="text-white/20 font-normal">/ 100</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{
                      width: `${creditPct}%`,
                      background: credits > 100 ? '#ef4444' : credits > 90 ? '#FBBF24' : '#00FF87',
                    }} />
                  </div>
                </div>

                {/* Position counters */}
                <div className="flex gap-1.5">
                  {Object.entries(positions).map(([k, v]) => {
                    const c = posCounts[k] || 0;
                    return (
                      <div key={k} className="w-14 bg-white/[0.015] rounded-lg py-2 text-center" style={{
                        border: `1px solid ${c >= v.max ? v.color + '30' : 'rgba(255,255,255,0.05)'}`,
                      }}>
                        <div className="text-[9px] font-bold tracking-wider mb-0.5" style={{ color: v.color }}>{v.short}</div>
                        <div className="text-base font-bold" style={{ fontFamily: 'Teko, sans-serif', color: c >= v.min ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                          {c}<span className="text-[11px] text-white/15">/{v.max}</span>
                        </div>
                      </div>
                    );
                  })}
                  {teams.map((t, idx) => {
                    const tc = getTeamColor(t, idx);
                    const c = teamCounts[t] || 0;
                    return (
                      <div key={t} className="w-14 rounded-lg py-2 text-center" style={{
                        background: tc.bg, border: `1px solid ${c > 7 ? 'rgba(239,68,68,0.4)' : tc.border}`,
                      }}>
                        <div className="text-[10px] truncate px-1" style={{ color: tc.text }}>{t.slice(0, 5)}</div>
                        <div className="text-base font-bold" style={{ fontFamily: 'Teko, sans-serif', color: c > 7 ? '#ef4444' : '#fff' }}>
                          {c}<span className="text-[11px] text-white/15">/7</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-1.5 mb-3 flex-wrap items-center">
                {[{ k: 'all', l: 'All' }, ...Object.entries(positions).map(([k, v]) => ({ k, l: v.short }))].map(f => (
                  <button key={f.k} onClick={() => setPosFilter(f.k)}
                    className={`px-3 py-[5px] rounded-md text-[11px] font-semibold transition ${
                      posFilter === f.k ? 'bg-[#00FF87]/10 text-[#00FF87]' : 'bg-white/[0.025] text-white/20'
                    }`}>{f.l}</button>
                ))}
                <div className="w-px h-5 bg-white/[0.06] mx-0.5" />
                <button onClick={() => setTeamFilter('all')}
                  className={`px-3 py-[5px] rounded-md text-[11px] font-semibold transition ${teamFilter === 'all' ? 'bg-[#00FF87]/10 text-[#00FF87]' : 'bg-white/[0.025] text-white/20'}`}>
                  Both
                </button>
                {teams.map((t, idx) => {
                  const tc = getTeamColor(t, idx);
                  return (
                    <button key={t} onClick={() => setTeamFilter(t)}
                      className="px-3 py-[5px] rounded-md text-[11px] font-semibold transition"
                      style={{ background: teamFilter === t ? tc.bg : 'rgba(255,255,255,0.025)', color: teamFilter === t ? tc.text : 'rgba(255,255,255,0.2)' }}>
                      {t}
                    </button>
                  );
                })}
                <div className="flex-1" />
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="px-2.5 py-[5px] rounded-md text-[10px] bg-white/[0.03] border border-white/[0.06] text-white/30 outline-none cursor-pointer">
                  <option value="credit">Credits ↓</option>
                  <option value="name">Name A-Z</option>
                  <option value="position">Position</option>
                </select>
              </div>

              {/* Column header */}
              <div className="grid grid-cols-[1fr_64px_80px_64px_44px] gap-2 px-4 py-1.5 text-[9px] text-white/15 uppercase tracking-[1.5px] font-semibold">
                <span>Player</span><span className="text-center">Role</span><span className="text-center">Team</span><span className="text-center">Credits</span><span />
              </div>

              {/* Player rows */}
              <div className="flex flex-col gap-0.5">
                {filtered.map(p => {
                  const sel = isSel(p);
                  const pos = positions[p.position] || { short: '?', color: '#888', min: 0, max: 11 };
                  const tc = getTeamColor(p.team, teams.indexOf(p.team));
                  const disabled = !sel && (selected.length >= 11 || (posCounts[p.position] || 0) >= pos.max || (teamCounts[p.team] || 0) >= 7 || credits + p.credit_value > 100);

                  return (
                    <div key={p.sportmonks_id} onClick={() => !disabled && toggle(p)}
                      className="grid grid-cols-[1fr_64px_80px_64px_44px] gap-2 items-center px-4 py-2.5 rounded-lg transition-all"
                      style={{
                        background: sel ? 'rgba(0,255,135,0.04)' : disabled ? 'rgba(255,255,255,0.005)' : 'rgba(255,255,255,0.012)',
                        border: sel ? '1px solid rgba(0,255,135,0.15)' : '1px solid transparent',
                        opacity: disabled ? 0.35 : 1,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold overflow-hidden"
                          style={{
                            background: sel ? 'rgba(0,255,135,0.12)' : 'rgba(255,255,255,0.04)',
                            color: sel ? '#00FF87' : 'rgba(255,255,255,0.25)',
                            border: sel ? '1px solid rgba(0,255,135,0.2)' : '1px solid rgba(255,255,255,0.04)',
                          }}>
                          {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : p.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <span className={`text-[13px] font-semibold ${sel ? 'text-white' : 'text-white/75'}`}>{p.name}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] px-2 py-[3px] rounded font-bold tracking-wide" style={{ background: pos.color + '15', color: pos.color }}>{pos.short}</span>
                      </div>
                      <div className="flex justify-center items-center gap-1">
                        <span className="text-[11px] font-medium" style={{ color: tc.text }}>{p.team}</span>
                      </div>
                      <div className="text-center text-sm font-bold text-white/60" style={{ fontFamily: 'Teko, sans-serif' }}>{p.credit_value}</div>
                      <div className="flex justify-center">
                        <div className="w-[22px] h-[22px] rounded-[5px] flex items-center justify-center transition-all" style={{
                          background: sel ? '#00FF87' : 'transparent',
                          border: sel ? '2px solid #00FF87' : '2px solid rgba(255,255,255,0.1)',
                        }}>
                          {sel && <span className="text-black text-[13px] font-extrabold">✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sticky CTA */}
              <div className="sticky bottom-0 pt-4 pb-4" style={{ background: 'linear-gradient(to top, #0A0A0B 60%, transparent)' }}>
                {!validation.valid && selected.length > 0 && selected.length < 11 && (
                  <div className="text-center text-xs text-white/30 mb-2.5">{validation.msg}</div>
                )}
                <button disabled={!validation.valid} onClick={() => setStep('captain')}
                  className="w-full py-4 rounded-xl font-bold text-xl tracking-wide transition"
                  style={{
                    fontFamily: 'Teko, sans-serif',
                    background: validation.valid ? '#00FF87' : 'rgba(255,255,255,0.04)',
                    color: validation.valid ? '#000' : 'rgba(255,255,255,0.15)',
                    cursor: validation.valid ? 'pointer' : 'not-allowed',
                  }}>
                  {selected.length < 11 ? `SELECT ${11 - selected.length} MORE PLAYER${11 - selected.length > 1 ? 'S' : ''}` :
                    validation.valid ? 'CHOOSE CAPTAIN & VICE-CAPTAIN →' : (validation.msg || '').toUpperCase()}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: Captain & VC ──────────── */}
          {step === 'captain' && (
            <>
              <div className="bg-white/[0.015] border border-white/5 rounded-xl p-4 mb-4">
                <p className="text-[13px] text-white/40">
                  <span className="text-[#00FF87] font-bold">Captain (C)</span> earns <span className="text-[#00FF87] font-bold">2×</span> points.{' '}
                  <span className="text-yellow-400 font-bold">Vice-Captain (VC)</span> earns <span className="text-yellow-400 font-bold">1.5×</span> points.
                  Choose wisely — this is the biggest decision in your lineup.
                </p>
              </div>

              <div className="flex flex-col gap-[3px]">
                {selected.map((p, idx) => {
                  const pos = positions[p.position] || { short: '?', color: '#888' };
                  const tc = getTeamColor(p.team, teams.indexOf(p.team));
                  const isC = captainIdx === idx, isV = vcIdx === idx;
                  return (
                    <div key={p.sportmonks_id} className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
                      style={{
                        background: isC ? 'rgba(0,255,135,0.04)' : isV ? 'rgba(251,191,36,0.04)' : 'rgba(255,255,255,0.015)',
                        border: isC ? '1px solid rgba(0,255,135,0.15)' : isV ? '1px solid rgba(251,191,36,0.15)' : '1px solid rgba(255,255,255,0.04)',
                      }}>
                      <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-[11px] font-bold text-white/25 overflow-hidden">
                        {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : p.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-white/85">{p.name}</span>
                          <span className="text-[10px] px-1.5 py-[2px] rounded font-bold" style={{ background: pos.color + '15', color: pos.color }}>{pos.short}</span>
                        </div>
                        <span className="text-[10px] text-white/20">{p.team} · {p.credit_value} cr</span>
                      </div>
                      <button onClick={() => { setCaptainIdx(idx); if (vcIdx === idx) setVcIdx(null); }}
                        className="w-11 h-9 rounded-lg font-extrabold text-[13px] transition-all"
                        style={{
                          background: isC ? '#00FF87' : 'rgba(255,255,255,0.03)', color: isC ? '#000' : 'rgba(255,255,255,0.15)',
                          boxShadow: isC ? '0 0 16px rgba(0,255,135,0.2)' : 'none', border: 'none', cursor: 'pointer',
                        }}>
                        {isC ? 'C ✓' : 'C'}
                      </button>
                      <button onClick={() => { setVcIdx(idx); if (captainIdx === idx) setCaptainIdx(null); }}
                        className="w-11 h-9 rounded-lg font-extrabold text-[13px] transition-all"
                        style={{
                          background: isV ? '#FBBF24' : 'rgba(255,255,255,0.03)', color: isV ? '#000' : 'rgba(255,255,255,0.15)',
                          boxShadow: isV ? '0 0 16px rgba(251,191,36,0.2)' : 'none', border: 'none', cursor: 'pointer',
                        }}>
                        {isV ? 'VC ✓' : 'VC'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="sticky bottom-0 pt-4 pb-4 flex gap-2" style={{ background: 'linear-gradient(to top, #0A0A0B 60%, transparent)' }}>
                <button onClick={() => setStep('select')}
                  className="px-6 py-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/30 font-semibold"
                  style={{ fontFamily: 'Teko, sans-serif', fontSize: 16, cursor: 'pointer' }}>
                  ← BACK
                </button>
                <button disabled={captainIdx === null || vcIdx === null} onClick={() => setStep('confirm')}
                  className="flex-1 py-4 rounded-xl font-bold text-xl tracking-wide transition"
                  style={{
                    fontFamily: 'Teko, sans-serif', cursor: captainIdx !== null && vcIdx !== null ? 'pointer' : 'not-allowed',
                    background: captainIdx !== null && vcIdx !== null ? '#00FF87' : 'rgba(255,255,255,0.04)',
                    color: captainIdx !== null && vcIdx !== null ? '#000' : 'rgba(255,255,255,0.15)',
                  }}>
                  {captainIdx === null && vcIdx === null ? 'SELECT CAPTAIN & VICE-CAPTAIN' :
                    captainIdx === null ? 'SELECT CAPTAIN' : vcIdx === null ? 'SELECT VICE-CAPTAIN' : 'REVIEW & CONFIRM →'}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Confirm & Pay ─────────── */}
          {step === 'confirm' && (
            <>
              <div className="rounded-[14px] border border-white/5 bg-white/[0.015] p-5 mb-4">
                <h3 className="text-xl font-semibold mb-3 text-white/70" style={{ fontFamily: 'Teko, sans-serif' }}>YOUR LINEUP</h3>
                {selected.map((p, idx) => {
                  const pos = positions[p.position] || { short: '?', color: '#888' };
                  const isC = captainIdx === idx, isV = vcIdx === idx;
                  return (
                    <div key={p.sportmonks_id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-[3px]"
                      style={{ background: isC ? 'rgba(0,255,135,0.03)' : isV ? 'rgba(251,191,36,0.03)' : 'rgba(255,255,255,0.01)' }}>
                      <span className="text-[10px] text-white/10 w-4 font-mono">{idx + 1}</span>
                      <span className="flex-1 text-[13px] font-medium text-white/70">{p.name}</span>
                      <span className="text-[10px] px-1.5 py-[2px] rounded font-bold" style={{ background: pos.color + '15', color: pos.color }}>{pos.short}</span>
                      <span className="text-[11px] text-white/20 w-9 text-right">{p.credit_value}</span>
                      {isC && <span className="text-[9px] px-2 py-[2px] rounded-full bg-[#00FF87] text-black font-extrabold">C</span>}
                      {isV && <span className="text-[9px] px-2 py-[2px] rounded-full bg-yellow-400 text-black font-extrabold">VC</span>}
                    </div>
                  );
                })}
                <div className="flex justify-between mt-3 pt-3 border-t border-white/[0.04] text-xs">
                  <span className="text-white/25">Total Credits</span>
                  <span className="font-bold">{credits.toFixed(1)} / 100</span>
                </div>
              </div>

              <div className="rounded-[14px] border border-[#00FF87]/[0.12] bg-[#00FF87]/[0.025] p-5 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-white/40 text-xs">Entry Fee</span>
                    <p className="text-[10px] text-white/15 mt-1">USDC transferred to contest contract on Arbitrum</p>
                  </div>
                  <span className="text-[32px] font-bold text-[#00FF87]" style={{ fontFamily: 'Teko, sans-serif' }}>${contest.entry_fee} USDC</span>
                </div>
              </div>

              {txStatus && (
                <div className={`rounded-lg p-3 px-4 mb-4 flex items-center gap-3 ${txStatus.startsWith('Error') ? 'bg-red-500/10 border border-red-500/20' : 'bg-[#00FF87]/[0.04] border border-[#00FF87]/10'}`}>
                  {!txStatus.startsWith('Error') && <div className="w-5 h-5 rounded-full border-2 border-[#00FF87]/20 border-t-[#00FF87] animate-spin" />}
                  <span className={`text-[13px] ${txStatus.startsWith('Error') ? 'text-red-400' : 'text-white/50'}`}>{txStatus}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setStep('captain')}
                  className="px-6 py-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/30 font-semibold cursor-pointer"
                  style={{ fontFamily: 'Teko, sans-serif', fontSize: 16 }}>
                  ← BACK
                </button>
                <button onClick={submitLineup} disabled={txLoading || !authenticated}
                  className="flex-1 py-[18px] rounded-[14px] font-bold text-[22px] tracking-wide transition"
                  style={{
                    fontFamily: 'Teko, sans-serif',
                    background: txLoading ? 'rgba(255,255,255,0.04)' : !authenticated ? 'rgba(255,255,255,0.04)' : '#00FF87',
                    color: txLoading || !authenticated ? 'rgba(255,255,255,0.15)' : '#000',
                    cursor: txLoading ? 'not-allowed' : 'pointer',
                  }}>
                  {txLoading ? 'PROCESSING...' : !authenticated ? 'CONNECT WALLET FIRST' : `PAY $${contest.entry_fee} USDC & JOIN`}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
