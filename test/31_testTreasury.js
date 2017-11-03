var Root = artifacts.require('Root')
var Treasury = artifacts.require('Treasury')

contract('Treasury', function (accounts) {
  let treasury

  before(() => {
    return Treasury.deployed()
      .then(t => (treasury = t))
  })

  it('must have correctly assigned root ', () => {
    return Promise.all([Root.deployed(), treasury.root()])
      .then(resp => assert.equal(resp[0].address, resp[1], 'root is correct'))
  })
})
