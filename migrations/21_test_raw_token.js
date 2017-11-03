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
var Token = artifacts.require('Token')
var TokenLogic = artifacts.require('TokenLogic')
var Roles = artifacts.require('Roles')

module.exports = function (deployer, network) {
  if (network === 'mainnet') return

  var logic
  deployer.deploy(Token, 'TestCoin', 'TTC', Roles.address)
    .then(() => deployer.new(TokenLogic, Token.address, 0, 1e26, Roles.address))
    .then(l => { logic = l; return Token.deployed() })
    .then(t => t.setLogic(logic.address))
}
