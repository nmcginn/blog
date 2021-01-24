#!/usr/bin/env node

const fs = require('fs');
const marked = require('marked');
const mustache = require('mustache');

if (fs.existsSync('site/'))
    fs.rmSync('site/', { recursive: true });
fs.mkdirSync('site/');

const template = fs.readFileSync('scripts/template.mustache').toString('utf-8');

const posts = fs.readdirSync('posts/').filter(file => file.endsWith('.md')).reverse();
const titles = [];
posts.forEach(file => {
    const content = fs.readFileSync(`posts/${file}`).toString('utf-8');
    titles.push(content.substring(2, content.indexOf('\n')));
    const html = marked(content);
    const fullContent = mustache.render(template, { content: html });
    fs.writeFileSync(`site/${file.replace('.md', '.html')}`, fullContent, { encoding: 'utf-8' });
    console.log(`${file.replace('.md', '.html')} rendered`);
});

let siteDirectory = '\n\n';
for (let i = 0; i < posts.length; i++) {
    siteDirectory += `- [${titles[i]}](${posts[i].replace('.md', '.html')})\n`;
}

const index = fs.readFileSync('index.md').toString('utf-8');
const indexFullContent = mustache.render(template, { content: marked(index + siteDirectory) });
fs.writeFileSync('site/index.html', indexFullContent, { encoding: 'utf-8' });
console.log('index.html rendered');
