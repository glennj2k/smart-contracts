/* global web3 */

// wraps web3 sync/callback function into a Promise
function web3AsynWrapper (web3Fun) {
  return function (arg) {
    return new Promise((resolve, reject) => {
      web3Fun(arg, (e, data) => e ? reject(e) : resolve(data))
    })
  }
}

exports.sendTransaction = web3AsynWrapper(web3.eth.sendTransaction)
exports.getBalance = web3AsynWrapper(web3.eth.getBalance)
exports.getTransaction = web3AsynWrapper(web3.eth.getTransaction)
exports.getTransactionReceipt = web3AsynWrapper(web3.eth.getTransactionReceipt)
