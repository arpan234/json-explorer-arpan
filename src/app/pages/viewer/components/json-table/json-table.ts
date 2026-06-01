import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { JsonNode } from '../../../../core/interfaces';

@Component({
    selector: 'app-json-table',
    standalone: true,
    imports: [MatTableModule, MatSortModule, MatPaginatorModule],
    templateUrl: './json-table.html',
    styleUrl: './json-table.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonTableComponent {
    readonly data = input.required<JsonNode>();

    readonly pageIndex = signal(0);
    readonly pageSize = signal(25);
    readonly sortColumn = signal('');
    readonly sortDirection = signal<'asc' | 'desc' | ''>('');

    readonly columns = computed(() => {
        const root = this.data();
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
        const root = this.data();
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
        const root = this.data();
        return root.children?.length ?? 0;
    });

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
}
