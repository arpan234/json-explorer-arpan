import {
    ChangeDetectionStrategy,
    Component,
    effect,
    input,
    output,
    signal,
    computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { JsonNode } from '../../../../core/interfaces';
import {
    TYPE_COLORS,
    getKeyColorByDepth,
} from '../../../../core/constants/json-viewer.constants';

@Component({
    selector: 'app-json-tree-node',
    standalone: true,
    imports: [FormsModule, MatIconModule, MatButtonModule],
    templateUrl: './json-tree-node.html',
    styleUrl: './json-tree-node.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonTreeNodeComponent {
    readonly node = input.required<JsonNode>();
    readonly searchMatches = input<Set<string>>(new Set());
    readonly depth = input(0);
    readonly expandAllTrigger = input(0);
    readonly collapseAllTrigger = input(0);

    constructor() {
        effect(() => {
            const v = this.expandAllTrigger();
            if (v > 0) this.isExpanded.set(true);
        });
        effect(() => {
            const v = this.collapseAllTrigger();
            if (v > 0) this.isExpanded.set(false);
        });
    }

    readonly pathSelected = output<string[]>();
    readonly nodeEdited = output<{ path: string[]; value: unknown }>();

    readonly isEditing = signal(false);
    readonly editValue = signal('');

    readonly isExpanded = signal<boolean | null>(null);

    readonly expanded = computed(() => {
        const override = this.isExpanded();
        return override !== null ? override : this.node().expanded;
    });

    readonly isContainer = computed(() => {
        const type = this.node().type;
        return type === 'object' || type === 'array';
    });

    readonly pathKey = computed(() => this.node().path.join('.'));

    readonly isMatch = computed(() => {
        return this.searchMatches().has(this.pathKey());
    });

    readonly valueColor = computed(() => TYPE_COLORS[this.node().type]);
    readonly keyColor = computed(() => getKeyColorByDepth(this.depth()));

    readonly childCount = computed(() => this.node().children?.length ?? 0);

    readonly displayValue = computed(() => {
        const n = this.node();
        if (n.type === 'string') return `"${n.value}"`;
        if (n.type === 'null') return 'null';
        return String(n.value);
    });

    readonly containerSummary = computed(() => {
        const n = this.node();
        if (n.type === 'object') return `{${this.childCount()}}`;
        if (n.type === 'array') return `[${this.childCount()}]`;
        return '';
    });

    toggleExpand(): void {
        this.isExpanded.set(!this.expanded());
        this.pathSelected.emit(this.node().path);
    }

    startEdit(): void {
        const n = this.node();
        if (this.isContainer()) return;
        this.isEditing.set(true);
        this.editValue.set(n.type === 'string' ? String(n.value) : JSON.stringify(n.value));
    }

    cancelEdit(): void {
        this.isEditing.set(false);
    }

    saveEdit(): void {
        const n = this.node();
        let newValue: unknown;

        const raw = this.editValue().trim();
        if (n.type === 'string') {
            newValue = raw;
        } else if (n.type === 'number') {
            newValue = Number(raw);
            if (isNaN(newValue as number)) return;
        } else if (n.type === 'boolean') {
            newValue = raw === 'true';
        } else if (n.type === 'null') {
            newValue = null;
        } else {
            try {
                newValue = JSON.parse(raw);
            } catch {
                return;
            }
        }

        this.isEditing.set(false);
        this.nodeEdited.emit({ path: n.path, value: newValue });
    }

    onChildEdit(event: { path: string[]; value: unknown }): void {
        this.nodeEdited.emit(event);
    }

    onChildPathSelected(path: string[]): void {
        this.pathSelected.emit(path);
    }
}
