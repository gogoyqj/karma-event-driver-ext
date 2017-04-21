'use strict';

exports.__esModule = true;
exports.afterHook = exports.runCommand = exports.beforeHook = exports.config = exports.loadScript = undefined;

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

/**
 * load script async
 * @param {string} src
 * @return promise
 */
var loadScript = function () {
    var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(src) {
        var script, rs, rj, timer, prom;
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        script = document.createElement('script');

                        script.type = 'text/javascript';
                        rs = void 0, rj = void 0, timer = void 0;

                        script.onload = function () {
                            script.onload = null;
                            clearTimeout(timer);
                            rs();
                        };
                        prom = new _promise2.default(function (resolve, reject) {
                            rs = resolve;
                            rj = reject;
                        });

                        script.src = src;
                        document.head.appendChild(script);
                        timer = setTimeout(function () {
                            return rj('load ' + src + ' time out');
                        }, 10000);
                        return _context.abrupt('return', prom);

                    case 9:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function loadScript(_x2) {
        return _ref.apply(this, arguments);
    };
}();

var wrapPromise = function () {
    var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(fn) {
        var wait = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        return _context2.abrupt('return', new _promise2.default(function (resolve, reject) {
                            wait ? fn(resolve, reject) : resolve();
                        }));

                    case 1:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));

    return function wrapPromise(_x3) {
        return _ref2.apply(this, arguments);
    };
}();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * browser side hooks for webdriver based event drive test
 */
var browser = {
    _stack: [] // tmp stack for browser[api]
};
var _config = {
    port: 8848,
    host: '127.0.0.1'
};
var Connection = void 0;
// get browserId
var browserId = ((opener || parent).location.search || '').replace(/^\S+id=([0-9]+)\S*/g, function (mat, id) {
    return id;
});
var switchFrame = parent !== window;

var contextFrame = parent.document.getElementById('context');
contextFrame = contextFrame && contextFrame.nodeName === 'IFRAME' ? contextFrame : null;
var fullScreenStyle = { position: 'absolute', left: 0, top: 0, background: '#fff' },
    originalStyle = {};
if (contextFrame) {
    for (var pro in fullScreenStyle) {
        originalStyle[pro] = contextFrame.style[pro];
    }
}

function fullScreen() {
    var full = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    if (!contextFrame) return;
    var tar = full ? fullScreenStyle : originalStyle;
    for (var _pro in tar) {
        contextFrame.style[_pro] = tar[_pro];
    }
}
/**
 * send Command to server
 * @param {object} message
 */
var _runCommand = function _runCommand(actions) {
    if (!contextFrame) return console.warn('webdriver driving test can\'t run in current tab', location.href);
    if (typeof actions !== 'function') return console.error('runCommand only receive function actions');
    actions(browser);
    Connection.emit('runCommand', {
        actions: browser._stack.splice(0),
        browserId: browserId,
        switchFrame: switchFrame
    });
};
var idCount = 0;
/**
 * parse browser.api(a, b, c) => ['api', [b, c]], so can be sent to the server and executed by the webdriver.
 * @private _toRunnable
 * @param {string} def api name
 * @param {any} args arguments
 */
function _toRunnable(def) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
    }

    browser._stack.push([def, args.map(function (ele) {
        if (ele instanceof Element) {
            // if no id, allocate one
            ele.id = ele.id || (ele.className && ele.className.split(' ')[0] || 'WebDriverID').replace(/\-/g, '_') + idCount++;
            return '#' + ele.id;
        } else if (typeof ele === 'function') {
            throw Error('can\'t use function ' + ele);
        } else {
            return ele;
        }
    })]);
}

var initialled = void 0,
    waitingPromise = _promise2.default.resolve(),
    rs = void 0,
    rj = void 0;

var config = function config(conf) {
    _config = (0, _extends3.default)({}, _config, conf);
};
/**
 * run first in before()
 * @params {function} done if assigned, call done after promise resolved.
 * @return promise
 */
var beforeHook = function () {
    var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(done) {
        var _config2, url, host, port;

        return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        if (!initialled) {
                            _context3.next = 2;
                            break;
                        }

                        return _context3.abrupt('return', done && done());

                    case 2:
                        _config2 = _config, url = _config2.url, host = _config2.host, port = _config2.port;

                        if (!url) url = host + ':' + port;
                        _context3.next = 6;
                        return loadScript('//' + url + '/socket.io/socket.io.js');

                    case 6:
                        // it's hard to share socket with karma
                        // Connection = (opener || parent).karma.socket;
                        Connection = io(url);
                        Connection.on('runBack', function (message) {
                            console.log('runBack', message);
                            message && !message.status ? rs() : rj(message.status);
                        });
                        // whether there is contextFrame, wait
                        waitingPromise = wrapPromise(function (resolve) {
                            Connection.on('ready', function (message) {
                                var _message$supportedDef = message.supportedDefs,
                                    supportedDefs = _message$supportedDef === undefined ? '' : _message$supportedDef;

                                supportedDefs.split(' ').map(function (def) {
                                    browser[def] = function () {
                                        _toRunnable.apply(undefined, [def].concat(Array.prototype.slice.call(arguments)));
                                        return this;
                                    };
                                });
                                // console.log('ready', message);
                                resolve();
                            });
                        });
                        _context3.next = 11;
                        return waitingPromise;

                    case 11:
                        fullScreen();
                        initialled = true;
                        done && done();

                    case 14:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, undefined);
    }));

    return function beforeHook(_x5) {
        return _ref3.apply(this, arguments);
    };
}();
/**
 * call webdriverio api from browser side
 * @return promise
 * @param {function} action chain of calling webdriverio api
 * @params {function} done if assigned, call done after promise resolve
 */
var runCommand = function () {
    var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(action, done) {
        return _regenerator2.default.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        if (initialled) {
                            _context4.next = 2;
                            break;
                        }

                        return _context4.abrupt('return', console.error('ensure beforeHook has been called'));

                    case 2:
                        _context4.next = 4;
                        return waitingPromise;

                    case 4:
                        waitingPromise = wrapPromise(function (resolve, reject) {
                            rs = resolve;
                            rj = reject;
                        }, contextFrame);
                        _runCommand(action);
                        _context4.next = 8;
                        return waitingPromise;

                    case 8:
                        done && done();

                    case 9:
                    case 'end':
                        return _context4.stop();
                }
            }
        }, _callee4, undefined);
    }));

    return function runCommand(_x6, _x7) {
        return _ref4.apply(this, arguments);
    };
}();
/**
 * run last in after()
 * @params {function} done if assigned, call done after promise resolve
 * @return promise
 */
var afterHook = function () {
    var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(done) {
        return _regenerator2.default.wrap(function _callee5$(_context5) {
            while (1) {
                switch (_context5.prev = _context5.next) {
                    case 0:
                        fullScreen(false);
                        done && done();

                    case 2:
                    case 'end':
                        return _context5.stop();
                }
            }
        }, _callee5, undefined);
    }));

    return function afterHook(_x8) {
        return _ref5.apply(this, arguments);
    };
}();

exports.default = {
    loadScript: loadScript,
    config: config,
    beforeHook: beforeHook,
    runCommand: runCommand,
    afterHook: afterHook
};
exports.loadScript = loadScript;
exports.config = config;
exports.beforeHook = beforeHook;
exports.runCommand = runCommand;
exports.afterHook = afterHook;
