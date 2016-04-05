
var assert = require('assert'), data,
		$template = require('../lib/template'),
		samplePartial = $template.put('sample', 'value: ${foo}'),
		i18n = {
			cancel: 'Cancel',
			accept: 'Accept'
		};

$template.cmd('i18n', function (scope, expression) {
		return i18n[expression.trim()] || i18n[scope.eval(expression)] || expression.trim();
	}, true);

beforeEach(function () {
	data = {
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
});

describe('basic replace', function () {

	it("should replace value", function() {
		assert.strictEqual(
			$template( 'value: ${foo}')(data),
			'value: bar' );
  });

	it("should return if", function() {
		assert.strictEqual( $template('$if{ foo === "bar" }gogogo{:}whoops{/}')(data), 'gogogo' );
  });

	it("should return otherwise", function() {
		assert.strictEqual( $template('$if{ foo !== "bar" }gogogo{:}whoops{/}')(data), 'whoops' );
  });

	it("should return otherwise (2)", function() {
		assert.strictEqual( $template('$if{ foo !== "bar" }gogogo{:}{/}')(data), '' );
  });

});


describe('partial', function () {

	it("should use sample partial", function() {
		assert.strictEqual( samplePartial(data), 'value: bar' );
  });

	it("should include sample partial", function() {
		assert.strictEqual( $template('$include{\'sample\'}')(data), 'value: bar' );
  });

	it("should return if sample as string", function() {
		assert.strictEqual( $template('$if{ foo === "bar" }$include{\'sample\'}{:}whoops{/}')(data), 'value: bar' );
  });

	it("should return if sample as string", function() {
		assert.strictEqual( $template('$if{ foo === "bar" }$include{ template }{:}whoops{/}')(data), 'value: bar' );
  });

});


describe('each command', function () {

	it("should return list", function() {
		assert.strictEqual( $template('$each{ item in list },${item}{/}')(data), ',foo,bar,foobar');
  });

	it("should return list with index", function() {
		assert.strictEqual(  $template('$each{ item in list }[${$index}:${item}]{/}')(data), '[0:foo][1:bar][2:foobar]');
  });

	it("should return list with index", function() {
		assert.strictEqual(  $template('$each{ item,key in list }[${key}:${item}]{/}')(data), '[0:foo][1:bar][2:foobar]');
  });

	it("should return list with inheritance", function() {
		assert.strictEqual(  $template('$each{ item in list }[${foo}:${item}]{/}')(data), '[bar:foo][bar:bar][bar:foobar]');
  });

	it("should return map", function() {
		assert.strictEqual(  $template('$each{ item in map }[${$key}:${item}]{/}')(data), '[hi:all][bye:nobody]');
  });

	it("should return map with key", function() {
		assert.strictEqual(  $template('$each{ item, key in map }[${key}:${item}]{/}')(data), '[hi:all][bye:nobody]');
  });

	it("should return map with key and inheritance", function() {
		assert.strictEqual(  $template('$each{ item, key in map }[${foo}:${key}:${item}]{/}')(data), '[bar:hi:all][bar:bye:nobody]');
  });

});


describe('custom commands', function () {

	it("should add new command", function() {
		$template.cmd('double', function (scope, expression) {
			return Number(scope.eval(expression))*2;
		}, true);

		assert.strictEqual(  $template('$double{4}')(data), '8');
  });

	it("should use custom i18n command (helper)", function() {
		assert.strictEqual(  $template('$i18n{label.cancel}')(data), 'Cancel');
  });

	it("should use custom i18n command (helper) inside a condition", function() {
		assert.strictEqual(  $template('$if{ foo === "bar" }$i18n{cancel}{:}$i18n{accept}{/}, done!')(data), 'Cancel, done!');
  });

});
