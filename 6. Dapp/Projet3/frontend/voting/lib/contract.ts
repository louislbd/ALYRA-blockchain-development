import { Contract, JsonRpcProvider, BrowserProvider } from 'ethers';

const VOTING_ABI = [
    {
      "inputs": [],
      "stateMutability": "payable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "proposalId",
          "type": "uint256"
        }
      ],
      "name": "ProposalRegistered",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "voter",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "proposalId",
          "type": "uint256"
        }
      ],
      "name": "Voted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "voterAddress",
          "type": "address"
        }
      ],
      "name": "VoterRegistered",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "enum Voting.WorkflowStatus",
          "name": "previousStatus",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "enum Voting.WorkflowStatus",
          "name": "newStatus",
          "type": "uint8"
        }
      ],
      "name": "WorkflowStatusChange",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_desc",
          "type": "string"
        }
      ],
      "name": "addProposal",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_addr",
          "type": "address"
        }
      ],
      "name": "addVoter",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "endProposalsRegistering",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "endVotingSession",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "getOneProposal",
      "outputs": [
        {
          "components": [
            {
              "internalType": "string",
              "name": "description",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "voteCount",
              "type": "uint256"
            }
          ],
          "internalType": "struct Voting.Proposal",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_addr",
          "type": "address"
        }
      ],
      "name": "getVoter",
      "outputs": [
        {
          "components": [
            {
              "internalType": "bool",
              "name": "isRegistered",
              "type": "bool"
            },
            {
              "internalType": "bool",
              "name": "hasVoted",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "votedProposalId",
              "type": "uint256"
            }
          ],
          "internalType": "struct Voting.Voter",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "setVote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "startProposalsRegistering",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "startVotingSession",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tallyVotes",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "winningProposalID",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "workflowStatus",
      "outputs": [
        {
          "internalType": "enum Voting.WorkflowStatus",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || '';

const provider = new JsonRpcProvider(RPC_URL);

export const votingContract = new Contract(CONTRACT_ADDRESS, VOTING_ABI, provider);

export const getContract = () => votingContract;

export const getContractWithSigner = async () => {
  const browserProvider = new BrowserProvider(window.ethereum);
  const signer = await browserProvider.getSigner();
  return new Contract(CONTRACT_ADDRESS, VOTING_ABI, signer);
};

export async function addVoter(address: string) {
  const contract = await getContractWithSigner();
  const tx = await contract.addVoter(address);
  return await tx.wait();
}

export async function addProposal(description: string) {
  const contract = await getContractWithSigner();
  const tx = await contract.addProposal(description);
  return await tx.wait();
}

export async function startProposalsRegistering() {
  const contract = await getContractWithSigner();
  const tx = await contract.startProposalsRegistering();
  return await tx.wait();
}

export async function endProposalsRegistering() {
  const contract = await getContractWithSigner();
  const tx = await contract.endProposalsRegistering();
  return await tx.wait();
}

export async function startVotingSession() {
  const contract = await getContractWithSigner();
  const tx = await contract.startVotingSession();
  return await tx.wait();
}

export async function endVotingSession() {
  const contract = await getContractWithSigner();
  const tx = await contract.endVotingSession();
  return await tx.wait();
}

export async function tallyVotes() {
  const contract = await getContractWithSigner();
  const tx = await contract.tallyVotes();
  return await tx.wait();
}

export { VOTING_ABI, CONTRACT_ADDRESS };
