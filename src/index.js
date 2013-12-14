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

var fs       = require('fs')
var path     = require('path')
var ometa    = require('ometa-js')
var grammar  = require('./grammar')
var compiler = require('./compiler')
var beautify = require('node-beautify').beautifyJs

function read(f) {
  return fs.readFileSync(f, 'utf-8')
}

function parse(s) {
  return grammar.matchAll(s, 'program')
}

function compile(s) {
  return beautify(compiler.match(s, 'compile'), { indentSize: 2 })
}

function runtimeFile() {
  return read(path.join(__dirname, '../runtime/core.js'))
}

function loadRuntime() {
  return require('../runtime/core.js')
}

module.exports = {
  parse: parse
, compile: compile
, loadRuntime: loadRuntime
, runtimeFile: runtimeFile
}