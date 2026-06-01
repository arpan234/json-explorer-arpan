import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
    selector: 'app-breadcrumbs',
    standalone: true,
    imports: [],
    templateUrl: './breadcrumbs.html',
    styleUrl: './breadcrumbs.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsComponent {
    readonly path = input<string[]>([]);
}
