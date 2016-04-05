
var Scope = require('./scope'),
    filters = require('./filters'),
    parse = require('./parse'),
    cmds = require('./cmds');

function compile (tmpl) {
  var render = parse(tmpl);

  return function (data) {
    return render( data instanceof Scope ? data : new Scope(data || {}) )
  };
}

function template (tmpl, scope) {
  return scope ? compile(tmpl)(scope) : compile(tmpl);
}
template.filter = require('./filters');
// template.filters = require('./filters');
template.eval = require('./eval');

template.cmd = function (name, fn, noContent) {
  fn.$noContent = noContent;
  cmds[name] = fn;
};

var tmplCache = {};
template.get = function (name) {
  return tmplCache[name];
};
template.put = function (name, tmpl) {
  if( typeof tmpl !== 'string' ) {
    throw new Error('template value should be a string');
  }
  tmplCache[name] = compile(tmpl);
  return tmplCache[name];
};

template.cmd('include', function (scope, expression) {
  var tmpl = template.get(scope.eval(expression));
  if( !tmpl ) {
    throw new Error('can not include template: \'' + scope.eval(expression) + '\' ( expression: ' + expression + ' )');
  }
  return tmpl(scope);
}, true);

module.exports = template;

// var data = {
//   foo: 'bar',
//   crash: {
//     test: 'dummy'
//   },
//   list: ['foo', 'bar', 'foobar'],
//   map: {
//     hi: 'all',
//     bye: 'nobody'
//   },
//   template: 'sample',
//   label: {
//     cancel: 'cancel'
//   }
// };
//
// template.put('demo-partial', '$each{ item,key in map }[${foo}:${key}:${item}]{/}', data)
//
// console.log( template('$if{ foo !== \'bar\' }gogogo{:}include: $include{\'demo-partial\'} {/}', data) );
