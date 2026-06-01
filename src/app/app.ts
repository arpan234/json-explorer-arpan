import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolbarComponent } from './shared/components/toolbar/toolbar';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, ToolbarComponent],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {}
