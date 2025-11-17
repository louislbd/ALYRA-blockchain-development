'use client'
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header() {
  return (
    <header className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <span className="text-2xl font-bold tracking-wider">Voting DApp</span>
        <ConnectButton />
      </div>
    </header>
  );
}
