(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.trisquel = factory());
}(this, (function () { 'use strict';

var filtersCache = {};

function filters (name, filterFn) {
  if( filterFn !== undefined ) {
    filters.put(name, filterFn);
  }
  return filters.get(name);
}

filters.put = function (name, filterFn) {
  if( !(filterFn instanceof Function) ) {
    throw new Error('filter should be a function');
  }
  filtersCache[name] = filterFn;
};

filters.get = function (name) {
  if ( !filtersCache[name] ) {
    throw new Error('filter \'' + name + '\' not found');
  }
  return filtersCache[name];
};

filters.map = function (parts) {
  return parts.map(function (part) {
    var splitted = part.match(/([^:]+):(.*)/), filterName, args;

    if( splitted ) {
      filterName = splitted[1].trim();
      args = [splitted[2]];
    } else {
      filterName = part.trim();
      args = [];
    }

    return function (result, scope) {
      return filters.get(filterName).apply(null, [result].concat( args.map(function (arg) {
        return scope.eval(arg);
      }) ) );
    };
  });
};

function parseExpression (expression) {
  var parts = expression.split('|'),
      filters$$1 =  [],
      part = parts.shift();

  while( part !== undefined ) {
    if( part === '' ) {
      filters$$1[filters$$1.length - 1] += '||' + parts.shift();
    } else {
      filters$$1.push(part);
    }
    part = parts.shift();
  }

  return {
    expression: filters$$1.shift(),
    filters: filters$$1
  };
}

function evalExpression (expression) {
  var parsed = parseExpression(expression);

  /* jshint ignore:start */
  var evaluator = (new Function('scope', 'try { with(scope) { return (' + parsed.expression + '); }; } catch(err) { return \'\'; }'));
  /* jshint ignore:end */

  var _filters = filters.map(parsed.filters);

  return function (scope) {
    var result = evaluator(scope);

    for( var i = 0, n = _filters.length ; i < n ; i++ ) {
      result = _filters[i](result, scope);
    }

    return result;
  };
}

// var evalExpression = require('./eval');

var Scope = function (data) {
		if(!this) {
			return new Scope(data);
		}

    if( data instanceof Object ) {
        this.extend(data);
    }
};

Scope.prototype.new = function(data) {
    var S = function () {
        this.extend(data);
    };
    S.prototype = this;
    return new S(data);
};

Scope.prototype.extend = function(data) {
    for( var key in data ) {
        this[key] = data[key];
    }
    return this;
};

Scope.prototype.eval = function ( expression ) {
    return evalExpression(expression)(this);
};

var REeach = /([^,]+)(\s*,\s*([\S]+))? in (\S+)/;

var cmds = {
  '': function (scope, expression) {
    return scope.eval(expression);
  },
  root: function (scope, expression, content, otherwise) {
    return content(scope);
  },
  if: function (scope, expression, content, otherwise) {
    return scope.eval(expression) ? content(scope) : otherwise(scope);
  },
  each: function (scope, expression, content, otherwise) {
    var values = REeach.exec(expression.trim()), key, n, s;

    if( !values ) {
      throw new Error('each expression is not correct');
    }

    var result = '',
        item = values[1],
        items = scope.eval(values[4]),
        iKey = values[3] || ( items instanceof Array ? '$index' : '$key' );

    if( items instanceof Array ) {
      for( var i = 0, n = items.length ; i < n ; i++ ) {
        s = scope.new();
        s[iKey] = i;
        s[item] = items[i];
        result += content(s);
      }
    } else {
      for( var key in items ) {
        s = scope.new();
        s[iKey] = key;
        s[item] = items[key];
        result += content(s);
      }
    }

    return result;
  }
};

var REsplit = /\$\w*{[^}]*}|{\/}|{\:}|{else}/;
var REmatch = /\$(\w*){([^}]*)}|{(\/|\:|else)}/g;
    // cmds = require('./cmds');

function singleCmd (cmd, expression) {
  return function (scope) {
    return cmds[cmd](scope, expression);
  };
}

function raiseList (tokens, cmd, expression, waitingForClose) {
  var token = tokens.shift(),
      targets = { $$content: [], $$otherwise: [] },
      target = '$$content',
      cmdResult,
      resolver = function () {
        return function (scope) {
          return cmds[cmd](scope, expression, function (s) {
            return targets.$$content.map(function (piece) {
              return piece instanceof Function ? piece(s) : piece;
            }).join('');
          }, function (s) {
            return targets.$$otherwise.map(function (piece) {
              return piece instanceof Function ? piece(s) : piece;
            }).join('');
          });
        }
      };

  while( token !== undefined ) {

    if( typeof token === 'string' ) {
      targets[target].push(token);
    } else if( token.cmd === 'case' ) {
      if( !waitingForClose ) {
        throw new Error('template root can not have cases');
      }
      target = expression.trim();
    } else if( typeof token.cmd === 'string' ) {
      if( token.cmd ) {
        if( !cmds[token.cmd] ) {
          throw new Error('cmd \'' + token.cmd + '\' is not defined');
        }

        if( cmds[token.cmd].$noContent ) {
          targets[target].push(singleCmd(token.cmd, token.expression));
        } else {
          cmdResult = raiseList(tokens, token.cmd, token.expression, true);

          targets[target].push(cmdResult.fn);
          tokens = cmdResult.tokens;
        }

      } else {
        targets[target].push(singleCmd(token.cmd, token.expression));
      }

    } else if( token.expression === ':' || token.expression === 'else' ){
      target = '$$otherwise';
    } else if( token.expression === '/' ) {
      if( !waitingForClose ) {
        throw new Error('can not close root level');
      }
      return {
        fn: resolver(),
        tokens: tokens
      };
    } else {
      throw new Error('\'' + token.expression + '\' is not a valid no-cmd expression');
    }

    token = tokens.shift();
  }

  if( waitingForClose ) {
    throw new Error('cmd \'' + cmd + '\' not closed propertly');
  }

  return resolver();
}

function parse(tmpl){
  if( typeof tmpl !== 'string' ) {
    throw new Error('template should be a string');
  }

  var i = 0,
      texts = tmpl.split(REsplit),
      list = [];

  list[i++] = texts.shift();

  tmpl.replace(REmatch,function(match, cmd, expression, altExpression){
    expression = altExpression || expression;

    if( cmd && !cmds[cmd] ) {
      throw new Error('cmd \'' + cmd + '\' is not defined');
    }

    var nextText = texts.shift();

    if( /\{/.test(expression) ) {

      var delta = expression.split('{').length - expression.split('}').length;

      if( delta < 0 ) {
        throw new Error('curly brackets mismatch');
      } else if( delta > 0 ) {
        var tracks = nextText.split('}');
        if( (tracks.length - 1) < delta ) {
          throw new Error('expression curly brackets mismatch');
        }
        expression += tracks.splice(0, delta).join('}') + '}';
        nextText = tracks.join('}');
      }
    }

    list[i++] = { cmd: cmd, expression: expression };
    list[i++] = nextText;
  });

  return raiseList(list, 'root');
}



// module.exports = parse;

function compile (tmpl) {
  var render = parse(tmpl);

  return function (data) {
    return render( data instanceof Scope ? data : new Scope(data) )
  };
}

function template (tmpl, scope) {
  return scope ? compile(tmpl)(scope) : compile(tmpl);
}
template.filter = filters;

template.eval = evalExpression;
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

return template;

})));
