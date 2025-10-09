// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9 <0.9.0;

contract CustomExercice1 {

    address public owner;
    string public myString = "Bonjour Alyra !";

    constructor() {
        owner = msg.sender;
    }

    function changeOwner(address newOwner) public {
        require(msg.sender == owner, "Owner only !");
        owner = newOwner;
    }

    function updateMyString(string memory newString) public {
        require(msg.sender == owner, "Owner only !");
        myString = newString;
    }
}