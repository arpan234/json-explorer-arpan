# Release and search monitoring

## Before publishing

Run `npm test -- --watch=false`, `npm run build`, and `npm run check:seo`. Review desktop and phone layouts, typing, clearing, restoring drafts, copying, table formatting, exports and keyboard controls. The SEO check verifies static output; it does not guarantee indexing or rankings.

## After deploying to Vercel

1. Open each sitemap URL directly and refresh it. Confirm the initial response contains the matching title, canonical, H1, example and guide. Verify the returned status is 200.
2. Verify `/json` returns a permanent redirect to `/`, an invented path returns HTTP 404, and `/robots.txt` and `/sitemap.xml` return their actual files.
3. In Search Console, inspect `/markdown`, `/json-to-markdown` and `/markdown-to-json`. Check the rendered mobile content, canonical choice and indexing eligibility. Request indexing once after material changes. Sitemap submission and a successful live test do not guarantee indexing.
4. Run PageSpeed Insights on the main tool pages. Compare CLS against 0.1 and check unnamed controls and contrast. Lab scores vary; use real-user data when available.
5. Validate social image previews and structured data. Do not add invented ratings or expect FAQ rich results for a developer tool.

## Weekly review

Review queries, landing pages, countries and devices in Search Console. Track index status for each intended URL, impressions, clicks and position. Compare CTR for similar queries and positions; 0 clicks at a low ranking is not evidence that the title alone failed. Record title/content changes and allow time for recrawling before judging results.

To measure product use later, record only coarse actions such as sample loaded, conversion succeeded or export clicked. Never collect document text, clipboard contents or complete share URLs. Update the privacy page before adding any analytics provider.

## Content and distribution

Prioritize the existing Markdown viewer and JSON/Markdown table conversion workflow. Build original worked examples for nested arrays, missing columns, escaped pipes and identifiers with leading zeros. Link each guide to the relevant working tool. Publish further guides when they answer actual user questions; avoid mass-producing near-identical pages.

Share a small public demonstration in relevant developer communities when useful and permitted by their rules. Ask real users what failed or was confusing. Improve the tool from that feedback. Community posts, paid promotion and outreach require a separate publishing decision. Do not purchase links or fabricate testimonials.

English pages already serve international users. Use country and query data to decide whether a maintained translation is useful. Publish distinct language URLs with translated UI/content and correct language annotations only when those translations are ready.

## Sitemap maintenance

List only canonical public pages that should appear in search. Set lastmod to the actual date of a material content change; do not update all dates on every build. Run the SEO check whenever routes change. Do not index shared user documents.
