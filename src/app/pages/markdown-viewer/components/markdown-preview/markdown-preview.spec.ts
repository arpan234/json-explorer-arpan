import { TestBed } from '@angular/core/testing';
import { provideMarkdown } from 'ngx-markdown';
import { MarkdownPreviewComponent } from './markdown-preview';

describe('MarkdownPreviewComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MarkdownPreviewComponent],
            providers: [provideMarkdown()],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(MarkdownPreviewComponent);
        fixture.componentRef.setInput('content', '# Hello');
        fixture.detectChanges();
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render markdown content', () => {
        const fixture = TestBed.createComponent(MarkdownPreviewComponent);
        fixture.componentRef.setInput('content', '# Hello World');
        fixture.detectChanges();
        expect(fixture.componentInstance.content()).toBe('# Hello World');
    });
});
