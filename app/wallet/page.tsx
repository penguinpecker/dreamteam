'use client';

import { useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, http } from 'viem';
import { arbitrum } from 'viem/chains';
import { ADDRESSES, USDC_ABI } from '@/lib/contracts';
import { formatUSDC } from '@/lib/web3-helpers';
import { supabase } from '@/lib/supabase';

export default function WalletPage() {
  const { authenticated, user, login } = usePrivy();
  const [usdcBalance, setUsdcBalance] = useState<string>('...');
  const [ethBalance, setEthBalance] = useState<string>('...');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.wallet?.address) { loadBalances(); loadHistory(); }
    else setLoading(false);
  }, [user?.wallet?.address]);

  async function loadBalances() {
    try {
      const pc = createPublicClient({ chain: arbitrum, transport: http() });
      const addr = user!.wallet!.address as `0x${string}`;
      const [usdc, eth] = await Promise.all([
        pc.readContract({ address: ADDRESSES.USDC, abi: USDC_ABI, functionName: 'balanceOf', args: [addr] }),
        pc.getBalance({ address: addr }),
      ]);
      setUsdcBalance(formatUSDC(usdc as bigint));
      setEthBalance((Number(eth) / 1e18).toFixed(6));
    } catch (err) { console.error(err); }
  }

  async function loadHistory() {
    try {
      const { data } = await supabase
        .from('user_contests')
        .select('id, created_at, claimed, reward, contest:contests(entry_fee, tier, match:matches(team_home, team_away, sport))')
        .eq('user_address', user?.wallet?.address?.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(20);
      setHistory(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">💰</div>
          <p className="text-white/30 mb-4">Connect your wallet to manage funds</p>
          <button onClick={login} className="px-6 py-3 bg-[#00FF87] text-black rounded-xl font-bold text-lg" style={{ fontFamily: 'Teko, sans-serif' }}>
            CONNECT WALLET
          </button>
        </div>
      </div>
    );
  }

  const addr = user?.wallet?.address || '';

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
      <div className="fixed inset-0 pointer-events-none z-50 opacity-40" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }} />

      <div className="max-w-[800px] mx-auto px-5 py-8 relative z-10">
        <h1 className="text-5xl font-bold tracking-tight" style={{ fontFamily: 'Teko, sans-serif' }}>WALLET</h1>
        <p className="text-white/30 text-sm mt-1 mb-8">Manage your USDC on Arbitrum</p>

        {/* Address */}
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-5 mb-4">
          <div className="text-[10px] text-white/20 uppercase tracking-wider mb-1">Connected Address</div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00FF87]" />
            <span className="font-mono text-[14px] text-white/60">{addr}</span>
            <button onClick={() => navigator.clipboard.writeText(addr)}
              className="text-[10px] text-white/15 hover:text-white/40 transition ml-auto">Copy</button>
          </div>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border border-[#00FF87]/[0.12] bg-[#00FF87]/[0.025] p-5">
            <div className="text-[10px] text-white/20 uppercase tracking-wider mb-2">USDC Balance</div>
            <div className="text-4xl font-bold text-[#00FF87]" style={{ fontFamily: 'Teko, sans-serif' }}>
              ${Number(usdcBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-white/15 mt-1">Arbitrum One · USDC</div>
          </div>
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-5">
            <div className="text-[10px] text-white/20 uppercase tracking-wider mb-2">ETH (Gas)</div>
            <div className="text-4xl font-bold text-white/60" style={{ fontFamily: 'Teko, sans-serif' }}>
              {Number(ethBalance).toFixed(4)}
            </div>
            <div className="text-[10px] text-white/15 mt-1">For transaction fees</div>
          </div>
        </div>

        {/* How to fund */}
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3 text-white/50" style={{ fontFamily: 'Teko, sans-serif' }}>HOW TO ADD USDC</h2>
          <div className="space-y-3 text-[13px] text-white/35">
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-[#00FF87]/10 text-[#00FF87] text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
              <p>Bridge USDC to Arbitrum via the <a href="https://bridge.arbitrum.io" target="_blank" rel="noopener" className="text-[#00FF87]/60 underline">Arbitrum Bridge</a> or buy directly on an exchange that supports Arbitrum withdrawals.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-[#00FF87]/10 text-[#00FF87] text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
              <p>Send USDC (native, not USDC.e) to your connected wallet address above.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-[#00FF87]/10 text-[#00FF87] text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
              <p>Keep a small amount of ETH on Arbitrum for gas fees (usually &lt; $0.01 per tx).</p>
            </div>
          </div>
        </div>

        {/* Contest History */}
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.04]">
            <h2 className="text-lg font-semibold text-white/50" style={{ fontFamily: 'Teko, sans-serif' }}>CONTEST HISTORY</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#00FF87]/30 border-t-[#00FF87] rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-white/15 text-sm">No contest entries yet</div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {history.map(h => {
                const match = h.contest?.match;
                const isWin = h.reward && h.reward > 0 && h.claimed;
                return (
                  <div key={h.id} className="px-5 py-3 flex items-center gap-3">
                    <span className="text-sm">{match?.sport === 'cricket' ? '🏏' : '⚽'}</span>
                    <div className="flex-1">
                      <div className="text-[13px] text-white/60">{match?.team_home} vs {match?.team_away}</div>
                      <div className="text-[10px] text-white/15">{new Date(h.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] text-red-400/60">-${h.contest?.entry_fee}</div>
                      {isWin && <div className="text-[12px] text-[#00FF87] font-bold">+${h.reward}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-center mt-4">
          <a href={`https://arbiscan.io/address/${addr}`} target="_blank" rel="noopener"
            className="text-[11px] text-white/15 hover:text-white/30 transition underline">
            View on Arbiscan ↗
          </a>
        </div>
      </div>
    </div>
  );
}
