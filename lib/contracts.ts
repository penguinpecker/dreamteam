// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DreamTeam — Contract Config (Arbitrum One)
//  Deployed: March 2, 2026
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CHAIN_ID = 42161;

export const ADDRESSES = {
  SCORING_REGISTRY: '0x03D0ef8D6F2F743e1A88AF0D28114a00d31a3EC9' as `0x${string}`,
  CONTEST_FACTORY: '0x65950BdD72e2D0feaf884bE3B735364EE10946D9' as `0x${string}`,
  CONTEST_IMPLEMENTATION: '0xe0bF1B83BB6f7B2282F84e21882f7EfF001d8E49' as `0x${string}`,
  USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
} as const;

export const USDC_ABI = [
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
] as const;

// ── Contest ABI (matches Contest.sol) ──────────────
export const CONTEST_ABI = [
  // View functions
  { name: 'matchId', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'matchFormat', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'entryFee', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'maxParticipants', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'participantCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'commitDeadline', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'revealDeadline', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'state', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'currentState', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'totalDeposited', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'distributablePool', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'commitments', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'bytes32' }] },
  { name: 'isSettled', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  { name: 'getUserResult', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: 'totalPoints', type: 'int32' }, { name: 'rank', type: 'uint32' }, { name: 'rewardAmount', type: 'uint256' }, { name: 'claimed', type: 'bool' }] },
  { name: 'getUserLineup', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: 'playerIds', type: 'uint256[11]' }, { name: 'captainId', type: 'uint256' }, { name: 'viceCaptainId', type: 'uint256' }, { name: 'revealed', type: 'bool' }] },
  { name: 'computeUserTotal', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'int32' }] },
  // User actions
  { name: 'commitLineup', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'lineupHash', type: 'bytes32' }], outputs: [] },
  { name: 'revealLineup', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'playerIds', type: 'uint256[11]' }, { name: 'captainId', type: 'uint256' }, { name: 'viceCaptainId', type: 'uint256' }, { name: 'salt', type: 'bytes32' }], outputs: [] },
  { name: 'claimReward', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'claimRefund', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'emergencyWithdrawUser', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  // Settlement
  { name: 'settle', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
] as const;

// ── ContestFactory ABI (matches ContestFactory.sol — UUPS proxy) ──────
export const CONTEST_FACTORY_ABI = [
  { name: 'owner', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'isContest', type: 'function', stateMutability: 'view', inputs: [{ name: 'addr', type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'protocolFeeBps', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint16' }] },
  { name: 'contestImplementation', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'usdc', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'scoringRegistry', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'contestCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  {
    name: 'createContest',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'matchId', type: 'uint256' },
      { name: 'matchFormat', type: 'uint8' },
      { name: 'entryFee', type: 'uint256' },
      { name: 'maxParticipants', type: 'uint256' },
      { name: 'commitDeadline', type: 'uint256' },
      { name: 'revealDeadline', type: 'uint256' },
      {
        name: '_prizeTiers',
        type: 'tuple[]',
        components: [
          { name: 'rankFrom', type: 'uint32' },
          { name: 'rankTo', type: 'uint32' },
          { name: 'payoutBps', type: 'uint16' },
        ],
      },
    ],
    outputs: [{ type: 'address' }],
  },
  { name: 'cancelContest', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'contestAddress', type: 'address' }], outputs: [] },
  { name: 'getMatchContests', type: 'function', stateMutability: 'view', inputs: [{ name: 'matchId', type: 'uint256' }], outputs: [{ type: 'address[]' }] },
  {
    name: 'ContestCreated',
    type: 'event',
    inputs: [
      { name: 'contestAddress', type: 'address', indexed: true },
      { name: 'matchId', type: 'uint256', indexed: true },
      { name: 'matchFormat', type: 'uint8', indexed: false },
      { name: 'entryFee', type: 'uint256', indexed: false },
      { name: 'maxParticipants', type: 'uint256', indexed: false },
      { name: 'commitDeadline', type: 'uint256', indexed: false },
      { name: 'revealDeadline', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const SCORING_REGISTRY_ABI = [
  { name: 'getScore', type: 'function', stateMutability: 'view', inputs: [{ name: 'matchId', type: 'uint256' }, { name: 'playerId', type: 'uint256' }], outputs: [{ type: 'int16' }] },
  { name: 'getScores', type: 'function', stateMutability: 'view', inputs: [{ name: 'matchId', type: 'uint256' }, { name: 'playerIds', type: 'uint256[]' }], outputs: [{ type: 'int16[]' }] },
  { name: 'matchSubmitted', type: 'function', stateMutability: 'view', inputs: [{ name: 'matchId', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'isMatchFinalized', type: 'function', stateMutability: 'view', inputs: [{ name: 'matchId', type: 'uint256' }], outputs: [{ type: 'bool' }] },
] as const;

// ── MatchFormat enum (must match Contest.sol) ──────
export enum MatchFormat {
  T20 = 0,
  IPL = 1,
  ODI = 2,
  TEST = 3,
  T10 = 4,
  THE_HUNDRED = 5,
  FOOTBALL = 6,
}

// Map DB sport/format string to on-chain enum
export function getMatchFormat(sport: string, format?: string): number {
  if (sport === 'football') return MatchFormat.FOOTBALL;
  if (!format) return MatchFormat.T20;
  const f = format.toLowerCase();
  if (f.includes('ipl')) return MatchFormat.IPL;
  if (f.includes('odi')) return MatchFormat.ODI;
  if (f.includes('test')) return MatchFormat.TEST;
  if (f.includes('t10')) return MatchFormat.T10;
  if (f.includes('hundred')) return MatchFormat.THE_HUNDRED;
  return MatchFormat.T20;
}

export enum ContestState {
  UNINITIALIZED = 0,
  OPEN = 1,
  COMMIT_CLOSED = 2,
  REVEAL_CLOSED = 3,
  SETTLED = 4,
  CANCELLED = 5,
}

export const STATE_LABELS: Record<number, string> = {
  0: 'Not Ready', 1: 'Open', 2: 'Lineups Locked', 3: 'In Progress', 4: 'Settled', 5: 'Cancelled',
};
export const STATE_COLORS: Record<number, string> = {
  0: '#888', 1: '#00FF87', 2: '#FBBF24', 3: '#3B82F6', 4: '#8B5CF6', 5: '#EF4444',
};
