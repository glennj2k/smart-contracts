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
var Roles = artifacts.require('Roles')
var Root = artifacts.require('Root')
var BRG = artifacts.require('BridgeToken')
var SWT = artifacts.require('SweetToken')
var VaultConfig = artifacts.require('VaultConfig')
var UserDirectoryFactory = artifacts.require('UserDirectoryFactory')
var WalletFactory = artifacts.require('WalletFactory')
var VaultFactory = artifacts.require('VaultFactory')

module.exports = function (deployer) {
  return deployer.deploy([
    [VaultConfig],
    [VaultFactory],
    [WalletFactory],
    [UserDirectoryFactory]])
    .then(() =>
          deployer.deploy(
            Root, SWT.address, VaultConfig.address,
            UserDirectoryFactory.address, WalletFactory.address, VaultFactory.address,
            Roles.address))
    .then(() => Root.deployed())
    .then(rootConfig)
    .then(() => VaultConfig.deployed())
    .then(vaultConfig)
}

function rootConfig (root) {
  return root.setBRG(BRG.address, 'USD')
}

function vaultConfig (vc) {
  return vc.setMaxUOUdays(356)
    .then(() => vc.setMaxUOU(SWT.address, 9500))

  // TODO: This fails because of a bug in truffle: https://github.com/trufflesuite/truffle/issues/526
    // .then(() => vc.setMaxUOUs(
    //   [SWT.address],
    //   [9500]
    // ))
}
