import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    PLATFORM_ID,
    computed,
    inject,
    input,
    viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MarkdownComponent } from 'ngx-markdown';
import { JsonParserService } from '../../../../core/services/json-parser/json-parser.service';

@Component({
    selector: 'app-markdown-preview',
    standalone: true,
    imports: [MarkdownComponent, MatButtonModule, MatIconModule, MatTooltipModule],
    templateUrl: './markdown-preview.html',
    styleUrl: './markdown-preview.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownPreviewComponent {
    private readonly parserService = inject(JsonParserService);
    private readonly router = inject(Router);
    private readonly snackBar = inject(MatSnackBar);
    private readonly platformId = inject(PLATFORM_ID);

    readonly content = input.required<string>();
    readonly previewBody = viewChild<ElementRef<HTMLElement>>('previewBody');

    readonly extractedTables = computed(() =>
        this.parserService.extractMarkdownTablesToJson(this.content()),
    );

    extractTablesToJson(): void {
        const tables = this.extractedTables();
        if (tables.length === 0) return;
        const payload = tables.length === 1 ? tables[0] : tables;
        const jsonStr = JSON.stringify(payload, null, 2);
        this.parserService.pendingJsonTransfer.set(jsonStr);
        this.router.navigate(['/']);
    }

    copyMarkdown(): void {
        const md = this.content();
        if (!md) return;
        navigator.clipboard.writeText(md);
        this.snackBar.open('Markdown copied to clipboard', '', { duration: 2000 });
    }

    copyHtml(): void {
        const html = this.previewBody()?.nativeElement.innerHTML;
        if (!html) return;
        navigator.clipboard.writeText(html.trim());
        this.snackBar.open('Rendered HTML copied to clipboard', '', { duration: 2000 });
    }

    shareMarkdown(): void {
        const md = this.content();
        if (!md || !isPlatformBrowser(this.platformId)) return;
        const encoded = this.parserService.encodeForUrl(md);
        const shareUrl = `${window.location.origin}${window.location.pathname}?md=${encoded}`;
        navigator.clipboard.writeText(shareUrl);
        this.snackBar.open('Shareable link copied to clipboard', '', { duration: 2500 });
    }

    downloadMarkdown(): void {
        const md = this.content();
        if (!md) return;
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.md';
        a.click();
        URL.revokeObjectURL(url);
        this.snackBar.open('Markdown downloaded', '', { duration: 2000 });
    }
}
