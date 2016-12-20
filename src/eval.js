
import filters from './filters'

function parseExpression (expression) {
  var parts = expression.split('|'),
      filters =  [],
      part = parts.shift();

  while( part !== undefined ) {
    if( part === '' ) {
      filters[filters.length - 1] += '||' + parts.shift();
    } else {
      filters.push(part);
    }
    part = parts.shift();
  }

  return {
    expression: filters.shift(),
    filters: filters
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

export default evalExpression;
