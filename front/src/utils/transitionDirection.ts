let directionRef = { current: 1 };
let lastPath = "/";
let pendingNextPath: string | null = null;

const routeLevels: Record<string, number> = {
  "/": 0,
  "/calc": 1,
  "/cart": 1,
  "/profile": 1,
};

export function getManualDirection() {
  return directionRef.current;
}

export function setManualDirectionByPath(nextPath: string) {
  const prevLevel = routeLevels[lastPath] ?? 0;
  const nextLevel = routeLevels[nextPath] ?? 0;

  directionRef.current = nextLevel > prevLevel ? 1 : -1;

  pendingNextPath = nextPath;
  console.log("➡️ Direction set", lastPath, "→", nextPath, "=>", directionRef.current);
}

export function confirmPathUpdate() {
  if (pendingNextPath) {
    console.log("✅ Path confirmed:", pendingNextPath);
    lastPath = pendingNextPath;
    pendingNextPath = null;
  }
}
