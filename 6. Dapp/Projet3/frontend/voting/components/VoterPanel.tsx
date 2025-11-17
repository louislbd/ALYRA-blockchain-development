'use client'
import { useState, useEffect } from 'react';
import {
  getContract,
  addProposal,
  getContractWithSigner
} from '@/lib/contract';
import { useAccount } from 'wagmi';

export default function VoterPanel({ workflowStatus }: { workflowStatus: number }) {
  const { address } = useAccount();
  const [proposals, setProposals] = useState<any[]>([]);
  const [newProposal, setNewProposal] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    async function fetchProposals() {
      try {
        const contract = getContract();
        let count = 0;
        try {
          count = await contract.getProposalsCount();
        } catch {
          count = 10;
        }
        const arr = [];
        for (let i = 0; i < Number(count); i++) {
          try {
            const p = await contract.getOneProposal(i);
            arr.push({ id: i, description: p.description, voteCount: Number(p.voteCount) });
          } catch {}
        }
        setProposals(arr);
      } catch (e) {
        setProposals([]);
      }
    }
    fetchProposals();
  }, [workflowStatus]);

  useEffect(() => {
    async function fetchVoterStatus() {
      if (!address) return;
      try {
        const contract = getContract();
        const voter = await contract.getVoter(address);
        setHasVoted(voter.hasVoted);
      } catch {
        setHasVoted(false);
      }
    }
    fetchVoterStatus();
  }, [address, workflowStatus]);

  async function handleAddProposal() {
    setLoading(true);
    try {
      await addProposal(newProposal);
      setNewProposal('');
      alert('Proposition ajoutée !');
    } catch (e) {
      alert((e as any).message);
    }
    setLoading(false);
  }

  async function handleVote(id: number) {
    setLoading(true);
    try {
      const contract = await getContractWithSigner();
      await contract.setVote(id);
      setHasVoted(true);
      alert('Vote enregistré !');
    } catch (e) {
      alert((e as any).message);
    }
    setLoading(false);
  }

  return (
    <section className="bg-card text-card-foreground rounded-lg p-4 mb-4 border border-border">
      <h2 className="text-xl font-bold mb-2">Panel Électeur</h2>
      <p>Statut actuel : <span className="font-mono">{workflowStatus}</span></p>

      {/* Ajouter une proposition */}
      {workflowStatus === 1 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Proposer une nouvelle idée</h3>
          <input
            className="border px-2 py-1 rounded bg-input mb-2 w-full"
            type="text"
            placeholder="Votre proposition"
            value={newProposal}
            onChange={(e) => setNewProposal(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={handleAddProposal}
            disabled={loading || !newProposal}
            className="mt-2 px-4 py-1 rounded bg-primary text-primary-foreground block"
          >
            {loading ? 'Ajout...' : 'Ajouter la proposition'}
          </button>
        </div>
      )}

      {/* Voter pour une proposition */}
      {workflowStatus === 3 && !hasVoted && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Soutenir une proposition</h3>
          {proposals.length === 0 ? (
            <p className="text-muted-foreground">Aucune proposition enregistrée</p>
          ) : (
            <div className="space-y-2">
              {proposals.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleVote(p.id)}
                  disabled={loading}
                  className="w-full text-left bg-white border p-3 rounded hover:bg-accent/10 focus:ring-2 focus:ring-accent"
                >
                  {p.description} <span className="font-mono ml-2">({p.voteCount} vote{p.voteCount > 1 ? 's' : ''})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {hasVoted && workflowStatus === 3 && (
        <div className="bg-green-50 border-l-4 border-green-400 p-3 mt-4 rounded text-green-800">
          Vous avez déjà voté !
        </div>
      )}
    </section>
  );
}
