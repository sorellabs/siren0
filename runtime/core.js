/*****************************************************************************/
/* The Purr language runtime                                                 */
/*****************************************************************************/

void function(global) {

  // Internal helpers
  function define(o, n, v) {
    Object.defineProperty(o, n, { value: v })
  }

  function k(a) { return function(b) {
    return a
  }}

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
    return a === Ordering.greater()?  1
    :      a === Ordering.lesser()?  -1
    :      a === Ordering.equal()?    0
    :      /* otherwise */            raise('Unknown ordering: ' + a)
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
    return List.$clone({ $value: Object.keys(this).map(function(a) {
                                   return String.clone({ $value: a.split('') })
                                 })})
  }

  Root['compare-to:'] = function(a) {
    return Ordering.equal()
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

  Root['as-string'] = k('<#Object>')

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


  // Lists
  var List = Root.$clone()
  define(List, '$type', '<List>')

  List['as-string'] = function() {
    var xs = this.$value.map(function(a) { return a.toString() })
    return '<#List(' + this['size']() + '): ' + xs.join(', ') + '>'
  }

  List['append:'] = function(a) {
    return this['++'](List.$clone({ $value: a }))
  }

  List['++'] = function(a) {
    expectType(List, a)
    return this.$clone({ $value: this.$value.concat(a.$value) })
  }

  List['first'] = function() {
    if (this.$value.length === 0)
      throw new Error("Can't take the first item of an empty list.")

    return this.$value[0]
  }

  List['slice-from:to:'] = function(start, end) {
    expectType(Number, start)
    expectType(Number, end)
    return this.$clone({ $value: this.$value.slice(start.$value, end.$value) })
  }

  List['rest'] = function() {
    return this.$clone({ $value: this.$value.slice(1) })
  }

  List['but-last'] = function() {
    return this.$clone({ $value: this.$value.slice(0, -1) })
  }

  List['size'] = function() {
    return Number.$clone({ $value: this.$value.length })
  }

  List['is-empty?'] = function() {
    return this.$value.length === 0? True : False
  }

  List['map:'] = function(f) {
    expectRespondTo(f, 'apply:')
    return this.$clone({ $value: this.$value.map(function(a) {
                                   return apply1(f, a)
                                 })})
  }

  List['reverse'] = function() {
    return this.$clone({ $value: this.$value.slice().reverse() })
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
    return this.$clone({ $value: this.$value.slice(0, n) })
  }

  List['drop:'] = function(n) {
    return this.$clone({ $value: this.$value.slice(n) })
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
    return this.$clone({ $value: this.$value.sort(function(a, b) {
                                   return apply2(f, a, b)
                                 })})
  }

  // String
  var String = Root.$clone()
  define(String, '$type', '<String>')

  String['as-string'] = function() {
    return this.$value.join('')
  }
  String['compare-to:'] = function(a) {
    return a.$value > this.$value?  Ordering.lesser()
    :      a.$value < this.$value?  Ordering.greater()
    :      /* otherwise */          Ordering.equal()
  }

  // Number
  var Number = Root.$clone()
  define(Number, '$type', '<Number>')

  Number['as-string'] = function() {
    return '' + this.$value
  }
  Number['compare-to:'] = function(a) {
    return a.$value > this.$value?  Ordering.lesser()
    :      a.$value < this.$value?  Ordering.greater()
    :      /* otherwise */          Ordering.equal()
  }
  Number['+'] = function(a) {
    expectType(Number, a)
    return Number.$clone({ $value: this.$value + a.$value })
  }
  Number['*'] = function(a) {
    expectType(Number, a)
    return Number.$clone({ $value: this.$value * a.$value })
  }
  Number['-'] = function(a) {
    expectType(Number, a)
    return Number.$clone({ $value: this.$value - a.$value })
  }
  Number['/'] = function(a) {
    expectType(Number, a)
    return Number.$clone({ $value: this.$value / a.$value })
  }
  Number['**'] = function(a) {
    expectType(Number, a)
    return Number.$clone({ $value: Math.pow(this.$value, a.$value) })
  }
  Number['remainder'] = function(a) {
    expectType(Number, a)
    return Number.$clone({ $value: this.$value % a.$value })
  }
  Number['negate'] = function() {
    return Number.$clone({ $value: this.$value * -1 })
  }
  Number['absolute'] = function() {
    return Number.$clone({ $value: Math.abs(this.$value) })
  }
  Number['round'] = function() {
    return Number.$clone({ $value: Math.round(this.$value) })
  }
  Number['floor'] = function() {
    return Number.$clone({ $value: Math.floor(this.$value) })
  }
  Number['ceil'] = function() {
    return Number.$clone({ $value: Math.ceil(this.$value) })
  }

  // Ordering
  var Ordering = Root.$clone()
  define(Ordering, '$type', '<Ordering>')
  var GT = Ordering.$clone()
  var EQ = Ordering.$clone()
  var LT = Ordering.$clone()

  Ordering['greater'] = function() {
    return GT
  }
  Ordering['lesser'] = function() {
    return LT
  }
  Ordering['equal'] = function() {
    return EQ
  }
  GT['to-string'] = k('<#Ordering: greater than>')
  EQ['to-string'] = k('<#Ordering: equal>')
  LT['to-string'] = k('<#Ordering: less than>')

  // Unsafe IO
  var IO = Root.$clone()
  IO['print:'] = function(a) {
    console.log('' + a.toString())
    return this
  }

  // The Lobby
  var Lobby = Root.$clone()
  Lobby['Number']   = k(Number)
  Lobby['String']   = k(String)
  Lobby['List']     = k(List)
  Lobby['True']     = k(True)
  Lobby['False']    = k(False)
  Lobby['Ordering'] = k(Ordering)
  Lobby['IO']       = k(IO)

  // System initialisation
  global.$runtime = {}
  $runtime.Root   = Root
  $runtime.List   = List
  $runtime.String = String
  $runtime.Number = Number
  $runtime.Lobby  = Lobby
}
( typeof global !== undefined?  global
: typeof window !== undefined?  window
: /* otherwise */               this
)
/*****************************************************************************/
