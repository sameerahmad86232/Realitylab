import { spawn } from "node:child_process";
const processes = [
  spawn(
    process.execPath,
    [
      "--use-env-proxy",
      "--use-system-ca",
      "--env-file-if-exists=.env",
      "server/src/index.js",
    ],
    { stdio: "inherit", detached: process.platform !== "win32" },
  ),
  spawn(
    "npm",
    [
      "--prefix",
      "frontend",
      "run",
      "dev",
      "--",
      "--host",
      "0.0.0.0",
      "--port",
      process.env.FRONTEND_PORT || "5173",
      "--strictPort",
    ],
    { stdio: "inherit", detached: process.platform !== "win32" },
  ),
];
let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  processes.forEach((p) => {
    if (!p.pid) return;
    try {
      if (process.platform === "win32") p.kill("SIGTERM");
      else process.kill(-p.pid, "SIGTERM");
    } catch (error) {
      if (error.code !== "ESRCH") process.exitCode = 1;
    }
  });
  process.exitCode = code;
}
processes.forEach((p) => {
  p.on("error", () => stop(1));
  p.on("exit", (code) => stop(code || 0));
});
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
