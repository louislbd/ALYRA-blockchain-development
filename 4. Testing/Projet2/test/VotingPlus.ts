import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

async function setUpSmartContract() {
  const voting = await ethers.deployContract("Voting");
  const [owner] = await ethers.getSigners();

  return { voting, owner };
}

describe("VotingPlus", function () {
  let voting: any;
  let owner: any;

  beforeEach(async () => {
    ({ voting, owner } = await setUpSmartContract());
  });

  describe("getters", function () {
    it("Should be deployed with RegisteringVoters as Workflow status", async function () {
      let status = await voting.workflowStatus();
      expect(status).to.be.equal(0);
    });
  });

  describe("Voter registration", function () {
    it("Should allow owner to register a voter", async function () {
      let tx = await voting.addVoter(owner.address);
      await tx.wait();
      const voter = await voting.getVoter(owner.address);
      expect(voter.isRegistered).to.be.true;
    });
    it("Should emit VoterRegistered event", async function () {
      await expect(voting.addVoter(owner.address))
        .to.emit(voting, "VoterRegistered")
        .withArgs(owner.address);
    });
    it("Should revert if non-owner tries to delete a voter", async function () {
      const signers = await ethers.getSigners();
      await voting.addVoter(owner.address);
      await expect(voting.connect(signers[1]).deleteVoter(owner.address))
        .to.be.revert(ethers);
    });
    it("Should revert if trying to delete a non-registered voter", async function () {
      await expect(voting.deleteVoter(owner.address))
        .to.be.revertedWith("Not registered.");
    });
  });

  describe("Proposal management", function () {
    it("Should allow registered voter to add proposal during ProposalsRegistrationStarted",
      async function () {
        await voting.addVoter(owner.address);
        await voting.nextWorkflowStatus();
        let tx = await voting.addProposal("New Proposal");
        await tx.wait();
        const proposal = await voting.getOneProposal(0);
        expect(proposal.description).to.equal("New Proposal");
    });
    it("Should emit ProposalRegistered event", async function () {
        await voting.addVoter(owner.address);
        await voting.nextWorkflowStatus();
        await expect(voting.addProposal("Another Proposal"))
            .to.emit(voting, "ProposalRegistered")
            .withArgs(0);
    });
    it("Should revert with empty description", async function () {
        await voting.addVoter(owner.address);
        await voting.nextWorkflowStatus();
        await expect(voting.addProposal("")).to.be.revertedWith("Vous ne pouvez pas ne rien proposer");
    });
  });

  describe("Voting session", function () {
    it("Should allow registered voter to vote", async function () {
        await voting.addVoter(owner.address);
        await voting.nextWorkflowStatus();
        let tx = await voting.addProposal("Vote for me");
        await tx.wait();
        await voting.nextWorkflowStatus();
        await voting.nextWorkflowStatus();
        tx = await voting.setVote(0);
        await tx.wait();
        const voter = await voting.getVoter(owner.address);
        expect(voter.hasVoted).to.be.true;
        expect(voter.votedProposalId).to.equal(0);
    });
    it("Should emit Voted event", async function () {
        await voting.addVoter(owner.address);
        await voting.nextWorkflowStatus();
        let tx = await voting.addProposal("Vote for me");
        await tx.wait();
        await voting.nextWorkflowStatus();
        await voting.nextWorkflowStatus();
        await expect(voting.setVote(0))
            .to.emit(voting, "Voted")
            .withArgs(owner.address, 0);
    });
    it("Should revert if voter already voted", async function () {
        await voting.addVoter(owner.address);
        await voting.nextWorkflowStatus();
        let tx = await voting.addProposal("Vote for me");
        await tx.wait();
        await voting.nextWorkflowStatus();
        await voting.nextWorkflowStatus();
        await voting.setVote(0);
        await expect(voting.setVote(0)).to.be.revertedWith("You have already voted");
    });
    it("Should revert if proposal id is out of bounds", async function () {
        await voting.addVoter(owner.address);
        await voting.nextWorkflowStatus();
        let tx = await voting.addProposal("Vote for me");
        await tx.wait();
        await voting.nextWorkflowStatus();
        await voting.nextWorkflowStatus();
        await expect(voting.setVote(1)).to.be.revertedWith("Proposal not found");
    });
  });

  describe("Workflow management", function () {
    it("Should transition workflow statuses sequentially", async function () {
        await voting.addVoter(owner.address);
        await voting.nextWorkflowStatus();
        await voting.nextWorkflowStatus();
        await voting.nextWorkflowStatus();
        await voting.nextWorkflowStatus();
        let tx = await voting.tallyDraw();
        await tx.wait();
        const status = await voting.workflowStatus();
        expect(status).to.equal(5);
    });
    it("Should emit WorkflowStatusChange event", async function () {
        await voting.addVoter(owner.address);
        await voting.nextWorkflowStatus();
        await voting.nextWorkflowStatus();
        await voting.nextWorkflowStatus();
        await voting.nextWorkflowStatus();
        await expect(voting.tallyDraw())
            .to.emit(voting, "WorkflowStatusChange")
            .withArgs(4, 5);
    });
    it("Should revert if transitions are out of order", async function () {
        await expect(voting.tallyDraw()).to.be.revertedWith("Current status is not voting session ended");
        await voting.addVoter(owner.address);
        await expect(voting.setWorkflowStatus(3)).to.be.revertedWith("bad workflowstatus");
    });
  });

  describe("Vote tallying", function () {
    it("Should correctly identify winning proposals in draw", async function () {
      await voting.addVoter(owner.address);
      const signers = await ethers.getSigners();
      await voting.addVoter(signers[1].address);
      await voting.nextWorkflowStatus();
      let tx = await voting.addProposal("Proposal 1");
      await tx.wait();
      tx = await voting.connect(signers[1]).addProposal("Proposal 2");
      await tx.wait();
      await voting.nextWorkflowStatus();
      await voting.nextWorkflowStatus();
      tx = await voting.setVote(0);
      await tx.wait();
      tx = await voting.connect(signers[1]).setVote(1);
      await tx.wait();
      await voting.nextWorkflowStatus();
      const p0 = await voting.getOneProposal(0);
      const p1 = await voting.getOneProposal(1);
      expect(p0.voteCount).to.equal(1);
      expect(p1.voteCount).to.equal(1);
      expect(p0.description).to.equal("Proposal 1");
      expect(p1.description).to.equal("Proposal 2");
    });
    it("Should emit WorkflowStatusChange when tallying", async function () {
      await voting.addVoter(owner.address);
      await voting.nextWorkflowStatus();
      await voting.nextWorkflowStatus();
      await voting.nextWorkflowStatus();
      await voting.nextWorkflowStatus();
      await expect(voting.tallyDraw())
          .to.emit(voting, "WorkflowStatusChange")
          .withArgs(4, 5);
    });
  });
  describe("Vote tallying (draw)", function () {
    it("Should revert tallyVotesDraw if not ended", async function () {
      await expect(voting.tallyVotesDraw()).to.be.revertedWith("Current status is not voting session ended");
    });

    it("Should revert tallyDraw if not ended", async function () {
      await expect(voting.tallyDraw()).to.be.revertedWith("Current status is not voting session ended");
    });
  });
});
