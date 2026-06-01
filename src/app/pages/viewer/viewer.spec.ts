import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ViewerComponent } from './viewer';

describe('ViewerComponent', () => {
    let snackBarSpy: { open: ReturnType<typeof vi.fn> };

    beforeEach(async () => {
        snackBarSpy = { open: vi.fn() };

        await TestBed.configureTestingModule({
            imports: [ViewerComponent],
            providers: [provideAnimationsAsync(), { provide: MatSnackBar, useValue: snackBarSpy }],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(ViewerComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should start with no data', () => {
        const fixture = TestBed.createComponent(ViewerComponent);
        expect(fixture.componentInstance.hasData()).toBe(false);
    });

    it('should parse valid JSON when input is received', () => {
        const fixture = TestBed.createComponent(ViewerComponent);
        const component = fixture.componentInstance;
        component.onJsonInput('{"name": "test"}');
        expect(component.hasData()).toBe(true);
        expect(component.rootNode()?.type).toBe('object');
    });

    it('should report parse errors for invalid JSON', () => {
        const fixture = TestBed.createComponent(ViewerComponent);
        const component = fixture.componentInstance;
        component.onJsonInput('{invalid}');
        expect(component.parseError()).toBeTruthy();
    });

    describe('expandAll()', () => {
        it('should increment expandAllTrigger', () => {
            const fixture = TestBed.createComponent(ViewerComponent);
            const component = fixture.componentInstance;
            expect(component.expandAllTrigger()).toBe(0);
            component.expandAll();
            expect(component.expandAllTrigger()).toBe(1);
        });
    });

    describe('collapseAll()', () => {
        it('should increment collapseAllTrigger', () => {
            const fixture = TestBed.createComponent(ViewerComponent);
            const component = fixture.componentInstance;
            expect(component.collapseAllTrigger()).toBe(0);
            component.collapseAll();
            expect(component.collapseAllTrigger()).toBe(1);
        });
    });

    describe('nodeStats()', () => {
        it('should return null when no data', () => {
            const fixture = TestBed.createComponent(ViewerComponent);
            expect(fixture.componentInstance.nodeStats()).toBeNull();
        });

        it('should compute key count and max depth', () => {
            const fixture = TestBed.createComponent(ViewerComponent);
            const component = fixture.componentInstance;
            component.onJsonInput('{"a": {"b": 1}, "c": 2}');
            const stats = component.nodeStats();
            expect(stats).toBeTruthy();
            expect(stats!.totalKeys).toBeGreaterThan(0);
            expect(stats!.maxDepth).toBeGreaterThanOrEqual(2);
        });
    });

    describe('formattedPath()', () => {
        it('should return $ for empty path', () => {
            const fixture = TestBed.createComponent(ViewerComponent);
            expect(fixture.componentInstance.formattedPath()).toBe('$');
        });

        it('should format path with dot notation', () => {
            const fixture = TestBed.createComponent(ViewerComponent);
            const component = fixture.componentInstance;
            component.selectedPath.set(['root', 'users', 'name']);
            expect(component.formattedPath()).toBe('$.users.name');
        });

        it('should format array indices with bracket notation', () => {
            const fixture = TestBed.createComponent(ViewerComponent);
            const component = fixture.componentInstance;
            component.selectedPath.set(['root', 'users', '0', 'name']);
            expect(component.formattedPath()).toBe('$.users[0].name');
        });
    });

    describe('copyToClipboard()', () => {
        it('should show snackbar notification', () => {
            const fixture = TestBed.createComponent(ViewerComponent);
            const component = fixture.componentInstance;
            const writeTextSpy = vi.fn().mockResolvedValue(undefined);
            Object.assign(navigator, { clipboard: { writeText: writeTextSpy } });
            component.rawJson.set('{"test": true}');
            component.copyToClipboard();
            expect(snackBarSpy.open).toHaveBeenCalledWith('Copied to clipboard', '', {
                duration: 2000,
            });
        });
    });

    describe('formatJson()', () => {
        it('should show snackbar notification', () => {
            const fixture = TestBed.createComponent(ViewerComponent);
            const component = fixture.componentInstance;
            component.onJsonInput('{"a":1}');
            component.formatJson();
            expect(snackBarSpy.open).toHaveBeenCalledWith('JSON formatted', '', { duration: 2000 });
        });
    });

    describe('panelWidth()', () => {
        it('should default to 35', () => {
            const fixture = TestBed.createComponent(ViewerComponent);
            expect(fixture.componentInstance.panelWidth()).toBe(35);
        });
    });
});
