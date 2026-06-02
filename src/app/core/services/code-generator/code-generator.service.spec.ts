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
            expect(code).toContain('Name string `json:"name"`');
            expect(code).toContain('Active bool `json:"active"`');
            expect(code).toContain('Count int `json:"count"`');
            expect(code).toContain('Rating float64 `json:"rating"`');
            expect(code).toContain('Config RootConfig `json:"config"`');
            expect(code).toContain('Users []RootUser `json:"users"`');
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
        it('should generate valid SQL CREATE TABLE and INSERT statements', () => {
            const code = service.generate(testObject, 'sql');
            expect(code).toContain('-- Tables Definitions');
            expect(code).toContain('CREATE TABLE root (');
            expect(code).toContain('name VARCHAR(255)');
            expect(code).toContain('active BOOLEAN');
            expect(code).toContain('count INT');
            expect(code).toContain('rating DECIMAL(10, 2)');
            expect(code).toContain('CREATE TABLE root_config (');
            expect(code).toContain('CREATE TABLE root_users (');
            expect(code).toContain('-- Inserts Statements');
            expect(code).toContain('INSERT INTO root (');
            expect(code).toContain("VALUES (1, 'JSON Explorer', '1.0.0', true, 5, 4.8);");
            expect(code).toContain('INSERT INTO root_config (');
            expect(code).toContain('INSERT INTO root_users (');
        });
    });
});
