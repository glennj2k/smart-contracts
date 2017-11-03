var Roles = artifacts.require('Roles')

function getParamFromTxEvent(transaction, paramName, contractFactory, eventName) {
    assert.isObject(transaction)
    let logs = transaction.logs
    if(eventName != null) {
        logs = logs.filter((l) => l.event === eventName)
    }
    assert.equal(logs.length, 1, 'too many logs found!')
    let param = logs[0].args[paramName]
    if(contractFactory != null) {
        let contract = contractFactory.at(param)
        assert.isObject(contract, `getting ${paramName} failed for ${param}`)
        return contract
    } else {
        return param
    }
}

function mineBlock(web3, reject, resolve) {
    web3.currentProvider.sendAsync({
        method: "evm_mine",
        jsonrpc: "2.0",
        id: new Date().getTime()
      }, (e) => (e ? reject(e) : resolve()))
}

function increaseTimestamp(web3, increase) {
    return new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
            method: "evm_increaseTime",
            params: [increase],
            jsonrpc: "2.0",
            id: new Date().getTime()
          }, (e) => (e ? reject(e) : mineBlock(web3, reject, resolve)))
    })
}

async function assertThrowsAsynchronously(test, error) {
    try {
        await test();
    } catch(e) {
        if (!error || e instanceof error)
            return "everything is fine";
    }
    throw new Error("Missing rejection" + (error ? " with "+error.name : ""));
}

async function addRole (roleName, contract, account) {
  let roles = Roles.at(Roles.address)
  let ctrhash = await contract.contractHash()
  let hasRole = await contract.hasRole(roleName)
  if (!hasRole)
    await roles.addContractRole(ctrhash, roleName)
  await roles.grantUserRole(ctrhash, roleName, account)
}

Object.assign(exports, {
  getParamFromTxEvent,
  increaseTimestamp,
  assertThrowsAsynchronously,
  addRole
})
