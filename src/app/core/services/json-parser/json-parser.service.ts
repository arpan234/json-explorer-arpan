import { Injectable, signal } from '@angular/core';
import { JsonNode, JsonValueType } from '../../interfaces';

export interface DiscoveredArrayNode {
    path: string;
    label: string;
    node: JsonNode;
}

@Injectable({ providedIn: 'root' })
export class JsonParserService {
    /** Cross-tool state for transferring converted payloads between JSON Viewer and Markdown Reader */
    readonly pendingMarkdownTransfer = signal<string | null>(null);
    readonly pendingJsonTransfer = signal<string | null>(null);

    validate(raw: string): { valid: boolean; error?: string } {
        try {
            JSON.parse(raw);
            return { valid: true };
        } catch (e) {
            return { valid: false, error: (e as SyntaxError).message };
        }
    }

    parse(raw: string): { data: JsonNode | null; error: string | null } {
        try {
            const parsed = JSON.parse(raw);
            const root = this.toJsonNode('root', parsed, []);
            return { data: root, error: null };
        } catch (e) {
            return { data: null, error: (e as SyntaxError).message };
        }
    }

    /**
     * Repairs common JSON syntax errors:
     * - Escaped / stringified JSON strings
     * - JS single-line (//) and multi-line (/* *\/) comments
     * - Single-quoted strings
     * - Unquoted object keys
     * - Trailing commas before } or ]
     * - Python/JS literals (True, False, None, undefined)
     */
    repairJson(raw: string): { repaired: string; valid: boolean; error?: string } {
        let text = raw.trim();
        if (!text) {
            return { repaired: '', valid: false, error: 'Please enter some JSON' };
        }

        // 1. Check if already valid (also unwrap stringified JSON like "{\"a\":1}")
        try {
            const firstPass = JSON.parse(text);
            if (typeof firstPass === 'string') {
                try {
                    const inner = JSON.parse(firstPass);
                    return { repaired: JSON.stringify(inner, null, 2), valid: true };
                } catch {
                    // keep firstPass
                }
            }
            return { repaired: JSON.stringify(firstPass, null, 2), valid: true };
        } catch {
            // proceed with repair heuristics
        }

        // 2. Unescape raw escaped JSON e.g. {\"name\": \"Alice\"}
        if (text.includes('\\"') && !text.includes('":')) {
            const unescaped = text
                .replace(/^["']|["']$/g, '')
                .replace(/\\"/g, '"')
                .replace(/\\n/g, '\n')
                .replace(/\\t/g, '\t')
                .replace(/\\\\/g, '\\');
            try {
                const parsed = JSON.parse(unescaped);
                return { repaired: JSON.stringify(parsed, null, 2), valid: true };
            } catch {
                text = unescaped;
            }
        }

        // 3. Token-aware pass: strip comments & convert single-quoted strings to double-quoted
        let out = '';
        let i = 0;
        while (i < text.length) {
            const ch = text[i];
            const next = text[i + 1];

            // Line comment
            if (ch === '/' && next === '/') {
                i += 2;
                while (i < text.length && text[i] !== '\n') i++;
                continue;
            }

            // Block comment
            if (ch === '/' && next === '*') {
                i += 2;
                while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
                i += 2;
                continue;
            }

            // Double-quoted string
            if (ch === '"') {
                out += ch;
                i++;
                while (i < text.length) {
                    if (text[i] === '\\') {
                        out += text[i] + (text[i + 1] ?? '');
                        i += 2;
                        continue;
                    }
                    if (text[i] === '"') {
                        out += '"';
                        i++;
                        break;
                    }
                    out += text[i];
                    i++;
                }
                continue;
            }

            // Single-quoted string -> convert to double-quoted string
            if (ch === "'") {
                out += '"';
                i++;
                while (i < text.length) {
                    if (text[i] === '\\') {
                        const escapedChar = text[i + 1] ?? '';
                        if (escapedChar === "'") {
                            out += "'";
                        } else {
                            out += '\\' + escapedChar;
                        }
                        i += 2;
                        continue;
                    }
                    if (text[i] === '"') {
                        out += '\\"';
                        i++;
                        continue;
                    }
                    if (text[i] === "'") {
                        out += '"';
                        i++;
                        break;
                    }
                    out += text[i];
                    i++;
                }
                continue;
            }

            out += ch;
            i++;
        }

        // 4. Quote unquoted keys: { key: ... } or , key: ...
        out = out.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$-]*)\s*:/g, '$1"$2":');

        // 5. Replace Python / JS constants outside quotes
        out = out
            .replace(/:\s*True\b/g, ': true')
            .replace(/:\s*False\b/g, ': false')
            .replace(/:\s*(None|undefined)\b/g, ': null');

        // 6. Remove trailing commas before } or ]
        out = out.replace(/,(\s*[}\]])/g, '$1');

        try {
            const parsed = JSON.parse(out);
            return { repaired: JSON.stringify(parsed, null, 2), valid: true };
        } catch (e) {
            return {
                repaired: out,
                valid: false,
                error: (e as SyntaxError).message,
            };
        }
    }

    minify(raw: string): { minified: string; valid: boolean; error?: string } {
        try {
            const parsed = JSON.parse(raw);
            return { minified: JSON.stringify(parsed), valid: true };
        } catch {
            const repaired = this.repairJson(raw);
            if (repaired.valid) {
                return { minified: JSON.stringify(JSON.parse(repaired.repaired)), valid: true };
            }
            return { minified: raw, valid: false, error: repaired.error };
        }
    }

    /**
     * Finds all arrays of objects in the JSON tree (including root and nested paths like $.users)
     */
    findTableArrays(root: JsonNode | null): DiscoveredArrayNode[] {
        if (!root) return [];
        const results: DiscoveredArrayNode[] = [];

        const walk = (node: JsonNode): void => {
            if (
                node.type === 'array' &&
                node.children &&
                node.children.length > 0 &&
                node.children.every((child) => child.type === 'object')
            ) {
                const pathStr = this.formatNodePath(node.path);
                const label =
                    node.path.length <= 1
                        ? `$ (${node.children.length} rows)`
                        : `${pathStr} (${node.children.length} rows)`;
                results.push({ path: pathStr, label, node });
            }

            if (node.children) {
                for (const child of node.children) {
                    walk(child);
                }
            }
        };

        walk(root);
        return results;
    }

    /**
     * Finds all arrays of objects containing at least one numeric field (including root and nested paths)
     */
    findChartArrays(root: JsonNode | null): DiscoveredArrayNode[] {
        return this.findTableArrays(root).filter((entry) =>
            entry.node.children?.some(
                (child) =>
                    child.type === 'object' && child.children?.some((gc) => gc.type === 'number'),
            ),
        );
    }

    formatNodePath(path: string[]): string {
        if (path.length <= 1) return '$';
        return (
            '$' +
            path
                .slice(1)
                .map((segment) => (/^\d+$/.test(segment) ? `[${segment}]` : `.${segment}`))
                .join('')
        );
    }

    /**
     * Converts an array-of-objects JsonNode into a GitHub-Flavored Markdown (GFM) table
     */
    nodeArrayToMarkdownTable(arrayNode: JsonNode): string {
        if (arrayNode.type !== 'array' || !arrayNode.children?.length) return '';

        const keys = new Set<string>();
        for (const child of arrayNode.children) {
            if (child.children) {
                for (const gc of child.children) {
                    keys.add(gc.key);
                }
            }
        }
        const columns = Array.from(keys);
        if (columns.length === 0) return '';

        const escapeCell = (val: unknown): string => {
            if (val === null || val === undefined) return '';
            const raw = typeof val === 'object' ? JSON.stringify(val) : String(val);
            return raw.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
        };

        const headerRow = `| ${columns.map((c) => escapeCell(c)).join(' | ')} |`;
        const separatorRow = `| ${columns.map(() => '---').join(' | ')} |`;

        const bodyRows = arrayNode.children.map((child) => {
            const rowMap = new Map<string, unknown>();
            if (child.children) {
                for (const gc of child.children) {
                    rowMap.set(gc.key, this.nodeToValue(gc));
                }
            }
            return `| ${columns.map((col) => escapeCell(rowMap.get(col))).join(' | ')} |`;
        });

        return [headerRow, separatorRow, ...bodyRows].join('\n');
    }

    /**
     * Converts an array-of-objects JsonNode into RFC-4180 CSV
     */
    nodeArrayToCsv(arrayNode: JsonNode): string {
        if (arrayNode.type !== 'array' || !arrayNode.children?.length) return '';

        const keys = new Set<string>();
        for (const child of arrayNode.children) {
            if (child.children) {
                for (const gc of child.children) {
                    keys.add(gc.key);
                }
            }
        }
        const columns = Array.from(keys);
        if (columns.length === 0) return '';

        const escapeCsv = (val: unknown): string => {
            if (val === null || val === undefined) return '';
            const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
            if (/[",\r\n]/.test(str)) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const header = columns.map((c) => escapeCsv(c)).join(',');
        const rows = arrayNode.children.map((child) => {
            const rowMap = new Map<string, unknown>();
            if (child.children) {
                for (const gc of child.children) {
                    rowMap.set(gc.key, this.nodeToValue(gc));
                }
            }
            return columns.map((col) => escapeCsv(rowMap.get(col))).join(',');
        });

        return [header, ...rows].join('\n');
    }

    /**
     * Extracts all Markdown tables from a Markdown document and parses them into JSON arrays
     */
    extractMarkdownTablesToJson(markdown: string): Record<string, unknown>[][] {
        const lines = markdown.split(/\r?\n/);
        const tables: Record<string, unknown>[][] = [];
        let i = 0;

        const splitTableLine = (line: string): string[] => {
            let trimmed = line.trim();
            if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
            if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
            return trimmed.split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, '|'));
        };

        const isSeparatorLine = (line: string): boolean => {
            const trimmed = line.trim();
            if (!trimmed.includes('|') || !trimmed.includes('-')) return false;
            const cells = splitTableLine(trimmed);
            return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
        };

        const parseCellValue = (raw: string): unknown => {
            if (raw === '') return null;
            if (raw === 'true') return true;
            if (raw === 'false') return false;
            if (raw === 'null') return null;
            if (/^-?\d+(\.\d+)?$/.test(raw)) {
                const num = Number(raw);
                if (!Number.isNaN(num)) return num;
            }
            if (
                (raw.startsWith('{') && raw.endsWith('}')) ||
                (raw.startsWith('[') && raw.endsWith(']'))
            ) {
                try {
                    return JSON.parse(raw);
                } catch {
                    // treat as string
                }
            }
            return raw;
        };

        while (i < lines.length - 1) {
            const current = lines[i].trim();
            const next = lines[i + 1].trim();

            if (current.includes('|') && isSeparatorLine(next)) {
                const headers = splitTableLine(current);
                i += 2;
                const rows: Record<string, unknown>[] = [];

                while (i < lines.length && lines[i].trim().includes('|')) {
                    const rowCells = splitTableLine(lines[i]);
                    const obj: Record<string, unknown> = {};
                    headers.forEach((header, idx) => {
                        const key = header || `col_${idx + 1}`;
                        obj[key] = parseCellValue(rowCells[idx] ?? '');
                    });
                    rows.push(obj);
                    i++;
                }

                if (rows.length > 0) {
                    tables.push(rows);
                }
                continue;
            }
            i++;
        }

        return tables;
    }

    /**
     * URL-safe UTF-8 Base64 encoding for shareable links
     */
    encodeForUrl(text: string): string {
        try {
            const bytes = new TextEncoder().encode(text);
            let binary = '';
            for (const b of bytes) {
                binary += String.fromCharCode(b);
            }
            return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        } catch {
            return '';
        }
    }

    decodeFromUrl(encoded: string): string | null {
        try {
            const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
            const binary = atob(padded);
            const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
            return new TextDecoder().decode(bytes);
        } catch {
            return null;
        }
    }

    toJsonNode(key: string, value: unknown, path: string[]): JsonNode {
        const currentPath = [...path, key];
        const type = this.getType(value);

        const node: JsonNode = {
            key,
            value,
            type,
            path: currentPath,
            expanded: currentPath.length <= 2,
        };

        if (type === 'object' && value !== null) {
            node.children = Object.entries(value as Record<string, unknown>).map(([k, v]) =>
                this.toJsonNode(k, v, currentPath),
            );
        } else if (type === 'array') {
            node.children = (value as unknown[]).map((item, index) =>
                this.toJsonNode(String(index), item, currentPath),
            );
        }

        return node;
    }

    nodeToValue(node: JsonNode): unknown {
        if (node.type === 'object' && node.children) {
            const obj: Record<string, unknown> = {};
            for (const child of node.children) {
                obj[child.key] = this.nodeToValue(child);
            }
            return obj;
        }

        if (node.type === 'array' && node.children) {
            return node.children.map((child) => this.nodeToValue(child));
        }

        return node.value;
    }

    stringify(node: JsonNode, indent = 2): string {
        const value = this.nodeToValue(node);
        return JSON.stringify(value, null, indent);
    }

    updateNode(root: JsonNode, path: string[], newValue: unknown): JsonNode {
        if (path.length === 0) {
            return this.toJsonNode(root.key, newValue, root.path.slice(0, -1));
        }

        const clone: JsonNode = { ...root };

        if (clone.children) {
            const [nextKey, ...remainingPath] = path;
            clone.children = clone.children.map((child) => {
                if (child.key === nextKey) {
                    if (remainingPath.length === 0) {
                        return this.toJsonNode(child.key, newValue, child.path.slice(0, -1));
                    }
                    return this.updateNode(child, remainingPath, newValue);
                }
                return child;
            });
        }

        clone.value = this.nodeToValue(clone);
        return clone;
    }

    private getType(value: unknown): JsonValueType {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value as JsonValueType;
    }
}
