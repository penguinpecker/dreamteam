'use client';

import AppNavbar from '@/app/components/AppNavbar';

export default function NavbarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNavbar />
      {children}
    </>
  );
}
