import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export type PermissionType = string | { resource: string; action: string };
export const Permissions = (...permissions: PermissionType[]) => SetMetadata(PERMISSIONS_KEY, permissions);