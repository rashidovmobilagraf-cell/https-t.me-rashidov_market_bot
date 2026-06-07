const fs = require('fs');
const js = fs.readFileSync('live.js', 'utf8');
console.log("Has lucide?", js.includes("createLucideIcon"));
