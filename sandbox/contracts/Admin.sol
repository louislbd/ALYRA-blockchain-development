// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

contract Admin is Ownable {
    mapping (address => bool) whitelist;
    mapping (address => bool) blacklist;

    function whitelist(address _account) private onlyOwner {
        require(!whitelist[_account], "Account already whitelisted.");
        require(!blacklist[_account], "Account already blacklisted.");

        whitelist[_account] = true;
    }

    function blacklist(address _account) private onlyOwner {
        require(!blacklist[_account], "Account already blacklisted.");
        require(!whitelist[_account], "Account already whitelisted.");

        blacklist[_account] = true;
    }

    function isWhiteListed(address _account) public view returns (bool) {
        return whitelist(_account);
    }

    function isBlackListed(address _account) public view returns (bool) {
        return blacklist(_account);
    }
}