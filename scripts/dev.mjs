import { spawn } from "node:child_process";

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

function run(args, name) {
  const p = spawn(npmCmd, args, { stdio: "inherit" });
  p.on("exit", (code) => {
    if (code !== 0) {
      console.error(`[${name}] exited with code`, code);
      process.exit(code);
    }
  });
  return p;
}

// Run server then client
run(["--workspace", "server", "run", "dev"], "server");
run(["--workspace", "client", "run", "dev"], "client");
