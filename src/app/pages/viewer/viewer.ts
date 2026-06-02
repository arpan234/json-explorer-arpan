import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    signal,
    HostListener,
    effect,
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

import { JsonParserService } from '../../core/services/json-parser/json-parser.service';
import { JsonSearchService } from '../../core/services/json-search/json-search.service';
import { ViewMode } from '../../core/constants/json-viewer.constants';
import { JsonNode } from '../../core/interfaces';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs';
import { JsonInputComponent } from './components/json-input/json-input';
import { JsonTreeNodeComponent } from './components/json-tree-node/json-tree-node';
import { RawEditorComponent } from './components/raw-editor/raw-editor';
import { JsonTableComponent } from './components/json-table/json-table';
import { JsonChartComponent } from './components/json-chart/json-chart';

@Component({
    selector: 'app-viewer',
    standalone: true,
    imports: [
        MatTabsModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatTooltipModule,
        FormsModule,
        BreadcrumbsComponent,
        JsonInputComponent,
        JsonTreeNodeComponent,
        RawEditorComponent,
        JsonTableComponent,
        JsonChartComponent,
    ],
    templateUrl: './viewer.html',
    styleUrl: './viewer.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerComponent {
    private readonly parserService = inject(JsonParserService);
    private readonly searchService = inject(JsonSearchService);
    private readonly snackBar = inject(MatSnackBar);

    readonly rawJson = signal('');
    readonly viewMode = signal<ViewMode>('tree');
    readonly searchQuery = signal('');
    readonly selectedPath = signal<string[]>([]);
    readonly showSearch = signal(false);
    readonly panelWidth = signal(35);
    readonly expandAllTrigger = signal(0);
    readonly collapseAllTrigger = signal(0);

    // Advanced search options
    readonly searchCaseSensitive = signal(false);
    readonly searchRegex = signal(false);
    readonly searchKeys = signal(true);
    readonly searchValues = signal(true);
    readonly activeMatchIndex = signal(-1);

    readonly parseResult = computed(() => {
        const raw = this.rawJson();
        if (!raw.trim()) return { data: null, error: null };
        return this.parserService.parse(raw);
    });

    readonly rootNode = computed(() => this.parseResult().data);
    readonly parseError = computed(() => this.parseResult().error);

    readonly searchResults = computed(() => {
        const root = this.rootNode();
        const query = this.searchQuery();
        if (!root) {
            return { directMatches: [], expandedPaths: new Set<string>() };
        }
        return this.searchService.search(root, query, {
            caseSensitive: this.searchCaseSensitive(),
            isRegex: this.searchRegex(),
            searchKeys: this.searchKeys(),
            searchValues: this.searchValues(),
        });
    });

    readonly directMatches = computed(() => this.searchResults().directMatches);
    readonly expandedPaths = computed(() => this.searchResults().expandedPaths);

    readonly activeMatchPath = computed(() => {
        const index = this.activeMatchIndex();
        const matches = this.directMatches();
        if (index >= 0 && index < matches.length) {
            return matches[index];
        }
        return null;
    });

    constructor() {
        // Reset or adjust activeMatchIndex when search results change
        effect(() => {
            const matches = this.directMatches();
            if (matches.length > 0) {
                const current = this.activeMatchIndex();
                if (current < 0 || current >= matches.length) {
                    this.activeMatchIndex.set(0);
                }
            } else {
                this.activeMatchIndex.set(-1);
            }
        });

        // Scroll active match into view when it changes
        effect(() => {
            const path = this.activeMatchPath();
            if (path && this.showSearch()) {
                setTimeout(() => {
                    const element = document.getElementById('node-' + path);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }, 50);
            }
        });
    }

    nextMatch(): void {
        const matches = this.directMatches();
        if (matches.length === 0) return;
        this.activeMatchIndex.update((idx) => (idx + 1) % matches.length);
    }

    prevMatch(): void {
        const matches = this.directMatches();
        if (matches.length === 0) return;
        this.activeMatchIndex.update((idx) => (idx - 1 + matches.length) % matches.length);
    }

    readonly hasData = computed(() => !!this.rootNode());

    readonly nodeStats = computed(() => {
        const root = this.rootNode();
        if (!root) return null;
        let totalKeys = 0;
        let maxDepth = 0;
        const walk = (node: JsonNode, depth: number): void => {
            totalKeys++;
            maxDepth = Math.max(maxDepth, depth);
            if (node.children) {
                for (const child of node.children) {
                    walk(child, depth + 1);
                }
            }
        };
        walk(root, 0);
        return { totalKeys, maxDepth };
    });

    readonly formattedPath = computed(() => {
        const path = this.selectedPath();
        if (path.length <= 1) return '$';
        return (
            '$' +
            path
                .slice(1)
                .map((segment) => (/^\d+$/.test(segment) ? `[${segment}]` : `.${segment}`))
                .join('')
        );
    });

    readonly isTableCompatible = computed(() => {
        const root = this.rootNode();
        if (!root) return false;
        if (root.type === 'array' && root.children && root.children.length > 0) {
            return root.children.every((child) => child.type === 'object');
        }
        return false;
    });

    readonly isChartCompatible = computed(() => {
        const root = this.rootNode();
        if (!root) return false;
        if (root.type === 'array' && root.children && root.children.length > 0) {
            return root.children.some(
                (child) =>
                    child.type === 'object' && child.children?.some((gc) => gc.type === 'number'),
            );
        }
        return false;
    });

    onJsonInput(raw: string): void {
        this.rawJson.set(raw);
        if (!this.hasData()) return;
        this.viewMode.set('tree');
    }

    onRawEditorChange(raw: string): void {
        this.rawJson.set(raw);
    }

    onNodeEdit(event: { path: string[]; value: unknown }): void {
        const root = this.rootNode();
        if (!root) return;
        const pathWithoutRoot = event.path.slice(1);
        const updated = this.parserService.updateNode(root, pathWithoutRoot, event.value);
        this.rawJson.set(this.parserService.stringify(updated));
    }

    onPathSelected(path: string[]): void {
        this.selectedPath.set(path);
    }

    onTabChange(index: number): void {
        const modes: ViewMode[] = ['raw', 'tree', 'table', 'chart'];
        this.viewMode.set(modes[index] ?? 'tree');
    }

    get selectedTabIndex(): number {
        const modes: ViewMode[] = ['raw', 'tree', 'table', 'chart'];
        return modes.indexOf(this.viewMode());
    }

    expandAll(): void {
        this.expandAllTrigger.update((v) => v + 1);
    }

    collapseAll(): void {
        this.collapseAllTrigger.update((v) => v + 1);
    }

    formatJson(): void {
        const root = this.rootNode();
        if (root) {
            this.rawJson.set(this.parserService.stringify(root));
            this.snackBar.open('JSON formatted', '', { duration: 2000 });
        }
    }

    copyToClipboard(): void {
        const raw = this.rawJson();
        if (raw) {
            navigator.clipboard.writeText(raw);
            this.snackBar.open('Copied to clipboard', '', { duration: 2000 });
        }
    }

    copyPath(): void {
        const path = this.formattedPath();
        navigator.clipboard.writeText(path);
        this.snackBar.open(`Path copied: ${path}`, '', { duration: 2000 });
    }

    downloadJson(): void {
        const raw = this.rawJson();
        if (!raw) return;
        const blob = new Blob([raw], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        a.click();
        URL.revokeObjectURL(url);
        this.snackBar.open('JSON downloaded', '', { duration: 2000 });
    }

    onResizeStart(event: MouseEvent): void {
        event.preventDefault();
        const container = (event.target as HTMLElement).parentElement!;
        const containerRect = container.getBoundingClientRect();

        const onMouseMove = (e: MouseEvent) => {
            const percentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;
            this.panelWidth.set(Math.max(20, Math.min(60, percentage)));
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    onSearchEnter(event: Event): void {
        const keyboardEvent = event as KeyboardEvent;
        if (keyboardEvent.shiftKey) {
            this.prevMatch();
        } else {
            this.nextMatch();
        }
    }

    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
            event.preventDefault();
            this.showSearch.update((v) => !v);
        }

        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'F') {
            event.preventDefault();
            this.formatJson();
        }
    }
}
