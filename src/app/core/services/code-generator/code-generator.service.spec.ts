import { TestBed } from '@angular/core/testing';
import { CodeGeneratorService } from './code-generator.service';

describe('CodeGeneratorService', () => {
    let service: CodeGeneratorService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CodeGeneratorService);
    });

    const testObject = {
        name: 'JSON Explorer',
        version: '1.0.0',
        active: true,
        count: 5,
        rating: 4.8,
        config: {
            theme: 'dark',
            autoFormat: true,
        },
        users: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob', email: 'bob@example.com' },
        ],
    };

    describe('generate - typescript', () => {
        it('should generate valid TypeScript interfaces', () => {
            const code = service.generate(testObject, 'typescript');
            expect(code).toContain('export interface Root');
            expect(code).toContain('name: string;');
            expect(code).toContain('active: boolean;');
            expect(code).toContain('count: number;');
            expect(code).toContain('rating: number;');
            expect(code).toContain('config: RootConfig;');
            expect(code).toContain('users: RootUser[];');
            expect(code).toContain('export interface RootConfig');
            expect(code).toContain('export interface RootUser');
            expect(code).toContain('email?: string;'); // optional field from merged array
        });
    });

    describe('generate - go', () => {
        it('should generate valid Go structs', () => {
            const code = service.generate(testObject, 'go');
            expect(code).toContain('package main');
            expect(code).toContain('type Root struct');
            expect(code).toContain('Name string');
            expect(code).toContain('Active bool');
            expect(code).toContain('Count int');
            expect(code).toContain('Rating float64');
            expect(code).toContain('Config RootConfig');
            expect(code).toContain('Users []RootUser');
            expect(code).toContain('type RootConfig struct');
            expect(code).toContain('type RootUser struct');
        });
    });

    describe('generate - python', () => {
        it('should generate valid Python Pydantic models', () => {
            const code = service.generate(testObject, 'python');
            expect(code).toContain('from pydantic import BaseModel');
            expect(code).toContain('from typing import List, Optional');
            expect(code).toContain('class Root(BaseModel):');
            expect(code).toContain('    name: str');
            expect(code).toContain('    active: bool');
            expect(code).toContain('    count: int');
            expect(code).toContain('    rating: float');
            expect(code).toContain('    config: RootConfig');
            expect(code).toContain('    users: List[RootUser]');
            expect(code).toContain('class RootConfig(BaseModel):');
            expect(code).toContain('class RootUser(BaseModel):');
            expect(code).toContain('    email: Optional[str] = None'); // optional field
        });
    });

    describe('generate - sql', () => {
        it('unions row fields, preserves input ids and declares nested tables once', () => {
            const sql = service.generate(
                [
                    { id: 4, child: { name: "O'Reilly" } },
                    { id: 5, extra: true, child: { name: 'Bob' } },
                ],
                'sql',
            );
            expect(sql.match(/CREATE TABLE "root" /g)).toHaveLength(1);
            expect(sql.match(/CREATE TABLE "root__5_child" /g)).toHaveLength(1);
            expect(sql).toContain('"id" NUMERIC');
            expect(sql).toContain('"extra" BOOLEAN');
            expect(sql).toContain('"_row_id" SERIAL PRIMARY KEY');
            expect(sql).toContain("'O''Reilly'");
            expect(sql).toContain('NULL');
        });
        it('does not collide with user fields named like bookkeeping keys', () => {
            const sql = service.generate({ __row: 10, _row_id: 20 }, 'sql');
            expect(sql).toContain('"_row_id_" SERIAL PRIMARY KEY');
            expect(sql).toContain('10, 20, 1');
        });
    });
    it('includes definitions for array-root TypeScript and Python models', () => {
        expect(service.generate([{ name: 'A' }], 'typescript')).toContain(
            'export interface RootItem',
        );
        expect(service.generate([{ name: 'A' }], 'typescript')).toContain(
            'export type Root = RootItem[]',
        );
        expect(service.generate([{ name: 'A' }], 'python')).toContain('class RootItem(BaseModel)');
    });
    it('uses Python aliases for invalid property names and imports Any', () => {
        const python = service.generate(
            { 'first-name': 'A', class: 1, values: [1, 'x'] },
            'python',
        );
        expect(python).toContain('alias="first-name"');
        expect(python).toContain('alias="class"');
        expect(python).toContain('Any');
    });
    describe('generate - markdown', () => {
        it('should generate Markdown document with tables for nested object arrays', () => {
            const md = service.generate(testObject, 'markdown');
            expect(md).toContain('# Document');
            expect(md).toContain('| **name** | JSON Explorer |');
            expect(md).toContain('## Users');
            expect(md).toContain('| id | name | email |');
            expect(md).toContain('| 1 | Alice |  |');
            expect(md).toContain('| 2 | Bob | bob@example.com |');
        });

        it('should calculate positive LLM token savings when converting JSON to Markdown', () => {
            const jsonStr = JSON.stringify(testObject.users, null, 2);
            const mdStr = service.generate(testObject.users, 'markdown');
            const stats = service.calculateTokenSavings(jsonStr, mdStr);
            expect(stats).toBeTruthy();
            expect(stats!.jsonTokens).toBeGreaterThan(stats!.mdTokens);
            expect(stats!.savedPercent).toBeGreaterThan(0);
        });
    });
});
