import { TestBed } from '@angular/core/testing';
import { JsonSearchService } from './json-search.service';
import { JsonParserService } from '../json-parser/json-parser.service';
import { JsonNode } from '../../interfaces';

describe('JsonSearchService', () => {
    let service: JsonSearchService;
    let parserService: JsonParserService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(JsonSearchService);
        parserService = TestBed.inject(JsonParserService);
    });

    function parseJson(json: string): JsonNode {
        return parserService.parse(json).data!;
    }

    describe('search', () => {
        it('should return empty results for empty query', () => {
            const root = parseJson('{"name": "John"}');
            const result = service.search(root, '');
            expect(result.directMatches.length).toBe(0);
            expect(result.expandedPaths.size).toBe(0);
        });

        it('should match key names', () => {
            const root = parseJson('{"name": "John", "age": 30}');
            const result = service.search(root, 'name');
            expect(result.directMatches).toContain('root.name');
            expect(result.expandedPaths.has('root.name')).toBe(true);
        });

        it('should match string values', () => {
            const root = parseJson('{"name": "John"}');
            const result = service.search(root, 'john');
            expect(result.directMatches).toContain('root.name');
            expect(result.expandedPaths.has('root.name')).toBe(true);
        });

        it('should match number values', () => {
            const root = parseJson('{"age": 42}');
            const result = service.search(root, '42');
            expect(result.directMatches).toContain('root.age');
            expect(result.expandedPaths.has('root.age')).toBe(true);
        });

        it('should be case-insensitive by default', () => {
            const root = parseJson('{"Name": "JOHN"}');
            const result = service.search(root, 'john');
            expect(result.directMatches).toContain('root.Name');
        });

        it('should support case-sensitive search', () => {
            const root = parseJson('{"Name": "JOHN", "nickname": "john"}');
            const result = service.search(root, 'JOHN', { caseSensitive: true });
            expect(result.directMatches).toContain('root.Name');
            expect(result.directMatches).not.toContain('root.nickname');
        });

        it('should support regex search', () => {
            const root = parseJson('{"age1": 25, "age2": 30, "height": 180}');
            const result = service.search(root, 'age\\d', { isRegex: true });
            expect(result.directMatches).toContain('root.age1');
            expect(result.directMatches).toContain('root.age2');
            expect(result.directMatches).not.toContain('root.height');
        });

        it('should return empty if regex is invalid', () => {
            const root = parseJson('{"age": 25}');
            const result = service.search(root, '[', { isRegex: true });
            expect(result.directMatches.length).toBe(0);
        });

        it('should support searchKeys option', () => {
            const root = parseJson('{"username": "John"}');
            const result = service.search(root, 'username', { searchKeys: true, searchValues: false });
            expect(result.directMatches).toContain('root.username');

            const resultVal = service.search(root, 'John', { searchKeys: true, searchValues: false });
            expect(resultVal.directMatches.length).toBe(0);
        });

        it('should support searchValues option', () => {
            const root = parseJson('{"username": "John"}');
            const result = service.search(root, 'John', { searchKeys: false, searchValues: true });
            expect(result.directMatches).toContain('root.username');

            const resultKey = service.search(root, 'username', { searchKeys: false, searchValues: true });
            expect(resultKey.directMatches.length).toBe(0);
        });

        it('should include parent paths in expandedPaths of matching nodes', () => {
            const root = parseJson('{"user": {"name": "John"}}');
            const result = service.search(root, 'john');
            expect(result.directMatches).toContain('root.user.name');
            expect(result.expandedPaths.has('root.user.name')).toBe(true);
            expect(result.expandedPaths.has('root.user')).toBe(true);
            expect(result.expandedPaths.has('root')).toBe(true);
        });

        it('should match in arrays', () => {
            const root = parseJson('{"items": ["apple", "banana"]}');
            const result = service.search(root, 'apple');
            expect(result.directMatches).toContain('root.items.0');
            expect(result.expandedPaths.has('root.items.0')).toBe(true);
        });

    });
});
