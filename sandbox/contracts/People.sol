// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract People {
    struct Person {
        string name;
        uint age;
    }

    Person[] public personnes;

    function add(string calldata _name, uint _age) public {
        Person memory newPerson = Person({
            name: _name,
            age: _age
        });
        personnes.push(newPerson);
    }

    function remove() public {
        personnes.pop();
    }
}