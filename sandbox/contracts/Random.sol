// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract Random {
    uint private nonce = 0;

    function random() public returns(uint) {
        nonce++;
        return uint(keccak256(abi.encodePacked(nonce, block.timestamp, msg.sender))) % 100;
    }
}