"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ReactNode } from "react";

export default function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
      config={{
        loginMethods: ["wallet", "twitter", "email"],
        appearance: {
          theme: "dark",
          accentColor: "#00FF88",
          logo: undefined,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
