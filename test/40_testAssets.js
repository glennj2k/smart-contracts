var Roles = artifacts.require('Roles')
var Assets = artifacts.require('Assets')
var SWT = artifacts.require('SweetToken')
var TestCoin = artifacts.require('Token')
let helpers = require('./helpers.js')

contract('Assets', function (accounts) {
  let assets
  let swt, ttc
  const swtSupply = 1e26
  const ttcSupply = 1e26
  const fs = require('fs')
  const fscb = function () { /* nothing to do in fs callback */ }

  before(() => {
    return Promise.all([Assets.new([SWT.address], 'Assets', Roles.address), SWT.deployed(), TestCoin.deployed()])
      .then(resp => {
        assets = resp[0]
        swt = resp[1]
        ttc = resp[2]
        return ttc.balanceOf(accounts[0])
      })
      // ttc total supply = ttcSupply -> migrations/21_test_raw_token.js
      .then(b => assert.equal(b.toNumber(), ttcSupply,
        'Initial check: TTC initial supplay is as expected in this test'))
  })

  it('checks allowance for doing transfers to assets', () => {
    return ttc.allowance(accounts[0], assets.address)
      .then(wad => {
        assert.equal(wad.toNumber(), 0, 'Precondition check: at the beginning the allowance for the assets is 0')
        return ttc.approve(assets.address, 1e16)
      })
      .then(tx => {
        fs.appendFile('gas.csv', 'Token;approve;' + tx.receipt.gasUsed + '\n', fscb)
        assert.isOk(tx, 'approve should succeed')
        return assets.addAsset(TestCoin.address, accounts[0], 3e16)
      })
      .then(() => assert.fail('Previous statement should fail - not enough apporved assets'))
      .catch(error => assert(error.message.indexOf('invalid opcode') >= 0))
      .then(() => ttc.approve(assets.address, 2e16))
      .then(tx => {
        fs.appendFile('gas.csv', 'Token;approve;' + tx.receipt.gasUsed + '\n', fscb)
        return ttc.allowance(accounts[0], assets.address)
      })
      .then(wad => assert.equal(wad.toNumber(), 2e16,
        'approve will reset allowance to the new value'))
  })

  it('removes the default asset', () => {
    return assets.assetsLen()
      .then(l => {
        assert.equal(l.toNumber(), 1)
        return assets.assets(0)
      })
      .then(asset => {
        assert.equal(asset, SWT.address)
        return assets.rmAsset(SWT.address, accounts[1])
      })
      .then(tx => {
        fs.appendFile('gas.csv', 'SweetToken;rmAsset;' + tx.receipt.gasUsed + '\n', fscb)
        assert.isOk(tx)
        let removed = tx.logs.find(log => log.event === 'AssetRemoved').args
        assert.equal(removed.token, SWT.address)
      })
  })

  it('is possible to add SWT as an asset', () => {
    return swt.approve(assets.address, 1e21)
      .then(tx => {
        fs.appendFile('gas.csv', 'SweetToken;approve;' + tx.receipt.gasUsed + '\n', fscb)
        return assets.addAsset(SWT.address, accounts[0], 5e20)
      })
      .then(tx => {
        fs.appendFile('gas.csv', 'SweetToken;addAsset;' + tx.receipt.gasUsed + '\n', fscb)
        return assets.addAsset(SWT.address, accounts[0], 1e20)
      })
      .then(tx => {
        fs.appendFile('gas.csv', 'SweetToken;addAsset;' + tx.receipt.gasUsed + '\n', fscb)
        return Promise.all([
          assets.assetsLen(),
          assets.assets(0),
          assets.balances(),
          assets.balanceOf(SWT.address),
          swt.balanceOf(assets.address),
          swt.balanceOf(accounts[0])])
      })
      .then(resp => {
        assert.equal(resp[0].toNumber(), 1, 'there should be 1 asset')
        assert.equal(resp[1], SWT.address)
        let [tokens, balancesBN] = resp[2]
        let balances = balancesBN.map(x => x.toNumber())
        assert.deepEqual(balances, [6e20])
        assert.deepEqual(tokens, [SWT.address])
        assert.equal(resp[3].toNumber(), 6e20, 'SWT assets balance is correct')
        assert.equal(resp[4].toNumber(), 6e20, 'assets SWT balance is correct')
        assert.equal(resp[5].toNumber(), swtSupply - 6e20, 'account[0] SWT balance is correct')
      })
  })

  // this test requires previous test execution
  it('is possible to add second asset', () => {
    return ttc.approve(assets.address, 3e24)
      .then(tx => {
        fs.appendFile('gas.csv', 'SweetToken;approve;' + tx.receipt.gasUsed + '\n', fscb)
        return assets.addAsset(TestCoin.address, accounts[0], 3e24)
      })
      .then(tx => {
        fs.appendFile('gas.csv', 'SweetToken;addAsset;' + tx.receipt.gasUsed + '\n', fscb)
        return Promise.all([
          assets.assetsLen(),
          assets.assets(1),
          assets.balances(),
          assets.balanceOf(TestCoin.address),
          ttc.balanceOf(assets.address),
          ttc.balanceOf(accounts[0])])
      })
      .then(resp => {
        assert.equal(resp[0].toNumber(), 2, 'there should be 2 assets')
        assert.equal(resp[1], TestCoin.address)
        let [tokens, balancesBN] = resp[2]
        let balances = balancesBN.map(x => x.toNumber())
        assert.deepEqual(balances, [6e20, 3e24])
        assert.deepEqual(tokens, [SWT.address, TestCoin.address])
        assert.equal(resp[3].toNumber(), 3e24, 'TTC assets balance is correct')
        assert.equal(resp[4].toNumber(), 3e24, 'assets TTC balance is correct')
        assert.equal(resp[5].toNumber(), ttcSupply - 3e24, 'account[0] TTC balance is correct')
      })
  })

  it('is possible to add again SWT', () => {
    return assets.addAsset(SWT.address, accounts[0], 1e20)
      .then(tx => {
        fs.appendFile('gas.csv', 'SweetToken;addAsset;' + tx.receipt.gasUsed + '\n', fscb)
        return Promise.all([
          assets.assetsLen(),
          assets.assets(0),
          assets.balances(),
          assets.balanceOf(SWT.address),
          swt.balanceOf(assets.address),
          swt.balanceOf(accounts[0])])
      })
      .then(resp => {
        assert.equal(resp[0].toNumber(), 2, 'there should be 2 assets')
        assert.equal(resp[1], SWT.address)
        let [tokens, balancesBN] = resp[2]
        let balances = balancesBN.map(x => x.toNumber())
        assert.deepEqual(balances, [7e20, 3e24])
        assert.deepEqual(tokens, [SWT.address, TestCoin.address])
        assert.equal(resp[3].toNumber(), 7e20, 'SWT assets balance is correct')
        assert.equal(resp[4].toNumber(), 7e20, 'assets SWT balance is correct')
        assert.closeTo(resp[5].toNumber(), swtSupply - 7e20, 1e24,
          'account[0] SWT balance is correct')
      })
  })

  it('is possible to remove an asset', () => {
    return assets.assetsLen()
      .then(l => {
        assert.equal(l.toNumber(), 2)
        return assets.rmAsset(TestCoin.address, accounts[1])
      })
      .then(tx => {
        fs.appendFile('gas.csv', 'SweetToken;rmAsset;' + tx.receipt.gasUsed + '\n', fscb)
        assert.isOk(tx)
      })
      .then(() => Promise.all([
        assets.assetsLen(),
        assets.assets(0),
        assets.balances(),
        assets.balanceOf(TestCoin.address),
        ttc.balanceOf(assets.address),
        ttc.balanceOf(accounts[0]),
        ttc.balanceOf(accounts[1])]))
      .then(resp => {
        assert.equal(resp[0].toNumber(), 1, 'there should be only 1 asset left in the assets')
        assert.equal(resp[1], SWT.address)
        let [tokens, balancesBN] = resp[2]
        let balances = balancesBN.map(x => x.toNumber())
        assert.deepEqual(balances, [7e20])
        assert.deepEqual(tokens, [SWT.address])
        assert.equal(resp[3].toNumber(), 0, 'TTC assets balance is correct')
        assert.equal(resp[4].toNumber(), 0, 'assets TTC balance is correct')
        assert.equal(resp[5].toNumber(), ttcSupply - 3e24,
          'account[0] TTC balance didn\'t change')
        assert.equal(resp[6].toNumber(), 3e24, 'account[0] TTC balance has been updated')
      })
  })

  it('can receive ETH', () => {
    return helpers.sendTransaction({from: accounts[0], to: assets.address, value: 1e19})
    // return web3.eth.getTransactionReceipt(tx)
      .then(tx => assets.ethBalance())
      .then(balance => assert.equal(balance.toNumber(), 1e19))
  })

  it('can send the ether away', () => {
    let startBalance = 0
    return assets.ethBalance()
      .then(balance => {
        assert.equal(balance.toNumber(), 1e19)
        return web3.eth.getBalance(accounts[5])
      })
      .then(balance => {
        startBalance = balance
        return assets.transferEth(accounts[5], 5e18)
      })
      .then(tx => helpers.getBalance(accounts[5]))
      .then(balance => assert.equal(balance.sub(startBalance).toNumber(), 5e18))
  })
})
