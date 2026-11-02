import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    computed,
    effect,
    input,
    output,
    signal,
    viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-markdown-input',
    standalone: true,
    imports: [MatButtonModule, MatIconModule, MatTooltipModule, FormsModule],
    templateUrl: './markdown-input.html',
    styleUrl: './markdown-input.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownInputComponent {
    readonly externalMarkdown = input<string>('');
    readonly markdownParsed = output<string>();

    readonly inputText = signal('');
    readonly isDragOver = signal(false);

    readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
    readonly editorArea = viewChild<ElementRef<HTMLTextAreaElement>>('editorArea');

    readonly docStats = computed(() => {
        const text = this.inputText();
        const trimmed = text.trim();
        const words = trimmed ? trimmed.split(/\s+/).length : 0;
        const chars = text.length;
        const lines = text ? text.split(/\r?\n/).length : 0;
        const readingTimeMin = Math.max(1, Math.ceil(words / 200));
        return { words, chars, lines, readingTimeMin };
    });

    constructor() {
        effect(() => {
            const ext = this.externalMarkdown();
            if (ext && ext !== this.inputText()) {
                this.inputText.set(ext);
            }
        });
    }

    onInput(): void {
        const raw = this.inputText().trim();
        if (raw) {
            this.markdownParsed.emit(raw);
        }
    }

    insertFormatting(prefix: string, suffix: string, placeholder: string): void {
        const textarea = this.editorArea()?.nativeElement;
        const current = this.inputText();

        if (!textarea) {
            const updated = `${current}${prefix}${placeholder}${suffix}`;
            this.inputText.set(updated);
            this.markdownParsed.emit(updated.trim());
            return;
        }

        const start = textarea.selectionStart ?? current.length;
        const end = textarea.selectionEnd ?? current.length;
        const selected = current.slice(start, end) || placeholder;
        const updated = current.slice(0, start) + prefix + selected + suffix + current.slice(end);

        this.inputText.set(updated);
        this.markdownParsed.emit(updated.trim());
    }

    insertLinePrefix(prefix: string): void {
        const current = this.inputText();
        const sep = current && !current.endsWith('\n') ? '\n' : '';
        const updated = `${current}${sep}${prefix}Item`;
        this.inputText.set(updated);
        this.markdownParsed.emit(updated.trim());
    }

    insertTableTemplate(): void {
        const template = [
            '| Column 1 | Column 2 | Column 3 |',
            '| --- | --- | --- |',
            '| Value A | 100 | true |',
            '| Value B | 200 | false |',
        ].join('\n');
        const current = this.inputText();
        const sep = current && !current.endsWith('\n\n') ? (current.endsWith('\n') ? '\n' : '\n\n') : '';
        const updated = `${current}${sep}${template}\n`;
        this.inputText.set(updated);
        this.markdownParsed.emit(updated.trim());
    }

    formatMarkdownTables(): void {
        const text = this.inputText();
        if (!text.trim()) return;

        const lines = text.split(/\r?\n/);
        const splitRow = (line: string): string[] => {
            let t = line.trim();
            if (t.startsWith('|')) t = t.slice(1);
            if (t.endsWith('|')) t = t.slice(0, -1);
            return t.split(/(?<!\\)\|/).map((c) => c.trim());
        };
        const isSep = (line: string): boolean => {
            const t = line.trim();
            if (!t.includes('|') || !t.includes('-')) return false;
            const cells = splitRow(t);
            return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
        };

        const out: string[] = [];
        let i = 0;
        while (i < lines.length) {
            if (
                i < lines.length - 1 &&
                lines[i].includes('|') &&
                isSep(lines[i + 1])
            ) {
                const tableRows: string[][] = [splitRow(lines[i]), splitRow(lines[i + 1])];
                i += 2;
                while (i < lines.length && lines[i].trim().includes('|')) {
                    tableRows.push(splitRow(lines[i]));
                    i++;
                }

                const colCount = Math.max(...tableRows.map((r) => r.length));
                const colWidths = Array.from({ length: colCount }, (_, colIdx) =>
                    Math.max(
                        3,
                        ...tableRows
                            .filter((_, rIdx) => rIdx !== 1)
                            .map((r) => (r[colIdx] ?? '').length),
                    ),
                );

                tableRows.forEach((row, rIdx) => {
                    const formattedCells = colWidths.map((w, cIdx) => {
                        const cell = row[cIdx] ?? '';
                        if (rIdx === 1) {
                            return '-'.repeat(w);
                        }
                        return cell.padEnd(w, ' ');
                    });
                    out.push(`| ${formattedCells.join(' | ')} |`);
                });
                continue;
            }
            out.push(lines[i]);
            i++;
        }

        const formatted = out.join('\n');
        this.inputText.set(formatted);
        this.markdownParsed.emit(formatted.trim());
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
