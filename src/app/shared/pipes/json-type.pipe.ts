import { Pipe, PipeTransform } from '@angular/core';
import { JsonValueType } from '../../core/interfaces';

@Pipe({ name: 'jsonType' })
export class JsonTypePipe implements PipeTransform {
    transform(type: JsonValueType): string {
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
}
