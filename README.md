## karma-event-driver-ext

### Introduction
----------------

[![Logic](./logic.jpeg)](xx)

This project aims to integrate webdriverio into karma, for writing event-drive-tests conveniently.

for example, in your browser side test code, call webdriverio api to simulate dragAndMove behavior:

```jsx
    await runCommand((browser) => {
        browser.moveToObject(document.body, 0, 0); // top-left corner
        browser.buttonDown(); // left-mouse down
        browser.moveTo(null, 0, -100); // mouse-move -100 on the Y-axis
        browser.buttonUp(); // left-mouse up
    });
```

### requirements

+ [selenium-server-standalone](http://selenium-release.storage.googleapis.com/3.3/selenium-server-standalone-3.3.1.jar)
+ [chromedriver](https://sites.google.com/a/chromium.org/chromedriver/), [more available drivers](http://www.seleniumhq.org/projects/webdriver/)
+ nodejs v6.10.0+
+ karma

then must export path to $PATH where u put drivers* or copy drivers* to project directory. 

### usage

#### npm install

#### karma.conf.js

```jsx
module.exports = {
     customLaunchers: {
        'Chrome': {
            base: 'WebDriverio',
            browserName: 'chrome',
            name: 'Karma'
        }
    },
    browsers: ['Chrome'],
    ...
}
```

#### Tests code [get webdriverio api](http://webdriver.io/api.html):

using mocha + chai-sinon

```jsx
    import eventHook, { beforeHook, afterHook, runCommand } from 'karma-event-driver-ext/cjs/event-driver-hooks';
    describe('Event Drive Tests', function() {
        // Notice: timeout, before, after is chai-sinon api
        // increase timeout
        this.timeout(200000);
        before(async() => {
            await beforeHook();
        });
        after(async() => {
            await afterHook(false);
        });
        it('click element', async () => {
            var div = document.createElement('div');
            div.innerHTML = 'Click Me';
            document.body.appendChild(div);
            div.id = 'assignedDiv'; // Tips: if element has no id, event-drivers-hook js will assign a unique id to it automatically. 
            var a = 1;
            div.onclick = function() {
                a++;
            };
            await runCommand((browser) => {
                // most webdriverio api support[except $, $$]. http://webdriver.io/api.html
                // browser is just a proxy to receive command and format arguments [convert dom to query, eg], then send to server and run by webdriverio.
                browser.click(div);
            });
            expect(a).to.equal(2);
        });
    });
```

using jasmine

```jsx
    import eventHook, { beforeHook, afterHook, runCommand } from 'karma-event-driver-ext/cjs/event-driver-hooks';
    describe('Jasmine', function() {
        // increase timeout
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000;
        beforeAll((done) => {
            beforeHook(done);
        });
        afterAll((done) => {
            afterHook(done);
        });
        // can wrap a proxy of it
        let _it = async (desc, fn) => {
            it(desc, async (done) => {
                await fn();
                done();
            })
        };
        _it('click element', async () => {
            var div = document.createElement('div');
            document.body.appendChild(div);
            div.innerHTML = 'click me';
            var a = 1;
            div.onclick = function() {
                a++;
            };
            await runCommand((browser) => {
                browser.click(div);
            });
            expect(a).toBe(2);
        });
        // or
        it('click element', async (done) => {
            var div = document.createElement('div');
            document.body.appendChild(div);
            div.innerHTML = 'click me';
            var a = 1;
            div.onclick = function() {
                a++;
            };
            await runCommand((browser) => {
                browser.click(div);
            });
            expect(a).toBe(2);
            done();
        });
    });
```

#### Run Test:

cli

```
    // start selenium-server-standalone
    java -jar selenium-server-standalone-3.3.1.jar
    // start karma server && event-driver server
    node node_modules/karma-event-driver-ext
```

api

```jsx
    let ext, { init } = require('karma-event-driver-ext');
    let karmaServer = init({
        onExit: (exitCode) {
            console.log('exitCode',  exitCode);
        }
    });
```
 