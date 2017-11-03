
const fs = require('fs')

var Root = artifacts.require('Root')
var BRG = artifacts.require('BridgeToken')
var UserDirectory = artifacts.require('UserDirectory')
var Wallet = artifacts.require('Wallet')
var Vault = artifacts.require('Vault')
var SWT = artifacts.require('SweetToken')
let helpers = require('./helpers.js')
let utils = require('./utils')

contract('Vault', function (accounts) {
  var root
  var vault
  var dir
  var wallet
  var brg
  var swt
  let user = accounts[4]
  let uouOracle = accounts[7]
  const fscb = function () { /* nothing to do in fs callback */ }

  before(async () => {
    root = await Root.deployed()
    brg = await BRG.deployed()
    swt = await SWT.deployed()
    swt.transfer(user, 1e22, {from: accounts[0]})
  })

  it('can create a vault', async () => {
    let tx = await root.addDirectory(user)
    fs.appendFile('gas.csv', 'Root;addDirectory;' + tx.receipt.gasUsed + '\n', fscb)
    let dirAdded = tx.logs.find(log => log.event === 'LogDirectoryAdded').args
    dir = UserDirectory.at(dirAdded.newUserDirectory)
    await utils.addRole('userManager', dir, user)

    tx = await dir.addWallet('USD', {from: user})
    fs.appendFile('gas.csv', 'UserDirectory;addWallet;' + tx.receipt.gasUsed + '\n', fscb)
    let walletAdded = tx.logs.find(log => log.event === 'LogWalletAdded').args

    wallet = Wallet.at(walletAdded.newWallet)
    assert.equal(await wallet.owner(), user)

    await wallet.addAsset(BRG.address, '0x0', 0, {from: user})
  })

  it('creates a new Vault in the Wallet', async () => {
    let tx = await wallet.addVault({from: user})
    fs.appendFile('gas.csv', 'Wallet;addVault;' + tx.receipt.gasUsed + '\n', fscb)
    let vaultAdded = tx.logs.find(log => log.event === 'LogVaultAdded').args
    vault = Vault.at(vaultAdded.vault)
    assert.equal(await wallet.owner(), await vault.owner())
    await utils.addRole('uouOracle', vault, uouOracle)
    await utils.addRole('minter', brg, vault.address)
    await utils.addRole('minter', brg, accounts[0])
  })

  it('has been initialized', () => {
    return vault.owner()
      .then(owner => assert.equal(owner, user))
      .then(() => vault.wallet())
      .then(walletAddress => assert.equal(walletAddress, wallet.address))
      .then(() => dir.root())
      .then(rootAddr => assert.equal(rootAddr, Root.address, 'recorded Root address must be the deployed address'))
      .then(() => vault.uouCount())
      .then((uous) => assert.equal(0, uous.toNumber()))
  })

  it('removes the default SWT and BRG assets from the wallet', () => {
    return vault.assetsLen()
      .then(l => {
        assert.equal(l.toNumber(), 2)
        return vault.assets(0)
      })
      .then(asset => {
        assert.equal(asset, SWT.address)
        return vault.rmAsset(SWT.address, accounts[1], {from: user})
      })
      .then(tx => {
        fs.appendFile('gas.csv', 'SweetToken;rmAsset;' + tx.receipt.gasUsed + '\n', fscb)
        assert.isOk(tx)
        let removed = tx.logs.find(log => log.event === 'AssetRemoved').args
        assert.equal(removed.token, SWT.address)
        return vault.rmAsset(BRG.address, accounts[1], {from: user})
      })
      .then(tx => {
        fs.appendFile('gas.csv', 'Wallet;rmAsset;' + tx.receipt.gasUsed + '\n', fscb)
        assert.isOk(tx)
        let removed = tx.logs.find(log => log.event === 'AssetRemoved').args
        assert.equal(removed.token, BRG.address)
      })
  })

  // this test requires previous test execution
  it('can add SWC as an asset', () => {
    return swt.approve(vault.address, 1e21, {from: user})
      .then(tx => {
        fs.appendFile('gas.csv', 'SweetToken;approve;' + tx.receipt.gasUsed + '\n', fscb)
        return vault.addAsset(swt.address, user, 6e20, {from: user})
      })
      .then(tx => {
        fs.appendFile('gas.csv', 'Vault;addAsset;' + tx.receipt.gasUsed + '\n', fscb)
        return Promise.all([
          vault.assetsLen(),
          vault.assets(0),
          vault.balanceOf(SWT.address),
          swt.balanceOf(vault.address),
          swt.balanceOf(user)])
      })
      .then(resp => {
        assert.equal(resp[0].toNumber(), 1)  // check assets len
        assert.equal(resp[1], SWT.address)
        assert.equal(resp[2].toNumber(), 6e20)
        assert.equal(resp[3].toNumber(), 6e20)
        assert.equal(resp[4].toNumber(), 1e22 - 6e20)  // 1e22 = initial SWT supply
      })
  })

  it('can request UOU for 1\'000 BRG', () => {
    return vault.requestUou(1e21, {from: user})
      .then(tx => {
        fs.appendFile('gas.csv', 'Vault;requestUou;' + tx.receipt.gasUsed + '\n', fscb)
        let uouRequested = tx.logs.find(log => log.event === 'UouRequested')
        assert.ok(uouRequested)
        assert.equal(uouRequested.args.brgAmount.toNumber(), 1e21)
        return vault.amountDue()
      })
      .then(due => assert.equal(due.toNumber(), 0))
  })

  it('adds the UOU amount to the amount due in case of acceptance', () => {
    return vault.senderHasRole('uouOracle', {from: uouOracle})
      .then(res => assert.ok(res))
      .then(() => vault.acceptUouRequest(0, {from: uouOracle}))
      .then(tx => {
        fs.appendFile('gas.csv', 'Vault;acceptUouRequest;' + tx.receipt.gasUsed + '\n', fscb)
        let uouRequestApproval = tx.logs.find(log => log.event === 'UouRequestApproved')
        assert.ok(uouRequestApproval)
        assert.equal(uouRequestApproval.args.brgAmount.toNumber(), 1e21)
        return brg.balanceOf(wallet.address)
      })
      .then(balance => {
        assert.equal(balance.toNumber(), 1e21)
        wallet.transfer(BRG.address, user, 1e21, {from: user})
        return vault.amountDue()
      })
      .then(due => {
        assert.equal(due.toNumber(), 1e21)
        return vault.uous(0)
      })
      .then(uou => {
        assert.equal(uou[0].toNumber(), 1e21, 'initialAmount')
        assert.equal(uou[1].toNumber(), 0, 'repaidAmount')
        assert.equal(uou[2].toNumber(), 0, 'fee')
        assert.equal(uou[4].toNumber(), 2, 'decision')
      })
  })

  it('fails if the same UOU is settled a second time', () => {
    return vault.acceptUouRequest(0, {from: uouOracle})
      .then(tx => assert.fail('Previous statement should fail'))
      .catch(error => assert(error.message.indexOf('invalid opcode') >= 0))
  })

  it('does not increase the amount due if the UOU is rejected', () => {
    return vault.requestUou(1e21, {from: user})
      .then(tx => {
        fs.appendFile('gas.csv', 'Vault;requestUou;' + tx.receipt.gasUsed + '\n', fscb)
        let uouRequested = tx.logs.find(log => log.event === 'UouRequested')
        assert.ok(uouRequested)
        assert.equal(uouRequested.args.brgAmount.toNumber(), 1e21)
        return vault.rejectUouRequest(1, {from: uouOracle})
      })
      .then(tx => {
        fs.appendFile('gas.csv', 'Vault;rejectUouRequest;' + tx.receipt.gasUsed + '\n', fscb)
        let uouRequestDeclined = tx.logs.find(log => log.event === 'UouRequestDeclined')
        assert.ok(uouRequestDeclined)
        assert.equal(uouRequestDeclined.args.brgAmount.toNumber(), 1e21)
        return vault.amountDue()
      })
      .then(due => {
        assert.equal(due.toNumber(), 1e21)
        return vault.uous(1)
      })
      .then(uou => {
        assert.equal(uou[0].toNumber(), 1e21, 'initialAmount')
        assert.equal(uou[1].toNumber(), 0, 'repaidAmount')
        assert.equal(uou[2].toNumber(), 0, 'fee')
        assert.equal(uou[4].toNumber(), 1, 'decision')
      })
  })

  it('repays part of a UOU', () => {
    return brg.repayUou(5e20, vault.address, 0, {from: user})
      .then(tx => {
        fs.appendFile('gas.csv', 'BridgeToken;repayUou;' + tx.receipt.gasUsed + '\n', fscb)
        let transfer = tx.logs.find(log => log.event === 'Transfer')
        assert.ok(transfer)
        assert.equal(transfer.args.from, user)
        assert.equal(transfer.args.to, vault.address)
        assert.equal(transfer.args.value.toNumber(), 5e20)
        return vault.amountDue()
      })
      .then(due => {
        assert.equal(due.toNumber(), 1e21)
        return brg.balanceOf(user)
      })
      .then(balance => {
        assert.equal(balance.toNumber(), 5e20)
        return vault.uous(0)
      })
      .then(uou => {
        assert.equal(uou[0].toNumber(), 1e21, 'initialAmount')
        assert.equal(uou[1].toNumber(), 5e20, 'repaidAmount')
        assert.equal(uou[2].toNumber(), 0, 'fee')
        assert.equal(uou[4].toNumber(), 2, 'decision')
        return brg.mintFor(user, 5e20)
      })
      .then(tx => {
        fs.appendFile('gas.csv', 'BridgeToken;mintFor;' + tx.receipt.gasUsed + '\n', fscb)
        return true
      })
  })

  it('repays total of a UOU even though more is sent', () => {
    return brg.repayUou(6e20, vault.address, 0, {from: user})
      .then(tx => {
        fs.appendFile('gas.csv', 'BridgeToken;repayUou;' + tx.receipt.gasUsed + '\n', fscb)
        let transfer = tx.logs.find(log => log.event === 'Transfer')
        assert.ok(transfer)
        assert.equal(transfer.args.value.toNumber(), 5e20)
        return vault.amountDue()
      })
      .then(due => {
        assert.equal(due.toNumber(), 1e21)
        return vault.uous(0)
      })
      .then(uou => {
        assert.equal(uou[0].toNumber(), 1e21, 'initialAmount')
        assert.equal(uou[1].toNumber(), 1e21, 'repaidAmount')
        assert.equal(uou[2].toNumber(), 0, 'fee')
        assert.equal(uou[4].toNumber(), 2, 'decision')
      })
  })

  it('throws an exception when trying to repay a declined UOU', () => {
    return brg.repayUou(5e20, vault.address, 1)
      .then(() => assert.fail('Previous statement should fail'))
      .catch(error => assert(error.message.indexOf('invalid opcode') >= 0))
  })

  it('can receive ETH', () => {
    return helpers.sendTransaction({from: accounts[0], to: vault.address, value: 1e19})
      .then(tx => helpers.getTransactionReceipt(tx))
      .then(rcpt => vault.ethBalance())
      .then(balance => {
        assert(balance.toNumber, 1e19)
        return true
      })
  })
})
