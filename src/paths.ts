import * as path from 'path';

export function basePath(...segments: string[]): string {
    return path.resolve(__dirname, '..', ...segments);
}

export function configPath(...segments: string[]): string {
    return basePath('config', ...segments);
}
