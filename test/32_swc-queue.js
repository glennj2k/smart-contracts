const fs = require('fs')

var BRG = artifacts.require('BridgeToken')
var SWCq = artifacts.require('SWCqueue')
var Root = artifacts.require('Root')
let utils = require('./utils')

contract('SWCq', function (accounts) {
  const account1 = accounts[1]
  var brg, swcq
  const fscb = function () { /* nothing to do in fs callback */ }

  before(async () => {
    brg = await BRG.deployed()
    swcq = await SWCq.deployed()
    await assert.equal(await swcq.root(), Root.address, 'SWCq has correct Root address')
    await utils.addRole('minter', brg, accounts[0])
    await brg.mintFor(accounts[0], 1e21)
    await brg.mintFor(account1, 1e20)
  })

  it('can send BRG from other account to SWCqueue', async () => {
    const amount = 1e20
    let tx = await brg.transfer(SWCq.address, amount, {from: account1})
    let log = tx.logs.find(log => log.event === 'Transfer')
    assert.isOk(log, 'Transfer log should exists')
    assert.equal(log.args.from, account1)
    assert.equal(log.args.value.toNumber(), amount)
    let b = await brg.balanceOf(SWCq.address)
    assert.equal(b.toNumber(), 1e20)
    b = await brg.balanceOf(account1)
    assert.equal(b.toNumber(), 0)
  })

  it('can send BRG to SWCqueue', () => {
    return brg.transfer(SWCq.address, 1e20)
      .then((tx) => brg.balanceOf(SWCq.address))
      .then(b => assert.equal(b.toNumber(), 2e20))
  })

  it('can request pledge cancelletion and will not change balances', () => {
    return swcq.cancel(1e19, 'USD')
      .then(tx => {
        fs.appendFile('gas.csv', 'SWCq;cancel;' + tx.receipt.gasUsed + '\n', fscb)
        let cancelEvent = tx.logs.find(log => log.event === 'LogSWCqueueCancel')
        assert.ok(cancelEvent)
        return Promise.all([brg.balanceOf(SWCq.address), brg.balanceOf(accounts[0])])
      })
      .then(resp => {
        assert.equal(resp[0], 2e20, 'swcq BRG balance didn\'t change')
        assert.equal(resp[1], 9e20, 'coinbase BRG balance didn\'t change')
      })
  })

  it('can\'t burn more then it\'s pledged', () => {
    return swcq.burn(1e21, 'USD')
      .then(tx => assert.fail('Previous statement should fail'))
      .catch(error =>
             assert(error.message.indexOf('invalid opcode') >= 0, error))
  })

  it('can burn part of the pledge', () => {
    return swcq.burn(15e19, 'USD')
      .then(() => Promise.all([brg.balanceOf(SWCq.address), brg.balanceOf(accounts[0])]))
      .then(resp => {
        assert.equal(resp[0].toNumber(), 5e19, 'swcq BRG balance changed')
        assert.equal(resp[1].toNumber(), 9e20, 'coinbase BRG balance didn\'t change')
      })
  })
})
