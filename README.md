nitro-template [![wercker status](https://app.wercker.com/status/281f306e7157005f0a21b770fbb81086/s "wercker status")](https://app.wercker.com/project/bykey/281f306e7157005f0a21b770fbb81086)
=============================
[![npm version](https://badge.fury.io/js/nitro-template.svg)](http://badge.fury.io/js/nitro-template)
[![Build Status](https://travis-ci.org/nitrojs/nitro-template.svg?branch=master)](https://travis-ci.org/nitrojs/nitro-template)

Installation
------------
```.sh
npm install nitro-template --save
```

Usage
-----
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
