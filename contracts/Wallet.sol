// Copyright (C) 2017 Sweetbridge Foundation, Switzerland
// All Rights Reserved
// Unauthorized reproducing or copying of this work, via any medium is strictly prohibited
// Written by the Sweetbridge Foundation Team, https://sweetbridge.com/
//
pragma solidity ^0.4.17;


import "./Assets.sol";
import "./UserDirectory.sol";


contract WalletFactory is WalletFactoryI {
    function createWallet(address directory, bytes3 currency) public returns (address) {
        return new Wallet(directory, currency);
    }
}


contract WalletEvents {
    event LogVaultAdded(address vault);

    event LogVaultRemoved(address vault);
}


/*Wallet belongs to exactly one user who is the owner of the contract.
  Use `addAsset` (from Assets) function to transfer assets to the wallet. After this operation
  wallet will become the owner of the assets.
  To move the token to another address use `transfer` function. */
contract Wallet is Assets, WalletEvents {
    // TODO: verify if parametrizing Wallet by `currency` in a good solution (or we should prefer to do Vault base?)
    bytes3 public currency; //the ISO code of the currency we want to evaluate assets in
    UserDirectory public directory;

    address[] public vaults;

    // TODO: maybe we should make root as a wallet member (instead of UserDirectory)?
    function Wallet(address directory_, bytes3 currency_)
    Assets([UserDirectory(directory_).root().swt(), UserDirectory(directory_).root().brg(currency_)], "Wallet", UserDirectory(directory_).roles()) public
    {
        directory = UserDirectory(directory_);
        require(directory.root().brg(currency_) != address(0));
        owner = directory.owner();
        currency = currency_;
    }

    function brg() public view returns (address) {
        return directory.root().brg(currency);
    }

    function vaultCount() public view returns (uint32) {
        return uint32(vaults.length);
    }

    function listVaults() public view returns (address[]) {
        address[] memory vs = new address[](vaults.length);
        for (uint32 i = 0; i < vaults.length; ++i) {
            vs[i] = vaults[i];
        }
        return vs;
    }

    function remove() public onlyOwner {
        require(this.balance == 0);
        require(!hasFunds());
        require(vaults.length == 0);
        directory.removeWallet(this);
        selfdestruct(address(0));
    }

    function addVault() public onlyOwner {
        // TODO: the vault must be added to the minter group in order to create UOUs
        address vault = directory.root().vaultFactory().createVault(this);
        // limit the number of vaults to avoid an OOG during operations
        require(vaults.length < 255);
        vaults.push(vault);
        LogVaultAdded(vault);
    }

    // can only be called by the vault itself
    function removeVault(address vault) public {
        uint32 idx;
        for (uint32 i = 0; i < vaults.length; ++i) {
            if (vault == vaults[i]) {
                idx = i;
            }
        }
        /*only the vault can remove itself from the wallet*/
        require(msg.sender == vaults[idx]);
        uint256 len = vaults.length - 1;

        LogVaultRemoved(vaults[idx]);
        if (idx != len)
            vaults[idx] = vaults[len];
        vaults.length = len;
    }

}
