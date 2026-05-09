const fs = require('fs');
const path = require('path');

const files = ['public/home.html', 'public/dashboard.html'];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern: ${ followed by non-} chars, then a quote or other end-of-expr char, but missing }
    // We specifically look for patterns like ${isDone ? '#052a15' : '#2a0000'
    // followed by " or > or space
    
    // This regex looks for ${ followed by chars that don't include } or ${, 
    // ending before a " or > or newline, if a } is not found before that.
    
    // Let's use a simpler approach: if we find ${ something and then a quote or > 
    // and that something doesn't contain }, it's likely broken.
    
    const brokenPattern = /\$\{([^{}]*?)(["' >])/g;
    
    const fixedContent = content.replace(brokenPattern, (match, p1, p2) => {
        // If p1 contains a } already, it's not broken (or at least not this specific way)
        if (p1.includes('}')) return match;
        
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
