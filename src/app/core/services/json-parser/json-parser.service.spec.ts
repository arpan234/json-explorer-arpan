import { TestBed } from '@angular/core/testing';
import { JsonParserService } from './json-parser.service';
import { JsonNode } from '../../interfaces';

describe('JsonParserService', () => {
    let service: JsonParserService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(JsonParserService);
    });

    describe('validate', () => {
        it('should return valid for correct JSON', () => {
            const result = service.validate('{"name": "test"}');
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should return invalid with error message for malformed JSON', () => {
            const result = service.validate('{invalid}');
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should handle empty object', () => {
            expect(service.validate('{}').valid).toBe(true);
        });

        it('should handle empty array', () => {
            expect(service.validate('[]').valid).toBe(true);
        });
    });

    describe('parse', () => {
        it('should parse a simple object', () => {
            const result = service.parse('{"name": "John", "age": 30}');
            expect(result.error).toBeNull();
            expect(result.data).not.toBeNull();
            expect(result.data!.type).toBe('object');
            expect(result.data!.children).toHaveLength(2);
        });

        it('should parse an array', () => {
            const result = service.parse('[1, 2, 3]');
            expect(result.data!.type).toBe('array');
            expect(result.data!.children).toHaveLength(3);
        });

        it('should return error for invalid JSON', () => {
            const result = service.parse('not json');
            expect(result.data).toBeNull();
            expect(result.error).toBeDefined();
        });

        it('should detect correct types for values', () => {
            const result = service.parse('{"s":"str","n":42,"b":true,"x":null}');
            const children = result.data!.children!;
            expect(children[0].type).toBe('string');
            expect(children[1].type).toBe('number');
            expect(children[2].type).toBe('boolean');
            expect(children[3].type).toBe('null');
        });

        it('should handle deeply nested objects', () => {
            const deep = '{"a":{"b":{"c":{"d":"value"}}}}';
            const result = service.parse(deep);
            const leaf = result.data!.children![0].children![0].children![0].children![0];
            expect(leaf.key).toBe('d');
            expect(leaf.value).toBe('value');
            expect(leaf.path).toEqual(['root', 'a', 'b', 'c', 'd']);
        });

        it('should auto-expand first two levels', () => {
            const result = service.parse('{"a":{"b":{"c":1}}}');
            expect(result.data!.expanded).toBe(true);
            expect(result.data!.children![0].expanded).toBe(true);
            expect(result.data!.children![0].children![0].expanded).toBe(false);
        });
    });

    describe('nodeToValue', () => {
        it('should reconstruct object from node tree', () => {
            const original = { name: 'John', age: 30 };
            const result = service.parse(JSON.stringify(original));
            const reconstructed = service.nodeToValue(result.data!);
            expect(reconstructed).toEqual(original);
        });

        it('should reconstruct array from node tree', () => {
            const original = [1, 'two', true, null];
            const result = service.parse(JSON.stringify(original));
            const reconstructed = service.nodeToValue(result.data!);
            expect(reconstructed).toEqual(original);
        });
    });

    describe('stringify', () => {
        it('should produce formatted JSON from node tree', () => {
            const result = service.parse('{"a":1}');
            const json = service.stringify(result.data!);
            expect(json).toBe('{\n  "a": 1\n}');
        });
    });

    describe('updateNode', () => {
        it('should update a nested value by path', () => {
            const result = service.parse('{"user":{"name":"John"}}');
            const updated = service.updateNode(result.data!, ['user', 'name'], 'Jane');
            const value = service.nodeToValue(updated) as Record<string, Record<string, string>>;
            expect(value['user']['name']).toBe('Jane');
        });
    });

    describe('repairJson', () => {
        it('should fix unquoted keys, single quotes, trailing commas, and Python booleans', () => {
            const broken = "{ name: 'Alice', active: True, tags: ['a', 'b',], }";
            const res = service.repairJson(broken);
            expect(res.valid).toBe(true);
            expect(JSON.parse(res.repaired)).toEqual({
                name: 'Alice',
                active: true,
                tags: ['a', 'b'],
            });
        });

        it('should unescape stringified JSON', () => {
            const escaped = '"{\\"id\\": 1, \\"name\\": \\"Bob\\"}"';
            const res = service.repairJson(escaped);
            expect(res.valid).toBe(true);
            expect(JSON.parse(res.repaired)).toEqual({ id: 1, name: 'Bob' });
        });
    });

    describe('findTableArrays & nodeArrayToMarkdownTable', () => {
        it('should find nested object arrays and convert to Markdown table', () => {
            const parsed = service.parse(
                JSON.stringify({
                    app: 'demo',
                    users: [
                        { id: 1, name: 'Alice' },
                        { id: 2, name: 'Bob' },
                    ],
                }),
            );
            const arrays = service.findTableArrays(parsed.data);
            expect(arrays).toHaveLength(1);
            expect(arrays[0].path).toBe('$.users');

            const md = service.nodeArrayToMarkdownTable(arrays[0].node);
            expect(md).toContain('| id | name |');
            expect(md).toContain('| 1 | Alice |');
            expect(md).toContain('| 2 | Bob |');
        });
    });

    describe('extractMarkdownTablesToJson', () => {
        it('should parse Markdown tables back into typed JSON arrays', () => {
            const md = `# Report\n\n| id | name | active |\n| --- | --- | --- |\n| 1 | Alice | true |\n| 2 | Bob | false |`;
            const tables = service.extractMarkdownTablesToJson(md);
            expect(tables).toHaveLength(1);
            expect(tables[0]).toEqual([
                { id: 1, name: 'Alice', active: true },
                { id: 2, name: 'Bob', active: false },
            ]);
        });
    });
});
