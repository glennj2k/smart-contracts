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
var Treasury = artifacts.require('Treasury')

module.exports = function (deployer) {
  return deployer.deploy(Treasury, Root.address, Roles.address)
    .then(() => Treasury.deployed())
    .then(() => Root.deployed())
    .then((root) => root.setTreasury(Treasury.address))
}
