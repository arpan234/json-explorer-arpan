import { Injectable } from '@angular/core';
import { JsonNode, JsonValueType } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class JsonParserService {
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
