// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract Whitelist {
    mapping (address => bool) whitelist;
    event Authorized(address indexed _address);

    modifier check() {
        require(whitelist[msg.sender], "you are not authorized");
        _;
    }

    function authorize(address _address) public check() {
        whitelist[_address] = true;
        emit Authorized(_address);
    }
}