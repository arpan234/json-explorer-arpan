import { Injectable } from '@angular/core';
import { JsonNode } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class JsonSearchService {
    search(root: JsonNode, query: string): Set<string> {
        const matches = new Set<string>();

        if (!query.trim()) return matches;

        const lowerQuery = query.toLowerCase();
        this.searchNode(root, lowerQuery, matches);
        return matches;
    }

    private searchNode(node: JsonNode, query: string, matches: Set<string>): boolean {
        let hasMatch = false;
        const pathKey = node.path.join('.');

        if (node.key.toLowerCase().includes(query)) {
            matches.add(pathKey);
            hasMatch = true;
        }

        if (node.type !== 'object' && node.type !== 'array') {
            const valueStr = String(node.value).toLowerCase();
            if (valueStr.includes(query)) {
                matches.add(pathKey);
                hasMatch = true;
            }
        }

        if (node.children) {
            for (const child of node.children) {
                if (this.searchNode(child, query, matches)) {
                    hasMatch = true;
                }
            }
        }

        if (hasMatch) {
            matches.add(pathKey);
        }

        return hasMatch;
    }
}
