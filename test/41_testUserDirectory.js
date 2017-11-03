var Root = artifacts.require('Root')
var BRG = artifacts.require('BridgeToken')
var UserDirectory = artifacts.require('UserDirectory')
var Wallet = artifacts.require('Wallet')
let utils = require('./utils')

contract('UserDirectory', function (accounts) {
  let dir, root
  let newUser = accounts[9]
  const fs = require('fs')
  const fscb = function () { /* nothing to do in fs callback */ }

  before(async () => {
    root = await Root.deployed()
  })

  it('can create a new directory and attach it to the root contract', async () => {
    let tx = await root.addDirectory(newUser)
    fs.appendFile('gas.csv', 'Root;addDirectory;' + tx.receipt.gasUsed + '\n', fscb)
    let dirAdded = tx.logs.find(log => log.event === 'LogDirectoryAdded').args
    assert.equal(dirAdded.owner, newUser)
    dir = UserDirectory.at(dirAdded.newUserDirectory)
    await utils.addRole('userManager', dir, accounts[5])

    assert.equal(await dir.root(), root.address)
    assert.equal(await root.userDirectories(newUser), dir.address)
    assert.equal(await dir.owner(), newUser)

  })

  it('can not create a new directory for the same user and attach it to the root contract', async () => {
    await utils.assertThrowsAsynchronously(() => root.addDirectory(newUser))
  })

  it('creates and stores wallet contracts', async () => {
    let tx
    let walletAdded
    let wallet

    tx = await dir.addWallet('USD', {from: newUser})
    fs.appendFile('gas.csv', 'UserDirectory;addWallet;' + tx.receipt.gasUsed + '\n', fscb)
    walletAdded = tx.logs.find(log => log.event === 'LogWalletAdded').args;
    assert.equal(walletAdded.newWallet, await dir.wallets(0))

    tx = await dir.addWallet('USD', {from: accounts[5]})
    fs.appendFile('gas.csv', 'UserDirectory;addWallet;' + tx.receipt.gasUsed + '\n', fscb)
    walletAdded = tx.logs.find(log => log.event === 'LogWalletAdded').args;
    assert.equal(walletAdded.newWallet, await dir.wallets(1))

    tx = await dir.addWallet('USD', {from: newUser})
    fs.appendFile('gas.csv', 'UserDirectory;addWallet;' + tx.receipt.gasUsed + '\n', fscb)
    walletAdded = tx.logs.find(log => log.event === 'LogWalletAdded').args;
    assert.equal(walletAdded.newWallet, await dir.wallets(2))

    wallet = await Wallet.at(walletAdded.newWallet)
    assert.equal((await dir.walletCount()).toNumber(), 3)
    assert.equal(await wallet.currency(), web3.fromAscii('USD'))

    tx = await dir.removeWallet(wallet.address, {from: newUser})
    fs.appendFile('gas.csv', 'UserDirectory;removeWallet;' + tx.receipt.gasUsed + '\n', fscb)
    assert.equal((await dir.walletCount()).toNumber(), 2)
  })

  it('can manage kyc', async () => {
    assert.isNotOk(await dir.kyc())
    let tx = await dir.setKYC(true, {from: accounts[5]})
    fs.appendFile('gas.csv', 'UserDirectory;setKYC;' + tx.receipt.gasUsed + '\n', fscb)
    assert.ok(await dir.kyc())
  })
})
