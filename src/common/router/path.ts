// 合并 controller 前缀和方法路径，例如 /users + / => /users。
export function combinePaths(prefix: string, path: string) {
  const fullPath = `${normalizePath(prefix)}${normalizePath(path)}`;
  return fullPath || "/";
}

// 统一路径格式，避免重复斜杠或末尾斜杠导致路由不一致。
export function normalizePath(path: string) {
  if (!path || path === "/") {
    return "";
  }

  return `/${path}`.replace(/\/+/g, "/").replace(/\/$/, "");
}
