'use client'
import { useAccount } from 'wagmi';
import Header from '@/components/Header';
import AdminPanel from '@/components/AdminPanel';
import VoterPanel from '@/components/VoterPanel';
import Results from '@/components/Results';
import { useEffect, useState } from 'react';
import { getContract } from '@/lib/contract';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [workflowStatus, setWorkflowStatus] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    async function fetchStatus() {
      const contract = await getContract();
      const status = await contract.workflowStatus();
      setWorkflowStatus(Number(status));
      const owner = await contract.owner();
      setIsAdmin(owner.toLowerCase() === (address ?? '').toLowerCase());
    }
    if (isConnected) fetchStatus();
  }, [isConnected, address]);

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Système de Vote – Sepolia</h1>
        {!isConnected && (
          <p className="p-8 border border-accent rounded bg-card text-card-foreground text-center">
            Connectez votre wallet pour commencer.
          </p>
        )}
        {isConnected && (
          <>
            {isAdmin && <AdminPanel workflowStatus={workflowStatus} />}
            {!isAdmin && <VoterPanel workflowStatus={workflowStatus} />}
            <Results workflowStatus={workflowStatus} />
          </>
        )}
      </main>
    </div>
  );
}
