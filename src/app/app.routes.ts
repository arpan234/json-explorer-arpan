import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        title: 'JSON Formatter & Viewer - json-md-formatter',
        data: {
            description:
                'An interactive online JSON to Markdown formatter, validator, tree viewer, and code generator. Easily format, repair, explore, and convert JSON data to Markdown tables.',
            keywords:
                'json formatter, json viewer, json validator, json to markdown, json repair, json table viewer, online json tools',
        },
        loadComponent: () => import('./pages/viewer/viewer').then((m) => m.ViewerComponent),
    },
    {
        path: 'json',
        redirectTo: '',
        pathMatch: 'full',
    },
    {
        path: 'markdown',
        title: 'Markdown Viewer & Editor - json-md-formatter',
        data: {
            description:
                'Free online Markdown viewer, live split-pane editor, and Markdown table formatter. Preview Markdown in real time, align GFM tables, and extract Markdown tables to JSON.',
            keywords:
                'markdown viewer, markdown editor, markdown preview, format markdown table, markdown table to json, readme previewer, online markdown reader',
        },
        loadComponent: () =>
            import('./pages/markdown-viewer/markdown-viewer').then(
                (m) => m.MarkdownViewerComponent,
            ),
    },
];
