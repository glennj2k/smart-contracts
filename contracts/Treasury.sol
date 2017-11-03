// Copyright (C) 2017 Sweetbridge Foundation, Switzerland
// All Rights Reserved
// Unauthorized reproducing or copying of this work, via any medium is strictly prohibited
// Written by the Sweetbridge Foundation Team, https://sweetbridge.com/
//
pragma solidity ^0.4.17;

import "./Root.sol";
import "./Vault.sol";
import "./authority/Roles.sol";


contract Treasury is SecuredWithRoles {
    // mapping from the vault address to the old owner
    mapping(address => address) public vaults;
    Root public root;

    function Treasury(Root r, address rolesContract) public SecuredWithRoles("Treasury", rolesContract) {
        require(r != address(0));
        root = r;
    }

    function addVault(Vault v) public onlyRole("vaultManager") {
        vaults[v] = v.owner();
        v.takeOwnership();
    }
}
