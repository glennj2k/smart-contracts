// Copyright (C) 2017 Sweetbridge Foundation, Switzerland
// All Rights Reserved
// Unauthorized reproducing or copying of this work, via any medium is strictly prohibited
// Written by the Sweetbridge Foundation Team, https://sweetbridge.com/
//
pragma solidity ^0.4.14;


interface UserDirectoryFactoryI {
    function createUserDirectory(address root, address user, address rolesContract) public returns (address);
}


interface WalletFactoryI {
    function createWallet(address directory, bytes3 currency) public returns (address);
}


interface VaultFactoryI {
    function createVault(address wallet) public returns (address);
}
