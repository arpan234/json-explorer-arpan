import { Injectable } from '@angular/core';

export type CodeLang = 'markdown' | 'typescript' | 'go' | 'python' | 'sql';

type SchemaType = 'string' | 'integer' | 'number' | 'boolean' | 'null' | 'array' | 'object' | 'any';

interface Schema {
    type: SchemaType;
    properties?: Record<string, Schema>;
    itemSchema?: Schema;
    optional?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CodeGeneratorService {
    /**
     * Estimates LLM token counts with a rough text-pattern heuristic, not a model tokenizer
     * and calculates token reduction percentage when converting JSON to Markdown.
     */
    calculateTokenSavings(
        jsonText: string,
        markdownText: string,
    ): { jsonTokens: number; mdTokens: number; savedPercent: number } | null {
        if (!jsonText.trim() || !markdownText.trim()) return null;

        const estimateTokens = (text: string): number => {
            const tokens = text.match(/[a-zA-Z0-9_]+|[^\s\w]/g);
            return tokens ? tokens.length : Math.ceil(text.length / 4);
        };

        const jsonTokens = estimateTokens(jsonText);
        const mdTokens = estimateTokens(markdownText);
        if (jsonTokens <= 0) return null;

        const savedPercent = Math.round(((jsonTokens - mdTokens) / jsonTokens) * 100);
        return { jsonTokens, mdTokens, savedPercent };
    }

    generate(value: unknown, lang: CodeLang): string {
        if (value === undefined) return '';

        if (lang === 'markdown') {
            return this.toMarkdown(value, 'Document');
        }

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

    // ==========================================
    // Markdown Document & Table Generator
    // ==========================================
    private toMarkdown(value: unknown, title = 'Document', level = 1): string {
        const headingPrefix = '#'.repeat(Math.min(level, 6));
        const escapeCell = (val: unknown): string => {
            if (val === null || val === undefined) return '';
            const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
            return str.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
        };

        const renderObjectArrayTable = (items: Record<string, unknown>[]): string => {
            const keys = new Set<string>();
            items.forEach((item) => Object.keys(item).forEach((k) => keys.add(k)));
            const cols = Array.from(keys);
            if (cols.length === 0) return '_Empty table_';

            const header = `| ${cols.map((c) => escapeCell(c)).join(' | ')} |`;
            const sep = `| ${cols.map(() => '---').join(' | ')} |`;
            const rows = items.map(
                (item) => `| ${cols.map((c) => escapeCell(item[c])).join(' | ')} |`,
            );
            return [header, sep, ...rows].join('\n');
        };

        if (Array.isArray(value)) {
            if (value.length === 0) return `${headingPrefix} ${title}\n\n_Empty array_`;
            const allObjects = value.every(
                (item) => typeof item === 'object' && item !== null && !Array.isArray(item),
            );
            if (allObjects) {
                const table = renderObjectArrayTable(value as Record<string, unknown>[]);
                return level === 1
                    ? `# ${title}\n\n${table}`
                    : `${headingPrefix} ${title}\n\n${table}`;
            }
            const list = value
                .map((item) =>
                    typeof item === 'object' && item !== null
                        ? `- \`${JSON.stringify(item)}\``
                        : `- ${String(item)}`,
                )
                .join('\n');
            return `${headingPrefix} ${title}\n\n${list}`;
        }

        if (typeof value === 'object' && value !== null) {
            const entries = Object.entries(value as Record<string, unknown>);
            const primitives = entries.filter(([_, v]) => typeof v !== 'object' || v === null);
            const complexes = entries.filter(([_, v]) => typeof v === 'object' && v !== null);

            const sections: string[] = [];
            if (level === 1) {
                sections.push(`# ${title}`);
            } else {
                sections.push(`${headingPrefix} ${title}`);
            }

            if (primitives.length > 0) {
                const propRows = primitives.map(
                    ([k, v]) => `| **${escapeCell(k)}** | ${escapeCell(v)} |`,
                );
                sections.push(['| Property | Value |', '| --- | --- |', ...propRows].join('\n'));
            }

            for (const [k, v] of complexes) {
                const sectionTitle = this.capitalize(k);
                sections.push(this.toMarkdown(v, sectionTitle, level + 1));
            }

            return sections.join('\n\n');
        }

        return `${headingPrefix} ${title}\n\n${String(value)}`;
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
                const interfaceName = this.identifier(name);
                if (generatedNames.has(interfaceName)) return interfaceName;
                generatedNames.add(interfaceName);

                const fields = Object.entries(s.properties)
                    .map(([k, propSchema]) => {
                        const cleanKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k)
                            ? k
                            : JSON.stringify(k);
                        const optionalMarker = propSchema.optional ? '?' : '';
                        const typeName = build(propSchema, name + this.capitalize(k));
                        return `    ${cleanKey}${optionalMarker}: ${typeName};`;
                    })
                    .join('\n');

                declarations.push(`export interface ${interfaceName} {\n${fields}\n}`);
                return interfaceName;
            }

            if (s.type === 'array' && s.itemSchema) {
                const itemType = build(
                    s.itemSchema,
                    name === rootName ? name + 'Item' : this.singularize(name),
                );
                return `${itemType}[]`;
            }

            return this.mapTypeTS(s.type);
        };

        const rootType = build(schema, rootName);

        if (schema.type !== 'object') {
            return [...declarations, `export type ${rootName} = ${rootType};`].join('\n\n');
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
                const structName = this.identifier(name);
                if (generatedNames.has(structName)) return structName;
                generatedNames.add(structName);

                const fields = Object.entries(s.properties)
                    .map(([k, propSchema]) => {
                        const goFieldName =
                            this.identifier(k) +
                            (Object.keys(s.properties!).filter(
                                (key) => this.identifier(key) === this.identifier(k),
                            ).length > 1
                                ? '_' + Object.keys(s.properties!).indexOf(k)
                                : '');
                        const typeName = build(propSchema, name + this.capitalize(k));
                        const pointerMarker = propSchema.optional ? '*' : '';
                        return `    ${goFieldName} ${pointerMarker}${typeName} ${JSON.stringify('json:' + JSON.stringify(k))}`;
                    })
                    .join('\n');

                declarations.push(`type ${structName} struct {\n${fields}\n}`);
                return structName;
            }

            if (s.type === 'array' && s.itemSchema) {
                const itemType = build(
                    s.itemSchema,
                    name === rootName ? name + 'Item' : this.singularize(name),
                );
                return `[]${itemType}`;
            }

            return this.mapTypeGo(s.type);
        };

        const rootType = build(schema, rootName);

        if (schema.type !== 'object') {
            return (
                'package main\n\n' + [...declarations, `type ${rootName} ${rootType}`].join('\n\n')
            );
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
        let usesField = false;
        const pythonKeywords = new Set(
            'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'.split(
                ' ',
            ),
        );

        const build = (s: Schema, name: string): string => {
            if (s.type === 'object' && s.properties) {
                const className = this.identifier(name);
                if (generatedNames.has(className)) return className;
                generatedNames.add(className);

                const fields = Object.entries(s.properties)
                    .map(([k, propSchema]) => {
                        const index = Object.keys(s.properties!).indexOf(k);
                        const needsAlias =
                            !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(k) ||
                            pythonKeywords.has(k) ||
                            k.startsWith('model_') ||
                            ['schema', 'json', 'dict', 'copy', 'validate', 'construct'].includes(k);
                        let pyFieldName = needsAlias ? `field_${index}` : k;
                        if (needsAlias)
                            while (Object.hasOwn(s.properties!, pyFieldName)) pyFieldName += '_';
                        if (needsAlias) usesField = true;
                        let typeName = build(propSchema, name + this.capitalize(k));

                        if (propSchema.optional) {
                            usesOptional = true;
                            typeName = `Optional[${typeName}] = None`;
                        }

                        if (needsAlias) {
                            const optional = propSchema.optional;
                            typeName = typeName.replace(' = None', '');
                            return `    ${pyFieldName}: ${typeName} = Field(${optional ? 'default=None, ' : ''}alias=${JSON.stringify(k)})`;
                        }
                        return `    ${pyFieldName}: ${typeName}`;
                    })
                    .join('\n');

                declarations.push(`class ${className}(BaseModel):\n${fields || '    pass'}`);
                return className;
            }

            if (s.type === 'array' && s.itemSchema) {
                usesList = true;
                const itemType = build(
                    s.itemSchema,
                    name === rootName ? name + 'Item' : this.singularize(name),
                );
                return `List[${itemType}]`;
            }

            return this.mapTypePython(s.type);
        };

        const rootType = build(schema, rootName);

        const imports = [
            'from __future__ import annotations',
            `from pydantic import BaseModel${usesField ? ', Field' : ''}`,
        ];
        if (
            usesList ||
            usesOptional ||
            declarations.join().includes(': Any') ||
            rootType.includes('Any')
        ) {
            const typingImports: string[] = [];
            if (declarations.join().includes('Any') || rootType.includes('Any'))
                typingImports.push('Any');
            if (usesList) typingImports.push('List');
            if (usesOptional) typingImports.push('Optional');
            imports.push(`from typing import ${typingImports.join(', ')}`);
        }

        const importsBlock = imports.join('\n');

        if (schema.type !== 'object') {
            return `${importsBlock}\n\n${declarations.join('\n\n')}\n\n${rootName} = ${rootType}`;
        }

        return `${importsBlock}\n\n` + declarations.join('\n\n');
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
                return 'Any';
        }
    }

    // ==========================================
    // SQL Table & Insert Generator
    // ==========================================
    private toSQL(value: unknown, tableName: string): string {
        // Collect rows first so every table is declared once with all observed columns.
        type Table = { rows: Record<string, unknown>[]; id: string; parent?: string };
        const tables = new Map<string, Table>();
        const rowIds = new WeakMap<object, number>();
        const parentIds = new WeakMap<object, number | undefined>();
        const quote = (name: string) => '"' + name.replace(/"/g, '""') + '"';
        const literal = (value: unknown): string => {
            if (value === null || value === undefined) return 'NULL';
            if (typeof value === 'number' || typeof value === 'boolean') return String(value);
            return "'" + String(value).replace(/'/g, "''") + "'";
        };
        const collect = (data: unknown, name: string, parentId?: number): void => {
            const items = Array.isArray(data) ? data : [data];
            let table = tables.get(name);
            if (!table) {
                table = { rows: [], id: '', parent: parentId === undefined ? undefined : '' };
                tables.set(name, table);
            }
            for (const item of items) {
                const object =
                    item !== null && typeof item === 'object' && !Array.isArray(item)
                        ? (item as Record<string, unknown>)
                        : { value: item };
                const row: Record<string, unknown> = {};
                const rowId = table.rows.length + 1;
                // Synthetic identifiers are assigned after all user columns have been observed.
                rowIds.set(row, rowId);
                parentIds.set(row, parentId);
                for (const [key, val] of Object.entries(object)) {
                    if (val !== null && typeof val === 'object')
                        collect(val, name + '__' + key.length + '_' + key, rowId);
                    else Object.defineProperty(row, key, { value: val, enumerable: true });
                }
                table.rows.push(row);
            }
        };
        collect(value, tableName);
        const definitions: string[] = [];
        const inserts: string[] = [];
        for (const [name, table] of tables) {
            const columns = [...new Set(table.rows.flatMap((row) => Object.keys(row)))];
            const unique = (base: string) => {
                let key = base;
                while (columns.includes(key)) key += '_';
                columns.push(key);
                return key;
            };
            table.id = unique('_row_id');
            const parent = table.parent === undefined ? undefined : unique('_parent_row_id');
            const fields = columns.map((key) => {
                if (key === table.id) return `    ${quote(key)} SERIAL PRIMARY KEY`;
                if (key === parent) return `    ${quote(key)} INT`;
                const values = table.rows
                    .map((row) => row[key])
                    .filter((v) => v !== null && v !== undefined);
                const types = new Set(values.map((v) => typeof v));
                const type =
                    types.size === 1 && types.has('number')
                        ? 'NUMERIC'
                        : types.size === 1 && types.has('boolean')
                          ? 'BOOLEAN'
                          : 'TEXT';
                return `    ${quote(key)} ${type}`;
            });
            definitions.push(`CREATE TABLE ${quote(name)} (\n${fields.join(',\n')}\n);`);
            for (const row of table.rows) {
                const vals = columns.map((key) =>
                    key === table.id
                        ? rowIds.get(row)
                        : key === parent
                          ? parentIds.get(row)
                          : row[key],
                );
                inserts.push(
                    `INSERT INTO ${quote(name)} (${columns.map(quote).join(', ')}) VALUES (${vals.map(literal).join(', ')});`,
                );
            }
        }
        return (
            '-- PostgreSQL draft: review types and relationships before executing.\n-- Tables Definitions\n' +
            definitions.join('\n\n') +
            '\n\n-- Inserts Statements\n' +
            inserts.join('\n')
        );
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
    private identifier(str: string): string {
        const cleaned = str.replace(/[^a-zA-Z0-9_]/g, '_');
        return /^[a-zA-Z]/.test(cleaned) ? this.capitalize(cleaned) : 'Field_' + cleaned;
    }

    private capitalize(str: string): string {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private singularize(str: string): string {
        if (str.endsWith('ies')) return str.slice(0, -3) + 'y';
        if (str.endsWith('es') && !str.endsWith('ces') && !str.endsWith('ses'))
            return str.slice(0, -2);
        if (str.endsWith('s') && !str.endsWith('ss')) return str.slice(0, -1);
        return str;
    }
}
