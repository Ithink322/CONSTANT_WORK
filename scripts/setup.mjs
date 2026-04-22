import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

const filesToCopy = [
  ["apps/api/.env.example", "apps/api/.env"],
  ["apps/web/.env.example", "apps/web/.env"]
];

for (const [source, target] of filesToCopy) {
  const sourcePath = path.join(root, source);
  const targetPath = path.join(root, target);

  if (!existsSync(targetPath)) {
    copyFileSync(sourcePath, targetPath);
    console.log(`Created ${target}`);
  } else {
    console.log(`Skipped ${target} (already exists)`);
  }
}

const commands = [
  ["npm", ["run", "build:shared"]],
  ["npm", ["run", "db:generate"]]
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
    cwd: root
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\nSetup complete.");
console.log("Next step: npm run dev");

