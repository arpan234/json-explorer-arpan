import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'privacy',
        title: 'Privacy and Saved Drafts | JSON & Markdown Formatter',
        data: {
            description:
                'How local processing, browser drafts and document share links work in JSON & Markdown Formatter.',
        },
        loadComponent: () => import('./pages/info/info').then((m) => m.InfoComponent),
    },
    {
        path: 'about',
        title: 'About | JSON & Markdown Formatter',
        data: {
            description:
                'Free browser tools for JSON, Markdown, CSV and sample code generation. Source code, limitations and feedback.',
        },
        loadComponent: () => import('./pages/info/info').then((m) => m.InfoComponent),
    },
    {
        path: '',
        title: 'JSON Formatter & Viewer - json-md-formatter',
        data: {
            description:
                'An interactive online JSON to Markdown formatter, validator, tree viewer, and code generator. Easily format, repair, explore, and convert JSON data to Markdown tables.',
            heading: 'JSON Formatter, Validator and Viewer',
            subheading:
                'An interactive online suite for formatting, validating, and exploring JSON, as well as converting JSON structures into clean Markdown tables, TypeScript interfaces, SQL queries, and charts.',
        },
        loadChildren: () => import('./pages/viewer/viewer.routes').then((m) => m.viewerRoutes),
    },
    {
        path: 'json',
        redirectTo: '',
        pathMatch: 'full',
    },
    {
        path: 'json-to-markdown',
        title: 'JSON to Markdown Table Converter Online - json-md-formatter',
        data: {
            defaultTab: 'codegen',
            defaultLang: 'markdown',
            description:
                'Convert JSON arrays and objects into GitHub-Flavored Markdown (GFM) tables and structured documentation instantly. Create readable tables for documentation and AI prompts in your browser.',
            heading: 'JSON to Markdown Table & Document Converter',
            subheading:
                'Transform verbose JSON payloads and arrays of objects into clean GitHub-Flavored Markdown tables and documentation—ideal for READMEs, Notion, and saving LLM prompt tokens.',
        },
        loadChildren: () => import('./pages/viewer/viewer.routes').then((m) => m.viewerRoutes),
    },
    {
        path: 'json-to-typescript',
        title: 'JSON to TypeScript Interface Generator Online - json-md-formatter',
        data: {
            defaultTab: 'codegen',
            defaultLang: 'typescript',
            description:
                'Generate clean, strongly-typed TypeScript interfaces from any JSON object or array automatically. Supports nested objects, optional fields, and mixed data types client-side.',
            heading: 'JSON to TypeScript Interface Generator',
            subheading:
                'Paste any JSON response payload to infer schemas and generate strongly-typed TypeScript interfaces with automatic optional property detection.',
        },
        loadChildren: () => import('./pages/viewer/viewer.routes').then((m) => m.viewerRoutes),
    },
    {
        path: 'json-to-python',
        title: 'JSON to Python Pydantic Model Generator - json-md-formatter',
        data: {
            defaultTab: 'codegen',
            defaultLang: 'python',
            description:
                'Convert JSON objects and arrays into Python Pydantic BaseModel classes with type hints, Optional fields, and List annotations in one click.',
            heading: 'JSON to Python Pydantic Model Generator',
            subheading:
                'Automatically convert raw JSON payloads into ready-to-use Python Pydantic BaseModel classes with full typing imports.',
        },
        loadChildren: () => import('./pages/viewer/viewer.routes').then((m) => m.viewerRoutes),
    },
    {
        path: 'json-to-go',
        title: 'JSON to Go Struct Generator Online - json-md-formatter',
        data: {
            defaultTab: 'codegen',
            defaultLang: 'go',
            description:
                'Convert JSON into Golang struct definitions with accurate json struct tags, nested types, and pointer fields for optional properties.',
            heading: 'JSON to Go Struct Generator',
            subheading:
                'Generate idiomatic Go structs with `json:"..."` tags and nested struct definitions directly from your JSON sample data.',
        },
        loadChildren: () => import('./pages/viewer/viewer.routes').then((m) => m.viewerRoutes),
    },
    {
        path: 'json-to-sql',
        title: 'JSON to SQL CREATE TABLE & INSERT Generator - json-md-formatter',
        data: {
            defaultTab: 'codegen',
            defaultLang: 'sql',
            description:
                'Convert JSON objects and nested arrays into relational SQL CREATE TABLE schemas and INSERT INTO statements automatically in your browser.',
            heading: 'JSON to SQL Schema & INSERT Generator',
            subheading:
                'Turn nested JSON arrays and objects into SQL CREATE TABLE and INSERT drafts for review before importing.',
        },
        loadChildren: () => import('./pages/viewer/viewer.routes').then((m) => m.viewerRoutes),
    },
    {
        path: 'json-to-csv',
        title: 'JSON to CSV & Interactive Table Viewer - json-md-formatter',
        data: {
            defaultTab: 'table',
            description:
                'View JSON arrays as an interactive, sortable data table and export to CSV or GitHub-Flavored Markdown tables in one click. Supports nested JSON arrays.',
            heading: 'JSON to CSV & Interactive Table Explorer',
            subheading:
                'Auto-discover nested arrays of objects in your JSON payload, sort and paginate rows, and export directly to CSV or Markdown tables.',
        },
        loadChildren: () => import('./pages/viewer/viewer.routes').then((m) => m.viewerRoutes),
    },
    {
        path: 'json-repair',
        title: 'Online JSON Repair & Fixer Tool - Fix Broken JSON',
        data: {
            defaultTab: 'tree',
            description:
                'Automatically repair broken or malformed JSON online. Fix unquoted keys, single quotes, trailing commas, Python True/False/None literals, comments, and escaped JSON strings.',
            heading: 'Online JSON Repair & Validator Tool',
            subheading:
                'Fix malformed JSON payloads—including unquoted keys, single quotes, trailing commas, JS comments, Python booleans, and stringified JSON—with one click.',
        },
        loadChildren: () => import('./pages/viewer/viewer.routes').then((m) => m.viewerRoutes),
    },
    {
        path: 'markdown',
        title: 'Free Online Markdown Viewer & Editor | Live .md Preview',
        data: {
            description:
                'Free online Markdown viewer, live split-pane editor, and Markdown table formatter. Preview Markdown in real time, align GFM tables, and extract Markdown tables to JSON.',
            heading: 'Free Online Markdown Viewer and Editor',
            subheading:
                'Read, preview, and format Markdown files in real-time with a split-pane editor, GFM table alignment, live document stats, and one-click table extraction to JSON.',
        },
        loadComponent: () =>
            import('./pages/markdown-viewer/markdown-viewer').then(
                (m) => m.MarkdownViewerComponent,
            ),
    },
    {
        path: 'markdown-to-json',
        title: 'Markdown Table to JSON Converter Online - json-md-formatter',
        data: {
            description:
                'Extract and convert GitHub-Flavored Markdown (GFM) pipe tables into structured, typed JSON arrays instantly in your browser.',
            heading: 'Markdown Table to JSON Converter',
            subheading:
                'Paste any Markdown document or GFM pipe table on the left and click "Extract Table to JSON" to convert rows into typed JSON objects automatically.',
        },
        loadComponent: () =>
            import('./pages/markdown-viewer/markdown-viewer').then(
                (m) => m.MarkdownViewerComponent,
            ),
    },
];
