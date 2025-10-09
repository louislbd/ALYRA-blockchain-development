// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title A simple crowdfunding smart contract
/// @author louislbd
/// @notice Users can create campaigns, pledge funds, unpledge before deadline, and claim/refund after deadline.
/// @dev This contract follows the checks-effects-interactions pattern and uses call for ETH transfers.
contract CrowdFunding is ReentrancyGuard {
    address private platformOwner;
    address payable private treasury;
    uint public campaignCount;
    uint constant creationFeeWei = 10_000_000_000_000_000; // 0.01 ETH
    uint16 constant feeBps = 500; // 5%
    uint constant MAX_TITLE_BYTES = 128;

    struct Campaign {
        address owner;
        string title;
        uint goalWei;
        uint pledged;
        uint deadline;
        bool claimed;
    }

    mapping(uint => Campaign) public campaigns;
    mapping(uint => mapping(address => uint)) public contributions;

    event CampaignCreated(uint indexed id, address indexed owner, string title, uint goalWei, uint deadline);
    event Pledged(uint indexed id, address indexed user, uint amountWei);
    event Unpledged(uint indexed id, address indexed user, uint amountWei);
    event Claimed(uint indexed id, address indexed owner, uint payout);
    event Refunded(uint indexed id, address indexed user, uint amountWei);

    error NotPlatformOwner();
    error CampaignNotFound();
    error NotOwner();
    error IncorrectDeadline();
    error IncorrectTitle();
    error IncorrectGoal();
    error InvalidAddress();
    error CampaignExpired();
    error CampaignNotExpired();
    error AmountZero();
    error InsufficientCreationFees();
    error GoalNotReached();
    error AlreadyClaimed();
    error NoFunds();
    error NotEnough();
    error EthTransferFailed();
    error SendEthViaPledge();

    modifier onlyPlatformOwner() {
        if (msg.sender != platformOwner) revert NotPlatformOwner();
        _;
    }

    modifier campaignExists(uint _id) {
        if (_id == 0 || _id > campaignCount) revert CampaignNotFound();
        _;
    }

    modifier onlyOwner(uint _id) {
        if (msg.sender != campaigns[_id].owner) revert NotOwner();
        _;
    }

    constructor(address  _treasury) {
        if (_treasury == address(0)) revert InvalidAddress();
        platformOwner = msg.sender;
        treasury = payable(_treasury);
    }

    /// @notice Update treasury address
    /// @param _newTreasury The address of the new treasury
    function setTreasury(address payable _newTreasury) external onlyPlatformOwner {
        if (_newTreasury == address(0)) revert InvalidAddress();
        treasury = _newTreasury;
    }

    /// @notice Create a new crowdfunding campaign
    /// @param _title The campaign title
    /// @param _goalWei The funding goal in wei
    /// @param _durationSeconds The duration of the campaign in seconds
    /// @return id The id of the newly created campaign
    function createCampaign(string calldata _title, uint _goalWei, uint _durationSeconds)
        external
        payable
        returns (uint id) {
        if (msg.value < creationFeeWei) revert InsufficientCreationFees();
        if (_goalWei <= 0) revert IncorrectGoal();
        if (_durationSeconds <= 0) revert IncorrectDeadline();
        if (bytes(_title).length <= 0 || bytes(_title).length > MAX_TITLE_BYTES) revert IncorrectTitle();

        unchecked { campaignCount++; }
        id = campaignCount;
        campaigns[id] = Campaign ({
            owner: msg.sender,
            title: _title,
            goalWei: _goalWei,
            pledged: 0,
            deadline: block.timestamp + _durationSeconds,
            claimed: false
        });

        uint surplus = msg.value - creationFeeWei;
        (bool ok1, ) = treasury.call{value: creationFeeWei}("");
        if (!ok1) revert EthTransferFailed();
        bool ok2 = true;
        if (surplus > 0) {
            (ok2, ) = msg.sender.call{value: surplus}("");
        }
        if (!ok2) revert EthTransferFailed();

        emit CampaignCreated(id, msg.sender, _title, _goalWei, campaigns[id].deadline);
        return id;
    }

    /// @notice Pledge funds to an existing campaign before deadline
    /// @dev ETH must be sent with this call (msg.value > 0)
    /// @param _id The campaign id
    function pledge(uint _id) external payable campaignExists(_id) {
        Campaign storage c = campaigns[_id];
        if (block.timestamp >= c.deadline) revert CampaignExpired();
        if (msg.value == 0) revert AmountZero();

        contributions[_id][msg.sender] += msg.value;
        c.pledged += msg.value;

        emit Pledged(_id, msg.sender, msg.value);
    }

    /// @notice Unpledge previously pledged funds before deadline
    /// @param _id The campaign id
    /// @param _amountWei The amount to unpledge in wei
    function unpledge(uint _id, uint _amountWei) external nonReentrant campaignExists(_id) {
        Campaign storage c = campaigns[_id];
        if (block.timestamp >= c.deadline) revert CampaignExpired();
        if (_amountWei <= 0) revert AmountZero();
        uint contribution = contributions[_id][msg.sender];
        if (contribution <= 0) revert NoFunds();
        if (_amountWei > contribution) revert NotEnough();

        contributions[_id][msg.sender] = contribution - _amountWei;
        c.pledged -= _amountWei;
        (bool ok, ) = msg.sender.call{value: _amountWei}("");
        if (!ok) revert EthTransferFailed();

        emit Unpledged(_id, msg.sender, _amountWei);
    }

    /// @notice Claim funds as campaign owner after success and deadline passed
    /// @param _id The campaign id
    function claim(uint _id) external nonReentrant campaignExists(_id) onlyOwner(_id) {
        Campaign storage c = campaigns[_id];
        if (block.timestamp <= c.deadline) revert CampaignNotExpired();
        if (c.pledged < c.goalWei) revert GoalNotReached();
        if (c.claimed) revert AlreadyClaimed();

        c.claimed = true;
        uint fee = (c.pledged * feeBps) / 10_000;
        uint payout = c.pledged - fee;

        (bool ok1, ) = treasury.call{value: fee}("");
        (bool ok2, ) = c.owner.call{value: payout}("");
        if (!ok1 || !ok2) revert EthTransferFailed();

        emit Claimed(_id, c.owner, payout);
    }

    /// @notice Refund contributor after campaign failure (after deadline, goal not reached)
    /// @param _id The campaign id
    function refund(uint _id) external nonReentrant campaignExists(_id) {
        Campaign storage c = campaigns[_id];
        if (block.timestamp <= c.deadline) revert CampaignNotExpired();
        if (c.pledged >= c.goalWei) revert GoalNotReached();
        uint amountWei = contributions[_id][msg.sender];
        if (amountWei == 0) revert NoFunds();

        contributions[_id][msg.sender] = 0;
        c.pledged -= amountWei;

        (bool ok, ) = msg.sender.call{value: amountWei}("");
        if (!ok) revert EthTransferFailed();

        emit Refunded(_id, msg.sender, amountWei);
    }

    receive() external payable { revert SendEthViaPledge(); }
    fallback() external payable { revert SendEthViaPledge(); }
}