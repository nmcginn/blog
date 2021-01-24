#!/usr/bin/env node

const fs = require('fs');
const mustache = require('mustache');

const template = fs.readFileSync('scripts/template.mustache').toString('utf-8');

fs.readdirSync('site/').filter(file => file.endsWith('.html')).forEach(file => {
    const filepath = `site/${file}`;
    const content = mustache.render(template, { content: fs.readFileSync(filepath).toString('utf-8') });
    fs.writeFileSync(filepath, content, { encoding: 'utf-8' });
    console.log(`Template applied to ${filepath}`);
});
