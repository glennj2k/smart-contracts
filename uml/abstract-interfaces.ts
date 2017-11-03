export type address = string
export type b32 = string
export type b8 = string
export type b4 = string
export type signature = string

export type uint = number
export type uint256 = number
export type uint128 = number
export type uint8 = number
export type int = number
export type int256 = number
export type int126 = number

export class Msg {
  sig: string
  sender: string
  value: number
  data: string
}

export interface IMath {

  // standard uint256 functions

  add (x: number, y: number)
  sub (x: number, y: number)
  mul (x: number, y: number)
  div (x: number, y: number)
  min (x: number, y: number)
  max (x: number, y: number)

  // uint128 functions

  hadd (x: number, y: number)
  hsub (x: number, y: number)
  hmul (x: number, y: number)
  hdiv (x: number, y: number)
  hmin (x: number, y: number)
  hmax (x: number, y: number)

  // WAD math

  wadd (x: number, y: number)
  wsub (x: number, y: number)
  wmul (x: number, y: number)
  wdiv (x: number, y: number)
  wmin (x: number, y: number)
  wmax (x: number, y: number)
}

export class Note {
  LogNote (s: signature, adr: address, foo: b32, bar: b32, wad: uint, fax: string) { return }

  modifier_note (msg: Msg) { return }
}

export interface IAuthority {
  canCall (src: address, dst: address, sig: b4): boolean
}

class AuthEvents {
  LogSetAuthority (authority: address) { return }
  LogSetOwner (owner: address ) { return }
  UnauthorizedAccess (caller: address, sig: b4) { return }
}

export class Auth extends AuthEvents {
  public authority: IAuthority
  public owner: address

  constructor (msg: Msg) { super() }
  setOwner (msg: Msg, owner: address) { return }
  setAuthority (msg: Msg, authority: IAuthority) { return }
  isAuthorized (src: address, sig: b4): boolean { return true }

  modifier_auth () { return }
}

export class Accounts extends Auth {
  public supply: uint256
  public balances: Map<address, uint256>
  public approvals: Map<address, Map<address, uint256>>
  token: address

  constructor (msg: Msg, token: address, supply: uint, owner: address) { super(msg) }
  setToken (msg: Msg, token: address) { return }
  setSupply (msg: Msg, supply: uint) { return }
  setBalances (msg: Msg, guy: address, balance: uint) { return }
  setApprovals (msg: Msg, guy: address, wad: uint) { return }
}

export interface IStoppable extends Auth, Note {
  stopped: boolean

  stop (msg: Msg)
  start (msg: Msg)

  modifier_stoppable ()
}

export interface IERC20Events {
  LogTransfer (_from: address, _to: address, value: uint)
  LogApproval (owner: address, spender: address, value: uint)
}

export interface IERC20 extends IERC20Events {
  totalSupply (): uint
  balanceOf (who: address)
  allowance (owner: address, spender: address): uint

  transfer (msg: Msg, to: address, value: uint): boolean
  transferFrom (msg: Msg, _from: address, _to: address, value: uint): boolean
  approve (msg: Msg, spender: address, value: uint): boolean
}

export interface IToken extends IERC20, IStoppable {
  symbol: b32
  name: string
  decimals: uint
  logic: any

  constructor (msg: Msg, name: string, symbol: b32)

  setName (msg: Msg, name: string)
  setLogic (msg: Msg, logic: any): boolean
  push (msg: Msg, dst: address, wad: uint128): boolean
  pull (msg: Msg, src: address, wad: uint128): boolean

  mint (msg: Msg, wad: uint128, recipient: address)
  burn (msg: Msg, wad: uint128, recipient: address)
  payout (msg: Msg, dst: address)

  apply ()  // this is the default function called while paying
}

class BridgeToken implements IToken {
  minters: Map<address, boolean>

  constructor (name: string, symbol: b32) { return }

  addMinter (msg: Msg, minter: address) { return }
  removeMinter (msg: Msg, minter: address) { return }
}

class SweetToken implements IToken {
  constructor (name: string, symbol: b32) { return }
}

class AssetEvents {
  LogUouFounded (baseAsset: address, brg: uint, fiat: uint) { return }
  LogUouUnfounded (baseAsset: address, brg: uint, fiat: uint, remainingFiat: uint) { return }
}

class Asset extends AssetEvents implements IStoppable, IMath {
  public assetContract: IERC20
  public lockedAmount: uint
  public uouCount: uint
  public uous: UOU[]
  public valut: Vault
  shareDecimals = 100000

  constructor (msg: Msg, assetContract: IERC20, vault: Vault) { super() }

  balance (): uint { return 1 }
  assetValue (): uint { return 1 }
  freeBridgeCoins (): uint { return 1 }
  maxCollateral (): uint { return 1 }
  availableValue (): uint { return 1 }
  fundUou (msg: Msg, fiatAmount: uint) { return }
  unfundUou (msg: Msg, fiatAmount: uint, uouIndex: uint) { return }
}

class UOU implements IStoppable, IMath {
  asset: Asset
  public originalAmount: uint
  public amount: uint
  public bcValue: uint

  constructor (msg: Msg, amount: uint, bcValue: uint, asset: Asset) { return }

  reduceAmount (msg: Msg, amount: uint) { return }
}

class VaultEvents {
  LogAssetAdded (tokenContract: address, owner: address, count: uint) { return }
}

class Vault extends VaultEvents implements IStoppable {
  public brg: BridgeToken
  public assetsMap: Map<address, Asset>
  public assets: Asset[]
  public currency: b4
  public assetCount: uint8
  public exchange: Exchange

  constructor (msg: Msg, currency: b4, brg: BridgeToken) { super() }

  lockedAmount (): uint { return 1 }
  bridgeCoinPrice (): uint { return 1 }
  bridgeCoinBalance (): uint { return 1 }
  addAsset (msg: Msg, tokenContract: IERC20) { return 1 }
}

class Exchange implements IStoppable {
  public prices: Map<address, Map<b4, uint256>>
  decimals = 18

  setPrice (msg: Msg, token: address, currency: b4, price: uint) { return }
  getPrice (token: address, currency: b4): uint { return 1 }

}

// const SWT = SweetToken('SweetToken', 'SWT')
