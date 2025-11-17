'use client'
import { useState } from 'react';
import {
  getContractWithSigner,
  addVoter,
  startProposalsRegistering,
  endProposalsRegistering,
  startVotingSession,
  endVotingSession,
  tallyVotes
} from '@/lib/contract';
import { useAccount } from 'wagmi';

const statusLabels = [
  "Enregistrement électeurs",
  "Session propositions",
  "Session propositions terminée",
  "Session de vote",
  "Session de vote terminée",
  "Votes comptabilisés"
];

export default function AdminPanel({ workflowStatus }: { workflowStatus: number }) {
  const { address } = useAccount();
  const [voterAddress, setVoterAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Ajout d’un électeur
  async function handleAddVoter() {
    setLoading(true);
    try {
      await addVoter(voterAddress);
      alert('Voter enregistré !');
      setVoterAddress('');
    } catch (e) {
      alert((e as any).message);
    }
    setLoading(false);
  }

  // Actions “workflow status”
  async function handleStatusAction(actionFn: () => Promise<void>, label: string) {
    setLoading(true);
    try {
      await actionFn();
      alert(`Action "${label}" réussie !`);
    } catch (error) {
      alert((error as any).message || error);
    }
    setLoading(false);
  }

  return (
    <section className="bg-card text-card-foreground rounded-lg p-4 mb-4 border border-border">
      <h2 className="text-xl font-bold mb-2">Panel Administrateur</h2>
      <p className="mb-4">Statut : <span className="font-mono">{statusLabels[workflowStatus]}</span></p>

      {/* Ajouter électeur */}
      {workflowStatus === 0 && (
        <div className="mb-4">
          <input
            className="border px-2 py-1 rounded bg-input mb-2"
            type="text"
            placeholder="Adresse voter"
            value={voterAddress}
            onChange={e => setVoterAddress(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={handleAddVoter}
            disabled={loading || !voterAddress}
            className="ml-2 px-4 py-1 rounded bg-primary text-primary-foreground"
          >
            {loading ? "Ajout..." : "Ajouter"}
          </button>
        </div>
      )}

      {/* Changer d’état selon le workflow */}
      <div className="space-y-2">
        {workflowStatus === 0 && (
          <button
            className="w-full py-2 rounded bg-accent text-accent-foreground"
            disabled={loading}
            onClick={() => handleStatusAction(startProposalsRegistering, "Démarrer session propositions")}
          >
            Démarrer la session d’enregistrement des propositions
          </button>
        )}
        {workflowStatus === 1 && (
          <button
            className="w-full py-2 rounded bg-accent text-accent-foreground"
            disabled={loading}
            onClick={() => handleStatusAction(endProposalsRegistering, "Fin session propositions")}
          >
            Terminer l’enregistrement des propositions
          </button>
        )}
        {workflowStatus === 2 && (
          <button
            className="w-full py-2 rounded bg-accent text-accent-foreground"
            disabled={loading}
            onClick={() => handleStatusAction(startVotingSession, "Démarrer session de vote")}
          >
            Démarrer la session de vote
          </button>
        )}
        {workflowStatus === 3 && (
          <button
            className="w-full py-2 rounded bg-accent text-accent-foreground"
            disabled={loading}
            onClick={() => handleStatusAction(endVotingSession, "Fin session de vote")}
          >
            Terminer la session de vote
          </button>
        )}
        {workflowStatus === 4 && (
          <button
            className="w-full py-2 rounded bg-accent text-accent-foreground"
            disabled={loading}
            onClick={() => handleStatusAction(tallyVotes, "Comptabiliser les votes")}
          >
            Comptabiliser les votes
          </button>
        )}
      </div>
    </section>
  );
}
