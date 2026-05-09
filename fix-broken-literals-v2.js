const fs = require('fs');
const path = require('path');

const files = ['public/home.html', 'public/dashboard.html'];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern: ${ followed by chars that don't include } or newline, 
    // ending before a quote or tag end, where we are SURE it's missing a }.
    // If it's something like ${iconColor" or ${isDone ? '...' : '...'"
    
    // We look for ${ followed by chars that don't have } before the next quote or >.
    const brokenPattern = /\$\{([^{}\n]*?)(["'>])/g;
    
    const fixedContent = content.replace(brokenPattern, (match, p1, p2) => {
        // If p1 contains a space, it might be something like "new Date()" which is valid
        // but if it's "new Date()" followed by " then it's broken.
        // HOWEVER, "new Date()..." usually has a } at the end.
        
        // If there is NO } at all in the captured group p1, and p2 is a quote or >, 
        // it's highly likely to be broken.
        
        // Wait, if it was ${new Date()} then p1 would be "new Date()" and match would include }.
        // But our regex [^{}\n]*? EXCLUDES }. So if there IS a }, the regex won't match.
        
        // So any match here IS missing a } before the " or >.
        
        // EXCEPTION: if p1 contains a space, let's check if it's something like "new" or "String".
        // In reality, most template expressions in these files that use spaces SHOULD have a }.
        // The only reason they wouldn't is if they are broken.
        
        console.log(`Fixing broken literal in ${file}: ${match}`);
        return `\${${p1}}${p2}`;
    });

    if (content !== fixedContent) {
        fs.writeFileSync(filePath, fixedContent);
        console.log(`Fixed ${file}`);
    } else {
        console.log(`No broken literals found in ${file} using current pattern.`);
    }
});
