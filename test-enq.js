const { Input } = require('enquirer');
const prompt = new Input({ message: 'Test:' });
prompt.run().then(console.log).catch(err => {
    console.log('Caught!', err);
});
setTimeout(() => {
    process.stdin.emit('data', '\u0003');
}, 500);
