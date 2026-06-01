import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { MarkdownInputComponent } from './components/markdown-input/markdown-input';
import { MarkdownPreviewComponent } from './components/markdown-preview/markdown-preview';

@Component({
    selector: 'app-markdown-viewer',
    standalone: true,
    imports: [MatIconModule, MarkdownInputComponent, MarkdownPreviewComponent],
    templateUrl: './markdown-viewer.html',
    styleUrl: './markdown-viewer.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownViewerComponent {
    readonly markdownContent = signal('');
    readonly panelWidth = signal(35);

    private resizing = false;

    onMarkdownInput(content: string): void {
        this.markdownContent.set(content);
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
