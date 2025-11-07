export const INCIDENT_TYPE_COLORS: Record<string, string> = {
  DELAY: '#F59E0B',
  QUALITY_ISSUE: '#8B5CF6',
  DAMAGE: '#EF4444',
  LOSS: '#DC2626',
  EXTRA: '#3B82F6',
  MISSING: '#F97316',
  OTHER: '#6B7280',
};

export const INCIDENT_STATUS_COLORS: Record<string, string> = {
  OPEN: '#EF4444',
  PENDING: '#F59E0B',
  IN_PROGRESS: '#3B82F6',
  RESOLVED: '#10B981',
  COMPENSATED: '#0EA5E9',
  CLOSED: '#6B7280',
};

export const getTypeColor = (type: string | null | undefined) => {
  if (!type) {
    return INCIDENT_TYPE_COLORS.OTHER;
  }
  return INCIDENT_TYPE_COLORS[type] || INCIDENT_TYPE_COLORS.OTHER;
};

export const getStatusColor = (status: string | null | undefined) => {
  if (!status) {
    return INCIDENT_STATUS_COLORS.CLOSED;
  }
  return INCIDENT_STATUS_COLORS[status] || INCIDENT_STATUS_COLORS.CLOSED;
};
