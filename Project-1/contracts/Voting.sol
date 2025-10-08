// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

/// @title A proposal-based voting system
/// @author louislbd
/// @notice The contract owner is responsible for manually controlling the voting workflow.
/// Registered voters can submit proposals and cast their votes during the allowed phases.
/// @custom:school This smart contract was developed as part of a school project.
contract Voting is Ownable {
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
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

    constructor() Ownable(msg.sender) {}

    /// @notice Registers a new voter to the whitelist.
    /// @dev Can only be called by the contract owner during the voter registration phase.
    /// @param _address The Ethereum address of the voter to register.
    function registerVoter(address _address) external onlyOwner {
        require(votingStatus == WorkflowStatus.RegisteringVoters, "Not in RegisteringVoters");
        require(_address != address(0), "Address 0 should not be a voter");
        require(!voters[_address].isRegistered, "Address has already been registered");
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
        require(votingStatus == WorkflowStatus.RegisteringVoters, "Not in RegisteringVoters");
        WorkflowStatus previous = votingStatus;
        votingStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(previous, votingStatus);
    }

    /// @notice Allows a registered voter to submit a new proposal.
    /// @dev Each proposal includes a short text description and starts with zero votes.
    /// @param _description The text describing the proposal (must be non-empty and under 128 bytes).
    function makeProposal(string calldata _description) external {
        require(votingStatus == WorkflowStatus.ProposalsRegistrationStarted, "Not in ProposalsRegistrationStarted");
        require(voters[msg.sender].isRegistered, "You are not registered as a voter");
        require(bytes(_description).length > 0 && bytes(_description).length <= MAX_DESC_BYTES, "Description field should not be empty");
        proposals.push(Proposal({
            description: _description,
            voteCount: 0
        }));
        emit ProposalRegistered(proposals.length - 1);
    }

    /// @notice Ends the proposal registration phase.
    /// @dev If no proposals have been submitted, the contract returns to the voter registration phase.
    function closeProposalSession() external onlyOwner {
        require(votingStatus == WorkflowStatus.ProposalsRegistrationStarted, "Not in ProposalsRegistrationStarted");
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
        require(votingStatus == WorkflowStatus.ProposalsRegistrationEnded, "Not in ProposalsRegistrationEnded");
        WorkflowStatus previous = votingStatus;
        votingStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(previous, votingStatus);
    }

    /// @notice Casts a vote for a specific proposal.
    /// @dev A voter can vote only once and must choose a valid proposal ID.
    /// @param _proposalId The ID of the proposal being voted for.
    function vote(uint _proposalId) external {
        require(votingStatus == WorkflowStatus.VotingSessionStarted, "Not in VotingSessionStarted");
        require(voters[msg.sender].isRegistered, "You are not registered as a voter");
        require(!voters[msg.sender].hasVoted, "You have already voted");
        require(_proposalId < proposals.length, "Invalid proposal id");
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedProposalId = _proposalId;
        proposals[_proposalId].voteCount++;
        emit Voted(msg.sender, _proposalId);
    }

    /// @notice Closes the voting session.
    /// @dev Only the contract owner can close the session once voting is over.
    function closeVotingSession() external onlyOwner {
        require(votingStatus == WorkflowStatus.VotingSessionStarted, "Not in VotingSessionStarted");
        WorkflowStatus previous = votingStatus;
        votingStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(previous, votingStatus);
    }

    /// @notice Tallies all votes and determines the winning proposal.
    /// @dev Only the contract owner can call this function after the voting session ends.
    /// The proposal with the highest vote count is selected as the winner.
    /// In case of ties, the firstly registered proposal will be the winner.
    function countVotes() external onlyOwner {
        require(votingStatus == WorkflowStatus.VotingSessionEnded, "Not in VotingSessionEnded");
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
        require(votingStatus == WorkflowStatus.VotesTallied, "Not in VotesTallied");
        Proposal storage p = proposals[winningProposalId];
        return (p.description, p.voteCount);
    }
}