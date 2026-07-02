import {
  type AppRole,
  isManagement,
  isProjectManagement,
} from "./roles";

export const canManageWorkers = (role: AppRole): boolean => {
  return isProjectManagement(role);
};

export const canApproveDailyReports = (role: AppRole): boolean => {
  return isProjectManagement(role);
};

export const canManageWorkOrders = (role: AppRole): boolean => {
  return isProjectManagement(role);
};

export const canViewPayroll = (role: AppRole): boolean => {
  return isManagement(role);
};

export const canManageMaterials = (role: AppRole): boolean => {
  return isProjectManagement(role);
};

export const canViewFinancialData = (role: AppRole): boolean => {
  return isManagement(role);
};

export const permission = {
  canManageWorkers,
  canApproveDailyReports,
  canManageWorkOrders,
  canManageMaterials,
  canViewPayroll,
  canViewFinancialData,
};