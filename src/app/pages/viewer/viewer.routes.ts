import { Routes } from '@angular/router';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
export const viewerRoutes: Routes = [
    {
        path: '',
        providers: [provideMonacoEditor()],
        loadComponent: () => import('./viewer').then((m) => m.ViewerComponent),
    },
];
