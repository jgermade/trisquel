# trisquel

JS template engine

[![](https://img.shields.io/npm/v/trisquel.svg)](https://www.npmjs.com/package/trisquel)
[![Build Status](https://travis-ci.org/kiltjs/trisquel.svg?branch=master)](https://travis-ci.org/kiltjs/trisquel)

### Installation

```.sh
npm install trisquel --save
```

### Usage

```.js
var data = {
  foo: 'bar',
  crash: {
    test: 'dummy'
  },
  list: ['foo', 'bar', 'foobar'],
  map: {
    hi: 'all',
    bye: 'nobody'
  }
};

template.put('partial-map', '$each{ item,key in map }[${foo}:${key}:${item}]{/}');

template.put('partial-list', '$each{ item,i in list }[${foo}:${i}:${item}]{/}');

console.log( template('$if{ foo !== \'bar\' }whoops{:}map: $include{\'partial-map\'} {/}', data) );
// returns 'map: [bar:hi:all][bar:bye:nobody]'

console.log( template('$if{ foo !== \'bar\' }whoops{:}list: $include{\'partial-list\'} {/}', data) );
// returns 'list: [bar:0:foo][bar:1:bar][bar:2:foobar]'


var i18n = {
  months: '${n} mes$if{ n > 1 }es{/}'
};
template.filter('i18n', function (key, data) {
  if( data ) {
    return template(i18n[key.trim()])(data);
  }
	return i18n[key.trim()];
});

console.log( template('${ \'months\' | i18n:{ n: 5 } }')() );
// returns '5 meses'
console.log( template('${ \'months\' | i18n:{ n: 1 } }')() );
// returns '1 mes'
```

### Tests
[![travis](https://cdn.travis-ci.org/images/favicon-662edf026745110e8203d8cf38d1d325.png)](https://travis-ci.org/kiltjs/trisquel)
[![Build Status](https://travis-ci.org/kiltjs/trisquel.svg?branch=master)](https://travis-ci.org/kiltjs/trisquel)
[![Wercker](http://wercker.com/favicon.ico)](https://app.wercker.com/project/bykey/281f306e7157005f0a21b770fbb81086)
[![wercker status](https://app.wercker.com/status/281f306e7157005f0a21b770fbb81086/s "wercker status")](https://app.wercker.com/project/bykey/281f306e7157005f0a21b770fbb81086)
``` sh
npm test
```
