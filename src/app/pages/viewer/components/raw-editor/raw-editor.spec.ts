import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { RawEditorComponent } from './raw-editor';

describe('RawEditorComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RawEditorComponent],
            providers: [provideAnimationsAsync(), provideMonacoEditor()],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(RawEditorComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });
});
