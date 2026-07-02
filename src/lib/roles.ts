export type AppRole =
  | "admin"
  | "manager"
  | "project_manager"
  | "site_supervisor"
  | "worker"
  | "viewer";

export const normalizeAppRole = (role: unknown): AppRole => {
  if (
    role === "admin" ||
    role === "manager" ||
    role === "project_manager" ||
    role === "site_supervisor" ||
    role === "worker" ||
    role === "viewer"
  ) {
    return role;
  }

  return "viewer";
};

export const isAdmin = (role: AppRole): boolean => {
  return role === "admin";
};

export const isManagement = (role: AppRole): boolean => {
  return role === "admin" || role === "manager";
};

export const isProjectManagement = (role: AppRole): boolean => {
  return (
    role === "admin" ||
    role === "manager" ||
    role === "project_manager" ||
    role === "site_supervisor"
  );
};

export const isWorker = (role: AppRole): boolean => {
  return role === "worker";
};