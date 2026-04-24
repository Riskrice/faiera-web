import { api } from './api';

interface ApiEnvelope<T> {
  success?: boolean;
  data: T;
  message?: string;
}

interface PaginatedEnvelope<T> {
  success?: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface Permission {
  id: string;
  name: string;
  action: string;
  resource: string;
  description: string;
}

export interface AdminRole {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  permissions: Permission[];
}

export interface AdminUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface AdminUser {
  id: string;
  userId: string;
  user: AdminUserProfile;
  role: AdminRole;
  revokedAt?: string;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  createdAt: string;
  actor?: AdminUserProfile;
  targetUser?: AdminUserProfile;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface CreateAdminPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  roleId: string;
}

export interface AuditQuery {
  page?: number;
  pageSize?: number;
  action?: string;
  resource?: string;
  actorId?: string;
  targetUserId?: string;
}

export interface PaginatedAuditResult {
  logs: AdminAuditLog[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function unwrapData<T>(response: T | ApiEnvelope<T>): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiEnvelope<T>).data;
  }

  return response as T;
}

export async function getRoles() {
  const response = await api.get<ApiEnvelope<AdminRole[]>>('/admin/rbac/roles');
  return unwrapData(response);
}

export async function getPermissions() {
  const response = await api.get<ApiEnvelope<Permission[]>>('/admin/rbac/permissions');
  return unwrapData(response);
}

export async function getAdmins() {
  const response = await api.get<ApiEnvelope<AdminUser[]>>('/admin/rbac/admins');
  return unwrapData(response);
}

export async function checkMyRbacAccess() {
  const response = await api.get<ApiEnvelope<{ hasRbacAccess: boolean; isSuperAdmin: boolean }>>('/admin/rbac/me');
  return unwrapData(response);
}

export async function getAuditLogs(query: AuditQuery = {}): Promise<PaginatedAuditResult> {
  const params = new URLSearchParams();

  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  if (query.action) params.set('action', query.action);
  if (query.resource) params.set('resource', query.resource);
  if (query.actorId) params.set('actorId', query.actorId);
  if (query.targetUserId) params.set('targetUserId', query.targetUserId);

  const endpoint = params.toString() ? `/admin/rbac/audit?${params.toString()}` : '/admin/rbac/audit';
  const response = await api.get<PaginatedEnvelope<AdminAuditLog>>(endpoint);

  return {
    logs: response.data || [],
    page: response.pagination?.page || 1,
    pageSize: response.pagination?.pageSize || 20,
    total: response.pagination?.total || 0,
    totalPages: response.pagination?.totalPages || 0,
  };
}

export async function createRole(data: CreateRolePayload) {
  const response = await api.post<ApiEnvelope<AdminRole>>('/admin/rbac/roles', data);
  return unwrapData(response);
}

export async function updateRole(roleId: string, data: UpdateRolePayload) {
  const response = await api.patch<ApiEnvelope<AdminRole>>(`/admin/rbac/roles/${roleId}`, data);
  return unwrapData(response);
}

export async function deleteRole(roleId: string) {
  return api.delete(`/admin/rbac/roles/${roleId}`);
}

export async function createAdmin(data: CreateAdminPayload) {
  const response = await api.post<ApiEnvelope<AdminUser>>('/admin/rbac/admins', data);
  return unwrapData(response);
}

export async function updateAdminRole(userId: string, roleId: string) {
  const response = await api.patch<ApiEnvelope<AdminUser>>(`/admin/rbac/admins/${userId}/role`, { roleId });
  return unwrapData(response);
}

export async function revokeAdmin(userId: string) {
  const response = await api.delete<ApiEnvelope<AdminUser>>(`/admin/rbac/admins/${userId}`);
  return unwrapData(response);
}

// Backward-compatible alias for old callers.
export async function assignRole(data: { adminId?: string; userId?: string; roleId: string }) {
  const response = await api.post<ApiEnvelope<AdminUser>>('/admin/rbac/assign', data);
  return unwrapData(response);
}
