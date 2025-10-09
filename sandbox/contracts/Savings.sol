// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Savings is Ownable() {
    uint time;
    uint depositId;
    mapping (uint => uint) deposits;

    constructor() Ownable(msg.sender) {}

    function getBalance() external view returns(uint) {
        return address(this).balance;
    }

    function deposit() external payable onlyOwner {
        require(msg.value != 0, "You should deposit more than 0 dollars.");
        deposits[depositId] = msg.value;
        depositId++;
        if (time == 0) {
            time = block.timestamp + 12 weeks;
        }
    }

    function withdraw() external onlyOwner {
        require(block.timestamp >= time, "Wait three months after the first deposit");
        (bool sent, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(sent, "Eth transfer failed");
    }

    receive() external payable { revert("send via deposit"); }
    fallback() external payable { revert("send via deposit"); }
}