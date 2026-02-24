import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DreamTeam | Fantasy Cricket & Football",
  description:
    "Build your ultimate squad from Premier League and IPL rosters. Compete in real-time. Climb the leaderboard. Earn rewards.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
