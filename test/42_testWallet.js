var Root = artifacts.require('Root')
var UserDirectory = artifacts.require('UserDirectory')
var Wallet = artifacts.require('Wallet')
var Vault = artifacts.require('Vault')
var SWT = artifacts.require('SweetToken')
var BRG = artifacts.require('BridgeToken')
let utils = require('./utils')

contract('Wallet', function (accounts) {
  const user = accounts[5]
  let root
  let dir
  let wallet
  let vaultAddrs = []
  let swt
  const fs = require('fs')
  const fscb = function () { /* empty callback */ }

  before(async () => {
    root = await Root.deployed()
    swt = await SWT.deployed()
    let tx = await swt.transfer(user, 1.5e21)
    fs.appendFile('gas.csv', 'SweetToken;transfer;' + tx.receipt.gasUsed + '\n', fscb)
  })

  it('can create a wallet', async () => {
    let tx = await root.addDirectory(user)
    fs.appendFile('gas.csv', 'Root;addDirectory;' + tx.receipt.gasUsed + '\n', fscb)
    let dirAdded = tx.logs.find(log => log.event === 'LogDirectoryAdded').args
    dir = UserDirectory.at(dirAdded.newUserDirectory)
    await utils.addRole('userManager', dir, user)

    tx = await dir.addWallet('USD', {from: user})
    fs.appendFile('gas.csv', 'UserDirectory;addWallet;' + tx.receipt.gasUsed + '\n', fscb)
    let walletAdded = tx.logs.find(log => log.event === 'LogWalletAdded').args;

    wallet = Wallet.at(walletAdded.newWallet)
    assert.equal(await wallet.owner(), user)
  })

  it('removes the default SWT and BRG asset from the wallet', () => {
    return wallet.assetsLen()
      .then(l => {
        assert.equal(l.toNumber(), 2)
        return wallet.assets(0)
      })
      .then(asset => {
        assert.equal(asset, SWT.address)
        return wallet.rmAsset(SWT.address, accounts[1], {from: user})
      })
      .then(tx => {
        fs.appendFile('gas.csv', 'Wallet;rmAsset;' + tx.receipt.gasUsed + '\n', fscb)
        assert.isOk(tx)
        let removed = tx.logs.find(log => log.event === 'AssetRemoved').args
        assert.equal(removed.token, SWT.address)
        return wallet.rmAsset(BRG.address, accounts[1], {from: user})
      })
      .then(tx => {
        fs.appendFile('gas.csv', 'Wallet;rmAsset;' + tx.receipt.gasUsed + '\n', fscb)
        assert.isOk(tx)
        let removed = tx.logs.find(log => log.event === 'AssetRemoved').args
        assert.equal(removed.token, BRG.address)
      })
  })

  it('can create 2 vaults', async () => {
    let tx = await wallet.addVault({from: user})
    fs.appendFile('gas.csv', 'Wallet;addVault;' + tx.receipt.gasUsed + '\n', fscb)
    let vaultAdded = tx.logs.find(log => log.event === 'LogVaultAdded').args;
    vaultAddrs.push(vaultAdded.vault)

    tx = await wallet.addVault({from: user})
    fs.appendFile('gas.csv', 'Wallet;addVault;' + tx.receipt.gasUsed + '\n', fscb)
    vaultAdded = tx.logs.find(log => log.event === 'LogVaultAdded').args;
    vaultAddrs.push(vaultAdded.vault)

    assert.equal((await wallet.vaultCount()).toNumber(), 2, 'there should be 2 vaults')
    assert.equal(await wallet.vaults(0), vaultAddrs[0], 'Vault 1 is properly added')
    assert.equal(await wallet.vaults(1), vaultAddrs[1], 'Vault 2 is properly added')

  })

  it('can list vaults', async () => {
    let vs = await wallet.listVaults()
    assert.equal(vs[0], vaultAddrs[0], 'Vault 1 is properly added')
    assert.equal(vs[1], vaultAddrs[1], 'Vault 2 is properly added')
  })

  it('can remove a vault', () => {
    return wallet.vaults(0)
      .then(vault => Vault.at(vault).remove({from: user}))
      .then(tx => {
        fs.appendFile('gas.csv', 'Vault;remove;' + tx.receipt.gasUsed + '\n', fscb)
        return wallet.vaultCount()
      })
      .then(n => {
        assert.equal(n, 1, 'there must be 1 vault left')
        return wallet.vaults(0)
      })
      .then(addr => {
        assert.equal(addr, vaultAddrs[1], 'only vault 0 was removed')
      })
  })

  it('can add SWC as an asset', () => {
    return swt.approve(wallet.address, 1e21, {from: user})
      .then((tx) => wallet.addAsset(swt.address, user, 6e20, {from: user}))
      .then(tx => {
        fs.appendFile('gas.csv', 'Wallet;addAsset;' + tx.receipt.gasUsed + '\n', fscb)
        return Promise.all([
          wallet.assetsLen(),
          wallet.assets(0),
          wallet.balances(),
          wallet.balanceOf(SWT.address),
          swt.balanceOf(wallet.address),
          swt.balanceOf(user)])
      })
      .then(resp => {
        assert.equal(resp[0].toNumber(), 1)  // check assets len
        assert.equal(resp[1], SWT.address)
        let [tokens, balancesBN] = resp[2]
        let balances = balancesBN.map(x => x.toNumber())
        assert.deepEqual(balances, [6e20])
        assert.deepEqual(tokens, [SWT.address])
        assert.equal(resp[3].toNumber(), 6e20)
        assert.equal(resp[4].toNumber(), 6e20)
        assert.equal(resp[5].toNumber(), 1.5e21 - 6e20) // 1.5e21 = initial SWT supply for user
      })
  })

  it('can not remove a vault if called directly on the wallet', () => {
    return wallet.vaults(0)
      .then(vault => {
        assert.ok(vault)
        assert.notEqual(vault, '0x0000000000000000000000000000000000000000')
        return wallet.removeVault(vault)
      })
      .then(() => assert.fail('Previous statement should fails'))
      .catch(error => assert(error.message.indexOf('invalid opcode') >= 0,
                             'wrong message ' + error.message))
  })
})
