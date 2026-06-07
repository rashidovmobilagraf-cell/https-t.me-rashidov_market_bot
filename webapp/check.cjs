const fs = require('fs');
const js = fs.readFileSync('live.js', 'utf8');
console.log("Has Array.isArray? ", js.includes('Array.isArray'));
console.log("Length: ", js.length);
