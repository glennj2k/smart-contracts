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
var ForwarderFactory = artifacts.require('ForwarderFactory')
var Roles = artifacts.require('Roles')

module.exports = function (deployer) {
  let ctrctHash = undefined
  let fwdFactory = undefined
  let roles = Roles.at(Roles.address)
  return deployer.deploy(ForwarderFactory, Roles.address)
    .then(ctrct => {
      fwdFactory = ForwarderFactory.at(ForwarderFactory.address)
      return fwdFactory.contractHash()
    })
    .then(hash => {
      ctrctHash = hash
      return roles.addContractRole(ctrctHash, 'admin')
    })
    .then(() => {
      return roles.grantUserRole(ctrctHash, 'admin', web3.eth.accounts[5])
    })
}
