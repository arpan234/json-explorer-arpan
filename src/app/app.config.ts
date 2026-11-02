import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { provideMarkdown } from 'ngx-markdown';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideHttpClient(withFetch()),
        provideRouter(routes),
        provideAnimationsAsync(),
        provideMonacoEditor(),
        provideMarkdown(),
        provideClientHydration(withEventReplay()),
    ],
};
