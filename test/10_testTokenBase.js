var Token = artifacts.require('Token')
var TokenLogic = artifacts.require('TokenLogic')
var TokenData = artifacts.require('TokenData')
var utils = require('./utils')

contract('TokenBase (Data + Logic)', function (accounts) {
  let t, tlogic, tdata

  before(() => {
    return Token.deployed()
      .then(x => { t = x; return t.logic() })
      .then(addr => { tlogic = TokenLogic.at(addr); return tlogic.data() })
      .then(addr => (tdata = TokenData.at(addr)))
  })

  it('has a TokenData contract which has some coins and whose owner is `accounts[0]`', () => {
    let owner
    return tdata.owner()
      .then(owner_ => {
        owner = owner_
        assert.equal(accounts[0], owner, 'accounts[0] is the TokenData owner')
        return Promise.all([tlogic.totalSupply(),
          tlogic.balanceOf(owner)])
      }).then(res => {
        assert.equal(res[0].toNumber(), res[1].toNumber(), 'owner holds all spply')
        assert(res[0].toNumber() > 1, 'owner balance > 1')
      })
  })

  it('has a linked Token contract', () => {
    return tlogic.token()
      .then(tokenAddr => assert.equal(tokenAddr, t.address,
                                      'the token address must be defined'))
  })

  it('Logic can\'t execute mint function', () => {
    return tlogic.mintFor(accounts[0], 1e18)
      .then(() => assert.fail('Previous statement should fails'))
      .catch(error => assert(error.message.indexOf('invalid opcode') >= 0))
  })

  it('Logic can\'t execute transfer function', () => {
    return tlogic.transfer(accounts[0], accounts[1], 1)
      .then(() => assert.fail('Previous statement should fails'))
      .catch(error => assert(error.message.indexOf('invalid opcode') >= 0))
  })

  it('can not replace the logic once it has been set', async () => {
    await utils.assertThrowsAsynchronously(() => t.setLogic(accounts[3], {from: accounts[0]}))
  })

  it('can replace the logic contract', async () => {
    let roles = await t.roles()
    let newLogic = await TokenLogic.new(t.address, tdata.address, 0, roles)
    let watcher = t.LogLogicReplaced({fromBlock: "latest"})
    await Promise.all([
      tlogic.replaceLogic(newLogic.address),
      new Promise((resolve, reject) => {
        watcher.watch(function(error, result) {
          // This will catch all Transfer events, regardless of how they originated.
          assert.notOk(error)
          assert.equal(newLogic.address, result.args.newLogic)
          watcher.stopWatching()
          resolve(true)
        })
        setTimeout(() => {
          watcher.stopWatching()
          reject(new Error('timeout'))
        }, 2000)
      })
    ])
  })
})
