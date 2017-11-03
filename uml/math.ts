import assert = require('assert')

const m128 = Math.pow(2, 128)
const WAD = Math.pow(10, 18)

export default class SMath {

  // standard uint256 functions

  add (x: number, y: number) { assert(x >= 0 && y >= 0); return x + y }
  sub (x: number, y: number) { assert(x >= 0 && y >= 0); return x - y }
  mul (x: number, y: number) { assert(x >= 0 && y >= 0); return x * y }
  div (x: number, y: number) { assert(x >= 0 && y >= 0); return y > 0 ? x / y : 0 }
  min (x: number, y: number) { assert(x >= 0 && y >= 0); return x <= y ? x : y }
  max (x: number, y: number) { assert(x >= 0 && y >= 0); return x >= y ? x : y }

  // uint128 functions

  hadd (x: number, y: number) {
    assert(m128 >= x && x >= 0 && m128 >= y && y >= 0)
    return x + y
  }
  hsub (x: number, y: number) {
    assert(m128 >= x && x >= 0 && m128 >= y && y >= 0)
    return x - y
  }
  hmul (x: number, y: number) {
    assert(m128 >= x && x >= 0 && m128 >= y && y >= 0)
    return x * y
  }
  hdiv (x: number, y: number) {
    assert(m128 >= x && x >= 0 && m128 >= y && y >= 0)
    return y > 0 ? x / y : 0
  }
  hmin (x: number, y: number) {
    assert(m128 >= x && x >= 0 && m128 >= y && y >= 0)
    return x <= y ? x : y
  }
  hmax (x: number, y: number) {
    assert(m128 >= x && x >= 0 && m128 >= y && y >= 0)
    return x >= y ? x : y
  }

  // WAD math

  wadd (x: number, y: number) { return this.hadd(x, y) }
  wsub (x: number, y: number) { return this.hsub(x, y) }
  wmul (x: number, y: number) {
    assert(m128 >= x && x >= 0 && m128 >= y && y >= 0)
    return (x * y + WAD / 2) / WAD
  }
  wdiv (x: number, y: number) {
    assert(m128 >= x && x >= 0 && m128 >= y && y >= 0)
    return (x * WAD + y / 2) / y
  }
  wmin (x: number, y: number) { return this.hmin(x, y) }
  wmax (x: number, y: number) { return this.hmax(x, y) }

}
