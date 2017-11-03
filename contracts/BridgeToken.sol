// Copyright (C) 2017 Sweetbridge Foundation, Switzerland
// All Rights Reserved
// Unauthorized reproducing or copying of this work, via any medium is strictly prohibited
// Written by the Sweetbridge Foundation Team, https://sweetbridge.com/
//
pragma solidity ^0.4.17;

import "./tokens/Token.sol";
import "./Vault.sol";


contract BridgeToken is Token {
    // you can't create logic here, because this contract would be the owner.
    function BridgeToken(string name_, string symbol_, address rolesContract) Token(name_, symbol_, rolesContract) public {}

    function repayUou(uint128 brgWad, Vault vault, uint256 uouIndex) public {
        require(balanceOf(msg.sender) >= brgWad);
        uint128 repaidAmount = vault.repayUou(brgWad, uouIndex);
        logic.burn(msg.sender, repaidAmount);
        Transfer(msg.sender, address(vault), repaidAmount);
    }
}
