// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract CustomExercice2 {
    address public owner;
    string[] public messages;
    mapping(address => uint) scores;

    // Events for EVM logging
    event MessageAdded(address sender, string message);
    event ScoreUpdated(address indexed user, uint oldScore, uint newScore);

    constructor() {
        owner = msg.sender;
    }

    function getNumberOfMessages() public view returns (uint) {
        return messages.length;
    }

    function getAllMessages() public view returns (string[] memory) {
        return messages;
    }

    function getScore(address user) public view returns (uint) {
        return scores[user];
    }

    function addMessage(string memory message) public {
        messages.push(message);
        scores[msg.sender]++;
        emit MessageAdded(msg.sender, message);
    }

    function changeScore(address user, uint newScore) public {
        require(msg.sender == owner, "Owner only !");

        uint oldScore = scores[user];

        scores[user] = newScore;
        emit ScoreUpdated(user, oldScore, newScore);
    }
}