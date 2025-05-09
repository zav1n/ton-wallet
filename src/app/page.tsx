"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";
import TonWalletDemo from "./components/TonWalletDemo";
import { TonWebProvider } from "./contexts/TonWebContext";

export default function Home() {
  return (
    <TonConnectUIProvider
      manifestUrl="https://miniapp.tradingbase.ai/tonconnect-manifest.json"
      actionsConfiguration={{
        twaReturnUrl: "https://t.me/@AaronFTestBot",
      }}>
      <TonWebProvider>
        <main className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-24">
          <div className="w-full max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-center mb-8">TON 钱包演示</h1>
            
            <div className="grid grid-cols-1 gap-6">
              <TonWalletDemo />
            </div>
          </div>
        </main>
      </TonWebProvider>
    </TonConnectUIProvider>
  );
}
