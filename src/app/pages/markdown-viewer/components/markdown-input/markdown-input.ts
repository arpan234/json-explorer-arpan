import { ChangeDetectionStrategy, Component, ElementRef, output, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-markdown-input',
    standalone: true,
    imports: [MatButtonModule, MatIconModule, FormsModule],
    templateUrl: './markdown-input.html',
    styleUrl: './markdown-input.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownInputComponent {
    readonly markdownParsed = output<string>();

    readonly inputText = signal('');
    readonly isDragOver = signal(false);

    readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

    onInput(): void {
        const raw = this.inputText().trim();
        if (raw) {
            this.markdownParsed.emit(raw);
        }
    }

    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.readFile(input.files[0]);
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragOver.set(true);
    }

    onDragLeave(): void {
        this.isDragOver.set(false);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragOver.set(false);
        const file = event.dataTransfer?.files[0];
        if (file) {
            this.readFile(file);
        }
    }

    onClear(): void {
        this.inputText.set('');
        this.markdownParsed.emit('');
    }

    onLoadSample(): void {
        const sample = `# Welcome to Markdown Reader

## Features

This viewer supports **bold**, *italic*, ~~strikethrough~~, and \`inline code\`.

### Ordered List
1. First item
2. Second item
3. Third item

### Unordered List
- Apples
- Oranges
- Bananas

### Links & Images
[Visit GitHub](https://github.com)

### Code Block
\`\`\`typescript
interface User {
  id: number;
  name: string;
  active: boolean;
}

function greet(user: User): string {
  return \\\`Hello, \\\${user.name}!\\\`;
}
\`\`\`

### Blockquote
> Markdown is a lightweight markup language that you can use to add
> formatting elements to plaintext text documents.

### Table
| Name    | Role       | Score |
|---------|------------|-------|
| Alice   | Developer  | 95    |
| Bob     | Designer   | 87    |
| Charlie | Manager    | 92    |

---

*Rendered with ngx-markdown*`;

        this.inputText.set(sample);
        this.markdownParsed.emit(sample);
    }

    private readFile(file: File): void {
        if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown') && file.type !== 'text/markdown') {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const text = reader.result as string;
            this.inputText.set(text);
            this.markdownParsed.emit(text);
        };
        reader.readAsText(file);
    }
}
