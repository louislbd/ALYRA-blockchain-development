## Tests unitaires du smart contract VotingPlus.sol
Ce projet fournit une suite complète de tests unitaires écrits avec Hardhat et Chai pour valider le fonctionnement du système de vote implémenté dans le smart contract Voting.sol.
L’objectif est de vérifier le bon déroulement du processus de vote, la gestion du workflow, la robustesse des mécanismes d’enregistrement et les résultats de tally, en suivant les consignes du devoir.

### Organisation des tests
Le fichier de test principal est test/VotingPlus.ts, organisé en plusieurs bloc :

- getters : Tests sur les getters du contrat (vérification du statut initial).

- Voter registration : Ajout, suppression, droits, events et erreurs liés à l’enregistrement des votants.

- Proposal management : Ajout de propositions, émission d’événements et validation des entrées.

- Voting session : Possibilités de vote, enregistrement du vote, gestion des erreurs (vote multiple, index hors limite), events.

- Workflow management : Transition d’états, vérification séquentielle, contrôle des transitions invalides et émission d’événement.

- Vote tallying : Vérification du décompte des votes, gestion des égalités et émission d’événements.

- Vote tallying (draw) : Tests approfondis sur la sélection des gagnants selon différents scénarios (victoire unique, égalité, tableau vide, tous à zéro).

---

### Principaux scénarios et logiques vérifiées
Etat initial : Le workflow commence toujours à RegisteringVoters.

- Gestion des votants : L’owner peut inscrire/supprimer un votant ; tentative par non-owner ou suppression d’un non-inscrit provoque un revert.

- Propositions : Un votant inscrit peut proposer ; description vide provoque un revert ; chaque ajout déclenche un événement.

- Session de vote : Un votant inscrit peut voter sur une proposition existante ; interdiction de voter plusieurs fois ; index non-existant provoque un revert ; chaque vote déclenche un événement.

- Transitions du workflow : Changements d’état successifs permis ; toute transition non conforme déclenche un revert ; chaque changement déclenche un événement.

- Tally / décompte : Une fois la session terminée, le tally identifie bien le(s) gagnant(s) selon le nombre de votes ; les égalités sont gérées ; aucun proposal ou votes à zéro sont couverts.

- Gestion des erreurs : Chaque revert, chaque événement et chaque changement d’état est systématiquement testé (y compris pour les cas limites).

---

### Couverture
La suite de tests couvre :

- Tous les modifiers, droits et transitions possibles.

- Tous les cas attendus de la logique métier : succès et échecs.

- Tous les événements émis.

- Les cas limites du tally, notamment égalités et array vide.

- La robustesse face aux erreurs et mauvais usages.

---

### Outils & exécution
Framework de test : Hardhat

Assert/Matchers : Chai, via Hardhat

Commandes principales :

```bash
npx hardhat test
npx hardhat test --coverage
```

---

### Pour lancer la suite de tests
```bash
git clone ...
cd <répertoire>
npm install
npx hardhat test
npx hardhat test --coverage
```

---

### Conclusion
Ce dossier de tests permet d’assurer la robustesse, la sécurité et la fiabilité du système Voting sur toutes ses fonctionnalités attendues, tout en garantissant une couverture adaptée à la consigne du devoir.

