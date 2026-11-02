import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JsonNode } from '../../../../core/interfaces';
import { CodeGeneratorService } from '../../../../core/services/code-generator/code-generator.service';
import { JsonParserService } from '../../../../core/services/json-parser/json-parser.service';

@Component({
    selector: 'app-json-table',
    standalone: true,
    imports: [
        FormsModule,
        MatTableModule,
        MatSortModule,
        MatPaginatorModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatIconModule,
        MatTooltipModule,
    ],
    templateUrl: './json-table.html',
    styleUrl: './json-table.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonTableComponent {
    private readonly parserService = inject(JsonParserService);
    private readonly generatorService = inject(CodeGeneratorService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly router = inject(Router);

    readonly data = input.required<JsonNode>();

    readonly selectedArrayPath = signal('');
    readonly pageIndex = signal(0);
    readonly pageSize = signal(25);
    readonly sortColumn = signal('');
    readonly sortDirection = signal<'asc' | 'desc' | ''>('');

    readonly availableArrays = computed(() => this.parserService.findTableArrays(this.data()));

    readonly activeArrayEntry = computed(() => {
        const list = this.availableArrays();
        if (list.length === 0) return null;
        const selected = this.selectedArrayPath();
        return list.find((item) => item.path === selected) ?? list[0];
    });

    readonly activeArrayNode = computed(() => this.activeArrayEntry()?.node ?? this.data());

    readonly tokenSavings = computed(() => {
        const node = this.activeArrayNode();
        const md = this.parserService.nodeArrayToMarkdownTable(node);
        if (!md) return null;
        const jsonStr = this.parserService.stringify(node);
        return this.generatorService.calculateTokenSavings(jsonStr, md);
    });

    readonly columns = computed(() => {
        const root = this.activeArrayNode();
        if (root.type !== 'array' || !root.children?.length) return [];

        const keys = new Set<string>();
        for (const child of root.children) {
            if (child.children) {
                for (const gc of child.children) {
                    keys.add(gc.key);
                }
            }
        }
        return Array.from(keys);
    });

    readonly rows = computed(() => {
        const root = this.activeArrayNode();
        if (root.type !== 'array' || !root.children) return [];

        let items = root.children.map((child) => {
            const row: Record<string, unknown> = {};
            if (child.children) {
                for (const gc of child.children) {
                    row[gc.key] = gc.value;
                }
            }
            return row;
        });

        const col = this.sortColumn();
        const dir = this.sortDirection();
        if (col && dir) {
            items = [...items].sort((a, b) => {
                const aVal = a[col];
                const bVal = b[col];
                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return dir === 'asc' ? -1 : 1;
                if (bVal == null) return dir === 'asc' ? 1 : -1;
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return dir === 'asc' ? aVal - bVal : bVal - aVal;
                }
                const comparison = String(aVal).localeCompare(String(bVal));
                return dir === 'asc' ? comparison : -comparison;
            });
        }

        const start = this.pageIndex() * this.pageSize();
        return items.slice(start, start + this.pageSize());
    });

    readonly totalRows = computed(() => {
        const root = this.activeArrayNode();
        return root.children?.length ?? 0;
    });

    onArrayPathChange(path: string): void {
        this.selectedArrayPath.set(path);
        this.pageIndex.set(0);
        this.sortColumn.set('');
        this.sortDirection.set('');
    }

    onSortChange(sort: Sort): void {
        this.sortColumn.set(sort.active);
        this.sortDirection.set(sort.direction);
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex.set(event.pageIndex);
        this.pageSize.set(event.pageSize);
    }

    formatCell(value: unknown): string {
        if (value === null) return 'null';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }

    copyAsMarkdown(): void {
        const md = this.parserService.nodeArrayToMarkdownTable(this.activeArrayNode());
        if (md) {
            navigator.clipboard.writeText(md);
            this.snackBar.open('Copied as Markdown Table', '', { duration: 2000 });
        }
    }

    copyAsCsv(): void {
        const csv = this.parserService.nodeArrayToCsv(this.activeArrayNode());
        if (csv) {
            navigator.clipboard.writeText(csv);
            this.snackBar.open('Copied as CSV', '', { duration: 2000 });
        }
    }

    openInMarkdownReader(): void {
        const entry = this.activeArrayEntry();
        const mdTable = this.parserService.nodeArrayToMarkdownTable(this.activeArrayNode());
        if (!mdTable) return;
        const title = entry && entry.path !== '$' ? `# ${entry.path}\n\n` : `# JSON Data Table\n\n`;
        this.parserService.pendingMarkdownTransfer.set(`${title}${mdTable}`);
        this.router.navigate(['/markdown']);
    }
}
