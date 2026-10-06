import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readExecutionProfile } from "./execution-profile.mjs";

const [command, ...args] = process.argv.slice(2);
if (!["dev", "build"].includes(command)) throw new Error("Expected dev or build.");
const managedLinux = readExecutionProfile() === "managed-linux";

if (managedLinux && command === "build") {
  const result = spawnSync("bash", [
    fileURLToPath(new URL("./build-verified.sh", import.meta.url)), ...args,
  ], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

// Import in this process so the preview owner retains its PID and signals.
const cli = new URL(managedLinux
  ? "../node_modules/vite/bin/vite.js"
  : "../node_modules/vinext/dist/cli.js", import.meta.url);
const hasPortArg = args.includes("--port") || args.includes("-p") || args.some(a => a.startsWith("--port="));
const hasHostArg = args.includes("--host") || args.includes("-H") || args.some(a => a.startsWith("--host="));
const defaultPort = process.env.PORT || "4000";
process.argv = [process.execPath, fileURLToPath(cli), command,
  ...(!managedLinux && command === "dev" && !hasPortArg ? ["--port", defaultPort] : []),
  ...(!managedLinux && command === "dev" && !hasHostArg ? ["--host", "0.0.0.0"] : []),
  ...args];
await import(cli.href);
