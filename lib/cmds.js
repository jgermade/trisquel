
var REeach = /([^,]+)(\s*,\s*([\S]+))? in (\S+)/;

function evalExpression (scope, expression) {
  return scope.eval(expression);
}

evalExpression.$noContent = true;

module.exports = {
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
