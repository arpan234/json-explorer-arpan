import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'json',
        pathMatch: 'full',
    },
    {
        path: 'json',
        loadComponent: () => import('./pages/viewer/viewer').then((m) => m.ViewerComponent),
    },
    {
        path: 'markdown',
        loadComponent: () =>
            import('./pages/markdown-viewer/markdown-viewer').then(
                (m) => m.MarkdownViewerComponent,
            ),
    },
];
