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
/* global web3 */

var TokenLogic = artifacts.require('TokenLogic')
var SweetTokenLogic = artifacts.require('SweetTokenLogic')
var SWT = artifacts.require('SweetToken')
var BRG = artifacts.require('BridgeToken')
var Roles = artifacts.require('Roles')

module.exports = function (deployer, network) {
  // logic has to be deployed separaterly because Token shouldn't be the owner of the logic

  var swt, brg
  return deployer.deploy([
    [SWT, 'SWT', 'SWT', Roles.address],
    [BRG, 'BRG', 'BRG', Roles.address]])
   .then(() => Promise.all([SWT.deployed(), BRG.deployed()]))
    .then(resp => {
      [swt, brg] = resp
      return Promise.all([
        deployer.deploy(SweetTokenLogic, swt.address, 0, 1e26, Roles.address),
        deployer.deploy(TokenLogic, brg.address, 0, 0, Roles.address)])
    }).then(resp => {
      return Promise.all([
        swt.setLogic(SweetTokenLogic.address),
        brg.setLogic(TokenLogic.address)
      ])
    })
}
