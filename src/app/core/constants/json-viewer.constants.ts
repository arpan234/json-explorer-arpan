import { JsonValueType } from '../interfaces';

export const TYPE_COLORS: Record<JsonValueType, string> = {
    string: '#22863a',
    number: '#005cc5',
    boolean: '#e36209',
    null: '#6a737d',
    object: '#6f42c1',
    array: '#6f42c1',
};

export const ROOT_KEY_COLOR = '#fdd835';
export const NESTED_KEY_COLORS = ['#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#e53935'];

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

export const VIEW_MODES = ['raw', 'tree', 'table', 'chart'] as const;

export type ViewMode = (typeof VIEW_MODES)[number];
