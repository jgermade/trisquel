/*
 * nitro-template
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Jesús Manuel Germade Castiñeiras <jesus@germade.es>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */


(function (root, factory) {
    'use strict';

    if ( typeof module !== 'undefined' ) {
        module.exports = factory();
    } else {
    	if ( root.define !== undefined ) {
            root.define('$template', factory );
        } else if ( root.angular ) {
            var $template = factory(root);
            root.angular.module('nitroTemplate', [])
              .provider('$template', function () {
                this.config = function (configFn) {
                  configFn.call(null, $template);
                };

                this.$get = function () {
                  return $template;
                };
              });
        } else if ( root.define !== undefined ) {
            root.define('$template', factory );
        } else if( !root.$template ) {
            root.$template = factory();
        }
    }

})(this, function () {
    'use strict';

    function noop () {}

    function _instanceof (prototype) {
    	return function (o) {
    		return o instanceof prototype;
    	};
    }

    function isString (o) {
    	return typeof o === 'string';
    }
    var isFunction = _instanceof(Function),
    	isArray = _instanceof(Array),
    	isObject = _instanceof(Object);

    // ----------------------------

    function parseExpression (expression) {
        /* jshint ignore:start */
        return (new Function('model', 'try{ with(model) { return (' + expression + ') }; } catch(err) { return \'\'; }'));
        /* jshint ignore:end */
    }

    function _each(o, handler) {

      if( !isFunction(handler) ) {
        throw 'handler should be a function';
      }

      if( isArray(o) ) {
        o.forEach(handler);
      } else if( isObject(o) ) {
        for( var key in o ) {
          handler.apply(null, [o[key], key]);
        }
      }
    }

    function _extend (dest, src) {
      for( var key in src ) {
        dest[key] = src[key];
      }
    }

    function Scope (data) {
        if( data instanceof Object ) {
            _extend(this, data);
        }
    }

    Scope.prototype.$new = function(data) {
        var S = function (data) {
            if( data instanceof Object ) {
                _extend(this, data);
            }
        };
        S.prototype = this;
        return new S(data);
    };

    Scope.prototype.$extend = function(data) {
        return _extend(this, data);
    };

    Scope.prototype.$eval = function ( expression ) {
        return parseExpression(expression)(this);
    };

    // ----------------------------

    var splitRex = /\$[\w\?]*{[^\}]+}|{[\$\/]}|{\:}/,
        matchRex = /(\$([\w\?]*){([^\}]+)})|({[\$\/]})|({\:})/g;

    function _compile(tmpl){

        if( !isString(tmpl) ) {
            throw 'template should be a string';
        }

        var texts = tmpl.split(splitRex),
            list = [texts.shift()];

        tmpl.replace(matchRex,function(match, match2, cmd, expression, closer, colon){
            list.push( closer ?
            			{ cmd: '', expression: '/' } :
            			( colon ?
            				{ cmd: '', expression: 'else' } :
            				{ cmd: cmd, expression: expression }
            			)
            		);
            list.push(texts.shift());
        });

        var compiled = raiseList(list, 'root');

        return compiled;
    }

    function raiseList(tokens, cmd, expression) {
        cmd = (cmd || '').trim();
        expression = expression || '';

        var options = { content: [] },
            currentOption = 'content',
            nextOption = function (optionName) {
                options[optionName] = [];
                currentOption = optionName;
            };

        var token = tokens.shift();

        while( token !== undefined ){

            if( typeof token === 'string' ) {
            	options[currentOption].push(token);
            } else if( isObject(token) ) {
                if( token.cmd ) {

                    if( _cmd[token.cmd] && _cmd[token.cmd].standalone ) {
                      options[currentOption].push(new ModelScript(token.cmd,token.expression.replace(/\/$/,'')));
                    } else {
                      switch(token.cmd) {
                          case 'case':
                          case 'when':
                              nextOption(token.expression);
                              break;
                          default: // cmd is like a helper
                              if( token.expression.substr(-1) === '/' ) {
                              	options[currentOption].push(new ModelScript(token.cmd, token.expression.replace(/\/$/,'') ));
                              } else {
                              	options[currentOption].push(raiseList(tokens, token.cmd, token.expression));
                              }
                              break;
                      }
                    }

                } else switch( token.expression ) {
                    case 'else':
                    case 'otherwise': nextOption('otherwise'); break;
                    case '/':
                        return new ModelScript(cmd, expression, options); // base case
                    default:
                        options[currentOption].push( new ModelScript('var', token.expression ) );
                        break;
                }
            }
            token = tokens.shift();
        }
        return new ModelScript(cmd, expression, options);
    }

    function _evalContent(scope, content) {
        var result = '';

        if( isFunction(content) ) {
          return content(scope);
        } else if( isArray(content) ) {

          // console.warn('_evalContent', scope, content);
          content.forEach(function(token){
              if( isString(token) ) {
              	result += token;
              } else if( token instanceof ModelScript ) {
              	result += token.render(scope);
              } else if( isArray(token) ) {
              	result += _evalContent(scope, content);
              }
          });

          return result;
        } else {
          return content;
        }
    }



    var _cmd = {
          root: function(scope){
            return this.content(scope);
          },
          var: function(scope, expression){
            return scope.$eval(expression);
          },
          if: function(scope, condition){
            return scope.$eval(condition) ? this.content(scope) : this.otherwise(scope);
          }
        };
    _cmd['?'] = _cmd.if;

    function _optionEvaluator (content) {
      return function (scope) {
        return _evalContent(scope, content );
      };
    }

    function ModelScript(cmd, expression, options){
        this.cmd = cmd;
        this.expression = expression;
        this.options = { content: noop, otherwise: noop };

        for( var key in options ) {
          this.options[key] = _optionEvaluator(options[key]);
        }
    }

    ModelScript.prototype.render = function (data) {

        if( !isFunction(_cmd[this.cmd]) ) {
          return '[command ' + this.cmd+' not found]';
        }

        var scope = ( data instanceof Scope ) ? data : new Scope(data),
            content = _cmd[this.cmd].apply(
                          this.options,
                          [scope, this.expression]
                      ),
            contentRendered = _evalContent(scope, content);

        return contentRendered === undefined ? '' : contentRendered;
    };

    function template (tmpl) {
        var compiled = _compile(tmpl),
            renderer = function (scope) {
                return compiled.render(scope);
            };

        renderer.compiled = compiled;

        return renderer;
    }

    template.cmd = function(cmdName, handler, standalone){
        if( isString(cmdName) && isFunction(handler) ) {
            handler.standalone = standalone;
            _cmd[cmdName] = handler;
        }
    };
    template.helper = template.cmd;

    var templatesCache = {};

    template.get = function (name) {
      return templatesCache[name];
    };

    template.put = function (name, tmpl) {
      templatesCache[name] = template(tmpl);
      return template;
    };

    // each as compile.cmd example

    var RE_EACH_INDEX = /^(.*)(\,(.*))in(.*)$/,
        RE_EACH = /^(.*)\bin\b(.*)$/,
        _cmdEach = function (scope, listExp, itemExp, indexExp) {

          var _this = this,
              result = '',
              list = scope.$eval(listExp),
              indexKey;

          if( isArray(list) ) {
            indexKey = '$index';
          } else if( isObject(list) ) {
            indexKey = '$key';
          } else {
            console.warn('can not list', list);
            return '';
          }

          _each(list, function (item, index) {
            var o = {};
            o[itemExp] = item;
            o[indexKey] = index;
            if( indexExp ) {
              o[indexExp] = index;
            }
            result += _this.content( scope.$new(o) );
          });

          return result;
        };

    template.cmd('each', function (scope, expression) {
          var _this = this, match;

          match = expression.match(RE_EACH_INDEX);
          if( match ) {
            return _cmdEach.call(this, scope, match[4], match[1].trim(), match[3].trim());
          }

          match = expression.match(RE_EACH);
          if ( match ) {
            return _cmdEach.call(this, scope, match[2], match[1].trim());
          }

          throw expression + ' malformed each expression';
        });

    // cmd: include

    template.cmd('include', function (scope, expression) {
      var partial = template.get( expression.trim() );
      if( partial ) {
        return partial(scope);
      }
      partial = template.get( scope.$eval(expression) );
      if( partial ) {
        return partial(scope);
      }

      throw 'partial' + expression + 'not found';
    });

    // --------------------------

    return template;
});
