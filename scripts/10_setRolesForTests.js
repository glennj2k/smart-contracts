var BRG = artifacts.require('BridgeToken')
var SWT = artifacts.require('SweetToken')
var SweetTokenLogic = artifacts.require('SweetTokenLogic')
var Roles = artifacts.require('Roles')
var Root = artifacts.require('Root')
var ForwarderFactory = artifacts.require('ForwarderFactory')

/**
 * this script allow to create base roles and grant them to test users
 * it is not required for running tests and thus is part of the scripts
 * that can be used as needed
 * @param contract
 * @param roleName
 * @returns {Promise.<T>|Promise<any>}
 */
const setRole = (contract, roleName) => {
  const testUser = web3.eth.accounts[2]
  const coinbase = web3.eth.accounts[0]
  const roles = Roles.at(Roles.address)

  contract = contract.at(contract.address)
  let ctrct = undefined

  return contract.contractHash()
    .then(hash => ctrct = hash)
    .then(() => contract.hasRole(roleName))
    .then(hasRole => {
      if (!hasRole) {
        console.log('create role', roleName, 'in', contract.constructor._json.contractName, hasRole)
        return roles.addContractRole(ctrct, roleName)
      } else {
        console.log('does NOT create role', roleName, 'in', contract.constructor._json.contractName, hasRole)
      }
    })
    .then(tx => roles.grantUserRole(ctrct, roleName, testUser))
    .then(tx => roles.grantUserRole(ctrct, roleName, coinbase))
    .catch(err => console.log('ERROR create role', roleName, 'in', contract.constructor._json.contractName))
}

module.exports = function (deployer, network) {
  if (network === 'mainnet') return

  return setRole(BRG, 'minter')
      .then(() => setRole(SWT, 'admin'))
      .then(() => setRole(SweetTokenLogic, 'admin'))
      .then(() => setRole(BRG, 'admin'))
      .then(() => setRole(ForwarderFactory, 'admin'))
      .then(() => setRole(Root, 'userManager'))
    .catch(console.log)
}
