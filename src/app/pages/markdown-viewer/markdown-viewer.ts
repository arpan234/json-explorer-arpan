import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { MarkdownInputComponent } from './components/markdown-input/markdown-input';
import { MarkdownPreviewComponent } from './components/markdown-preview/markdown-preview';

@Component({
    selector: 'app-markdown-viewer',
    standalone: true,
    imports: [MatIconModule, MatButtonModule, MarkdownInputComponent, MarkdownPreviewComponent],
    templateUrl: './markdown-viewer.html',
    styleUrl: './markdown-viewer.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownViewerComponent {
    private readonly breakpointObserver = inject(BreakpointObserver);

    readonly markdownContent = signal('');
    readonly panelWidth = signal(35);

    // Mobile responsive state
    readonly isMobile = signal(false);
    readonly activeMobileTab = signal<'input' | 'output'>('input');

    private resizing = false;

    constructor() {
        this.breakpointObserver.observe('(max-width: 768px)').subscribe((result) => {
            this.isMobile.set(result.matches);
        });
    }

    onMarkdownInput(content: string): void {
        this.markdownContent.set(content);
        if (content && this.isMobile()) {
            this.activeMobileTab.set('output');
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
