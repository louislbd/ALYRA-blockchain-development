// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.4.0/contracts/access/Ownable.sol";

/// @title An improved proposal-based voting system
/// @author louislbd
/// @notice The contract owner is responsible for manually controlling the voting workflow.
/// Registered voters can submit proposals and cast their votes during the allowed phases.
/// @custom:school This smart contract was developed as part of a school project.
contract VotingPlus is Ownable {
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint32 votedProposalId;
    }

    struct Proposal {
        string description;
        uint voteCount;
    }

    /// @notice Defines all possible phases of the voting process.
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    uint constant MAX_DESC_BYTES = 128;

    mapping (address => Voter) public voters;
    address[] public voterAddresses;
    Proposal[] public proposals;
    uint public winningProposalId;
    WorkflowStatus public votingStatus;

    /// @notice Emitted when a new voter is registered.
    event VoterRegistered(address indexed voterAddress);

    /// @notice Emitted whenever the voting workflow status changes.
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);

    /// @notice Emitted when a new proposal is registered by a voter.
    event ProposalRegistered(uint indexed proposalId);

    /// @notice Emitted when a voter casts a vote for a proposal.
    event Voted(address indexed voter, uint indexed proposalId);

    error NotInPhase(WorkflowStatus expected);
    error NotRegistered();
    error AlreadyRegistered();
    error AlreadyVoted();
    error InvalidAddress();
    error InvalidProposalId();
    error InvalidDescription();

    constructor() Ownable(msg.sender) {}

    /// @notice Resets the system to start a new election using the same list of registered voters.
    /// @dev Clears all proposals and resets each voter’s vote status.
    /// Can only be called by the contract owner after the last votes have been tallied.
    function newElection() external onlyOwner {
        if (votingStatus != WorkflowStatus.VotesTallied) revert NotInPhase(WorkflowStatus.VotesTallied);
        delete proposals;
        winningProposalId = 0;
        for (uint i = 0; i < voterAddresses.length; i++) {
            address voterAddr = voterAddresses[i];
            voters[voterAddr].hasVoted = false;
            voters[voterAddr].votedProposalId = 0;
        }
        WorkflowStatus previous = votingStatus;
        votingStatus = WorkflowStatus.RegisteringVoters;
        emit WorkflowStatusChange(previous, votingStatus);
    }

    /// @notice Registers a new voter to the whitelist.
    /// @dev Can only be called by the contract owner during the voter registration phase.
    /// @param _address The Ethereum address of the voter to register.
    function registerVoter(address _address) external onlyOwner {
        if (votingStatus != WorkflowStatus.RegisteringVoters) revert NotInPhase(WorkflowStatus.RegisteringVoters);
        if (_address == address(0)) revert InvalidAddress();
        if (voters[_address].isRegistered) revert AlreadyRegistered();
        voterAddresses.push(_address);
        voters[_address] = Voter ({
            isRegistered: true,
            hasVoted: false,
            votedProposalId: 0
        });
        emit VoterRegistered(_address);
    }

    /// @notice Starts the proposal registration phase.
    /// @dev Only callable by the contract owner once all voters have been registered.
    function openProposalSession() external onlyOwner {
        if (votingStatus != WorkflowStatus.RegisteringVoters) revert NotInPhase(WorkflowStatus.RegisteringVoters);
        WorkflowStatus previous = votingStatus;
        votingStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(previous, votingStatus);
    }

    /// @notice Allows a registered voter to submit a new proposal.
    /// @dev Each proposal includes a short text description and starts with zero votes.
    /// @param _description The text describing the proposal (must be non-empty and under 128 bytes).
    function makeProposal(string calldata _description) external {
        if (votingStatus != WorkflowStatus.ProposalsRegistrationStarted) revert NotInPhase(WorkflowStatus.ProposalsRegistrationStarted);
        if (!voters[msg.sender].isRegistered) revert NotRegistered();
        uint len = bytes(_description).length;
        if (len == 0 || len > MAX_DESC_BYTES) revert InvalidDescription();
        proposals.push(Proposal({
            description: _description,
            voteCount: 0
        }));
        emit ProposalRegistered(proposals.length - 1);
    }

    /// @notice Ends the proposal registration phase.
    /// @dev If no proposals have been submitted, the contract returns to the voter registration phase.
    function closeProposalSession() external onlyOwner {
        if (votingStatus != WorkflowStatus.ProposalsRegistrationStarted) revert NotInPhase(WorkflowStatus.ProposalsRegistrationStarted);
        WorkflowStatus previous = votingStatus;
        if (proposals.length == 0) {
            votingStatus = WorkflowStatus.RegisteringVoters;
        } else {
            votingStatus = WorkflowStatus.ProposalsRegistrationEnded;
        }
        emit WorkflowStatusChange(previous, votingStatus);
    }

    /// @notice Opens the voting session, allowing registered voters to cast their votes.
    /// @dev Only the contract owner can start the voting phase once the proposal registration has ended.
    function openVotingSession() external onlyOwner {
        if (votingStatus != WorkflowStatus.ProposalsRegistrationEnded) revert NotInPhase(WorkflowStatus.ProposalsRegistrationEnded);
        WorkflowStatus previous = votingStatus;
        votingStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(previous, votingStatus);
    }

    /// @notice Casts a vote for a specific proposal.
    /// @dev A voter can vote only once and must choose a valid proposal ID.
    /// @param _proposalId The ID of the proposal being voted for.
    function vote(uint _proposalId) external {
        if (votingStatus != WorkflowStatus.VotingSessionStarted) revert NotInPhase(WorkflowStatus.VotingSessionStarted);
        if (_proposalId >= proposals.length) revert InvalidProposalId();
        Voter storage voter = voters[msg.sender];
        if (!voter.isRegistered) revert NotRegistered();
        if (voter.hasVoted) revert AlreadyVoted();
        voter.hasVoted = true;
        voter.votedProposalId = uint32(_proposalId);
        proposals[_proposalId].voteCount++;
        emit Voted(msg.sender, _proposalId);
    }

    /// @notice Closes the voting session.
    /// @dev Only the contract owner can close the session once voting is over.
    function closeVotingSession() external onlyOwner {
        if (votingStatus != WorkflowStatus.VotingSessionStarted) revert NotInPhase(WorkflowStatus.VotingSessionStarted);
        WorkflowStatus previous = votingStatus;
        votingStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(previous, votingStatus);
    }

    /// @notice Tallies all votes and determines the winning proposal.
    /// @dev Only the contract owner can call this function after the voting session ends.
    /// The proposal with the highest vote count is selected as the winner.
    /// In case of ties, the firstly registered proposal will be the winner.
    function countVotes() external onlyOwner {
        if (votingStatus != WorkflowStatus.VotingSessionEnded) revert NotInPhase(WorkflowStatus.VotingSessionEnded);
        WorkflowStatus previous = votingStatus;
        uint mostVotedCount = 0;
        for (uint i = 0; i < proposals.length; i++) {
            if (mostVotedCount < proposals[i].voteCount) {
                winningProposalId = i;
                mostVotedCount = proposals[i].voteCount;
            }
        }
        votingStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(previous, votingStatus);
    }

    /// @notice Returns the details of the winning proposal.
    /// @dev Can only be called after the votes have been tallied.
    /// @return description The description text of the winning proposal.
    /// @return voteCount The number of votes the winning proposal received.
    function getWinner() external view returns (
        string memory description,
        uint voteCount
    ) {
        if (votingStatus != WorkflowStatus.VotesTallied) revert NotInPhase(WorkflowStatus.VotesTallied);
        Proposal memory p = proposals[winningProposalId];
        return (p.description, p.voteCount);
    }
}