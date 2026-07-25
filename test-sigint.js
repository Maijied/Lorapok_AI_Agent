const { Input } = require('enquirer');
const readline = require('readline');
const originalPause = readline.Interface.prototype.pause;
readline.Interface.prototype.pause = function() {
    try {
        originalPause.call(this);
    } catch (e) {
        if (e.code !== 'ERR_USE_AFTER_CLOSE') throw e;
    }
};

let count = 0;
process.on('SIGINT', () => {
    count++;
    console.log('SIGINT received, count:', count);
});

async function run() {
    const prompt = new Input({ message: 'Test:' });
    await prompt.run().catch(() => console.log('Prompt rejected'));
    console.log('Loop tick');
}
run();
setTimeout(() => {
    process.stdin.emit('data', '\u0003');
}, 500);
