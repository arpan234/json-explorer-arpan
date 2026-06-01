import { TestBed } from '@angular/core/testing';
import { provideMarkdown } from 'ngx-markdown';
import { MarkdownViewerComponent } from './markdown-viewer';

describe('MarkdownViewerComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MarkdownViewerComponent],
            providers: [provideMarkdown()],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(MarkdownViewerComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should start with no content', () => {
        const fixture = TestBed.createComponent(MarkdownViewerComponent);
        expect(fixture.componentInstance.markdownContent()).toBe('');
    });

    it('should update markdownContent when onMarkdownInput is called', () => {
        const fixture = TestBed.createComponent(MarkdownViewerComponent);
        const component = fixture.componentInstance;
        component.onMarkdownInput('# Hello');
        expect(component.markdownContent()).toBe('# Hello');
    });

    it('should have default panel width of 35', () => {
        const fixture = TestBed.createComponent(MarkdownViewerComponent);
        expect(fixture.componentInstance.panelWidth()).toBe(35);
    });
});
