import { spawn } from "node:child_process";

const root = process.cwd();
const children = [];

function start(name, args) {
  const child = spawn("npm", args, {
    cwd: root,
    stdio: "inherit",
    shell: true
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
      shutdown(code);
    }
  });

  children.push(child);
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

start("api", ["run", "dev:api"]);
start("web", ["run", "dev:web"]);

