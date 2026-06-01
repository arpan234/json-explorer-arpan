import { ChangeDetectionStrategy, Component, input, output, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorComponent } from 'ngx-monaco-editor-v2';
import { DEFAULT_MONACO_OPTIONS } from '../../../../core/constants/json-viewer.constants';

@Component({
    selector: 'app-raw-editor',
    standalone: true,
    imports: [FormsModule, EditorComponent],
    templateUrl: './raw-editor.html',
    styleUrl: './raw-editor.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RawEditorComponent implements OnInit {
    readonly json = input<string>('');
    readonly jsonChange = output<string>();

    readonly editorOptions = signal({ ...DEFAULT_MONACO_OPTIONS });
    protected editorValue = '';

    ngOnInit(): void {
        this.editorValue = this.json();
    }

    onEditorValueChange(value: string): void {
        this.editorValue = value;
        this.jsonChange.emit(value);
    }

    onEditorInit(): void {
        this.editorValue = this.json();
    }
}
