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

  Root['as-string'] = k('<#Object>')

  Root['as-json'] = function() {
    return this
  }

  // Lists
  var List = Root.$clone()
  define(List, '$type', '<List>')

  List['as-string'] = function() {
    var xs = this.$value.map(function(a) { return a.toString() })
    return '<#List: ' + xs.join(', ') + '>'
  }

  // String
  var String = Root.$clone()
  define(String, '$type', '<String>')

  String['as-string'] = function() {
    return this.$value.join('')
  }

  // Number
  var Number = Root.$clone()
  define(Number, '$type', '<Number>')

  Number['as-string'] = function() {
    return '' + this.$value
  }

  // Unsafe IO
  var IO = Root.$clone()
  IO['print:'] = function(a) {
    console.log('' + a.toString())
    return this
  }

  // The Lobby
  var Lobby = Root.$clone()
  Lobby['Number'] = k(Number)
  Lobby['String'] = k(String)
  Lobby['List']   = k(List)
  Lobby['IO']     = k(IO)

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
