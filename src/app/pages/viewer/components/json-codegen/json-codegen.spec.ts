import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { JsonCodegenComponent } from './json-codegen';

describe('JsonCodegenComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [JsonCodegenComponent],
            providers: [provideAnimationsAsync(), provideMonacoEditor()],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(JsonCodegenComponent);
        fixture.componentRef.setInput('rawJson', '{"name": "Bob", "age": 30}');
        fixture.detectChanges();
        expect(fixture.componentInstance).toBeTruthy();
    });
});
