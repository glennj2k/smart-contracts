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
var Math = artifacts.require('Math')
var TokenLogic = artifacts.require('TokenLogic')
var Vault = artifacts.require('Vault')

module.exports = function (deployer, network) {
  deployer.deploy(Math).then(() => deployer.link(
    Math,
    [TokenLogic, Vault]))
}
