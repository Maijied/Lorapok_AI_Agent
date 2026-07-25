const { Input } = require('enquirer');
process.on('uncaughtException', (err) => {
    if (err.message.includes('readline was closed')) {
        console.log('Swallowed readline error');
        return;
    }
    console.error(err);
    process.exit(1);
});
async function loop() {
    console.log('Starting loop');
    const prompt = new Input({ message: 'Test:' });
    try {
        const res = await prompt.run();
        console.log('Result:', res);
    } catch (err) {
        console.log('Caught rejection!');
    }
    console.log('Loop ended');
}
loop();
setTimeout(() => {
    process.stdin.emit('data', '\u0003');
}, 500);
