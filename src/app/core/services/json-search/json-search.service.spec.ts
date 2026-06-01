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
        it('should return empty set for empty query', () => {
            const root = parseJson('{"name": "John"}');
            const matches = service.search(root, '');
            expect(matches.size).toBe(0);
        });

        it('should match key names', () => {
            const root = parseJson('{"name": "John", "age": 30}');
            const matches = service.search(root, 'name');
            expect(matches.has('root.name')).toBe(true);
        });

        it('should match string values', () => {
            const root = parseJson('{"name": "John"}');
            const matches = service.search(root, 'john');
            expect(matches.has('root.name')).toBe(true);
        });

        it('should match number values', () => {
            const root = parseJson('{"age": 42}');
            const matches = service.search(root, '42');
            expect(matches.has('root.age')).toBe(true);
        });

        it('should be case-insensitive', () => {
            const root = parseJson('{"Name": "JOHN"}');
            const matches = service.search(root, 'john');
            expect(matches.has('root.Name')).toBe(true);
        });

        it('should include parent paths of matching nodes', () => {
            const root = parseJson('{"user": {"name": "John"}}');
            const matches = service.search(root, 'john');
            expect(matches.has('root.user.name')).toBe(true);
            expect(matches.has('root.user')).toBe(true);
            expect(matches.has('root')).toBe(true);
        });

        it('should match in arrays', () => {
            const root = parseJson('{"items": ["apple", "banana"]}');
            const matches = service.search(root, 'apple');
            expect(matches.has('root.items.0')).toBe(true);
        });
    });
});
