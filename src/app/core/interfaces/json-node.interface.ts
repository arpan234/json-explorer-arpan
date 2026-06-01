export type JsonValueType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';

export interface JsonNode {
    key: string;
    value: unknown;
    type: JsonValueType;
    path: string[];
    children?: JsonNode[];
    expanded: boolean;
}
