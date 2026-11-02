import {
    ChangeDetectionStrategy,
    Component,
    PLATFORM_ID,
    effect,
    inject,
    signal,
} from '@angular/core';
import { provideMarkdown } from 'ngx-markdown';
import { ToolGuideComponent } from '../../shared/components/tool-guide/tool-guide';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { JsonParserService } from '../../core/services/json-parser/json-parser.service';
import { MarkdownInputComponent } from './components/markdown-input/markdown-input';
import { MarkdownPreviewComponent } from './components/markdown-preview/markdown-preview';

const SAMPLE_MARKDOWN = `# Welcome to Markdown Reader

## Features

This viewer supports **bold**, *italic*, ~~strikethrough~~, and \`inline code\`.

### Table (Click "Extract Table to JSON" in Preview!)
| Name    | Role       | Score | Active |
|---------|------------|-------|--------|
| Alice   | Developer  | 95    | true   |
| Bob     | Designer   | 87    | false  |
| Charlie | Manager    | 92    | true   |

---

*Rendered with json-md-formatter*`;

@Component({
    selector: 'app-markdown-viewer',
    standalone: true,
    imports: [
        ToolGuideComponent,
        MatIconModule,
        MatButtonModule,
        MarkdownInputComponent,
        MarkdownPreviewComponent,
    ],
    providers: [provideMarkdown()],
    templateUrl: './markdown-viewer.html',
    styleUrl: './markdown-viewer.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownViewerComponent {
    private readonly breakpointObserver = inject(BreakpointObserver);
    private readonly parserService = inject(JsonParserService);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly route = inject(ActivatedRoute);

    readonly markdownContent = signal('');
    readonly panelWidth = signal(35);
    readonly seoHeading = signal('About json-md-formatter Markdown Tool');
    readonly seoSubheading = signal(
        'Our online Markdown tool helps you read, preview, and format Markdown files in real-time. Whether you are working on a README.md file, formatting tables, or writing software documentation, our split-pane viewer lets you edit raw markdown and see formatted HTML rendering instantly.',
    );
    readonly savedSessionMarkdown = signal<string | null>(null);

    // Mobile responsive state
    readonly isMobile = signal(false);
    readonly activeMobileTab = signal<'input' | 'output'>('input');

    private resizing = false;

    constructor() {
        const routeData = this.route.snapshot?.data ?? {};
        if (routeData['heading']) {
            this.seoHeading.set(routeData['heading'] as string);
        }
        if (routeData['subheading']) {
            this.seoSubheading.set(routeData['subheading'] as string);
        }

        const transferred = this.parserService.pendingMarkdownTransfer();
        if (transferred) {
            this.markdownContent.set(transferred);
            this.parserService.pendingMarkdownTransfer.set(null);
        } else if (isPlatformBrowser(this.platformId)) {
            const params = new URLSearchParams(
                window.location.hash.slice(1) || window.location.search,
            );
            const encoded = params.get('md');
            if (encoded) {
                const decoded = this.parserService.decodeFromUrl(encoded);
                if (decoded) {
                    this.markdownContent.set(decoded);
                }
            }

            try {
                const saved = localStorage.getItem('json_md_last_md');
                if (saved?.trim()) {
                    this.savedSessionMarkdown.set(saved);
                }
            } catch {
                // ignore storage errors
            }
        }

        effect(() => {
            const content = this.markdownContent();
            if (isPlatformBrowser(this.platformId) && content.trim()) {
                try {
                    localStorage.setItem('json_md_last_md', content);
                } catch {
                    // ignore quota errors
                }
            }
        });

        this.breakpointObserver.observe('(max-width: 768px)').subscribe((result) => {
            this.isMobile.set(result.matches);
        });
    }

    loadSampleFromWelcome(): void {
        this.onMarkdownInput(SAMPLE_MARKDOWN);
    }

    restoreSavedSession(): void {
        const saved = this.savedSessionMarkdown();
        if (saved) {
            this.onMarkdownInput(saved);
        }
    }

    onMarkdownInput(content: string): void {
        this.markdownContent.set(content);
        if (!content.trim() && isPlatformBrowser(this.platformId)) {
            try {
                localStorage.removeItem('json_md_last_md');
            } catch {
                /* Storage unavailable. */
            }
            this.savedSessionMarkdown.set(null);
        }
    }

    onResizeStart(event: MouseEvent): void {
        event.preventDefault();
        this.resizing = true;

        const onMouseMove = (e: MouseEvent) => {
            if (!this.resizing) return;
            const percent = (e.clientX / window.innerWidth) * 100;
            this.panelWidth.set(Math.max(15, Math.min(70, percent)));
        };

        const onMouseUp = () => {
            this.resizing = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }
}
