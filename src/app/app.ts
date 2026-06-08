import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolbarComponent } from './shared/components/toolbar/toolbar';
import { SeoService } from './core/services/seo/seo.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, ToolbarComponent],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    private readonly seoService = inject(SeoService);

    constructor() {
        this.seoService.init();
    }
}
