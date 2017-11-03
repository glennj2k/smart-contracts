// Copyright (C) 2017 Sweetbridge Foundation, Switzerland
// All Rights Reserved
// Unauthorized reproducing or copying of this work, via any medium is strictly prohibited
// Written by the Sweetbridge Foundation Team, https://sweetbridge.com/
//
pragma solidity ^0.4.17;

import "./BridgeToken.sol";
import "./authority/Roles.sol";


contract SWCqueueEvents {
    event LogSWCqueueCancel(address who, uint128 wad, bytes3 currency);
    // This events represent direct pledges done without transfer from user account
    event LogSWCqueueDirectPledge(address who, uint128 wad, bytes3 currency);
    event LogSWCqueueTranchRelease(uint256 timestamp, uint256 price, uint128 wad);
}


/* SWCqueue holds BRG pledges for SWC tranches.
 * The pledge is done in two ways:
 *   1. through the brg transfer from the user account to the SWCqueue contract address
 *   2. through direct mint to the SWCqueue contract address and calling `directPledge`
 *      function.
 */
contract SWCqueue is SWCqueueEvents, SecuredWithRoles {
    Root public root;
    // BRG/SWT ratio in basis points (1e4)
    uint256 public nextBRGusdSWTratio;

    function SWCqueue(address root_, uint256 nextBRGusdSWTratio_, address rolesContract) SecuredWithRoles("SWCqueue", rolesContract) public {
        require(root_ != address(0));
        root = Root(root_);
        nextBRGusdSWTratio = nextBRGusdSWTratio_;
    }

    function setRoot(address root_) public roleOrOwner("admin") {
        require(root_ != address(0));
        root = Root(root_);
    }

    function setNextBRGusdSWTratio(uint256 ratio) public roleOrOwner("tgeAdmin") {
        require(ratio > 0);
        nextBRGusdSWTratio = ratio;
    }

    function cancel(uint128 wad, bytes3 currency) public {
        LogSWCqueueCancel(msg.sender, wad, currency);
    }

    function directPledge(address who, uint128 wad) public roleOrOwner("tgeAdmin") {
        LogSWCqueueDirectPledge(who, wad, "usd");
    }

    function logTrancheRelease(uint128 wad) public roleOrOwner("tgeAdmin") {
        LogSWCqueueTranchRelease(now, nextBRGusdSWTratio, wad);
    }

    function burn(uint128 wad, bytes3 currency) public roleOrOwner("tgeAdmin") {
        BridgeToken brg = BridgeToken(root.brg(currency));
        require(brg != address(0));
        brg.burn(wad);
    }
}
