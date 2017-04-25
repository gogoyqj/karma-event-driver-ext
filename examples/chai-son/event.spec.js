import eventHook, { beforeHook, afterHook, browser } from 'karma-event-driver-ext/cjs/event-driver-hooks';
let { $$addTest, executer } = browser;

describe('Event Drive Tests', function() {
    this.timeout(200000);
    before(async () => {
        await beforeHook();
    });
    after(async () => {
        await afterHook();
    });
    it('click element', async () => {
        var div = document.createElement('div');

        document.body.appendChild(div);
        div.innerHTML = 'Click Me';
        var a = 1;
        div.onclick = function() {
            setTimeout(() => {
                a++;
                executer.next();
            }, 500)
        };

        await browser
            .click(div)
            .$$action('wait');
        expect(a).to.equal(2);

        await browser
            .click(div)
            .$$action('wait');

        expect(a).to.equal(3);
    });
});
