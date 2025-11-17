'use client'
import { useEffect, useState } from 'react';
import { getContract } from '@/lib/contract';

export default function Results({ workflowStatus }: { workflowStatus: number }) {
  const [proposals, setProposals] = useState<any[]>([]);
  const [winningId, setWinningId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const contract = await getContract();
        // Récupère le nombre de propositions
        let count = 0;
        try {
          count = await contract.getProposalsCount();
        } catch {
          // si pas de getter, fallback sur proposalsArray.length max testé côté front
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

        // Récupère l’id gagnant si votes comptabilisés
        if (workflowStatus === 5) {
          const winnerId = await contract.winningProposalID();
          setWinningId(Number(winnerId));
        } else {
          setWinningId(null);
        }
      } catch (error) {
        // Optionnel : gestion erreur
      }
    }
    fetchAll();
  }, [workflowStatus]);

  return (
    <section className="bg-card text-card-foreground rounded-lg p-4 border border-border">
      <h2 className="font-bold mb-4 text-xl">Résultats</h2>

      {workflowStatus === 5 && winningId !== null && proposals[winningId] && (
        <div className="bg-yellow-100 border-yellow-300 border p-4 mb-6 rounded">
          <h3 className="font-bold">🏆 Proposition gagnante</h3>
          <p className="text-lg mb-1">{proposals[winningId].description}</p>
          <span className="text-xs text-muted-foreground">
            {proposals[winningId].voteCount} votes
          </span>
        </div>
      )}

      <div>
        <h3 className="mb-3 font-semibold">Toutes les propositions</h3>
        {proposals.length === 0 ? (
          <p className="text-muted-foreground">Aucune proposition (encore).</p>
        ) : (
          proposals.map((p) => (
            <div
              key={p.id}
              className={`bg-white border mb-2 rounded p-3 flex justify-between ${
                workflowStatus === 5 && winningId === p.id
                  ? 'border-yellow-400 bg-yellow-50'
                  : ''
              }`}
            >
              <span>{p.description}</span>
              <span className="font-mono font-bold">{p.voteCount} vote{p.voteCount > 1 ? 's' : ''}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
