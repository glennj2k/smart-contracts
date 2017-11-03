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
var Root = artifacts.require('Root')
var Roles = artifacts.require('Roles')
var SWCq = artifacts.require('SWCqueue')

module.exports = function (deployer) {
  return deployer.deploy(SWCq, Root.address, 20000, Roles.address) // 1swc = 2brg
    .then(() => SWCq.deployed())
}
