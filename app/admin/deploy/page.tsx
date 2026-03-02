'use client';

import { useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom, http, parseUnits, decodeEventLog } from 'viem';
import { arbitrum } from 'viem/chains';
import { supabase } from '@/lib/supabase';
import { ADDRESSES, CONTEST_FACTORY_ABI } from '@/lib/contracts';

// ── Prize Structures by Tier ─────────────────────
const PRIZE_STRUCTURES: Record<string, { rankStart: number[]; rankEnd: number[]; bps: number[] }> = {
  beginner:     { rankStart: [1, 2, 3],          rankEnd: [1, 2, 3],          bps: [5000, 3000, 2000] },
  standard:     { rankStart: [1, 2, 3, 4, 6],    rankEnd: [1, 2, 3, 5, 10],   bps: [2500, 1500, 1000, 500, 300] },
  pro:          { rankStart: [1, 2, 3],          rankEnd: [1, 2, 3],          bps: [5000, 3000, 2000] },
  head_to_head: { rankStart: [1],               rankEnd: [1],               bps: [10000] },
};

interface ContestRow {
  id: string; tier: string; entry_fee: string; max_participants: number;
  commit_deadline: string; reveal_deadline: string; contract_address: string;
  match: { sportmonks_id: number; team_home: string; team_away: string; starts_at: string; sport: string };
}

// Only allow your wallet
const ADMIN_ADDRESS = '0x31fc857d467aeec23d31ef7c89b0054eec49f711';

export default function AdminDeployPage() {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [contests, setContests] = useState<ContestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [batchMode, setBatchMode] = useState(false);

  const isAdmin = user?.wallet?.address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  useEffect(() => { loadContests(); }, []);

  async function loadContests() {
    const { data } = await supabase
      .from('contests')
      .select('*, match:matches(sportmonks_id, team_home, team_away, starts_at, sport)')
      .order('commit_deadline', { ascending: true });
    setContests(data || []);
    setLoading(false);
  }

  async function deployContest(contest: ContestRow) {
    if (!isAdmin) return;
    const wallet = wallets[0];
    if (!wallet) return;

    setDeploying(contest.id);
    setStatus(`Deploying ${contest.tier} for ${contest.match.team_home} vs ${contest.match.team_away}...`);

    try {
      const provider = await wallet.getEthereumProvider();
      const wc = createWalletClient({ chain: arbitrum, transport: custom(provider) });
      const pc = createPublicClient({ chain: arbitrum, transport: http() });
      const addr = user!.wallet!.address as `0x${string}`;

      const prize = PRIZE_STRUCTURES[contest.tier] || PRIZE_STRUCTURES.beginner;
      const entryFeeUsdc = parseUnits(String(contest.entry_fee), 6);
      const commitDeadline = BigInt(Math.floor(new Date(contest.commit_deadline).getTime() / 1000));
      const revealDeadline = BigInt(Math.floor(new Date(contest.reveal_deadline).getTime() / 1000));

      setStatus('Sending createContest tx...');
      const txHash = await wc.writeContract({
        address: ADDRESSES.CONTEST_FACTORY,
        abi: CONTEST_FACTORY_ABI,
        functionName: 'createContest',
        args: [
          BigInt(contest.match.sportmonks_id),
          entryFeeUsdc,
          contest.max_participants,
          commitDeadline,
          revealDeadline,
          prize.rankStart,
          prize.rankEnd,
          prize.bps.map(b => BigInt(b)),
        ],
        account: addr,
      });

      setStatus(`Tx sent: ${txHash.slice(0, 16)}... waiting for confirmation...`);
      const receipt = await pc.waitForTransactionReceipt({ hash: txHash });

      // Extract deployed contest address from logs
      // ContestFactory emits ContestCreated(address indexed contest, uint256 matchId)
      let contestAddr = '';
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: [{ name: 'ContestCreated', type: 'event', inputs: [{ name: 'contest', type: 'address', indexed: true }, { name: 'matchId', type: 'uint256', indexed: false }] }],
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === 'ContestCreated') {
            contestAddr = (decoded.args as any).contest;
            break;
          }
        } catch { /* not this event */ }
      }

      // Fallback: try reading from return value or last created
      if (!contestAddr) {
        // If no event found, use the first contract creation in the receipt
        // The clone address can be computed, but event is more reliable
        setStatus('Warning: Could not extract address from event. Check tx on Arbiscan.');
        setDeploying(null);
        return;
      }

      setStatus(`Deployed at ${contestAddr}! Updating DB...`);

      // Update Supabase
      await supabase
        .from('contests')
        .update({ contract_address: contestAddr })
        .eq('id', contest.id);

      setStatus(`✅ ${contest.tier} deployed: ${contestAddr}`);
      await loadContests();
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message?.slice(0, 150)}`);
    } finally {
      setDeploying(null);
    }
  }

  async function deployBatch(matchContests: ContestRow[]) {
    for (const c of matchContests) {
      if (c.contract_address !== 'pending') continue;
      await deployContest(c);
      // Small delay between txs
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Group contests by match
  const grouped = new Map<string, { match: ContestRow['match']; contests: ContestRow[] }>();
  for (const c of contests) {
    const key = `${c.match.team_home}-${c.match.team_away}`;
    if (!grouped.has(key)) grouped.set(key, { match: c.match, contests: [] });
    grouped.get(key)!.contests.push(c);
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00FF87]/30 border-t-[#00FF87] rounded-full animate-spin" />
    </div>
  );

  if (!authenticated || !isAdmin) return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-white/40">
      <p>Connect admin wallet ({ADMIN_ADDRESS.slice(0, 8)}...) to access this page.</p>
    </div>
  );

  const pending = contests.filter(c => c.contract_address === 'pending').length;
  const deployed = contests.filter(c => c.contract_address !== 'pending').length;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-8" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
      <div className="max-w-[900px] mx-auto">
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Teko, sans-serif' }}>ADMIN — CONTRACT DEPLOYMENT</h1>
        <p className="text-white/30 text-sm mb-6">
          Deploy Contest contracts on Arbitrum via ContestFactory. Each deploy costs ~0.0003 ETH gas.
        </p>

        {/* Stats */}
        <div className="flex gap-4 mb-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-xl px-5 py-3">
            <span className="text-[10px] text-white/20 uppercase tracking-wider">Total</span>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Teko, sans-serif' }}>{contests.length}</p>
          </div>
          <div className="bg-[#00FF87]/[0.04] border border-[#00FF87]/10 rounded-xl px-5 py-3">
            <span className="text-[10px] text-[#00FF87]/40 uppercase tracking-wider">Deployed</span>
            <p className="text-2xl font-bold text-[#00FF87]" style={{ fontFamily: 'Teko, sans-serif' }}>{deployed}</p>
          </div>
          <div className="bg-yellow-500/[0.04] border border-yellow-500/10 rounded-xl px-5 py-3">
            <span className="text-[10px] text-yellow-400/40 uppercase tracking-wider">Pending</span>
            <p className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Teko, sans-serif' }}>{pending}</p>
          </div>
        </div>

        {/* Status bar */}
        {status && (
          <div className={`rounded-lg p-3 px-4 mb-4 text-[13px] ${status.startsWith('❌') ? 'bg-red-500/10 text-red-400' : status.startsWith('✅') ? 'bg-[#00FF87]/10 text-[#00FF87]' : 'bg-white/[0.03] text-white/50'}`}>
            {deploying && <span className="inline-block w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2 align-middle" />}
            {status}
          </div>
        )}

        {/* Match groups */}
        <div className="space-y-4">
          {Array.from(grouped.values()).map(({ match, contests: mc }) => {
            const allDeployed = mc.every(c => c.contract_address !== 'pending');
            const pendingCount = mc.filter(c => c.contract_address === 'pending').length;

            return (
              <div key={`${match.team_home}-${match.team_away}`} className="rounded-xl border border-white/5 overflow-hidden">
                {/* Match header */}
                <div className="px-5 py-3 bg-white/[0.02] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-white/20 mr-2">{match.sport === 'cricket' ? '🏏' : '⚽'}</span>
                    <span className="font-bold" style={{ fontFamily: 'Teko, sans-serif' }}>
                      {match.team_home} vs {match.team_away}
                    </span>
                    <span className="text-xs text-white/15 ml-3">{new Date(match.starts_at).toLocaleString()}</span>
                  </div>
                  {pendingCount > 0 ? (
                    <button
                      onClick={() => deployBatch(mc)}
                      disabled={!!deploying}
                      className="text-xs px-3 py-1.5 rounded-lg bg-[#00FF87] text-black font-bold hover:bg-[#00FF87]/90 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Deploy All ({pendingCount})
                    </button>
                  ) : (
                    <span className="text-xs text-[#00FF87]/50">✓ All deployed</span>
                  )}
                </div>

                {/* Contest rows */}
                <div className="divide-y divide-white/[0.03]">
                  {mc.map(c => {
                    const isDeployed = c.contract_address !== 'pending';
                    const isDeployingThis = deploying === c.id;

                    return (
                      <div key={c.id} className="px-5 py-2.5 flex items-center gap-4 text-sm">
                        <span className="w-20 text-xs font-bold text-white/40 uppercase">{c.tier}</span>
                        <span className="w-16 text-white/60">${c.entry_fee}</span>
                        <span className="w-12 text-white/30 text-xs">{c.max_participants}p</span>
                        <div className="flex-1 font-mono text-[11px]">
                          {isDeployed ? (
                            <a href={`https://arbiscan.io/address/${c.contract_address}`} target="_blank" rel="noopener"
                              className="text-[#00FF87]/60 hover:text-[#00FF87]">
                              {c.contract_address.slice(0, 10)}...{c.contract_address.slice(-8)}
                            </a>
                          ) : (
                            <span className="text-yellow-400/40">pending</span>
                          )}
                        </div>
                        {!isDeployed && (
                          <button
                            onClick={() => deployContest(c)}
                            disabled={!!deploying}
                            className="text-[11px] px-3 py-1 rounded-md bg-white/[0.04] text-white/30 hover:bg-[#00FF87]/10 hover:text-[#00FF87] disabled:opacity-20 disabled:cursor-not-allowed"
                          >
                            {isDeployingThis ? '...' : 'Deploy'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
