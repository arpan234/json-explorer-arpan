import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { JsonChartComponent } from './json-chart';
import { JsonParserService } from '../../../../core/services/json-parser/json-parser.service';

describe('JsonChartComponent', () => {
    let parserService: JsonParserService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [JsonChartComponent],
            providers: [provideAnimationsAsync()],
        }).compileComponents();
        parserService = TestBed.inject(JsonParserService);
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(JsonChartComponent);
        const data = parserService.parse('[{"name":"A","score":90}]').data!;
        fixture.componentRef.setInput('data', data);
        fixture.detectChanges();
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should detect numeric fields', () => {
        const fixture = TestBed.createComponent(JsonChartComponent);
        const data = parserService.parse('[{"name":"A","score":90,"rank":1}]').data!;
        fixture.componentRef.setInput('data', data);
        fixture.detectChanges();
        expect(fixture.componentInstance.numericFields()).toEqual(['score', 'rank']);
    });

    it('should build chart data', () => {
        const fixture = TestBed.createComponent(JsonChartComponent);
        const data = parserService.parse('[{"name":"A","score":90},{"name":"B","score":80}]').data!;
        fixture.componentRef.setInput('data', data);
        fixture.detectChanges();
        const chartData = fixture.componentInstance.chartData();
        expect(chartData).toHaveLength(2);
        expect(chartData[0]).toEqual({ name: 'A', value: 90 });
    });
});
