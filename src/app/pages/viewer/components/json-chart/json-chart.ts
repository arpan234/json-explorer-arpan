import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import { JsonNode } from '../../../../core/interfaces';
import { NgxChartsModule } from '@swimlane/ngx-charts';

type ChartType = 'bar' | 'line' | 'pie';

@Component({
    selector: 'app-json-chart',
    standalone: true,
    imports: [NgxChartsModule, MatButtonToggleModule, FormsModule],
    templateUrl: './json-chart.html',
    styleUrl: './json-chart.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonChartComponent {
    readonly data = input.required<JsonNode>();
    readonly chartType = signal<ChartType>('bar');

    readonly numericFields = computed(() => {
        const root = this.data();
        if (root.type !== 'array' || !root.children?.length) return [];

        const fields = new Set<string>();
        for (const child of root.children) {
            if (child.children) {
                for (const gc of child.children) {
                    if (gc.type === 'number') fields.add(gc.key);
                }
            }
        }
        return Array.from(fields);
    });

    readonly selectedField = signal('');

    readonly activeField = computed(() => {
        const selected = this.selectedField();
        const fields = this.numericFields();
        return selected && fields.includes(selected) ? selected : (fields[0] ?? '');
    });

    readonly labelField = computed(() => {
        const root = this.data();
        if (root.type !== 'array' || !root.children?.length) return '';

        const firstChild = root.children[0];
        if (!firstChild.children) return '';

        const stringField = firstChild.children.find((gc) => gc.type === 'string');
        return stringField?.key ?? firstChild.children[0]?.key ?? '';
    });

    readonly chartData = computed(() => {
        const root = this.data();
        const field = this.activeField();
        const label = this.labelField();

        if (!field || root.type !== 'array' || !root.children) return [];

        return root.children
            .filter((child) => child.children)
            .map((child, index) => {
                const nameNode = child.children?.find((gc) => gc.key === label);
                const valueNode = child.children?.find((gc) => gc.key === field);
                return {
                    name: nameNode ? String(nameNode.value) : `Item ${index}`,
                    value: typeof valueNode?.value === 'number' ? valueNode.value : 0,
                };
            });
    });

    onFieldChange(field: string): void {
        this.selectedField.set(field);
    }
}
