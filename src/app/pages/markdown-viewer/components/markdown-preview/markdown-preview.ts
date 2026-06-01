import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
    selector: 'app-markdown-preview',
    standalone: true,
    imports: [MarkdownComponent],
    templateUrl: './markdown-preview.html',
    styleUrl: './markdown-preview.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownPreviewComponent {
    readonly content = input.required<string>();
}
