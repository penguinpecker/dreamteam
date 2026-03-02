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

export const CONTEST_ABI = [
  { name: 'matchId', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'entryFee', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'maxParticipants', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint32' }] },
  { name: 'participantCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint32' }] },
  { name: 'commitDeadline', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'revealDeadline', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'state', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'prizePool', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'commitments', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'bytes32' }] },
  { name: 'results', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: 'totalPoints', type: 'int256' }, { name: 'rank', type: 'uint32' }, { name: 'reward', type: 'uint256' }, { name: 'claimed', type: 'bool' }] },
  { name: 'commitLineup', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'commitment', type: 'bytes32' }], outputs: [] },
  { name: 'revealLineup', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'playerIds', type: 'uint256[11]' }, { name: 'captainIndex', type: 'uint8' }, { name: 'viceCaptainIndex', type: 'uint8' }, { name: 'salt', type: 'bytes32' }], outputs: [] },
  { name: 'claimReward', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'claimRefund', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { name: 'emergencyWithdraw', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] },
] as const;

export const CONTEST_FACTORY_ABI = [
  { name: 'isContest', type: 'function', stateMutability: 'view', inputs: [{ name: 'addr', type: 'address' }], outputs: [{ type: 'bool' }] },
  { name: 'protocolFeeBps', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'createContest', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'matchId', type: 'uint256' }, { name: 'entryFee', type: 'uint256' }, { name: 'maxParticipants', type: 'uint32' }, { name: 'commitDeadline', type: 'uint256' }, { name: 'revealDeadline', type: 'uint256' }, { name: 'prizeRankStart', type: 'uint32[]' }, { name: 'prizeRankEnd', type: 'uint32[]' }, { name: 'prizeBps', type: 'uint256[]' }], outputs: [{ type: 'address' }] },
] as const;

export const SCORING_REGISTRY_ABI = [
  { name: 'getScores', type: 'function', stateMutability: 'view', inputs: [{ name: 'matchId', type: 'uint256' }, { name: 'playerIds', type: 'uint256[]' }], outputs: [{ type: 'int32[]' }] },
  { name: 'matchFinalized', type: 'function', stateMutability: 'view', inputs: [{ name: 'matchId', type: 'uint256' }], outputs: [{ type: 'bool' }] },
] as const;

export enum ContestState { OPEN = 0, COMMIT_CLOSED = 1, REVEAL_CLOSED = 2, SETTLED = 3, CANCELLED = 4 }

export const STATE_LABELS: Record<number, string> = { 0: 'Open', 1: 'Lineups Locked', 2: 'In Progress', 3: 'Settled', 4: 'Cancelled' };
export const STATE_COLORS: Record<number, string> = { 0: '#00FF87', 1: '#FBBF24', 2: '#3B82F6', 3: '#8B5CF6', 4: '#EF4444' };
