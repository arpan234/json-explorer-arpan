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
    readonly depth = input(0);
    readonly expandAllTrigger = input(0);
    readonly collapseAllTrigger = input(0);

    // Advanced search inputs
    readonly searchQuery = input('');
    readonly searchCaseSensitive = input(false);
    readonly searchRegex = input(false);
    readonly searchKeys = input(true);
    readonly searchValues = input(true);
    readonly expandedPaths = input<Set<string>>(new Set());
    readonly activeMatchPath = input<string | null>(null);

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
        // Auto expand if there is an active search and this node lies on a matching path.
        // This takes precedence over manual overrides so that matches are always visible.
        const query = this.searchQuery();
        if (query.trim() && this.expandedPaths().has(this.pathKey())) {
            return true;
        }

        const override = this.isExpanded();
        if (override !== null) return override;

        return this.node().expanded;
    });

    readonly isContainer = computed(() => {
        const type = this.node().type;
        return type === 'object' || type === 'array';
    });

    readonly pathKey = computed(() => this.node().path.join('.'));

    readonly isDirectMatch = computed(() => {
        const query = this.searchQuery();
        if (!query.trim()) return false;

        const isRegex = this.searchRegex();
        const caseSensitive = this.searchCaseSensitive();
        const searchKeys = this.searchKeys();
        const searchValues = this.searchValues();
        const node = this.node();

        let regex: RegExp | null = null;
        if (isRegex) {
            try {
                regex = new RegExp(query, caseSensitive ? '' : 'i');
            } catch {
                return false;
            }
        }

        const queryLower = caseSensitive ? query : query.toLowerCase();

        // 1. Check Key Match
        if (searchKeys) {
            const keyText = node.key;
            if (regex) {
                if (regex.test(keyText)) return true;
            } else {
                const source = caseSensitive ? keyText : keyText.toLowerCase();
                if (source.includes(queryLower)) return true;
            }
        }

        // 2. Check Value Match
        if (searchValues && node.type !== 'object' && node.type !== 'array') {
            const valText = String(node.value);
            if (regex) {
                if (regex.test(valText)) return true;
            } else {
                const source = caseSensitive ? valText : valText.toLowerCase();
                if (source.includes(queryLower)) return true;
            }
        }

        return false;
    });

    readonly isActiveMatch = computed(() => {
        return this.activeMatchPath() === this.pathKey();
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

    readonly keySegments = computed(() => {
        const text = this.node().key;
        const query = this.searchQuery();
        if (!this.searchKeys() || !query.trim()) {
            return [{ text, match: false }];
        }
        return getHighlightSegments(
            text,
            query,
            this.searchCaseSensitive(),
            this.searchRegex()
        );
    });

    readonly valueSegments = computed(() => {
        if (this.isContainer()) return [];
        const n = this.node();
        const query = this.searchQuery();
        const caseSensitive = this.searchCaseSensitive();
        const isRegex = this.searchRegex();

        if (!this.searchValues() || !query.trim()) {
            return [{ text: this.displayValue(), match: false }];
        }

        if (n.type === 'string') {
            const rawVal = String(n.value);
            const segments = getHighlightSegments(rawVal, query, caseSensitive, isRegex);
            return [
                { text: '"', match: false },
                ...segments,
                { text: '"', match: false }
            ];
        }

        return getHighlightSegments(String(n.value), query, caseSensitive, isRegex);
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

function getHighlightSegments(
    text: string,
    query: string,
    caseSensitive: boolean,
    isRegex: boolean
): { text: string; match: boolean }[] {
    if (!query.trim() || !text) {
        return [{ text, match: false }];
    }

    try {
        let regex: RegExp;
        if (isRegex) {
            regex = new RegExp(query, caseSensitive ? 'g' : 'gi');
        } else {
            const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
        }

        const segments: { text: string; match: boolean }[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        regex.lastIndex = 0;

        while ((match = regex.exec(text)) !== null) {
            if (match.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            if (match.index > lastIndex) {
                segments.push({
                    text: text.substring(lastIndex, match.index),
                    match: false,
                });
            }

            segments.push({
                text: match[0],
                match: true,
            });

            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            segments.push({
                text: text.substring(lastIndex),
                match: false,
            });
        }

        return segments;
    } catch {
        return [{ text, match: false }];
    }
}
