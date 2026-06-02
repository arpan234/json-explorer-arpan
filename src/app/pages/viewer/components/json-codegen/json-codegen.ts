import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditorComponent } from 'ngx-monaco-editor-v2';

import { DEFAULT_MONACO_OPTIONS } from '../../../../core/constants/json-viewer.constants';
import { CodeGeneratorService, CodeLang } from '../../../../core/services/code-generator/code-generator.service';

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
    private readonly snackBar = inject(MatSnackBar);

    readonly rawJson = input.required<string>();

    readonly selectedLanguage = signal<CodeLang>('typescript');

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
}
