import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'json',
        pathMatch: 'full',
    },
    {
        path: 'json',
        title: 'JSON Formatter & Viewer - json-md-formatter',
        loadComponent: () => import('./pages/viewer/viewer').then((m) => m.ViewerComponent),
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
