const fs = require('fs');
const content = fs.readFileSync('c:/Users/leela/Desktop/gym-app/frontend/src/GymApp.jsx', 'utf8');
let balance = 0;
let inString = false;
let stringChar = '';
let inComment = false;
let inRegex = false;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const next = content[i+1];

  if (inComment) {
    if (inComment === '//' && char === '\n') inComment = false;
    if (inComment === '/*' && char === '*' && next === '/') { inComment = false; i++; }
    continue;
  }

  if (inString) {
    if (char === '\\') { i++; continue; }
    if (char === inString) inString = false;
    continue;
  }

  if (char === '/' && next === '/') { inComment = '//'; i++; continue; }
  if (char === '/' && next === '*') { inComment = '/*'; i++; continue; }
  if (char === "'" || char === '"' || char === '`') { inString = char; continue; }

  if (char === '{') balance++;
  if (char === '}') balance--;
}

console.log('Final brace balance:', balance);
