const fs = require('fs');
const path = require('path');


// Let's just use regex on the whole file, but carefully.
const filePath = path.join(__dirname, 'public', 'home.html');
let content = fs.readFileSync(filePath, 'utf-8');

let styles = {};
let counter = 1;

// Regex to find tags with style attribute
// We match <tagname ... style="..." ...>
const tagRegex = /<([a-zA-Z0-9\-]+)([^>]*)style="([^"]+)"([^>]*)>/g;

let newContent = content.replace(tagRegex, (match, tag, beforeStyle, styleValue, afterStyle) => {
    // Determine class name
    let className;
    for (const [cls, val] of Object.entries(styles)) {
        if (val === styleValue) {
            className = cls;
            break;
        }
    }
    if (!className) {
        className = `home-auto-style-${counter++}`;
        styles[className] = styleValue;
    }

    // Now inject className into the tag
    let restOfAttrs = beforeStyle + afterStyle;
    
    // Check if there's already a class attribute
    if (/class="/.test(restOfAttrs)) {
        restOfAttrs = restOfAttrs.replace(/class="/, `class="${className} `);
    } else {
        restOfAttrs += ` class="${className}"`;
    }
    
    return `<${tag}${restOfAttrs}>`;
});

// Clean up extra spaces
newContent = newContent.replace(/  +/g, ' ');

// Inject CSS
let cssBlock = '\n    <style id="home-auto-styles">\n';
for (const [cls, val] of Object.entries(styles)) {
    cssBlock += `        .${cls} {\n`;
    const properties = val.split(';').map(p => p.trim()).filter(p => p);
    for (const prop of properties) {
        cssBlock += `            ${prop};\n`;
    }
    cssBlock += `        }\n`;
}
cssBlock += '    </style>\n</head>';

newContent = newContent.replace('</head>', cssBlock);

fs.writeFileSync(filePath, newContent);
console.log('Refactored ' + Object.keys(styles).length + ' unique inline styles.');
