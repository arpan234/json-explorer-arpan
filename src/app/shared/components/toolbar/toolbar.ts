import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'app-toolbar',
    standalone: true,
    imports: [
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatTabsModule,
        RouterLink,
        RouterLinkActive,
    ],
    templateUrl: './toolbar.html',
    styleUrl: './toolbar.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly doc = inject(DOCUMENT);

    readonly isDark = signal(false);

    readonly navLinks = [
        { path: '/', label: 'JSON Viewer', icon: 'data_object' },
        { path: '/markdown', label: 'Markdown Reader', icon: 'description' },
    ];

    constructor() {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        try {
            if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
                const savedTheme = localStorage.getItem('json_md_theme');
                if (savedTheme === 'dark' || savedTheme === 'light') {
                    const enabled = savedTheme === 'dark';
                    this.isDark.set(enabled);
                    this.doc.documentElement.classList.toggle('dark-theme', enabled);
                    this.doc.body.classList.toggle('dark-theme', enabled);
                    return;
                }
            }
        } catch {
            // ignore storage errors
        }

        this.isDark.set(this.doc.documentElement.classList.contains('dark-theme'));
    }

    toggleTheme(): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        this.isDark.update((v) => !v);
        const enabled = this.isDark();
        this.doc.documentElement.classList.toggle('dark-theme', enabled);
        this.doc.body.classList.toggle('dark-theme', enabled);
        try {
            if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
                localStorage.setItem('json_md_theme', enabled ? 'dark' : 'light');
            }
        } catch {
            // ignore storage errors
        }
    }
}
