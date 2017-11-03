var BRG = artifacts.require('BridgeToken')
var Root = artifacts.require('Root')
var SWT = artifacts.require('SweetToken')
var Treasury = artifacts.require('Treasury')

contract('Root', function (accounts) {
  let root

  before(() => {
    return Root.deployed()
      .then(r => (root = r))
  })

  it('must have assigned correct singleton contracts', () => {
    return Promise.all([
      BRG.deployed(), root.brg('USD'),
      SWT.deployed(), root.swt(),
      Treasury.deployed(), root.treasury()
    ])
      .then(resp => {
        assert.equal(resp[0].address, resp[1], 'has correactly assigned Bridge token')
        assert.equal(resp[2].address, resp[3], 'has correactly assigned Sweet token')
        assert.equal(resp[4].address, resp[5], 'has correactly assigned Treasury')
      })
  })
})
