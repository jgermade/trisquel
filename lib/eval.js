
var filters = require('./filters');

function evalExpression (expression) {
  var parts = expression.split('|');

  /* jshint ignore:start */
  var evaluator = (new Function('scope', 'try { with(scope) { return (' + parts.shift() + '); }; } catch(err) { console.log(err.message); return \'\'; }'));
  /* jshint ignore:end */

  var _filters = filters.map(parts);

  return function (scope) {
    var result = evaluator(scope);

    for( var i = 0, n = _filters.length ; i < n ; i++ ) {
      result = _filters[i](result, scope);
    }

    return result;
  };
}

module.exports = evalExpression;
