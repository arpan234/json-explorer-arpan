import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { provideMarkdown } from 'ngx-markdown';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes, withEnabledBlockingInitialNavigation()),
        provideAnimationsAsync(),
        provideMonacoEditor(),
        provideMarkdown(),
    ],
};
