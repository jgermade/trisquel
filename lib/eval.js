
var getFilter = require('./filter');

function mapFilters (parts) {
  return parts.map(function (part) {
    var args = part.split(':'),
        filterName = parts.shift().trim();

    return function (scope) {
      getFilter(filterName).apply(null, [scope].concat( args.map(function (arg) {
        return scope.eval(arg);
      }) ) );
    };

  });
}

module.exports = function (expression) {
  var parts = expression.split('|');

  /* jshint ignore:start */
  var evaluator = (new Function('scope', 'try { with(scope) { return (' + parts.shift() + '); }; } catch(err) { return \'\'; }'));
  /* jshint ignore:end */

  var filters = mapFilters(parts);

  return function (scope) {
    var result = evaluator(scope);

    for( var i = 0, n = filters.length ; i < n ; i++ ) {
      result = filters[i](scope);
    }

    return result;
  };
}
