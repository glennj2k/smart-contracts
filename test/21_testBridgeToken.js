var Roles = artifacts.require('Roles')
var BRG = artifacts.require('BridgeToken.sol')
let utils = require('./utils')

contract('BridgeToken', function (accounts) {
  let brg, roles
  const fs = require('fs')
  const fscb = function () { /* nothing to do in fs callback */ }

  before(async () => {
    brg = await BRG.deployed()
    roles = await Roles.deployed()
  })

  it('grants roles to users 0 and 2', () => {
    let brgHash = undefined
    return brg.contractHash()
      .then(hash => brgHash = hash)
      .then(() => roles.addContractRole(brgHash, 'admin'))
      .then(() => brg.hasRole('admin'))
      .then(hasAdmin => assert.ok(hasAdmin))
      .then(() => roles.addContractRole(brgHash, 'minter'))
      .then(() => brg.hasRole('minter'))
      .then(hasMinter => assert.ok(hasMinter))
      .then(tx => roles.grantUserRole(brgHash, 'admin', web3.eth.accounts[0]))
      .then(tx => roles.grantUserRole(brgHash, 'admin', web3.eth.accounts[2]))
      .then(tx => roles.grantUserRole(brgHash, 'minter', web3.eth.accounts[0]))
      .then(tx => roles.grantUserRole(brgHash, 'minter', web3.eth.accounts[2]))
  })

  it('has zero supply at the beginning', async () => {
      assert.equal((await brg.totalSupply()).toNumber(), 0)
  })

  it('can mint new tokens and get them directly to the owner', () => {
    return brg.mintFor(accounts[0], 1e18, {from: accounts[0]})
      .then(tx => {
        fs.appendFile('gas.csv', 'BridgeToken;mint;' + tx.receipt.gasUsed + '\n', fscb)
        return Promise.all([brg.balanceOf(accounts[0]), brg.totalSupply()])
      })
      .then(resp => {
        assert.equal(resp[0].toNumber(), 1e18)
        assert.equal(resp[1].toNumber(), 1e18)
      })
  })

  it('can mint for somebody new tokens', () => {
    return brg.mintFor(accounts[1], 1e18, {from: accounts[2]})
      .then(tx => {
        fs.appendFile('gas.csv', 'BridgeToken;mintFor;' + tx.receipt.gasUsed + '\n', fscb)
        return brg.balanceOf(accounts[1])
      })
      .then(balance => assert.equal(balance.toNumber(), 1e18))
  })

  it('fails to mint when unauthorised user tries it', async () => {
    await utils.assertThrowsAsynchronously(() => brg.mintFor(accounts[3], 1e18, {from: accounts[1]}))
  })

  it('can burn own tokens', () => {
    return brg.burn(1e17)
      .then(() => Promise.all([
        brg.totalSupply(),
        brg.balanceOf(accounts[0]),
        brg.balanceOf(accounts[1])]))
      .then(resp => {
        resp = resp.map(x => x.toNumber())
        assert.equal(resp[0], 19e17, 'total supply has decreased')
        assert.equal(resp[1], 9e17, 'balance of account 0 has changed')
        assert.equal(resp[2], 1e18, 'balance of account 1 didn\'t change')
      })
  })
})
