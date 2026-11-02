import { Component, inject, input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
    CodeGeneratorService,
    CodeLang,
} from '../../../core/services/code-generator/code-generator.service';

const JSON_SAMPLE = '[{"name":"Alice","score":95},{"name":"Bob","score":87}]';
const MD_SAMPLE = '| Name | Score |\n| --- | ---: |\n| Alice | 95 |\n| Bob | 87 |';
interface Guide {
    steps: string[];
    limits: string;
    example: string;
    result: string;
}
const GUIDES: Record<string, Guide> = {
    '': {
        steps: [
            'Paste JSON or open a .json file. Use Repair if the input is malformed.',
            'Choose Tree to explore values, Table to inspect arrays, or Code Gen to convert data.',
            'Copy or download your result. Clear removes the draft saved in this browser.',
        ],
        limits: 'JSON does not support comments or trailing commas. Repair is best effort: review changes before relying on the result. JavaScript number precision applies, so keep large identifiers as strings.',
        example: '{"name":"Alice","active":true}',
        result: '{\n  "name": "Alice",\n  "active": true\n}',
    },
    'json-to-markdown': {
        steps: [
            'Paste a JSON array of objects to create a table, or an object to create a document.',
            'The Code Gen tab opens with Markdown selected. Review the output and copy it.',
            'Open in Markdown Reader to preview the table before using it in a README or documentation.',
        ],
        limits: 'Columns combine keys from every row. Missing and null values become empty cells; nested cell values remain JSON text. This conversion is for readable documentation and is not a lossless JSON backup. Token savings are rough estimates, not measured model token counts.',
        example: JSON_SAMPLE,
        result: '',
    },
    'json-to-typescript': {
        steps: [
            'Paste a representative JSON response, including examples of optional fields.',
            'Review the inferred interfaces in Code Gen with TypeScript selected.',
            'Copy the interfaces into your project and check them with your TypeScript compiler.',
        ],
        limits: 'A sample cannot reveal fields that are absent from every row. Mixed types currently fall back to any. Review nullable values, property names and API requirements before using generated types.',
        example: '{"name":"Alice","active":true}',
        result: '',
    },
    'json-to-python': {
        steps: [
            'Paste a representative JSON object or array.',
            'Review Python Pydantic model definitions in Code Gen.',
            'Copy the code into your project, install Pydantic there and validate representative inputs.',
        ],
        limits: 'Generated models are a starting point for Pydantic v2. A sample does not describe all valid API responses. Review aliases, nullability and validation constraints before production use.',
        example: '{"name":"Alice","active":true}',
        result: '',
    },
    'json-to-go': {
        steps: [
            'Paste a JSON payload with representative field values.',
            'Review Go structs and JSON field tags in Code Gen.',
            'Copy the types into your Go package and test encoding/json decoding with your real data.',
        ],
        limits: 'Numeric types are inferred from sample values. JSON nulls, mixed arrays, unusual key names and optional fields need review. Generated names may need adjustment to your project conventions.',
        example: '{"name":"Alice","active":true}',
        result: '',
    },
    'json-to-sql': {
        steps: [
            'Paste JSON objects or arrays into the input panel.',
            'Review the PostgreSQL table definitions and INSERT drafts in Code Gen.',
            'Check column types, identifiers and relationships in a disposable database before importing.',
        ],
        limits: 'Output targets PostgreSQL syntax, including SERIAL. It does not migrate an existing database or enforce inferred foreign keys. Review numeric precision, text lengths, empty arrays and mixed data types. Never execute unreviewed generated SQL against production.',
        example: JSON_SAMPLE,
        result: '',
    },
    'json-to-csv': {
        steps: [
            'Paste JSON containing an array of objects.',
            'Use the Table tab and select the nested array you want to export.',
            'Choose Copy CSV, then save the text as a .csv file or import it into your spreadsheet.',
        ],
        limits: 'Columns combine the keys found in the selected array. Nested objects remain JSON text in cells. CSV has no type metadata; spreadsheet software may reinterpret dates, identifiers and formulas. Review untrusted content before opening it in a spreadsheet.',
        example: JSON_SAMPLE,
        result: 'name,score\nAlice,95\nBob,87',
    },
    'json-repair': {
        steps: [
            'Paste malformed JSON into the input panel.',
            'Choose Repair to attempt fixes for common syntax mistakes.',
            'Inspect the repaired result and copy or download it once it matches your intended data.',
        ],
        limits: 'Repair can fix common issues such as trailing commas, unquoted keys and single quotes. It cannot reliably infer missing data or the intent of every malformed document. Always compare the repaired values with the source.',
        example: "{name: 'Alice', active: True,}",
        result: '{\n  "name": "Alice",\n  "active": true\n}',
    },
    markdown: {
        steps: [
            'Paste Markdown or open a local .md or .markdown file. The file is read in your browser.',
            'Edit the source and see the live preview. On phones use the Input and Preview tabs.',
            'Format tables, copy rendered HTML, download Markdown, or extract a table into JSON.',
        ],
        limits: 'Supports common Markdown and GitHub Flavored Markdown tables. Relative image paths need an accessible absolute URL. External images can contact their own hosts. Mermaid and mathematical notation are not enabled. Table extraction infers numbers and booleans; use strings when preserving identifiers matters.',
        example: MD_SAMPLE,
        result: 'A two-column table with names and right-aligned scores. Select Preview to see the rendered document, then Extract Table to JSON to convert the rows.',
    },
    'markdown-to-json': {
        steps: [
            'Paste a Markdown pipe table, or a document containing one or more tables.',
            'Select Preview, then choose Extract Table to JSON.',
            'The JSON viewer opens with the converted rows. Inspect values, then copy or download JSON.',
        ],
        limits: 'Headers become object keys. Numbers, true, false and null are inferred; leading zeros in identifiers may be lost. Empty cells become null. Multiple tables produce an array of tables. Complex escaped syntax and tables inside code fences may require cleanup before extraction.',
        example: MD_SAMPLE,
        result: '[\n  {"Name":"Alice","Score":95},\n  {"Name":"Bob","Score":87}\n]',
    },
};

@Component({
    selector: 'app-tool-guide',
    standalone: true,
    imports: [RouterLink],
    template: ` @if (part() === 'intro') {
            <header class="tool-intro">
                <h1>{{ heading }}</h1>
                <a class="privacy-note" routerLink="/privacy">Local processing · Privacy</a>
            </header>
        } @else {
            <section class="tool-guide" aria-label="Tool instructions and examples">
                <p>{{ description }}</p>
                <h2>How to use {{ heading }}</h2>
                <ol>
                    @for (step of guide.steps; track step) {
                        <li>{{ step }}</li>
                    }
                </ol>
                <h2>Example input and output</h2>
                <div class="examples">
                    <div>
                        <h3>Input</h3>
                        <pre><code>{{ guide.example }}</code></pre>
                    </div>
                    <div>
                        <h3>Result</h3>
                        <pre><code>{{ result }}</code></pre>
                    </div>
                </div>
                <h2>Supported data and limitations</h2>
                <p>{{ guide.limits }}</p>
                <h2>Where does my data go?</h2>
                <p>
                    Formatting and conversion run locally in your browser. Your last valid JSON and
                    last Markdown draft are saved on this device so you can restore them. Clear
                    removes the corresponding saved draft. Shared links contain the document: anyone
                    with the link can read it.
                    <a routerLink="/privacy">Read the privacy details</a>.
                </p>
                <nav aria-label="Related tools">
                    <h2>JSON and Markdown tools</h2>
                    <div class="related-tools">
                        @for (tool of tools; track tool.path) {
                            @if (tool.path !== path) {
                                <a [routerLink]="'/' + tool.path">{{ tool.label }}</a>
                            }
                        }
                    </div>
                </nav>
            </section>
        }`,
    styles: [
        `
            :host {
                display: block;
            }
            .tool-intro {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 4px 20px;
                padding: 10px 20px;
                border-bottom: 1px solid var(--mat-sys-outline-variant);
            }
            .tool-intro h1 {
                font-size: 1.05rem;
                margin: 0;
                line-height: 1.4;
                font-weight: 600;
            }
            .privacy-note {
                font-size: 0.75rem;
                white-space: nowrap;
            }
            .tool-guide {
                max-width: 1100px;
                margin: auto;
                padding: 24px;
            }
            .tool-guide {
                line-height: 1.7;
            }
            .tool-guide h2 {
                font-size: 1.2rem;
                margin-top: 28px;
            }
            .tool-guide li {
                margin: 8px 0;
            }
            .examples {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            .examples > div {
                min-width: 0;
            }
            pre {
                padding: 16px;
                background: var(--mat-sys-surface-container-low);
                border: 1px solid var(--mat-sys-outline-variant);
                overflow: auto;
                white-space: pre-wrap;
                overflow-wrap: anywhere;
            }
            a {
                color: var(--mat-sys-primary);
            }
            .related-tools {
                display: flex;
                flex-wrap: wrap;
                gap: 12px 24px;
            }
            @media (max-width: 768px) {
                .examples {
                    grid-template-columns: 1fr;
                }
                .tool-intro {
                    padding: 8px 12px;
                    gap: 2px 12px;
                }
                .tool-intro h1 {
                    font-size: 0.95rem;
                }
                .tool-guide {
                    padding: 20px 16px;
                }
            }
        `,
    ],
})
export class ToolGuideComponent {
    readonly part = input<'intro' | 'guide'>('guide');
    private readonly route = inject(ActivatedRoute);
    private readonly generator = inject(CodeGeneratorService);
    private readonly pageRoute =
        this.route.snapshot.routeConfig?.path === '' &&
        this.route.parent?.snapshot.routeConfig?.path
            ? this.route.parent.snapshot
            : this.route.snapshot;
    readonly path = this.pageRoute.routeConfig?.path ?? '';
    readonly heading = this.pageRoute.data['heading'] ?? 'JSON and Markdown tools';
    readonly description = this.pageRoute.data['subheading'] ?? '';
    readonly guide = GUIDES[this.path] ?? GUIDES[''];
    readonly result = this.exampleResult();
    readonly tools = [
        { path: '', label: 'JSON Formatter and Viewer' },
        { path: 'markdown', label: 'Markdown Viewer and Editor' },
        { path: 'json-to-markdown', label: 'JSON to Markdown' },
        { path: 'markdown-to-json', label: 'Markdown Table to JSON' },
        { path: 'json-to-csv', label: 'JSON to CSV' },
        { path: 'json-repair', label: 'JSON Repair' },
        { path: 'json-to-typescript', label: 'JSON to TypeScript' },
        { path: 'json-to-python', label: 'JSON to Python' },
        { path: 'json-to-go', label: 'JSON to Go' },
        { path: 'json-to-sql', label: 'JSON to SQL' },
    ];
    private exampleResult(): string {
        const lang = this.path.replace('json-to-', '') as CodeLang;
        return this.guide.result || this.generator.generate(JSON.parse(this.guide.example), lang);
    }
}
