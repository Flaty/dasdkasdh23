import { createMemoryHistory, type MemoryHistory } from "history";

// === стек переходов ===
let pathStack: string[] = [window.location.pathname];

export function pushPath(path: string) {
  const current = pathStack[pathStack.length - 1];
  if (current !== path) pathStack.push(path);
}

export function popPath(): string {
  return pathStack.pop() || "/";
}

export function getPreviousPath(): string {
  return pathStack[pathStack.length - 2] || "/";
}

export function getCurrentPath(): string {
  return pathStack[pathStack.length - 1] || "/";
}

export function resetPathStack(initialPath = "/") {
  pathStack = [initialPath];
}

// === кастомный history ===
const isTg = typeof window !== "undefined" && !!window.Telegram?.WebApp;
const isDev = import.meta.env.MODE === "development";

// ✅ типизированно как MemoryHistory, чтобы не ругался HistoryRouter
export const customHistory: MemoryHistory = (isTg || isDev)
  ? createMemoryHistory({
      initialEntries: [window.location.pathname],
      initialIndex: 0,
    })
  : (() => {
      throw new Error("BrowserHistory не поддерживается. Тестируй через dev или Telegram.");
    })();
