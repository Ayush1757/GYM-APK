const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'home.html');
let content = fs.readFileSync(filePath, 'utf-8');

// Find the wlog section
const logStartStr = ' <!-- ═══════════════ MY WORKOUT LOG (member self-track) ═══════════════ -->';
const historyStartStr = ' <!-- WORKOUT HISTORY -->';

const logStart = content.indexOf(logStartStr);
const historyStart = content.indexOf(historyStartStr);

if (logStart === -1 || historyStart === -1) {
    console.log("Could not find sections");
    process.exit(1);
}

// Extract wlog section
const wlogBlock = content.substring(logStart, historyStart);

// Remove wlog section from its current position
content = content.substring(0, logStart) + content.substring(historyStart);

// Now find where to insert it: right before <!-- TODAY'S WORKOUT HIGHLIGHT -->
const insertPointStr = ' <!-- TODAY\'S WORKOUT HIGHLIGHT -->';
const insertStart = content.indexOf(insertPointStr);

if (insertStart === -1) {
    console.log("Could not find insert point");
    process.exit(1);
}

// Insert it
const newContent = content.substring(0, insertStart) + wlogBlock + '\n' + content.substring(insertStart);

fs.writeFileSync(filePath, newContent);
console.log("Successfully moved My Workout Log to the top!");
