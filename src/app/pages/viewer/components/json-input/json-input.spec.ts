import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { JsonInputComponent } from './json-input';

describe('JsonInputComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [JsonInputComponent],
            providers: [provideAnimationsAsync()],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(JsonInputComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should show error for empty input', () => {
        const fixture = TestBed.createComponent(JsonInputComponent);
        const component = fixture.componentInstance;
        component.onParse();
        expect(component.error()).toBe('Please enter some JSON');
    });

    it('should show error for invalid JSON', () => {
        const fixture = TestBed.createComponent(JsonInputComponent);
        const component = fixture.componentInstance;
        component.inputText.set('{invalid}');
        component.onParse();
        expect(component.error()).toBeTruthy();
    });

    it('should emit jsonParsed for valid JSON', () => {
        const fixture = TestBed.createComponent(JsonInputComponent);
        const component = fixture.componentInstance;
        const emitSpy = vi.spyOn(component.jsonParsed, 'emit');
        component.inputText.set('{"valid": true}');
        component.onParse();
        expect(emitSpy).toHaveBeenCalledWith('{"valid": true}');
        expect(component.error()).toBeNull();
    });

    it('should clear input and error on clear', () => {
        const fixture = TestBed.createComponent(JsonInputComponent);
        const component = fixture.componentInstance;
        component.inputText.set('test');
        component.error.set('some error');
        component.onClear();
        expect(component.inputText()).toBe('');
        expect(component.error()).toBeNull();
    });

    describe('onPaste()', () => {
        it('should auto-parse valid JSON on paste', () => {
            const fixture = TestBed.createComponent(JsonInputComponent);
            const component = fixture.componentInstance;
            const emitSpy = vi.spyOn(component.jsonParsed, 'emit');
            const preventDefaultSpy = vi.fn();
            const pasteEvent = {
                clipboardData: { getData: () => '{"pasted": true}' },
                preventDefault: preventDefaultSpy,
            } as unknown as ClipboardEvent;

            component.onPaste(pasteEvent);
            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(component.inputText()).toBe('{"pasted": true}');
            expect(emitSpy).toHaveBeenCalledWith('{"pasted": true}');
        });

        it('should not auto-parse invalid JSON on paste', () => {
            const fixture = TestBed.createComponent(JsonInputComponent);
            const component = fixture.componentInstance;
            const emitSpy = vi.spyOn(component.jsonParsed, 'emit');
            const preventDefaultSpy = vi.fn();
            const pasteEvent = {
                clipboardData: { getData: () => 'not json' },
                preventDefault: preventDefaultSpy,
            } as unknown as ClipboardEvent;

            component.onPaste(pasteEvent);
            expect(preventDefaultSpy).not.toHaveBeenCalled();
            expect(emitSpy).not.toHaveBeenCalled();
        });
    });
});
