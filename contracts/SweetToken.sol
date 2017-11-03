// Copyright (C) 2017 Sweetbridge Foundation, Switzerland
// All Rights Reserved
// Unauthorized reproducing or copying of this work, via any medium is strictly prohibited
// Written by the Sweetbridge Foundation Team, https://sweetbridge.com/
//
pragma solidity ^0.4.17;

import "./tokens/Token.sol";
import "./tokens/TokenLogic.sol";


contract SweetTokenLogic is TokenLogic {

    function SweetTokenLogic(
        address token_,
        TokenData data_,
        uint256 supply_,
        address rolesContract)
        TokenLogic(token_, data_, supply_, rolesContract) public
    {}

    function mintFor(address, uint256 ) public tokenOnly {
        // no more SweetTokens can be minted after the initial mint
        assert(false);
    }

    function burn(address , uint256 ) public tokenOnly {
        // burning is not possible
        assert(false);
    }
}


contract SweetToken is Token {
    function SweetToken(string name_, string symbol_, address rolesContract) public Token(name_, symbol_, rolesContract) {
        // you shouldn't create logic here, because this contract would be the owner.
    }

    // it's not be possible to send ETH. Buying SWC is done using another contract.
    function () public payable {
        require(false);
    }

}
