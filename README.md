# JSON & Markdown Formatter

Free browser tools at [json-md-formatter.com](https://json-md-formatter.com/markdown) for JSON formatting, repair, tree exploration, CSV export, Markdown live preview and table conversion. Includes sample-based TypeScript, Go, Python Pydantic and PostgreSQL code generation.

## Run and verify

Use a supported even-numbered Node.js LTS release compatible with Angular 21, then:

```sh
npm ci
npm start
npm test -- --watch=false
npm run build
npm run check:seo
```

The development server uses port 4202. Production files are written to `dist/json-explorer-arpan/browser`. Angular prerenders the public tool and information routes so their headings, examples, links and metadata are present in the initial HTML.

## Example: JSON to Markdown

Input:

```json
[{"name":"Alice","score":95},{"name":"Bob","score":87}]
```

Open `/json-to-markdown`, paste the input, and copy the Markdown from Code Gen. Choose Open in Markdown Reader to preview it. To reverse the workflow, open `/markdown-to-json`, paste a pipe table and choose Extract Table to JSON in Preview.

## Privacy

Processing runs in the browser. Local files are read on the device. The last valid JSON and last Markdown draft persist in local storage; Clear removes the corresponding draft. `/privacy` includes a control to delete both. New shared documents use URL fragments; encoding is not encryption and anyone with a link can read it. Legacy query-string share URLs remain readable. External Markdown images and the Google icon font can make network requests. Do not use private examples in issue reports.

## Limitations

Generated code is a draft, inferred only from the supplied sample. Mixed types fall back to general types. Review generated names, nullability and validation rules. SQL targets PostgreSQL and needs review in a disposable database before importing; inferred parent identifiers do not enforce foreign keys. Markdown table extraction infers values and is not a lossless round trip. Token savings use a rough text-pattern estimate, not a model tokenizer.

## Deployment

Vercel builds with `npm run build` and serves `dist/json-explorer-arpan/browser`. `cleanUrls` serves prerendered `/route/index.html` pages; the configuration intentionally has no catch-all SPA rewrite. `/json` permanently redirects to `/`. Unknown URLs must return HTTP 404 using `public/404.html`.

Follow [the release and search monitoring checklist](docs/SEO-OPERATIONS.md) after deploying. Check the actual production responses because local static output cannot validate Vercel's routing configuration.

## Feedback

[Open an issue](https://github.com/arpan234/json-explorer-arpan/issues) with a small non-sensitive example, steps to reproduce, actual and expected output, and browser version. Include generated code when relevant. Source and issue visibility depend on repository access settings.
