
var REsplit = /\$[^}]*{[^}]*}|{\/}|{\:}|{else}/,
    // REmatch = /\$([^{]*){([^}]*)}|{(\/|\:|else)}/,
    REmatch = /\$([^{]*){([^}]*)}|{(\/|\:|else)}/g,
    cmds = require('./cmds');

function singleCmd (cmd, expression) {
  return function (scope) {
    return cmds[cmd](scope, expression);
  };
}

function raiseList (tokens, cmd, expression, waitingForClose) {
  var token = tokens.shift(),
      targets = { $$content: [], $$otherwise: [] },
      target = '$$content',
      cmdResult,
      resolver = function () {
        return function (scope) {
          return cmds[cmd](scope, expression, function (s) {
            return targets.$$content.map(function (piece) {
              return piece instanceof Function ? piece(s) : piece;
            }).join('');
          }, function (s) {
            return targets.$$otherwise.map(function (piece) {
              return piece instanceof Function ? piece(s) : piece;
            }).join('');
          });
        }
      };

  while( token !== undefined ) {

    if( typeof token === 'string' ) {
      targets[target].push(token);
    } else if( token.cmd === 'case' ) {
      if( !waitingForClose ) {
        throw new Error('template root can not have cases');
      }
      target = expression.trim();
    } else if( typeof token.cmd === 'string' ) {
      if( token.cmd ) {
        if( !cmds[token.cmd] ) {
          throw new Error('cmd \'' + token.cmd + '\' is not defined');
        }

        if( cmds[token.cmd].$noContent ) {
          targets[target].push(singleCmd(token.cmd, token.expression));
        } else {
          cmdResult = raiseList(tokens, token.cmd, token.expression, true);

          targets[target].push(cmdResult.fn);
          tokens = cmdResult.tokens;
        }

      } else {
        targets[target].push(singleCmd(token.cmd, token.expression));
      }

    } else if( token.expression === ':' || token.expression === 'else' ){
      target = '$$otherwise';
    } else if( token.expression === '/' ) {
      if( !waitingForClose ) {
        throw new Error('can not close root level');
      }
      return {
        fn: resolver(),
        tokens: tokens
      };
    } else {
      throw new Error('\'' + token.expression + '\' is not a valid no-cmd expression');
    }

    token = tokens.shift()
  }

  if( waitingForClose ) {
    throw new Error('cmd \'' + cmd + '\' not closed propertly');
  }

  return resolver();
}

function parse(tmpl){
  if( typeof tmpl !== 'string' ) {
    throw new Error('template should be a string');
  }

  var i = 0,
      texts = tmpl.split(REsplit),
      list = [];

  list[i++] = texts.shift();

  tmpl.replace(REmatch,function(match, cmd, expression, singleToken){
    // cmd = cmd && cmd.substr(1);
    expression = singleToken || expression;
    // console.log('> ', { cmd: cmd, expression: expression });

    if( cmd && !cmds[cmd] ) {
      throw new Error('cmd \'' + cmd + '\' is not defined');
    }

    var nextText = texts.shift(),
        bracketExtended = nextText.match(/(.*)}(.*)/);

    //
    if( bracketExtended ) {
      expression += '}' + bracketExtended[1];
      nextText = bracketExtended[2];
    }
    console.log('> ', { cmd: cmd, expression: expression }, arguments);

    list[i++] = { cmd: cmd, expression: expression };
    list[i++] = nextText;
  });

  // console.log('list', list);

  return raiseList(list, 'root');
}

module.exports = parse;
