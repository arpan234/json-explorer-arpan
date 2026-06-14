import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        title: 'JSON Formatter & Viewer - json-md-formatter',
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
        loadComponent: () =>
            import('./pages/markdown-viewer/markdown-viewer').then(
                (m) => m.MarkdownViewerComponent,
            ),
    },
];
