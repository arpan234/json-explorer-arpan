import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class SeoService {
    private readonly document = inject(DOCUMENT);
    private readonly router = inject(Router);
    private readonly baseUrl = 'https://json-md-formatter.com';

    init(): void {
        this.router.events
            .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
            .subscribe((event) => {
                this.updateCanonicalUrl(event.urlAfterRedirects);
            });
    }

    private updateCanonicalUrl(url: string): void {
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
    }
}
