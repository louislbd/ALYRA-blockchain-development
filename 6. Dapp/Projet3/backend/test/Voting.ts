import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Voting Contract", function () {
  let voting: any;
  let owner: any, addr1: any, addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
  });

  it("Should register voters", async function () {
    const addr1Address = await addr1.getAddress();
    await voting.addVoter(addr1Address);
    const voter = await voting.connect(addr1).getVoter(addr1Address);
    expect(voter.isRegistered).to.equal(true);
  });

  it("Should start proposal registration", async function () {
    await voting.startProposalsRegistering();
    expect(await voting.workflowStatus()).to.equal(1);
  });

  it("Should add proposal", async function () {
    const addr1Address = await addr1.getAddress();
    await voting.addVoter(addr1Address);
    await voting.startProposalsRegistering();
    await voting.connect(addr1).addProposal("Test proposal");
    const proposal = await voting.connect(addr1).getOneProposal(1);
    expect(proposal.description).to.equal("Test proposal");
  });

  it("Should vote", async function () {
    const addr1Address = await addr1.getAddress();
    await voting.addVoter(addr1Address);
    await voting.startProposalsRegistering();
    await voting.connect(addr1).addProposal("Test proposal");
    await voting.endProposalsRegistering();
    await voting.startVotingSession();
    await voting.connect(addr1).setVote(1);
    const voter = await voting.connect(addr1).getVoter(addr1Address);
    expect(voter.hasVoted).to.equal(true);
  });
});
