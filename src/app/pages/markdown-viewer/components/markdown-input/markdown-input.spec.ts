import { TestBed } from '@angular/core/testing';
import { MarkdownInputComponent } from './markdown-input';

describe('MarkdownInputComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MarkdownInputComponent],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(MarkdownInputComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should start with empty input', () => {
        const fixture = TestBed.createComponent(MarkdownInputComponent);
        expect(fixture.componentInstance.inputText()).toBe('');
    });

    describe('onInput()', () => {
        it('should emit markdownParsed when input has content', () => {
            const fixture = TestBed.createComponent(MarkdownInputComponent);
            const component = fixture.componentInstance;
            const emitSpy = vi.spyOn(component.markdownParsed, 'emit');

            component.inputText.set('# Hello');
            component.onInput();

            expect(emitSpy).toHaveBeenCalledWith('# Hello');
        });

        it('should emit whitespace so deleting content clears the preview', () => {
            const fixture = TestBed.createComponent(MarkdownInputComponent);
            const component = fixture.componentInstance;
            const emitSpy = vi.spyOn(component.markdownParsed, 'emit');

            component.inputText.set('   ');
            component.onInput();

            expect(emitSpy).toHaveBeenCalledWith('   ');
        });
    });

    it('preserves significant leading Markdown indentation', () => {
        const component = TestBed.createComponent(MarkdownInputComponent).componentInstance;
        const emit = vi.spyOn(component.markdownParsed, 'emit');
        component.inputText.set('    code\n');
        component.onInput();
        expect(emit).toHaveBeenCalledWith('    code\n');
    });
    it('preserves left, right and center table alignment', () => {
        const component = TestBed.createComponent(MarkdownInputComponent).componentInstance;
        component.inputText.set('| A | B | C |\n| :--- | ---: | :---: |\n| x | y | z |');
        component.formatMarkdownTables();
        expect(component.inputText()).toContain('| :--- | ---: | :---: |');
    });
    describe('onClear()', () => {
        it('should clear input and emit empty string', () => {
            const fixture = TestBed.createComponent(MarkdownInputComponent);
            const component = fixture.componentInstance;
            const emitSpy = vi.spyOn(component.markdownParsed, 'emit');

            component.inputText.set('# Hello');
            component.onClear();

            expect(component.inputText()).toBe('');
            expect(emitSpy).toHaveBeenCalledWith('');
        });
    });

    describe('onLoadSample()', () => {
        it('should populate input with sample content and emit', () => {
            const fixture = TestBed.createComponent(MarkdownInputComponent);
            const component = fixture.componentInstance;
            const emitSpy = vi.spyOn(component.markdownParsed, 'emit');

            component.onLoadSample();

            expect(component.inputText()).toContain('# Welcome to Markdown Reader');
            expect(emitSpy).toHaveBeenCalled();
        });
    });

    describe('drag and drop', () => {
        it('should set isDragOver on dragOver', () => {
            const fixture = TestBed.createComponent(MarkdownInputComponent);
            const component = fixture.componentInstance;
            const event = new Event('dragover') as DragEvent;
            Object.defineProperty(event, 'preventDefault', { value: vi.fn() });

            component.onDragOver(event as DragEvent);
            expect(component.isDragOver()).toBe(true);
        });

        it('should clear isDragOver on dragLeave', () => {
            const fixture = TestBed.createComponent(MarkdownInputComponent);
            const component = fixture.componentInstance;

            component.isDragOver.set(true);
            component.onDragLeave();
            expect(component.isDragOver()).toBe(false);
        });
    });

    describe('formatting & stats', () => {
        it('should compute document stats accurately', () => {
            const fixture = TestBed.createComponent(MarkdownInputComponent);
            const component = fixture.componentInstance;

            component.inputText.set('Hello world\nSecond line');
            const stats = component.docStats();
            expect(stats.words).toBe(4);
            expect(stats.lines).toBe(2);
            expect(stats.readingTimeMin).toBe(1);
        });

        it('should format and align Markdown tables', () => {
            const fixture = TestBed.createComponent(MarkdownInputComponent);
            const component = fixture.componentInstance;

            component.inputText.set('| Name | Score |\n|---|---|\n| Alice | 95 |');
            component.formatMarkdownTables();
            expect(component.inputText()).toContain('| Name  | Score |');
            expect(component.inputText()).toContain('| ----- | ----- |');
            expect(component.inputText()).toContain('| Alice | 95    |');
        });
    });
});
