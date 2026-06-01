import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { JsonTreeNodeComponent } from './json-tree-node';
import { JsonNode } from '../../../../core/interfaces';
import { ROOT_KEY_COLOR, getKeyColorByDepth } from '../../../../core/constants/json-viewer.constants';

describe('JsonTreeNodeComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [JsonTreeNodeComponent],
            providers: [provideAnimationsAsync()],
        }).compileComponents();
    });

    function createNode(overrides: Partial<JsonNode> = {}): JsonNode {
        return {
            key: 'test',
            value: 'hello',
            type: 'string',
            path: ['root', 'test'],
            expanded: false,
            ...overrides,
        };
    }

    it('should create', () => {
        const fixture = TestBed.createComponent(JsonTreeNodeComponent);
        fixture.componentRef.setInput('node', createNode());
        fixture.detectChanges();
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should display string value in quotes', () => {
        const fixture = TestBed.createComponent(JsonTreeNodeComponent);
        fixture.componentRef.setInput('node', createNode({ value: 'hello' }));
        fixture.detectChanges();
        expect(fixture.componentInstance.displayValue()).toBe('"hello"');
    });

    it('should display null value', () => {
        const fixture = TestBed.createComponent(JsonTreeNodeComponent);
        fixture.componentRef.setInput('node', createNode({ type: 'null', value: null }));
        fixture.detectChanges();
        expect(fixture.componentInstance.displayValue()).toBe('null');
    });

    it('should identify containers', () => {
        const fixture = TestBed.createComponent(JsonTreeNodeComponent);
        fixture.componentRef.setInput(
            'node',
            createNode({ type: 'object', value: {}, children: [] }),
        );
        fixture.detectChanges();
        expect(fixture.componentInstance.isContainer()).toBe(true);
    });

    it('should toggle expansion', () => {
        const fixture = TestBed.createComponent(JsonTreeNodeComponent);
        fixture.componentRef.setInput(
            'node',
            createNode({ type: 'object', value: {}, children: [], expanded: false }),
        );
        fixture.detectChanges();
        fixture.componentInstance.toggleExpand();
        expect(fixture.componentInstance.expanded()).toBe(true);
    });

    it('should use depth-based key colors', () => {
        const rootFixture = TestBed.createComponent(JsonTreeNodeComponent);
        rootFixture.componentRef.setInput('node', createNode({ path: ['root'] }));
        rootFixture.componentRef.setInput('depth', 0);
        rootFixture.detectChanges();

        const levelOneFixture = TestBed.createComponent(JsonTreeNodeComponent);
        levelOneFixture.componentRef.setInput('node', createNode({ path: ['root', 'level1'] }));
        levelOneFixture.componentRef.setInput('depth', 1);
        levelOneFixture.detectChanges();

        const levelTwoFixture = TestBed.createComponent(JsonTreeNodeComponent);
        levelTwoFixture.componentRef.setInput('node', createNode({ path: ['root', 'level1', 'level2'] }));
        levelTwoFixture.componentRef.setInput('depth', 2);
        levelTwoFixture.detectChanges();

        expect(rootFixture.componentInstance.keyColor()).toBe(ROOT_KEY_COLOR);
        expect(levelOneFixture.componentInstance.keyColor()).toBe(getKeyColorByDepth(1));
        expect(levelTwoFixture.componentInstance.keyColor()).toBe(getKeyColorByDepth(2));
        expect(levelOneFixture.componentInstance.keyColor()).not.toBe(levelTwoFixture.componentInstance.keyColor());
    });

    describe('expandAllTrigger()', () => {
        it('should expand node when trigger increments', async () => {
            const fixture = TestBed.createComponent(JsonTreeNodeComponent);
            fixture.componentRef.setInput(
                'node',
                createNode({ type: 'object', value: {}, children: [], expanded: false }),
            );
            fixture.componentRef.setInput('expandAllTrigger', 0);
            fixture.detectChanges();
            expect(fixture.componentInstance.expanded()).toBe(false);

            fixture.componentRef.setInput('expandAllTrigger', 1);
            fixture.detectChanges();
            await fixture.whenStable();
            expect(fixture.componentInstance.expanded()).toBe(true);
        });
    });

    describe('collapseAllTrigger()', () => {
        it('should collapse node when trigger increments', async () => {
            const fixture = TestBed.createComponent(JsonTreeNodeComponent);
            fixture.componentRef.setInput(
                'node',
                createNode({ type: 'object', value: {}, children: [], expanded: true }),
            );
            fixture.componentRef.setInput('collapseAllTrigger', 0);
            fixture.detectChanges();
            expect(fixture.componentInstance.expanded()).toBe(true);

            fixture.componentRef.setInput('collapseAllTrigger', 1);
            fixture.detectChanges();
            await fixture.whenStable();
            expect(fixture.componentInstance.expanded()).toBe(false);
        });
    });
});
