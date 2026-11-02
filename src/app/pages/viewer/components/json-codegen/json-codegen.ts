import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    input,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditorComponent } from 'ngx-monaco-editor-v2';

import { DEFAULT_MONACO_OPTIONS } from '../../../../core/constants/json-viewer.constants';
import { CodeGeneratorService, CodeLang } from '../../../../core/services/code-generator/code-generator.service';
import { JsonParserService } from '../../../../core/services/json-parser/json-parser.service';

@Component({
    selector: 'app-json-codegen',
    standalone: true,
    imports: [
        FormsModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatIconModule,
        MatTooltipModule,
        EditorComponent,
    ],
    templateUrl: './json-codegen.html',
    styleUrl: './json-codegen.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonCodegenComponent {
    private readonly generatorService = inject(CodeGeneratorService);
    private readonly parserService = inject(JsonParserService);
    private readonly router = inject(Router);
    private readonly snackBar = inject(MatSnackBar);

    readonly rawJson = input.required<string>();
    readonly initialLanguage = input<CodeLang>('markdown');

    readonly selectedLanguage = signal<CodeLang>('markdown');

    constructor() {
        effect(() => {
            const initLang = this.initialLanguage();
            if (initLang) {
                this.selectedLanguage.set(initLang);
            }
        });
    }

    readonly generatedCode = computed(() => {
        const raw = this.rawJson();
        if (!raw.trim()) return '';
        try {
            const parsed = JSON.parse(raw);
            return this.generatorService.generate(parsed, this.selectedLanguage());
        } catch (e) {
            return `Error generating code: ${(e as Error).message}`;
        }
    });

    readonly tokenSavings = computed(() => {
        if (this.selectedLanguage() !== 'markdown') return null;
        return this.generatorService.calculateTokenSavings(this.rawJson(), this.generatedCode());
    });

    readonly editorOptions = computed(() => ({
        ...DEFAULT_MONACO_OPTIONS,
        language: this.selectedLanguage(),
        readOnly: true,
    }));

    copyCode(): void {
        const code = this.generatedCode();
        if (code) {
            navigator.clipboard.writeText(code);
            this.snackBar.open('Code copied to clipboard', '', { duration: 2000 });
        }
    }

    openInMarkdownReader(): void {
        const md = this.generatedCode();
        if (!md) return;
        this.parserService.pendingMarkdownTransfer.set(md);
        this.router.navigate(['/markdown']);
    }
}
