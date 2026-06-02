import { Injectable } from '@angular/core';
import { JsonNode } from '../../interfaces';

export interface SearchOptions {
    caseSensitive?: boolean;
    isRegex?: boolean;
    searchKeys?: boolean;
    searchValues?: boolean;
}

export interface SearchResult {
    directMatches: string[];
    expandedPaths: Set<string>;
}

@Injectable({ providedIn: 'root' })
export class JsonSearchService {
    search(root: JsonNode, query: string, options: SearchOptions = {}): SearchResult {
        const directMatches: string[] = [];
        const expandedPaths = new Set<string>();

        if (!query.trim()) {
            return { directMatches, expandedPaths };
        }

        const caseSensitive = !!options.caseSensitive;
        const isRegex = !!options.isRegex;
        const searchKeys = options.searchKeys !== false;
        const searchValues = options.searchValues !== false;

        let regex: RegExp | null = null;
        if (isRegex) {
            try {
                regex = new RegExp(query, caseSensitive ? '' : 'i');
            } catch (e) {
                // Return empty if regex is invalid
                return { directMatches, expandedPaths };
            }
        }

        const queryLower = caseSensitive ? query : query.toLowerCase();

        this.searchNode(
            root,
            queryLower,
            regex,
            { caseSensitive, isRegex, searchKeys, searchValues },
            directMatches,
            expandedPaths
        );

        return { directMatches, expandedPaths };
    }

    private searchNode(
        node: JsonNode,
        query: string,
        regex: RegExp | null,
        options: Required<SearchOptions>,
        directMatches: string[],
        expandedPaths: Set<string>
    ): boolean {
        let isDirectMatch = false;
        const pathKey = node.path.join('.');

        // 1. Check Key Match
        if (options.searchKeys) {
            const keyText = node.key;
            if (regex) {
                if (regex.test(keyText)) {
                    isDirectMatch = true;
                }
            } else {
                const source = options.caseSensitive ? keyText : keyText.toLowerCase();
                if (source.includes(query)) {
                    isDirectMatch = true;
                }
            }
        }

        // 2. Check Value Match (only for leaf nodes)
        if (options.searchValues && node.type !== 'object' && node.type !== 'array') {
            const valText = String(node.value);
            if (regex) {
                if (regex.test(valText)) {
                    isDirectMatch = true;
                }
            } else {
                const source = options.caseSensitive ? valText : valText.toLowerCase();
                if (source.includes(query)) {
                    isDirectMatch = true;
                }
            }
        }

        if (isDirectMatch) {
            directMatches.push(pathKey);
        }

        let hasChildMatch = false;
        if (node.children) {
            for (const child of node.children) {
                if (this.searchNode(child, query, regex, options, directMatches, expandedPaths)) {
                    hasChildMatch = true;
                }
            }
        }

        if (isDirectMatch || hasChildMatch) {
            expandedPaths.add(pathKey);
            return true;
        }

        return false;
    }
}
