import { beforeHook, afterHook, browser } from 'karma-event-driver-ext/cjs/event-driver-hooks';
let { executer, $$addTest } = browser;
describe('Event Drive Tests', function() {
    // increase timeout
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 2000000;

    beforeAll((done) => {
        beforeHook(done);
    });
    
    afterAll((done) => {
        afterHook(done);
    });

    it('Simple Demo', async (done) => {
        var div = document.createElement('div');
        document.body.appendChild(div);
        div.innerHTML = 'Click Me';
        var a = 1;
        div.onclick = function() {
            a++
        };
        await browser
            .click(div)
            .$$action();
        expect(a).toBe(2);
        done();
    });

    it('Async Demo', async (done) => {
        var div = document.createElement('div');
        div.innerHTML = 'Click Me';
        var a = 1;
        div.onclick = function() {
            a++;
            setTimeout(() => {
                a++;
                executer.next();
            }, 500);
        };
        document.body.appendChild(div);

        await browser
            .click(div)
            .$$action('wait'); // wait for executer.next()
        expect(a).toBe(3);
        done();
    });

    it('React Like Demo', async (done) => {
        var div = document.createElement('div');
        div.innerHTML = 'Click Me';
        var a = 1;
        div.onclick = function() {
            a++;
            setTimeout(() => {
                a++;
                executer.next();
            }, 500);
        };
        let render = () => {
            document.body.appendChild(div);
            // start executing register tests
            executer.next();
        }

        // register two test execute in serial, and won't execute util calling executor.next()
        $$addTest(
            async () => {
                await browser
                    .click(div)
                    .$$action('wait');
                expect(a).toBe(3);
            },
            async () => {
                await browser
                    .click(div)
                    .$$action('wait');
                expect(a).toBe(5);
                // finish, call 'done'
                done();
            }
        );
        
        render();
    });
    
});