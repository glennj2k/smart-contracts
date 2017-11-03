// Copyright (C) 2017 Sweetbridge Foundation, Switzerland
// All Rights Reserved
// Unauthorized reproducing or copying of this work, via any medium is strictly prohibited
// Written by the Sweetbridge Foundation Team, https://sweetbridge.com/
//
// Copyright (C) 2017 Sweetbridge Foundation, Switzerland
// All Rights Reserved
// Unauthorized reproducing or copying of this work, via any medium is strictly prohibited
// Written by the Sweetbridge Foundation Team, https://sweetbridge.com/
//
var AssetsLib = artifacts.require('AssetsLib')
var Assets = artifacts.require('Assets')
var Wallet = artifacts.require('Wallet')
var Vault = artifacts.require('Vault')
var WalletFactory = artifacts.require('WalletFactory')
var VaultFactory = artifacts.require('VaultFactory')

module.exports = function (deployer, network) {
  deployer.deploy(AssetsLib).then(() => deployer.link(
    AssetsLib,
    [Assets, Wallet, Vault, WalletFactory, VaultFactory]))
}
