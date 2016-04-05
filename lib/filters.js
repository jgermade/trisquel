
var filtersCache = {};

function filters (name, filterFn) {
  if( filterFn !== undefined ) {
    filters.put(name, filterFn);
  }
  return filters.get(name);
};

filters.put = function (name, filterFn) {
  if( !(filterFn instanceof Function) ) {
    throw new Error('filter should be a function');
  }
  filtersCache[name] = filterFn;
}

filters.get = function (name) {
  if ( !filtersCache[name] ) {
    throw new Error('filter \'' + name + '\' not found');
  }
  return filtersCache[name];
}

filters.map = function (parts) {
  return parts.map(function (part) {
    var args = part.split(':'),
        filterName = args.shift().trim();

    return function (result, scope) {
      return filters.get(filterName).apply(null, [result].concat( args.map(function (arg) {
        return scope.eval(arg);
      }) ) );
    };
  });
};

module.exports = filters;
