// Copyright (c) 2013 - Quildreen Motta
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation files
// (the "Software"), to deal in the Software without restriction,
// including without limitation the rights to use, copy, modify, merge,
// publish, distribute, sublicense, and/or sell copies of the Software,
// and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var Root, List, String, Number

void function() {

  var define = Object.defineProperty

  function expectType(a, b) {
    if (!a.isPrototypeOf(b))
      throw TypeError('Expected ' + a.type + ', got ' + b.type)
  }


  Root = Object.create(null)
  define(Root, 'type', { value: 'Root' })
  define(Root, 'toString', { value: function() { return this['as-string']() }})
  define(Root, 'toJson', { value: function(){ return this['as-json']() }})

  Root['clone'] = function(properties) {
    var instance = Object.create(this)
    for (var p in properties) {
      if (/^__/.test(p))  define(instance, p, { value: properties[p] })
      else                instance[p] = properties[p]
    }
    return instance
  }

  Root['get-slot'] = function(name) {
    return this[name].bind(this)
  }

  Root['prototype'] = function() {
    return Object.getPrototypeOf(this)
  }

  Root['slots'] = function() {
    return List.clone({ __value: Object.keys(this) })
  }

  Root['as-string'] = function() {
    return '<#Root>'
  }

  Root['as-json'] = function() {
    return this
  }

  Root['print:'] = function(a) {
    console.log(a.toString())
    return this
  }

  List = Root.clone()
  define(List, 'type', { value: 'List' })

  // Representations
  List['as-string'] = function() {
    var xs = this.__value.map(function(a){ return a.toString() }).join(', ')
    return '<#List: ' + xs + '>'
  }

  // Basic functions
  List['append:'] = function(a) {
    return this['++'](List.clone({ __value: a }))
  }

  List['++'] = function(a) {
    expectType(List, a)
    return this.clone({ __value: this.__value.concat(a.value) })
  }

  List['head'] = function() {
    if (this.__value.length === 0)
      throw new Error('Can\'t take the head of an empty list.')

    return this.__value[0]
  }

  List['tail'] = function() {
    return this.clone({ __value: this.__value.slice(1) })
  }

  List['but-last'] = function() {
    return this.clone({ __value: this.__value.slice(0, -1) })
  }

  List['size'] = function() {
    return this.__value.length
  }


  // Transformations
  List['map:'] = function(f) {
    return List.clone({ __value: this.__value.map(function(a) {
                                   return f['apply:'](a)
                                 })})
  }

  List['reverse'] = function() {
    return List.clone({ __value: this.__value.slice().reverse() })
  }

  List['fold-from:using:'] = function(b, f) {
    return this.__value.reduce(function(c, a) {
             return f['apply:with:'](a, c)
           }, b)
  }

  // Slicing
  List['take:'] = function(n) {
    return List.clone({ __value: this.__value.slice(0, n) })
  }

  List['drop:'] = function(n) {
    return List.clone({ __value: this.__value.slice(n) })
  }


  // String
  String = List.clone()
  define(String, 'type', { value: 'String' })

  String['as-string'] = function() {
    return this.__value.join('')
  }

  // Number
  Number = Root.clone()
  define(Number, 'type', { value: 'Number' })

  Number['+'] = function(a) {
    expectType(Number, a)
    return Number.clone({ __value: this.__value + a.__value })
  }

  Number['-'] = function(a) {
    expectType(Number, a)
    return Number.clone({ __value: this.__value - a.__value })
  }

  Number['*'] = function(a) {
    expectType(Number, a)
    return Number.clone({ __value: this.__value * a.__value })
  }

  Number['/'] = function(a) {
    expectType(Number, a)
    return Number.clone({ __value: this.__value / a.__value })
  }

  Number['as-string'] = function() {
    return '' + this.__value
  }

}()