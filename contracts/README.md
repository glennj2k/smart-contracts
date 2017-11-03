# How to use the smart contracts

this documents gives input on how to use the smart contracts in the geth console. This differs from how one would use
them in a program but should give an indication of what is expected.

> Remember: numbers in web3js are allways BigNumber objects and must be converted to a JavaScript number by calling the
`toNumber` function on them

## Exchange

The exchange contract contains all the asset pairs and the prices for 1 unit of fiat currency in tokens.

If tohe price for a token (e.g. BNT) is USD 2.5 and the number of decimals of the token is 18 then the price would be `1e18/2.5` which is `4e17`

### constant functions

Use `view` or `pure` for constant functions.

````
function getPrice(bytes4 currency, ERC20 token) view returns(uint)
````

####example:

````
var exchange = eth.contract(abi).at("0xthecontractethaddress0000000000000000000");
var sct2usd = exchange.getPrice("USD", "0xSweetCoinEthereumAddress0000000000000000");
console.log(sct2usd.toNumber()) //will print 400'000'000'000'000'000
console.log(web3.fromWei(sct2usd, "ether") // will print 0.4 we can use the toWei and fromWei functions because our token has the same number of decimals as ETH
````

### transaction functions

````
function setPrice(address token, bytes4 currency, uint price) auth ;
````

####example:

````
var exchange = eth.contract(abi).at("0xthecontractethaddress0000000000000000000");
var sct2usd = 4e17;
personal.unlock(accounts[0], "my super strong password");
exchange.setPrice("USD", "0xSweetCoinEthereumAddress0000000000000000", sct2usd);

````

## Vault

The vault contains a list of assets which in turn contain the list of UOU contracts. A vault must be created for a
specific owner.
