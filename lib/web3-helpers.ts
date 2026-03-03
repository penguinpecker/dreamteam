import { encodePacked, keccak256, parseUnits, formatUnits } from 'viem';

// ── Lineup Commitment (must match Contest.sol) ───
// On-chain: keccak256(abi.encodePacked(playerIds[0..10], captainId, viceCaptainId, salt))
export function computeLineupHash(
  playerIds: bigint[], captainId: bigint, viceCaptainId: bigint, salt: `0x${string}`
): `0x${string}` {
  if (playerIds.length !== 11) throw new Error('Must have exactly 11 players');
  return keccak256(encodePacked(
    ['uint256','uint256','uint256','uint256','uint256','uint256','uint256','uint256','uint256','uint256','uint256','uint256','uint256','bytes32'],
    [...playerIds, captainId, viceCaptainId, salt] as any
  ));
}

export function generateSalt(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
}

// ── USDC ─────────────────────────────────────────
export const formatUSDC = (amount: bigint) => formatUnits(amount, 6);
export const parseUSDC = (amount: string) => parseUnits(amount, 6);

// ── Time ─────────────────────────────────────────
export function formatCountdown(deadline: number): string {
  const diff = deadline - Math.floor(Date.now() / 1000);
  if (diff <= 0) return 'Closed';
  const d = Math.floor(diff / 86400), h = Math.floor((diff % 86400) / 3600), m = Math.floor((diff % 3600) / 60), s = diff % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatMatchDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Positions ────────────────────────────────────
export const CRICKET_POSITIONS: Record<string, { short: string; color: string; min: number; max: number }> = {
  BAT:  { short: 'BAT',  color: '#FF6B6B', min: 1, max: 6 },
  BOWL: { short: 'BOWL', color: '#4ECDC4', min: 1, max: 6 },
  AR:   { short: 'AR',   color: '#45B7D1', min: 1, max: 4 },
  WK:   { short: 'WK',   color: '#F7DC6F', min: 1, max: 2 },
};

export const FOOTBALL_POSITIONS: Record<string, { short: string; color: string; min: number; max: number }> = {
  GK:  { short: 'GK',  color: '#F7DC6F', min: 1, max: 1 },
  DEF: { short: 'DEF', color: '#4ECDC4', min: 3, max: 5 },
  MID: { short: 'MID', color: '#45B7D1', min: 2, max: 5 },
  FWD: { short: 'FWD', color: '#FF6B6B', min: 1, max: 3 },
};

// ── Validation ───────────────────────────────────
export function validateTeam(
  players: { position: string; team: string; credit_value: number }[],
  sport: 'cricket' | 'football'
): { valid: boolean; msg?: string } {
  const positions = sport === 'cricket' ? CRICKET_POSITIONS : FOOTBALL_POSITIONS;
  if (players.length !== 11) return { valid: false, msg: `Select ${11 - players.length} more player${11 - players.length > 1 ? 's' : ''}` };

  const posCounts: Record<string, number> = {};
  players.forEach(p => { posCounts[p.position] = (posCounts[p.position] || 0) + 1; });
  for (const [pos, cfg] of Object.entries(positions)) {
    if ((posCounts[pos] || 0) < cfg.min) return { valid: false, msg: `Need at least ${cfg.min} ${cfg.short}` };
    if ((posCounts[pos] || 0) > cfg.max) return { valid: false, msg: `Max ${cfg.max} ${cfg.short}` };
  }

  const teamCounts: Record<string, number> = {};
  players.forEach(p => { teamCounts[p.team] = (teamCounts[p.team] || 0) + 1; });
  for (const [team, count] of Object.entries(teamCounts)) {
    if (count > 7) return { valid: false, msg: `Max 7 from ${team}` };
  }

  const credits = players.reduce((s, p) => s + p.credit_value, 0);
  if (credits > 100) return { valid: false, msg: `Over budget: ${credits.toFixed(1)}/100` };

  return { valid: true };
}
