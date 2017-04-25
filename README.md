## karma-event-driver-ext

### Introduction
----------------

[![Logic](./logic.jpeg)](xx)

This project aims to integrate webdriverio into karma, for writing event-drive-tests conveniently.

for example, in your browser side test code, call webdriverio api to simulate dragAndMove behavior:

```jsx
        await browser
            .moveToObject(document.body, 0, 0) // top-left corner
            .buttonDown() // left-mouse down
            .moveTo(null, 0, -100) // mouse-move -100 on the Y-axis
            .buttonUp() // left-mouse up
            .$$action(); // execute
```

#### How it works

browser in karma-event-driver-ext is just a proxy to receive command. while a webdriverio-like api being called, proxy will format arguments received, for example, convert an argument which type is Element to unique query, then call $$action to sends drive-commands to socket server and wait for executing response. 

webdriverio is used to drive the browser and simulate user-behavior.


Tips: 

+ must call $$action, a promise will be returned.
+ if Element has no id, event-drivers-hook js will assign a unique id to it automatically. 
+ most webdriverio api support[except $, $$, then]. [more api](http://webdriver.io/api.html)

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


```jsx
    import { beforeHook, afterHook, browser } from 'karma-event-driver-ext/cjs/event-driver-hooks';
    let { executer, $$addTest } = browser;
    describe('Test', function() {
        // first increase timeout
        ...
        // then before all hook
        before(async () => {
            await beforeHook();
            ...
        })

        after(async () => {
            ...
            await afterHook();
        })

        it('Example', async () => {
            await browser
                .click(document.body)
                .$$action();
            ...
        })
    });
```
                
#### Examples

+ [using mocha + chai-sinon](./examples/chai-son)
+ [using jasmine](./examples/jasmine)


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
 