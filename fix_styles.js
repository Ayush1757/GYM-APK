const fs = require('fs');
const path = 'e:/Project/login-app/public/dashboard.html';
let content = fs.readFileSync(path, 'utf8');

const styleRegex = /<([a-zA-Z0-9\-]+)([^>]*?)style="([^"]+)"([^>]*?)>/g;
let styleMap = new Map();
let styleCounter = 1;

content = content.replace(styleRegex, (match, tag, beforeStyle, inlineStyle, afterStyle) => {
    let normStyle = inlineStyle.trim().replace(/\s+/g, ' ');
    if (normStyle === '') return `<${tag} ${beforeStyle}${afterStyle}>`;

    if (!styleMap.has(normStyle)) {
        styleMap.set(normStyle, `auto-style-${styleCounter++}`);
    }
    let className = styleMap.get(normStyle);

    let newAttrs = `${beforeStyle} ${afterStyle}`;
    
    if (/class="/.test(newAttrs)) {
        newAttrs = newAttrs.replace(/class="/, `class="${className} `);
    } else {
        newAttrs += ` class="${className}"`;
    }

    newAttrs = newAttrs.replace(/\s+/g, ' ').trim();

    return `<${tag} ${newAttrs}>`;
});

let cssAdded = '\n<style id="auto-styles">\n';
for (let [style, cls] of styleMap.entries()) {
    cssAdded += `.${cls} { ${style} }\n`;
}
cssAdded += '</style>\n</head>';

content = content.replace('</head>', cssAdded);
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed inline styles. Total unique styles:', styleMap.size);
