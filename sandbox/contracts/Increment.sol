// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract ExoBen {
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function changeOwner(address _address) external onlyOwner {
        owner = _address;
    }

    function getOwnerBalance() public view returns (uint) {
        return owner.balance;
    }

    function getBalance(address _address) public view returns (uint) {
        return _address.balance;
    }

    function tranferEthTo(address payable _address) external payable {
        require(_address != address(0), "Invalid address");
        _address.transfer(msg.value);
    }
}