// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ULTToken is ERC20, Ownable {
    constructor() ERC20("ULT Token", "ULT") Ownable(msg.sender) {
        // The ERC20 constructor gets the token name and symbol.
        // The Ownable constructor is passed msg.sender as the initial owner.
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
