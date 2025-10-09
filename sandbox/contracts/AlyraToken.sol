// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol";

contract AlyraToken is ERC20 {
    constructor(uint _initialSupply) ERC20("ALYRA", "ALY") {
        _mint(msg.sender, _initialSupply);
    }
}