/*****************************************************************************/
/* The Purr language runtime                                                 */
/*****************************************************************************/

var __String   = String
var __Object   = Object
var __Boolean  = Boolean
var __Function = Function


void function(global) {

  // Internal helpers
  function define(o, n, v) {
    Object.defineProperty(o, n, { value: v })
  }

  function k(a) { return function(b) {
    return a
  }}

  function make(type, value) {
    return Object.create(type, { $value: { value: value }})
  }

  function apply0(f) {
    return f['get-slot']('apply')()
  }

  function apply1(f, a) {
    return f['get-slot']('apply:')(a)
  }

  function apply2(f, a, b) {
    return f['get-slot']('apply:with:')(a, b)
  }

  function applyN(n, f, as) {
    return n === 0?  apply0(f)
    :      n === 1?  apply1(f, as[0])
    :      n === 2?  apply2(f, as[0], as[1])
    :      /* _ */   f['get-slot'](makeSlotName(n)).apply(null, as)

    function makeSlotName(n) {
      return 'apply:' + Array.apply(null, Array(n)).map(k('with:')).join('')
    }
  }

  function expectType(kind, a) {
    if (!a['is-child-of:'](kind))
      throw TypeError('Expected ' + kind.$type + ', got ' + a.$type)
  }

  function expectRespondTo(a, m) {
    if (!(m in a))
      throw TypeError('Expected ' + a + ' to respond to ' + m)
  }

  function raise(a) {
    throw a
  }

  function ordering(a) {
    expectType(Ordering, a)
    return a === GT?  1
    :      a === LT? -1
    :      a === EQ?  0
    :      /* _ */    raise('Unknown ordering: ' + a)
  }

  function toString(a) {
    return function() {
      return make(String, a.split('').map(function(b){
                            return make(Character, b)
                          }))
    }
  }

  // System definitions
  var Root = Object.create(null)
  define(Root, '$type', '<Root>')
  define(Root, '$clone', function(ps) {
    var clone = Object.create(this)
    for (var p in ps)
      if (/^\$/.test(p))  define(clone, p, ps[p])
      else                clone[p] = ps[p]

    return clone
  })
  define(Root, 'toString', function(){ return this['as-string']() })
  define(Root, 'toJson', function(){ return this['as-json']() })

  // Public primitives
  Root['get-slot'] = function(name) {
    if (!(name in this))
      throw new Error(this.toString() + ' has no slot "' + name + '".')

    return this[name].bind(this)
  }

  Root['prototype'] = function() {
    return Object.getPrototypeOf(this)
  }

  Root['is-child-of:'] = function(a) {
    return Object.isPrototypeOf.call(a, this)
  }

  Root['slots'] = function() {
    return make(List, Object.keys(this).map(function(a) {
                        return make(String, a.split(''))
                      }))
  }
  Root['self'] = function() {
    return this
  }

  Root['compare-to:'] = function(a) {
    return UNKNOWN
  }
  Root['='] = function(a) {
    return this['compare-to:'](a) === EQ?  True : False
  }
  Root['=/='] = function(a) {
    return this['='](a)['not']()
  }
  Root['<'] = function(a) {
    return this['compare-to:'](a) === LT?  True : False
  }
  Root['>'] = function(a) {
    return this['compare-to:'](a) === GT?  True : False
  }
  Root['<='] = function(a) {
    return this['<'](a)['\\/'](this['='](a))
  }
  Root['>='] = function(a) {
    return this['>'](a)['\\/'](this['='](a))
  }

  Root['as-string'] = toString('<#Object>')

  Root['as-json'] = function() {
    return this
  }

  // Booleans
  var Boolean = Root.$clone()
  define(Boolean, '$type', '<Boolean>')

  Boolean['is-true'] = function() {
    return False
  }
  Boolean['is-false'] = function() {
    return False
  }
  Boolean['compare-to:'] = function(a) {
    if (this === True) {
      return a === True?  EQ
      :      /* _ */      GT
    }
    else if (this === False) {
      return a === False?  EQ
      :      /* _ */       LT
    }
    return UNKNOWN
  }
  Boolean['as-string'] = toString('<#Boolean>')

  var True = Boolean.$clone()
  True['is-true'] = k(True)
  True['/\\'] = function(a) {
    return a['is-true']() === True? True : False
  }
  True['\\/'] = function(a) {
    return True
  }
  True['not'] = function() {
    return False
  }
  True['then:else:'] = function(f, g) {
    expectRespondTo(f, 'apply')
    expectRespondTo(g, 'apply')
    return apply0(f)
  }
  True['as-string'] = toString('<#Boolean: True>')

  var False = Boolean.$clone()
  False['is-false'] = k(True)
  False['/\\'] = function(a) {
    return False
  }
  False['\\/'] = function(a) {
    return a['is-true']() === True? True : False
  }
  False['not'] = function() {
    return True
  }
  False['then:else:'] = function(f, g) {
    expectRespondTo(f, 'apply')
    expectRespondTo(g, 'apply')
    return apply0(g)
  }
  False['as-string'] = toString('<#Boolean: False>')

  // Lists
  var List = Root.$clone()
  define(List, '$type', '<List>')

  List['as-string'] = function() {
    var xs   = this.$value.map(function(a) { return a.toString() })
    var size = this['size']().toString()
    return toString('<#List(' + size + '): ' + xs.join(', ') + '>')()
  }

  List['append:'] = function(a) {
    return this['++'](make(this, a))
  }

  List['++'] = function(a) {
    expectType(List, a)
    return make(this, this.$value.concat(a.$value))
  }

  List['first'] = function() {
    if (this.$value.length === 0)
      throw new Error("Can't take the first item of an empty list.")

    return this.$value[0]
  }

  List['slice-from:to:'] = function(start, end) {
    expectType(Number, start)
    expectType(Number, end)
    return make(this, this.$value.slice(start.$value, end.$value))
  }

  List['rest'] = function() {
    return make(this, this.$value.slice(1))
  }

  List['but-last'] = function() {
    return make(this, this.$value.slice(0, -1))
  }

  List['size'] = function() {
    return make(Number, this.$value.length)
  }

  List['is-empty?'] = function() {
    return this.$value.length === 0? True : False
  }

  List['map:'] = function(f) {
    expectRespondTo(f, 'apply:')
    return make(this, this.$value.map(function(a){ return apply1(f, a) }))
  }

  List['filter:'] = function(f) {
    expectRespondTo(f, 'apply:')
    return make(this, this.$value.filter(function(a){
                        return apply1(f, a) === True }))
  }

  List['reverse'] = function() {
    return make(this, this.$value.slice().reverse())
  }

  List['fold-right:using:'] = function(b, f) {
    expectRespondTo(f, 'apply:with:')
    return this.$value.reduce(function(c, a) {
             return apply2(f, a, c)
           }, b)
  }

  List['fold-left:using:'] = function(b, f) {
    expectRespondTo(f, 'apply:with:')
    return this.$value.reduce(function(c, a) {
             return apply2(f, c, a)
           }, b)
  }

  List['take:'] = function(n) {
    expectType(Number, n)
    return make(this, this.$value.slice(0, n))
  }

  List['drop:'] = function(n) {
    expectType(Number, n)
    return make(this, this.$value.slice(n))
  }

  List['contains:'] = function(a) {
    return this['fold-right:using:'](False, function(b, r) {
             return r['\\/'](a['='](b))
           })
  }
  List['at:'] = function(n) {
    if (n.$value < 0 || n.$value > this.$value.length - 1)
      throw new Error(n + ' is out of the bounds in ' + this)

    return this.$value[n.$value]
  }

  List['sort-using:'] = function(f) {
    expectRespondTo(f, 'apply:with:')
    return make(this, this.$value.sort(function(a, b) {
                        return ordering(apply2(f, a, b))
                      }))
  }

  List['compare-to:'] = function(a) {
    expectType(List, a)
    var len1 = this.$value.length, len2 = a.$value.length

    return len1 < len2?  LT
    :      len1 > len2?  GT
    :      /* _ */       compareLists(this.$value, a.$value)

    function compareLists(a, b) {
      for (var i = 0; i < len1; ++i) {
        var order = a[i]['compare-to:'](b[i])
        if (order !== EQ)  return order
      }
      return EQ
    }
  }

  // String
  var String = List.$clone()
  define(String, '$type', '<String>')
  define(String, 'toString', function() {
    return this.$value.join('')
  })
  String['upcase'] = function() {
    return this.map({ 'apply:': function(a){ return a.upcase() } })
  }
  String['downcase'] = function() {
    return this.map({ 'apply:': function(a){ return a.downcase() }})
  }
  String['as-string'] = function() {
    return this
  }

  // Character
  var Character = Root.$clone()
  define(Character, '$type', '<Character>')
  define(Character, 'toString', function() {
    return this.$value
  })

  Character['as-string'] = function() {
    return make(String, [this])
  }
  Character['compare-to:'] = function(a) {
    expectType(Character, a)
    return this.$value < a.$value?  LT
    :      this.$value > a.$value?  GT
    :      /* otherwise */          EQ
  }
  Character['is-space?'] = function() {
    return /\s/.test(this.$value)
  }
  Character['is-lower?'] = function() {
    return /[a-z]/.test(this.$value)
  }
  Character['is-upper?'] = function() {
    return /[A-Z]/.test(this.$value)
  }
  Character['is-alpha?'] = function() {
    return /\w/.test(this.$value)
  }
  Character['is-alpha-numeric?'] = function() {
    return /[\w\d]/.test(this.$value)
  }
  Character['is-digit?'] = function() {
    return /\d/.test(this.$value)
  }
  Character['is-octal-digit?'] = function() {
    return /[0-7]/.test(this.$value)
  }
  Character['is-hexadecimal-digit?'] = function() {
    return /[0-9a-fA-F]/.test(this.$value)
  }
  Character['upcase'] = function() {
    return make(this, this.$value.toUpperCase())
  }
  Character['downcase'] = function() {
    return make(this, this.$value.toLowerCase())
  }
  Character['from-code:'] = function(a) {
    expectType(Number, a)
    return make(this, __String.fromCharCode(a.$value))
  }
  Character['as-code'] = function(a) {
    return make(this, this.$value.charCodeAt(0))
  }

  // Number
  var Number = Root.$clone()
  define(Number, '$type', '<Number>')

  Number['as-string'] = function() {
    return toString('' + this.$value)()
  }
  Number['compare-to:'] = function(a) {
    return a.$value > this.$value?  Ordering.lesser()
    :      a.$value < this.$value?  Ordering.greater()
    :      /* otherwise */          Ordering.equal()
  }
  Number['+'] = function(a) {
    expectType(Number, a)
    return make(this, this.$value + a.$value)
  }
  Number['*'] = function(a) {
    expectType(Number, a)
    return make(this, this.$value * a.$value)
  }
  Number['-'] = function(a) {
    expectType(Number, a)
    return make(this, this.$value - a.$value)
  }
  Number['/'] = function(a) {
    expectType(Number, a)
    return make(this, this.$value / a.$value)
  }
  Number['**'] = function(a) {
    expectType(Number, a)
    return make(this, Math.pow(this.$value, a.$value))
  }
  Number['remainder:'] = function(a) {
    expectType(Number, a)
    return make(this, this.$value % a.$value)
  }
  Number['negate'] = function() {
    return make(this, this.$value * -1)
  }
  Number['absolute'] = function() {
    return make(this, Math.abs(this.$value))
  }
  Number['round'] = function() {
    return make(this, Math.round(this.$value))
  }
  Number['floor'] = function() {
    return make(this, Math.floor(this.$value))
  }
  Number['ceil'] = function() {
    return make(this, Math.ceil(this.$value))
  }
  Number['square-root'] = function() {
    return make(this, Math.sqrt(this.$value))
  }

  // Ordering
  var Ordering = Root.$clone()
  define(Ordering, '$type', '<Ordering>')
  var GT = Ordering.$clone()
  var EQ = Ordering.$clone()
  var LT = Ordering.$clone()
  var UNKNOWN = Ordering.$clone()

  Ordering['greater'] = function() {
    return GT
  }
  Ordering['lesser'] = function() {
    return LT
  }
  Ordering['equal'] = function() {
    return EQ
  }
  Ordering['unknown'] = function() {
    return UNKNOWN
  }
  GT['as-string'] = toString('<#Ordering: greater than>')
  EQ['as-string'] = toString('<#Ordering: equal>')
  LT['as-string'] = toString('<#Ordering: less than>')
  UNKNOWN['as-string'] = toString('<#Ordering: unknown>')

  // Unsafe IO
  var IO = Root.$clone()
  IO['print:'] = function(a) {
    console.log('' + a.toString())
    return this
  }

  // The Lobby
  var Lobby = Root.$clone()
  Lobby['Number']    = k(Number)
  Lobby['String']    = k(String)
  Lobby['Character'] = k(Character)
  Lobby['List']      = k(List)
  Lobby['True']      = k(True)
  Lobby['False']     = k(False)
  Lobby['Ordering']  = k(Ordering)
  Lobby['IO']        = k(IO)

  // System initialisation
  global.$runtime = {}
  $runtime.Root      = Root
  $runtime.List      = List
  $runtime.String    = String
  $runtime.Number    = Number
  $runtime.Character = Character
  $runtime.Lobby     = Lobby
}
( typeof global !== undefined?  global
: typeof window !== undefined?  window
: /* otherwise */               this
)
/*****************************************************************************/
