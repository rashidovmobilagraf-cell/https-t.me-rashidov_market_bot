const { spawn } = require('child_process');

const child = spawn('npx.cmd', ['vercel', 'login', '--github']);

child.stdout.on('data', (data) => {
    console.log(`STDOUT: ${data}`);
});

child.stderr.on('data', (data) => {
    console.log(`STDERR: ${data}`);
});

// Stop after 10 seconds
setTimeout(() => {
    child.kill();
}, 10000);
