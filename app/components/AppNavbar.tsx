'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/contests', label: 'Contests' },
  { href: '/my-contests', label: 'My Contests' },
  { href: '/wallet', label: 'Wallet' },
];

export default function AppNavbar() {
  const pathname = usePathname();
  const { authenticated, user, login, logout } = usePrivy();

  const shortAddr = user?.wallet?.address
    ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
    : '';

  return (
    <nav className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl"
      style={{ background: 'rgba(10,10,11,0.85)' }}>
      <div className="max-w-[1200px] mx-auto px-5 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-[22px] font-bold tracking-tight" style={{ fontFamily: 'Teko, sans-serif', color: '#00FF87' }}>
            DREAMTEAM
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`px-3 py-1.5 rounded-md text-[13px] font-semibold transition-all ${
                  active
                    ? 'text-[#00FF87] bg-[#00FF87]/[0.08]'
                    : 'text-white/30 hover:text-white/60'
                }`}
                style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Wallet */}
        {authenticated ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <div className="w-2 h-2 rounded-full bg-[#00FF87]" />
              <span className="text-[12px] text-white/50 font-mono">{shortAddr}</span>
            </div>
            <button onClick={logout}
              className="text-[11px] text-white/20 hover:text-white/40 transition px-2">
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={login}
            className="px-4 py-1.5 rounded-lg bg-[#00FF87] text-black text-[13px] font-bold hover:bg-[#00FF87]/90 transition"
            style={{ fontFamily: 'Teko, sans-serif' }}>
            CONNECT WALLET
          </button>
        )}
      </div>
    </nav>
  );
}
