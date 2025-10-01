import { existsSync } from 'fs';
import { isAbsolute, resolve } from 'path';

// Resolves proto files from common workspace locations while allowing short proto-relative strings.
const FALLBACK_DIRS = [
  process.cwd(),
  resolve(process.cwd(), 'libs/proto/src'),
  resolve(process.cwd(), 'libs/proto/src/proto'),
  resolve(__dirname, '../..'),
  resolve(__dirname, '../../proto'),
];

export function resolveProtoPath(protoPath: string): string {
  if (!protoPath) {
    throw new Error('protoPath must be provided');
  }

  const sanitized = protoPath.replace(/\\/g, '/');

  if (isAbsolute(sanitized) && existsSync(sanitized)) {
    return sanitized;
  }

  for (const base of FALLBACK_DIRS) {
    const candidate = resolve(base, sanitized);
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return resolve(FALLBACK_DIRS[0], sanitized);
}

export function resolveProtoPaths(protoPaths: string | string[]): string | string[] {
  if (Array.isArray(protoPaths)) {
    return protoPaths.map((path) => resolveProtoPath(path));
  }

  return resolveProtoPath(protoPaths);
}
