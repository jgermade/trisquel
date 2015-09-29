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
  },
  template: 'sample',
  label: {
    cancel: 'cancel'
  }
};

$template.compile('$if{ foo === "bar" }gogogo{:}whoops{/}')(data)
// returns 'gogogo'

$template.compile('$each{ item, key in map }[${foo}:${key}:${item}]{/}')(data);
// returns '[bar:hi:all][bar:bye:nobody]'
```
