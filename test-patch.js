const readline = require('readline');
const originalPause = readline.Interface.prototype.pause;
readline.Interface.prototype.pause = function() {
    try {
        originalPause.call(this);
    } catch (e) {
        if (e.code !== 'ERR_USE_AFTER_CLOSE') throw e;
    }
};

const { Input } = require('enquirer');
const prompt = new Input({ message: 'Test:' });
prompt.run().then(console.log).catch(err => {
    console.log('Caught!', err.message || err);
});
setTimeout(() => {
    process.stdin.emit('data', '\u0003');
}, 500);
