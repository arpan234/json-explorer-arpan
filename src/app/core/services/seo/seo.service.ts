import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class SeoService {
    private readonly document = inject(DOCUMENT);
    private readonly router = inject(Router);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly meta = inject(Meta);
    private readonly baseUrl = 'https://json-md-formatter.com';

    init(): void {
        this.router.events
            .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
            .subscribe((event) => {
                const canonicalUrl = this.updateCanonicalUrl(event.urlAfterRedirects);
                this.updateRouteMetaTags(canonicalUrl);
            });
    }

    private updateCanonicalUrl(url: string): string {
        // Remove query parameters or fragments if any
        const path = url.split('?')[0].split('#')[0];
        // Don't append extra slash for root, keep canonical clean
        const cleanPath = path === '/' || path === '' ? '' : path;
        const canonicalUrl = `${this.baseUrl}${cleanPath}`;

        let link: HTMLLinkElement | null = this.document.querySelector("link[rel='canonical']");
        if (link) {
            link.setAttribute('href', canonicalUrl);
        } else {
            link = this.document.createElement('link');
            link.setAttribute('rel', 'canonical');
            link.setAttribute('href', canonicalUrl);
            this.document.head.appendChild(link);
        }

        return canonicalUrl;
    }

    private updateRouteMetaTags(canonicalUrl: string): void {
        let route = this.activatedRoute;
        while (route.firstChild) {
            route = route.firstChild;
        }

        const snapshot = route.snapshot;
        const title =
            snapshot.routeConfig?.title && typeof snapshot.routeConfig.title === 'string'
                ? snapshot.routeConfig.title
                : 'JSON & Markdown Formatter - json-md-formatter';
        const description =
            (snapshot.data?.['description'] as string | undefined) ??
            'An interactive online JSON to Markdown formatter, validator, and viewer. Easily format, explore, and convert JSON data to markdown tables and code blocks.';
        const keywords = snapshot.data?.['keywords'] as string | undefined;

        this.meta.updateTag({ name: 'description', content: description });
        if (keywords) {
            this.meta.updateTag({ name: 'keywords', content: keywords });
        }

        // Open Graph
        this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
        this.meta.updateTag({ property: 'og:title', content: title });
        this.meta.updateTag({ property: 'og:description', content: description });

        // Twitter Card
        this.meta.updateTag({ property: 'twitter:url', content: canonicalUrl });
        this.meta.updateTag({ property: 'twitter:title', content: title });
        this.meta.updateTag({ property: 'twitter:description', content: description });

        // JSON-LD Structured Data
        const ldScript = this.document.querySelector("script[type='application/ld+json']");
        if (ldScript) {
            ldScript.textContent = JSON.stringify(
                {
                    '@context': 'https://schema.org',
                    '@type': 'WebApplication',
                    name: title,
                    alternateName: 'JSON & Markdown Formatter',
                    url: canonicalUrl,
                    applicationCategory: 'DeveloperApplication',
                    operatingSystem: 'All',
                    browserRequirements: 'Requires JavaScript. Requires HTML5.',
                    description,
                    offers: {
                        '@type': 'Offer',
                        price: '0.00',
                        priceCurrency: 'USD',
                    },
                },
                null,
                4,
            );
        }
    }
}
