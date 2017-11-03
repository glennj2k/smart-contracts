/* global web3 */

var helpers = require('./helpers.js')
var SweetToken = artifacts.require('SweetToken')

contract('SweetToken', function (accounts) {
  let swt
  const fs = require('fs')
  const fscb = function () { /* nothing to do in fs callback */ }

  before(() => {
    return SweetToken.deployed()
      .then(t => (swt = t))
  })

  it('can not mint new tokens - even from owner', () => {
    return swt.totalSupply()
      .then(ts => {
        assert.equal(ts.toNumber(), 1e26)
        return swt.mintFor(accounts[0], 1e18)
      })
      .then(() => assert.fail('Previous statement should fails'))
      .catch(err => assert(err.message.indexOf('invalid opcode') >= 0,
        'assertion error on mint ' + err.message + ' ' + swt.address))
  })

  it('can not burn tokens', () => {
    return swt.burn(1e17)
      .then((x) => {
        console.log('%%%%%%%%%%%%', x)
        assert.fail('Previous statement should fails')
      }).catch(err => {
        assert(err.message.indexOf('invalid opcode') >= 0, err)
      })
  })

  it('does not accept ether', () => {
    return helpers.sendTransaction(
      {from: accounts[0], to: swt.address, value: web3.toWei(1, 'ether')})
      .then(() => assert.fail('Previous statement should fails'))
      .catch(err => assert(err.message.indexOf('invalid opcode') >= 0,
                           err.message))
  })

  it('can transfer sweetcoins', () => {
    let ownerBalance = 0
    return swt.balanceOf(accounts[0])
      .then(bal => {
        ownerBalance = bal
        assert(bal.toNumber() > 1e25)
        return swt.transfer(accounts[1], 1e25)
      })
      .then(tx => {
        fs.appendFile('gas.csv', 'SweetToken;transfer;' + tx.receipt.gasUsed + '\n', fscb)
        assert(tx, 'transaction returns true')
        return Promise.all([
          swt.balanceOf(accounts[0]),
          swt.balanceOf(accounts[1])
        ])
      })
      .then(res => {
        assert.equal(res[0].toNumber(), ownerBalance.sub(res[1]).toNumber(), 'src account balance has been updated')
        assert.equal(res[1].toNumber(), 1e25, 'src account balance has been updated')
        return swt.transfer(accounts[2], 5e24, {from: accounts[1]})
      })
      .then(tx => {
        fs.appendFile('gas.csv', 'SweetToken;transfer;' + tx.receipt.gasUsed + '\n', fscb)
        assert(tx, 'transaction returns true')
        return Promise.all([
          swt.balanceOf(accounts[1]),
          swt.balanceOf(accounts[2])
        ])
      })
      .then(res => {
        assert.equal(res[0].toNumber(), 5e24, 'accounts[1] balance has been updated')
        assert.equal(res[1].toNumber(), 5e24, 'accounts[2] balance has been updated')
        return true
      })
  })

  it('allows to pull - transferFrom tokens', () => {
    return swt.approve(accounts[1], 1e21)
      .then(tx => {
        fs.appendFile('gas.csv', 'SweetToken;approve;' + tx.receipt.gasUsed + '\n', fscb)
        return swt.allowance(accounts[0], accounts[1])
      })
      .then(allowance => assert.equal(allowance.toNumber(), 1e21))
      .then(() => swt.pull(accounts[0], 5e20, {from: accounts[1]}))
      .then(tx => {
        fs.appendFile('gas.csv', 'SweetToken;pull;' + tx.receipt.gasUsed + '\n', fscb)
        return swt.allowance(accounts[0], accounts[1])
      })
      .then(allowance => assert.equal(allowance.toNumber(), 5e20))
      .then(() => swt.transferFrom(accounts[0], accounts[1], 5e20, {from: accounts[2]}))
      .then(tx => {
        fs.appendFile('gas.csv', 'SweetToken;transferFrom;' + tx.receipt.gasUsed + '\n', fscb)
        return swt.allowance(accounts[0], accounts[1])
      })
      .then(allowance => assert.equal(allowance.toNumber(), 0))
  })
})
