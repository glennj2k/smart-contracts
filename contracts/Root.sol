// Copyright (C) 2017 Sweetbridge Foundation, Switzerland
// All Rights Reserved
// Unauthorized reproducing or copying of this work, via any medium is strictly prohibited
// Written by the Sweetbridge Foundation Team, https://sweetbridge.com/
//
pragma solidity ^0.4.17;

import "./BridgeToken.sol";
import "./SweetToken.sol";
import "./Treasury.sol";
import "./FactoryInterfaces.sol";
import "./authority/Roles.sol";


interface RootI {
    function brg(bytes3 currency) public view returns(address);
    function swt() public view returns(address);
    function addDirectory(address owner, address directory) public;
    function userDirFactory() public view returns(UserDirectoryFactoryI);
    function walletFactory() public view returns(WalletFactoryI);
    function vaultFactory() public view returns(VaultFactoryI);
}


contract RootEvents {
    event LogDirectoryAdded(address newUserDirectory, address owner);
}


contract Root is SecuredWithRoles, RootEvents {
    mapping(bytes3 => BridgeToken) private brgs;

    SweetToken public swt;
    Treasury public treasury;
    VaultConfig public vaultConfig;
    UserDirectoryFactoryI public userDirFactory;
    WalletFactoryI public walletFactory;
    VaultFactoryI public vaultFactory;
    mapping(address => address) public userDirectories;


    function Root(
        address swt_,
        address vc,
        address userDirFactory_,
        address walletFactory_,
        address vaultFactory_, address rolesContract) public SecuredWithRoles("Root", rolesContract)
    {
        require(swt_ != address(0));
        require(vc != address(0));
        swt = SweetToken(swt_);
        vaultConfig = VaultConfig(vc);
        userDirFactory = UserDirectoryFactoryI(userDirFactory_);
        walletFactory = WalletFactoryI(walletFactory_);
        vaultFactory = VaultFactoryI(vaultFactory_);
    }

    function brg(bytes3 currency) public view returns(address) {
        return brgs[currency];
    }

    function setBRG(BridgeToken brg_, bytes3 currency) public onlyOwner {
        require(brg_ != address(0));
        brgs[currency] = brg_;
    }

    function setSWT(SweetToken swt_) public onlyOwner {
        require(swt_ != address(0));
        swt = swt_;
    }

    function setTreasury(address t) public onlyOwner {
        treasury = Treasury(t);
    }

    function setVaultConfig(VaultConfig vc) public onlyOwner {
        vaultConfig = vc;
    }

    function setUserFactory(address userDirFactory_) public onlyOwner {
        userDirFactory = UserDirectoryFactoryI(userDirFactory_);
    }

    function setWalletFactory(address walletFactory_) public onlyOwner {
        walletFactory = WalletFactoryI(walletFactory_);
    }

    function setVaultFactory(address vaultFactory_) public onlyOwner {
        vaultFactory = VaultFactoryI(vaultFactory_);
    }

    function addDirectory(address owner) public {
        assert(owner != address(0x0));
        // the userdirectory must not exist
        require(userDirectories[owner] == address(0x0));

        address directory = userDirFactory.createUserDirectory(this, owner, roles);
        userDirectories[owner] = directory;
        LogDirectoryAdded(directory, owner);
    }

    function removeDirectory(address owner) public roleOrOwner("userManager") {
        delete userDirectories[owner];
    }
}
