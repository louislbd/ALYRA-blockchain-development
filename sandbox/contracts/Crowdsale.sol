// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./AlyraToken.sol";

contract Crowdsale is ERC20 {
    uint public rate = 200;
    AlyraToken public token;

    constructor(uint _initialSupply) {
        AlyraToken = new AlyraToken(_initialSupply);
    }

    receive() external payable {
        require(msg.value >= 0.1 ether, "You can't send less than 0.1 ETH.");
        distribute(msg.value);
    }

    function distribute(uint amount) internal {
        uint tokenToSend = amount * rate;

        token.transfer(msg.sender, tokenToSend);
    }
}