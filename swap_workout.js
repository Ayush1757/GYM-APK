const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'home.html');
let content = fs.readFileSync(filePath, 'utf-8');

const historyStart = content.indexOf(' <!-- WORKOUT HISTORY -->');
const logStart = content.indexOf(' <!-- ═══════════════ MY WORKOUT LOG (member self-track) ═══════════════ -->');
const logEnd = content.indexOf(' <!-- PAYMENTS PAGE -->');

if (historyStart !== -1 && logStart !== -1 && logEnd !== -1) {
    const historyBlock = content.substring(historyStart, logStart);
    const logBlock = content.substring(logStart, logEnd);
    
    // Swap them
    const newContent = content.substring(0, historyStart) + logBlock + historyBlock + content.substring(logEnd);
    fs.writeFileSync(filePath, newContent);
    console.log('Successfully swapped!');
} else {
    console.log('Could not find sections.');
}
