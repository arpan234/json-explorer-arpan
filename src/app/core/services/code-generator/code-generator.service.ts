import { Injectable } from '@angular/core';

export type CodeLang = 'typescript' | 'go' | 'python' | 'sql';

type SchemaType = 'string' | 'integer' | 'number' | 'boolean' | 'null' | 'array' | 'object' | 'any';

interface Schema {
    type: SchemaType;
    properties?: Record<string, Schema>;
    itemSchema?: Schema;
    optional?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CodeGeneratorService {
    generate(value: unknown, lang: CodeLang): string {
        if (value === undefined) return '';

        const schema = this.inferSchema(value);

        switch (lang) {
            case 'typescript':
                return this.toTypeScript(schema, 'Root');
            case 'go':
                return this.toGo(schema, 'Root');
            case 'python':
                return this.toPython(schema, 'Root');
            case 'sql':
                return this.toSQL(value, 'root');
            default:
                return '';
        }
    }

    private inferSchema(value: unknown): Schema {
        if (value === null) return { type: 'null' };
        if (Array.isArray(value)) {
            if (value.length === 0) return { type: 'array', itemSchema: { type: 'any' } };
            const itemSchemas = value.map((item) => this.inferSchema(item));
            const merged = this.mergeSchemas(itemSchemas);
            return { type: 'array', itemSchema: merged };
        }
        if (typeof value === 'object') {
            const properties: Record<string, Schema> = {};
            for (const [k, v] of Object.entries(value)) {
                properties[k] = this.inferSchema(v);
            }
            return { type: 'object', properties };
        }
        if (typeof value === 'number') {
            return { type: Number.isInteger(value) ? 'integer' : 'number' };
        }
        if (typeof value === 'boolean') return { type: 'boolean' };
        return { type: 'string' };
    }

    private mergeSchemas(schemas: Schema[]): Schema {
        if (schemas.length === 0) return { type: 'null' };
        const first = schemas[0];

        // If they are all of the same type (or null/any mixed in)
        const types = new Set(schemas.map((s) => s.type));
        types.delete('null');
        types.delete('any');

        if (types.size === 0) {
            return { type: 'any' };
        }

        const primaryType = Array.from(types)[0];

        if (types.size === 1) {
            if (primaryType === 'object') {
                const properties: Record<string, Schema> = {};
                const allKeys = new Set<string>();

                for (const s of schemas) {
                    if (s.properties) {
                        Object.keys(s.properties).forEach((k) => allKeys.add(k));
                    }
                }

                for (const key of allKeys) {
                    const keySchemas: Schema[] = [];
                    let missingInSome = false;

                    for (const s of schemas) {
                        if (s.properties && s.properties[key]) {
                            keySchemas.push(s.properties[key]);
                        } else {
                            missingInSome = true;
                        }
                    }

                    const mergedProp = this.mergeSchemas(keySchemas);
                    if (missingInSome) {
                        mergedProp.optional = true;
                    }
                    properties[key] = mergedProp;
                }

                return { type: 'object', properties };
            }

            if (primaryType === 'array') {
                const itemSchemas: Schema[] = [];
                for (const s of schemas) {
                    if (s.itemSchema) itemSchemas.push(s.itemSchema);
                }
                return { type: 'array', itemSchema: this.mergeSchemas(itemSchemas) };
            }

            // Normal primitive type
            const hasNull = schemas.some((s) => s.type === 'null');
            const resultSchema: Schema = { type: primaryType };
            if (hasNull) resultSchema.optional = true;
            return resultSchema;
        }

        // Mixed types fallback to any
        return { type: 'any' };
    }

    // ==========================================
    // TypeScript Generator
    // ==========================================
    private toTypeScript(schema: Schema, rootName: string): string {
        const declarations: string[] = [];
        const generatedNames = new Set<string>();

        const build = (s: Schema, name: string): string => {
            if (s.type === 'object' && s.properties) {
                const interfaceName = this.capitalize(name);
                if (generatedNames.has(interfaceName)) return interfaceName;
                generatedNames.add(interfaceName);

                const fields = Object.entries(s.properties)
                    .map(([k, propSchema]) => {
                        const cleanKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
                        const optionalMarker = propSchema.optional ? '?' : '';
                        const typeName = build(propSchema, name + this.capitalize(k));
                        return `    ${cleanKey}${optionalMarker}: ${typeName};`;
                    })
                    .join('\n');

                declarations.push(`export interface ${interfaceName} {\n${fields}\n}`);
                return interfaceName;
            }

            if (s.type === 'array' && s.itemSchema) {
                const itemType = build(s.itemSchema, this.singularize(name));
                return `${itemType}[]`;
            }

            return this.mapTypeTS(s.type);
        };

        const rootType = build(schema, rootName);

        if (schema.type !== 'object') {
            return `export type ${rootName} = ${rootType};`;
        }

        return declarations.reverse().join('\n\n');
    }

    private mapTypeTS(type: SchemaType): string {
        switch (type) {
            case 'string':
                return 'string';
            case 'integer':
            case 'number':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'null':
            case 'any':
                return 'any';
            default:
                return 'any';
        }
    }

    // ==========================================
    // Go Struct Generator
    // ==========================================
    private toGo(schema: Schema, rootName: string): string {
        const declarations: string[] = [];
        const generatedNames = new Set<string>();

        const build = (s: Schema, name: string): string => {
            if (s.type === 'object' && s.properties) {
                const structName = this.capitalize(name);
                if (generatedNames.has(structName)) return structName;
                generatedNames.add(structName);

                const fields = Object.entries(s.properties)
                    .map(([k, propSchema]) => {
                        const goFieldName = this.capitalize(k.replace(/[^a-zA-Z0-9]/g, ''));
                        const typeName = build(propSchema, name + this.capitalize(k));
                        const pointerMarker = propSchema.optional ? '*' : '';
                        return `    ${goFieldName} ${pointerMarker}${typeName} \`json:"${k}"\``;
                    })
                    .join('\n');

                declarations.push(`type ${structName} struct {\n${fields}\n}`);
                return structName;
            }

            if (s.type === 'array' && s.itemSchema) {
                const itemType = build(s.itemSchema, this.singularize(name));
                return `[]${itemType}`;
            }

            return this.mapTypeGo(s.type);
        };

        const rootType = build(schema, rootName);

        if (schema.type !== 'object') {
            return `type ${rootName} ${rootType}`;
        }

        return `package main\n\n` + declarations.reverse().join('\n\n');
    }

    private mapTypeGo(type: SchemaType): string {
        switch (type) {
            case 'string':
                return 'string';
            case 'integer':
                return 'int';
            case 'number':
                return 'float64';
            case 'boolean':
                return 'bool';
            default:
                return 'interface{}';
        }
    }

    // ==========================================
    // Python Pydantic Generator
    // ==========================================
    private toPython(schema: Schema, rootName: string): string {
        const declarations: string[] = [];
        const generatedNames = new Set<string>();
        let usesList = false;
        let usesOptional = false;

        const build = (s: Schema, name: string): string => {
            if (s.type === 'object' && s.properties) {
                const className = this.capitalize(name);
                if (generatedNames.has(className)) return className;
                generatedNames.add(className);

                const fields = Object.entries(s.properties)
                    .map(([k, propSchema]) => {
                        const pyFieldName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k) ? k : `_${k}`;
                        let typeName = build(propSchema, name + this.capitalize(k));

                        if (propSchema.optional) {
                            usesOptional = true;
                            typeName = `Optional[${typeName}] = None`;
                        }

                        return `    ${pyFieldName}: ${typeName}`;
                    })
                    .join('\n');

                declarations.push(`class ${className}(BaseModel):\n${fields || '    pass'}`);
                return className;
            }

            if (s.type === 'array' && s.itemSchema) {
                usesList = true;
                const itemType = build(s.itemSchema, this.singularize(name));
                return `List[${itemType}]`;
            }

            return this.mapTypePython(s.type);
        };

        const rootType = build(schema, rootName);

        const imports = ['from pydantic import BaseModel'];
        if (usesList || usesOptional) {
            const typingImports: string[] = [];
            if (usesList) typingImports.push('List');
            if (usesOptional) typingImports.push('Optional');
            imports.push(`from typing import ${typingImports.join(', ')}`);
        }

        const importsBlock = imports.join('\n');

        if (schema.type !== 'object') {
            return `${importsBlock}\n\n${rootName} = ${rootType}`;
        }

        return `${importsBlock}\n\n` + declarations.reverse().join('\n\n');
    }

    private mapTypePython(type: SchemaType): string {
        switch (type) {
            case 'string':
                return 'str';
            case 'integer':
                return 'int';
            case 'number':
                return 'float';
            case 'boolean':
                return 'bool';
            default:
                return 'any';
        }
    }

    // ==========================================
    // SQL Table & Insert Generator
    // ==========================================
    private toSQL(value: unknown, tableName: string): string {
        const createTables: string[] = [];
        const inserts: string[] = [];

        const sanitizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9_]/g, '_');

        const process = (val: unknown, name: string, parentIdCol?: string, parentIdVal?: number): void => {
            const cleanTableName = sanitizeName(name);

            if (Array.isArray(val)) {
                if (val.length === 0) return;

                // If it is an array of primitives, we can make a table: id (SERIAL), val_id (FK), value
                if (typeof val[0] !== 'object' || val[0] === null) {
                    const create = `CREATE TABLE ${cleanTableName} (\n` +
                        `    id SERIAL PRIMARY KEY,\n` +
                        `    ${parentIdCol || 'parent_id'} INT,\n` +
                        `    value VARCHAR(255)\n` +
                        `);`;
                    createTables.push(create);

                    val.forEach((item) => {
                        const sqlVal = typeof item === 'string' ? `'${item.replace(/'/g, "''")}'` : String(item);
                        inserts.push(`INSERT INTO ${cleanTableName} (${parentIdCol || 'parent_id'}, value) VALUES (${parentIdVal || 1}, ${sqlVal});`);
                    });
                    return;
                }

                // If it is an array of objects
                const sample = val[0] as Record<string, unknown>;
                const fields = Object.entries(sample)
                    .filter(([_, v]) => typeof v !== 'object' || v === null)
                    .map(([k, v]) => `    ${sanitizeName(k)} ${this.mapTypeSQL(v)}`)
                    .join(',\n');

                const fkField = parentIdCol ? `,\n    ${parentIdCol} INT` : '';

                const create = `CREATE TABLE ${cleanTableName} (\n` +
                    `    id SERIAL PRIMARY KEY${fkField},\n` +
                    `${fields}\n` +
                    `);`;
                createTables.push(create);

                val.forEach((item, index) => {
                    const rowId = index + 1;
                    const itemObj = item as Record<string, unknown>;
                    const columns = Object.entries(itemObj)
                        .filter(([_, v]) => typeof v !== 'object' || v === null)
                        .map(([k]) => sanitizeName(k));

                    if (parentIdCol) columns.unshift(parentIdCol);
                    columns.unshift('id');

                    const values = Object.entries(itemObj)
                        .filter(([_, v]) => typeof v !== 'object' || v === null)
                        .map(([_, v]) => {
                            if (v === null) return 'NULL';
                            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
                            return String(v);
                        });

                    if (parentIdCol) values.unshift(String(parentIdVal || 1));
                    values.unshift(String(rowId));

                    inserts.push(`INSERT INTO ${cleanTableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`);

                    // Process nested arrays/objects in this row
                    Object.entries(itemObj)
                        .filter(([_, v]) => typeof v === 'object' && v !== null)
                        .forEach(([k, v]) => {
                            process(v, `${cleanTableName}_${k}`, `${cleanTableName}_id`, rowId);
                        });
                });

                return;
            }

            if (typeof val === 'object' && val !== null) {
                const obj = val as Record<string, unknown>;
                const fields = Object.entries(obj)
                    .filter(([_, v]) => typeof v !== 'object' || v === null)
                    .map(([k, v]) => `    ${sanitizeName(k)} ${this.mapTypeSQL(v)}`)
                    .join(',\n');

                const fkField = parentIdCol ? `,\n    ${parentIdCol} INT` : '';

                const create = `CREATE TABLE ${cleanTableName} (\n` +
                    `    id SERIAL PRIMARY KEY${fkField},\n` +
                    `${fields}\n` +
                    `);`;
                createTables.push(create);

                const rowId = 1;
                const columns = Object.entries(obj)
                    .filter(([_, v]) => typeof v !== 'object' || v === null)
                    .map(([k]) => sanitizeName(k));
                if (parentIdCol) columns.unshift(parentIdCol);
                columns.unshift('id');

                const values = Object.entries(obj)
                    .filter(([_, v]) => typeof v !== 'object' || v === null)
                    .map(([_, v]) => {
                        if (v === null) return 'NULL';
                        if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
                        return String(v);
                    });
                if (parentIdCol) values.unshift(String(parentIdVal || 1));
                values.unshift(String(rowId));

                inserts.push(`INSERT INTO ${cleanTableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`);

                // Process nested arrays/objects
                Object.entries(obj)
                    .filter(([_, v]) => typeof v === 'object' && v !== null)
                    .forEach(([k, v]) => {
                        process(v, `${cleanTableName}_${k}`, `${cleanTableName}_id`, rowId);
                    });
            }
        };

        process(value, tableName);

        return `-- Tables Definitions\n` +
            createTables.join('\n\n') +
            `\n\n-- Inserts Statements\n` +
            inserts.join('\n');
    }

    private mapTypeSQL(v: unknown): string {
        if (v === null) return 'VARCHAR(255)';
        if (typeof v === 'number') {
            return Number.isInteger(v) ? 'INT' : 'DECIMAL(10, 2)';
        }
        if (typeof v === 'boolean') return 'BOOLEAN';
        return 'VARCHAR(255)';
    }

    // ==========================================
    // Helper Text Utilities
    // ==========================================
    private capitalize(str: string): string {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private singularize(str: string): string {
        if (str.endsWith('ies')) return str.slice(0, -3) + 'y';
        if (str.endsWith('es') && !str.endsWith('ces') && !str.endsWith('ses')) return str.slice(0, -2);
        if (str.endsWith('s') && !str.endsWith('ss')) return str.slice(0, -1);
        return str;
    }
}
