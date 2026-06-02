import { JsonValueType } from '../interfaces';

export const TYPE_COLORS: Record<JsonValueType, string> = {
    string: 'var(--type-color-string, #22863a)',
    number: 'var(--type-color-number, #005cc5)',
    boolean: 'var(--type-color-boolean, #e36209)',
    null: 'var(--type-color-null, #6a737d)',
    object: 'var(--type-color-object, #6f42c1)',
    array: 'var(--type-color-array, #6f42c1)',
};

export const ROOT_KEY_COLOR = 'var(--mat-sys-primary, #00f0ff)';
export const NESTED_KEY_COLORS = [
    '#ff79c6', // Neon Pink
    '#50fa7b', // Neon Green
    '#ffb86c', // Neon Orange
    '#bd93f9', // Neon Purple
    '#ff5555', // Neon Red
];

export const getKeyColorByDepth = (depth: number): string => {
    if (depth <= 0) return ROOT_KEY_COLOR;
    return NESTED_KEY_COLORS[(depth - 1) % NESTED_KEY_COLORS.length];
};

export const DEFAULT_MONACO_OPTIONS: Record<string, unknown> = {
    language: 'json',
    theme: 'vs',
    minimap: { enabled: false },
    automaticLayout: true,
    formatOnPaste: true,
    scrollBeyondLastLine: false,
    tabSize: 2,
    wordWrap: 'on',
};

export const VIEW_MODES = ['raw', 'tree', 'table', 'chart', 'codegen'] as const;

export type ViewMode = (typeof VIEW_MODES)[number];
