const { spawn } = require("node:child_process");
const { join } = require("node:path");

const yarnPath = join(process.cwd(), ".yarn", "releases", "yarn-4.6.0.cjs");
const vitePath = join(process.cwd(), "node_modules", "vite", "bin", "vite.js");
// StackBlitz's automatic installer ignores yarnPath and invokes Yarn 1.
// Run the committed release directly so the fixed branch can use `patch:`.
const installer = spawn(process.execPath, [yarnPath, "install"], {
  stdio: ["inherit", "pipe", "pipe"],
});

let devServerStarted = false;
let installerOutput = "";

function startDevServer() {
  if (devServerStarted) {
    return;
  }

  devServerStarted = true;
  process.stdout.write("\nStarting Vite after Yarn completed linking.\n");

  const devServer = spawn(process.execPath, [vitePath, "--host", "0.0.0.0"], {
    stdio: "inherit",
  });

  devServer.on("exit", (code) => {
    process.exitCode = code ?? 0;
  });
}

function forwardInstallerOutput(chunk, destination) {
  destination.write(chunk);
  installerOutput = `${installerOutput}${chunk.toString()}`.slice(-2048);

  if (installerOutput.includes("Done in")) {
    startDevServer();
  }
}

installer.stdout.on("data", (chunk) => {
  forwardInstallerOutput(chunk, process.stdout);
});

installer.stderr.on("data", (chunk) => {
  forwardInstallerOutput(chunk, process.stderr);
});

installer.on("exit", (code) => {
  if (code === 0) {
    startDevServer();
  } else {
    process.exitCode = code ?? 1;
  }
});
