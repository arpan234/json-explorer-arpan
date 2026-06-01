import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { JsonTableComponent } from './json-table';
import { JsonParserService } from '../../../../core/services/json-parser/json-parser.service';

describe('JsonTableComponent', () => {
    let parserService: JsonParserService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [JsonTableComponent],
            providers: [provideAnimationsAsync()],
        }).compileComponents();
        parserService = TestBed.inject(JsonParserService);
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(JsonTableComponent);
        const data = parserService.parse('[{"name":"A","val":1}]').data!;
        fixture.componentRef.setInput('data', data);
        fixture.detectChanges();
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should detect columns from array of objects', () => {
        const fixture = TestBed.createComponent(JsonTableComponent);
        const data = parserService.parse('[{"name":"A","val":1},{"name":"B","val":2}]').data!;
        fixture.componentRef.setInput('data', data);
        fixture.detectChanges();
        expect(fixture.componentInstance.columns()).toEqual(['name', 'val']);
    });

    it('should format null values', () => {
        const fixture = TestBed.createComponent(JsonTableComponent);
        const data = parserService.parse('[{"a":null}]').data!;
        fixture.componentRef.setInput('data', data);
        fixture.detectChanges();
        expect(fixture.componentInstance.formatCell(null)).toBe('null');
    });
});
