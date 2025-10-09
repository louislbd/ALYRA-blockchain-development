// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract Bank {
    mapping(address => uint) balances;

    function balanceOf(address _account) public view returns(uint) {
        return balances[_account];
    }

    function deposit(uint _amount) public payable {
        require(_amount > 0, "You should deposit more than 0 dollars.");
        balances[msg.sender] = _amount;
    }

    function transfer(address _recipient, uint _amount) public {
        require(_amount > 0, "You should transfer more than 0 dollars.");
        require(_recipient != address(0), "You cannot transfer to the address zero.");
        require(balances[msg.sender] >= _amount, "You have not enough balance.");

        balances[msg.sender] -= _amount;
        balances[_recipient] += _amount;
    }

    receive() external payable { revert("send via deposit"); }
    fallback() external payable { revert("send via deposit"); }
}