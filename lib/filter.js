
var filterCache = {};

function filter (name, filterFn) {
  if( filterFn !== undefined ) {
    if( !(filterFn instanceof Function) ) {
      throw new Error('filter should be a function');
    }
    filterCache[name] = filterFn;
  } else if ( !filterCache[name] ) {
    throw new Error('filter \'' + name + '\' not found');
  }
  return filterCache[name];
};

module.exports = filter;
