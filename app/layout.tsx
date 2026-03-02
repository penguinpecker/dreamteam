import type { Metadata } from "next";
import "./globals.css";
import Web3Provider from "./components/Web3Provider";
import AppNavbar from "./components/AppNavbar";

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
      <body>
        <Web3Provider>
          <AppNavbar />
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
