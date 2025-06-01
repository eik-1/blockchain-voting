"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import React from "react";

const config = getDefaultConfig({
  appName: "Blockchain Voting",
  projectId: "aedb10bf2cd98950f949b0d4769228cb",
  chains: [sepolia],
  ssr: true,
  //   transports: {
  //     [sepolia.id]: http("https://eth-sepolia.g.alchemy.com/v2/..."),
  //   },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
