
var Scope = require('./scope'),
    filters = require('./filters'),
    parse = require('./parse'),
    cmds = require('./cmds');

function compile (tmpl) {
  var render = parse(tmpl);

  return function (data) {
    return render( data instanceof Scope ? data : new Scope(data) )
  };
}

function template (tmpl, scope) {
  return scope ? compile(tmpl)(scope) : compile(tmpl);
}
template.filter = require('./filters');
// template.filters = require('./filters');

template.eval = require('./eval');
template.scope = function (data) {
  return new Scope(data);
};

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

template.clear = function () {
  for( var k in tmplCache ) {
    delete tmplCache[k];
  }
  return template;
};

template.cmd('include', function (scope, expression) {
  var tmpl = template.get(expression.trim());
  if( !tmpl ) {
    throw new Error('can not include template: \'' + scope.eval(expression) + '\' ( expression: ' + expression + ' )');
  }
  return tmpl(scope);
}, true);

template.cmd('includeEval', function (scope, expression) {
  var tmpl = template.get(scope.eval(expression));
  if( !tmpl ) {
    throw new Error('can not include template: \'' + scope.eval(expression) + '\' ( expression: ' + expression + ' )');
  }
  return tmpl(scope);
}, true);

module.exports = template;
