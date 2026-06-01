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
        { path: '/json', label: 'JSON Viewer', icon: 'data_object' },
        { path: '/markdown', label: 'Markdown Reader', icon: 'description' },
    ];

    constructor() {
        if (!isPlatformBrowser(this.platformId)) {
            return;
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
    }
}
