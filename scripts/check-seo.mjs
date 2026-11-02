import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root = 'dist/json-explorer-arpan/browser';
const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
for (const url of urls) {
    const path = new URL(url).pathname;
    const html = readFileSync(join(root, path, 'index.html'), 'utf8');
    const expectOne = (pattern, label) => {
        if ([...html.matchAll(pattern)].length !== 1)
            throw new Error(`${url}: expected one ${label}`);
    };
    expectOne(/<h1\b/g, 'H1');
    expectOne(/<title>/g, 'title');
    expectOne(/rel="canonical"/g, 'canonical');
    if (!html.match(/<link[^>]*rel="canonical"[^>]*>/)?.[0].includes(`href="${url}"`) || !html.includes('name="description"'))
        throw new Error(`${url}: missing metadata`);
    if (path !== '/privacy' && path !== '/about') {
        if (
            !html.includes('Example input and output') ||
            !html.includes('Supported data and limitations')
        )
            throw new Error(`${url}: guide missing from initial HTML`);
    }
}
if (!existsSync(join(root, 'assets/monaco/min/vs/loader.js')))
    throw new Error('Monaco assets missing; install the monaco-editor dependency');
if (!existsSync(join(root, '404.html')) || !existsSync(join(root, 'social-preview.png')))
    throw new Error('Missing public assets');
console.log(
    `Verified ${urls.length} prerendered sitemap pages, metadata, examples, 404 and social image.`,
);
