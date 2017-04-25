import { autobind } from 'core-decorators';
/**
 * browser side hooks for webdriver based event drive test
 */
let config = (conf) => {
    _config = {
        ..._config,
        ...conf
    };
};
let _config = {
    port: 8848,
    host: '127.0.0.1'
};
let idCount = 0;
let Connection;
// get browserId
let browserId = ((opener || parent).location.search || '').replace(/^\S+id=([0-9]+)\S*/g, (mat, id) => id);
let switchFrame = parent !== window;

// this ext can only run in karma default tap with an iframe#context
let contextFrame = parent.document.getElementById('context');
contextFrame = contextFrame && contextFrame.nodeName === 'IFRAME' ? contextFrame : null;
let fullScreenStyle = { position: 'absolute', left: 0, top: 0, background: '#fff' },
    originalStyle = {};
if (contextFrame) {
    for (let pro in fullScreenStyle) {
        originalStyle[pro] = contextFrame.style[pro];
    }
}
/**
 * @private Executer 
 */
function * Executer(browser) {
    let tests = browser.__tests;
    while (true) {
        let status = yield;
        (tests.shift() || noop)(status);
    }
} // well, must put Executer here, or babel can't compile correct

function noop() {}

let initialled, $$Browser; 

// webdriver api serial
let waitingPromise = Promise.resolve();
// promise ensure serial
let serialPromiseResolve, serialPromiseReject;


class $Browser {
    constructor() {
        this.__tests;
        this.__stack;
        this.executer;
    }
    /**
     * @public $$addTest register test
     * @param {Function} tests as many functions as u want
     * @return {browser} calling chain 
     */
    @autobind
    $$addTest (...tests) {
        tests.forEach((test) => {
            this.__tests.push(async () => {
                await test(this);
                // auto run next test
                this.executer.next();
            });
        });
        return this;
    }
    /**
     * @public $$action execute right now
     * @param {Boolean} waitForExecuterNext wait for calling executer.next
     * @param {Function} done callback
     * @return {Promise} if !!waitForExecuterNext === false return a resolved promise, else a promise not resolved until executer.next being called
     */
    async $$action (waitForExecuterNext, done) {
        let actions = this.__stack.splice(0);
        if (!initialled) return console.error('ensure beforeHook has been called');
        let executerPromiseResolve, executerPromiseReject;
        let prom;
        if (waitForExecuterNext) {
            prom = new Promise((resolve, reject) => {
                executerPromiseResolve = resolve;
                executerPromiseReject = reject;
            });
            // wait for executer.next()
            console.log('async callback add to executer, ensure executer.next(rejectReason) will be called');
            // !!status === true, then reject
            this.__tests.unshift((status) => {
                !!status ? executerPromiseReject(status) : executerPromiseResolve()
            });
        };
        await waitingPromise;
        if (actions.length) {
            waitingPromise = wrapPromise((resolve, reject) => {
                serialPromiseResolve = resolve;
                serialPromiseReject = reject;
            }, contextFrame);
            this.__callDriver(actions);
            await waitingPromise;
        }
        await prom;
        done && done();
    }
    /**
     * @public $$actionAndWait equal to $$action('waitForExecuterNext')
     */
    async $$actionAndWait (done) {
        await this.$$action(true, done);
    }
    /**
     * @private __callDriver send Command to server
     * @param {Array} actions
     */
    __callDriver(actions) {
        if (!contextFrame) return console.warn('webdriver driving test can\'t run in current tab', location.href);
        Connection.emit('runCommand', {
            actions,
            browserId,
            switchFrame
        });
    }
    /**
     * parse browser.api(a, b, c) => ['api', [b, c]], so can be sent to the server and executed by the webdriver.
     * @private __toRunnable
     * @param {string} def api name
     * @param {any} args arguments
     */
     __toRunnable(def, ...args) {
        this.__stack.push([
            def,
            args.map((ele) => {
                if (ele instanceof Element) {
                    // if no id, allocate one
                    ele.id = ele.id || (ele.className && ele.className.split(' ')[0] || 'WebDriverID').replace(/\-/g, '_') + idCount++;
                    return '#' + ele.id;
                } else if (typeof ele === 'function') {
                    throw Error('can\'t use function ' + ele);
                } else {
                    return ele;
                }
            })
        ]);
        return this;
    }
}

function Browser () {
    this.__tests = []; // for register tests
    this.__stack = [];// tmp stack for browser[api]
    this.executer = Executer(this);
    this.executer.next(); // start
}

$$Browser = Browser.prototype = new $Browser();

let browser = new Browser();

function fullScreen(full = true) {
    if (!contextFrame) return;
    let tar = full ? fullScreenStyle : originalStyle;
    for (let pro in tar) {
        contextFrame.style[pro] = tar[pro];
    }
}

/**
 * load script async
 * @param {string} src
 * @return promise
 */
async function loadScript(src) {
    let script = document.createElement('script');
    script.type = 'text/javascript';
    let rs, rj, timer;
    script.onload = () => {
        script.onload = null;
        clearTimeout(timer);
        rs();
    };
    let prom = new Promise((resolve, reject) => {
        rs = resolve;
        rj = reject;
    });
    script.src = src;
    document.head.appendChild(script);
    timer = setTimeout(() => rj('load ' + src + ' time out'), 10000);
    return prom;
}

async function wrapPromise(fn, wait = true) {
    return new Promise((resolve, reject) => {
        wait ? fn(resolve, reject) : resolve();
    });
}
/**
 * run first in before()
 * @params {function} done if assigned, call done after promise resolved.
 * @return promise
 */
async function beforeHook(done) {
    // height & width : 100%
    fullScreen();
    if (initialled) return done && done();
    let { url, host, port } = _config;
    if (!url) url = host + ':' + port;
    await loadScript('//' + url + '/socket.io/socket.io.js');
    // it's hard to share socket with karma
    // Connection = (opener || parent).karma.socket;
    Connection = io(url);
    Connection.on('runBack', (message) => {
        console.log('runBack', message);
        message && !message.status  ? serialPromiseResolve() : serialPromiseReject(message.status);
    });
    // whether there is contextFrame, wait
    waitingPromise = wrapPromise((resolve) => {
        Connection.on('ready', (message) => {
            let { supportedDefs = '' } = message;
            supportedDefs.split(' ').map((def) => {
                $$Browser[def] = function () {
                    return this.__toRunnable(def, ...arguments);
                };
            });
            // console.log('ready', message);
            resolve();
        });
    });
    await waitingPromise;
    initialled = true;
    done && done();
};

/**
 * run last in after()
 * @params {function} done if assigned, call done after promise resolve
 * @return promise
 */
async function afterHook(done) {
    fullScreen(false);
    done && done();
};

export default {
    loadScript,
    config,
    browser,
    beforeHook,
    afterHook
}

export {
    loadScript,
    config,
    browser,
    beforeHook,
    afterHook
}