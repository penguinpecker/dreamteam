import type { Metadata } from "next";
import "./globals.css";
import Web3Provider from "./components/Web3Provider";

export const metadata: Metadata = {
  title: "DreamTeam | Fantasy Cricket & Football",
  description:
    "Build your ultimate squad from Premier League and IPL rosters. Compete in real-time. Climb the leaderboard. Earn rewards.",
  openGraph: {
    title: "DreamTeam | Fantasy Cricket & Football",
    description:
      "Build your ultimate squad from Premier League and IPL rosters. Compete in real-time. Climb the leaderboard. Earn rewards.",
    url: "https://mydreamteam.xyz",
    siteName: "DreamTeam",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@dreamteam_xyz",
    creator: "@dreamteam_xyz",
    title: "DreamTeam | Fantasy Cricket & Football",
    description:
      "Build your ultimate squad from Premier League and IPL rosters. Compete in real-time. Climb the leaderboard. Earn rewards.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
