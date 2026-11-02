import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    effect,
    inject,
    input,
    output,
    signal,
    viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { JsonParserService } from '../../../../core/services/json-parser/json-parser.service';

@Component({
    selector: 'app-json-input',
    standalone: true,
    imports: [MatButtonModule, MatIconModule, MatTooltipModule, FormsModule],
    templateUrl: './json-input.html',
    styleUrl: './json-input.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonInputComponent {
    private readonly parserService = inject(JsonParserService);

    readonly externalJson = input<string>('');
    readonly jsonParsed = output<string>();

    readonly inputText = signal('');
    readonly error = signal<string | null>(null);
    readonly isDragOver = signal(false);

    readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

    constructor() {
        effect(() => {
            const ext = this.externalJson();
            if (ext !== this.inputText()) {
                this.inputText.set(ext);
                this.error.set(null);
            }
        });
    }

    onTextChange(value: string): void {
        this.inputText.set(value);
        const trimmed = value.trim();
        const result = trimmed ? this.parserService.validate(trimmed) : { valid: true };
        this.error.set(result.valid ? null : (result.error ?? 'Invalid JSON'));
        this.jsonParsed.emit(value);
    }

    onPaste(event: ClipboardEvent): void {
        const text = event.clipboardData?.getData('text/plain')?.trim();
        if (!text) return;

        if (this.parserService.validate(text).valid) {
            event.preventDefault();
            this.inputText.set(text);
            this.error.set(null);
            this.jsonParsed.emit(text);
        }
    }

    onParse(): void {
        const raw = this.inputText().trim();
        if (!raw) {
            this.error.set('Please enter some JSON');
            return;
        }

        const validation = this.parserService.validate(raw);
        if (!validation.valid) {
            this.error.set(validation.error ?? 'Invalid JSON');
            return;
        }

        this.error.set(null);
        this.jsonParsed.emit(raw);
    }

    onRepair(): void {
        const raw = this.inputText().trim();
        if (!raw) {
            this.error.set('Please enter some JSON');
            return;
        }

        const result = this.parserService.repairJson(raw);
        if (result.valid) {
            this.inputText.set(result.repaired);
            this.error.set(null);
            this.jsonParsed.emit(result.repaired);
        } else {
            this.error.set(result.error ?? 'Could not auto-repair JSON');
        }
    }

    onMinify(): void {
        const raw = this.inputText().trim();
        if (!raw) {
            this.error.set('Please enter some JSON');
            return;
        }

        const result = this.parserService.minify(raw);
        if (result.valid) {
            this.inputText.set(result.minified);
            this.error.set(null);
            this.jsonParsed.emit(result.minified);
        } else {
            this.error.set(result.error ?? 'Invalid JSON');
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
        this.error.set(null);
        this.jsonParsed.emit('');
    }

    onLoadSample(): void {
        const sample = JSON.stringify(
            {
                name: 'JSON Viewer',
                version: '1.0.0',
                features: ['tree view', 'search', 'editing', 'table', 'charts'],
                config: {
                    theme: 'light',
                    autoFormat: true,
                    maxDepth: 10,
                },
                users: [
                    { id: 1, name: 'Alice', score: 95, active: true },
                    { id: 2, name: 'Bob', score: 87, active: false },
                    { id: 3, name: 'Charlie', score: 92, active: true },
                ],
            },
            null,
            2,
        );
        this.inputText.set(sample);
        this.error.set(null);
        this.jsonParsed.emit(sample);
    }

    private readFile(file: File): void {
        if (!file.name.endsWith('.json') && file.type !== 'application/json') {
            this.error.set('Please select a .json file');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const text = reader.result as string;
            this.inputText.set(text);
            this.error.set(null);
            this.jsonParsed.emit(text);
        };
        reader.onerror = () => {
            this.error.set('Failed to read file');
        };
        reader.readAsText(file);
    }
}
