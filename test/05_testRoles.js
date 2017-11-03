let utils = require('./utils')
var Roles = artifacts.require('Roles')

contract('Roles', function (accounts) {
  let roles
  let contractHash

  before(async () => {
    roles = await Roles.deployed()
    contractHash = await roles.contractHash()
  })

  it('has accounts[0] as owner', async () => {
    assert.equal(await roles.owner(), accounts[0])
  })

  it('is named RolesRepository', async () => {
    assert.equal(contractHash, web3.sha3('RolesRepository'))
  })

  it('can add a new role for the contract', async () => {
    await roles.addContractRole(contractHash, 'admin')
    assert.ok(await roles.hasRole('admin'))
  })

  it('can grant a role to a user in the contract', async () => {
    // neither owner nor role should throw
    await utils.assertThrowsAsynchronously(() => roles.grantUserRole(contractHash, 'admin', accounts[1], {from: accounts[5]}))

    await roles.grantUserRole(contractHash, 'admin', accounts[5])
    assert.ok(await roles.roleList(contractHash, web3.sha3('admin'), accounts[5]))

    // now that the user is permissioned it should work
    await roles.grantUserRole(contractHash, 'admin', accounts[6], {from: accounts[5]})
    assert.ok(await roles.roleList(contractHash, web3.sha3('admin'), accounts[6]))
  })

  it('can revoke a role from a user in the contract', async () => {
    assert.ok(await roles.roleList(contractHash, web3.sha3('admin'), accounts[5]))
    await roles.revokeUserRole(contractHash, 'admin', accounts[5], {from: accounts[5]})
    assert.notOk(await roles.roleList(contractHash, web3.sha3('admin'), accounts[5]))

    // now that the user is not permissioned anymore it should not work
    assert.ok(await roles.roleList(contractHash, web3.sha3('admin'), accounts[6]))
    await utils.assertThrowsAsynchronously(() => roles.revokeUserRole(web3.sha3('RolesRepository'), web3.sha3('admin'), accounts[6], {from: accounts[5]}))
  })

  it('can remove a role from the contract', async () => {
    /*check that the user still has permission before removing the role*/
    await roles.grantUserRole(contractHash, 'admin', accounts[1], {from: accounts[6]})
    let tx = await roles.removeContractRole(contractHash, 'admin')
    assert.equal(utils.getParamFromTxEvent(tx, 'contractHash', null, 'LogRoleRemoved'), contractHash)
    assert.equal(utils.getParamFromTxEvent(tx, 'roleName', null, 'LogRoleRemoved'), 'admin')
    assert.notOk(await roles.hasRole('admin'))
  })

  it('ignores privileges of removed roles', async () => {
    await utils.assertThrowsAsynchronously(() => roles.grantUserRole(contractHash, 'admin', accounts[1], {from: accounts[6]}))
  })

})
