// @effect-diagnostics nodeBuiltinImport:off globalConsole:off - wraps the desktop build and verifies the macOS bundle.
// Builds the standalone macOS enhancer app from this checkout, then verifies its
// bundle identifier and code signature.
//
//   node scripts/build-macos-enhancer.ts <output-directory>
//
// The build produces T3 Code Enhancer.app in <output-directory>/mac-arm64.
import * as NodeChildProcess from "node:child_process";
import * as NodePath from "node:path";
import * as NodeURL from "node:url";

import * as HostProcess from "@t3tools/shared/HostProcess";

import {
  DESKTOP_ENHANCER_APP_ID,
  DESKTOP_ENHANCER_NAME,
} from "../apps/desktop/src/app/DesktopEnhancer.ts";

const repoRoot = NodePath.resolve(
  NodePath.dirname(NodeURL.fileURLToPath(import.meta.url)),
  "..",
);

function main(): void {
  const [outputPath, extra] = process.argv.slice(2);
  if (!outputPath || extra) {
    throw new Error("用法：node scripts/build-macos-enhancer.ts <输出目录>");
  }
  const platform = HostProcess.Platform.defaultValue();
  const architecture = HostProcess.Architecture.defaultValue();
  if (platform !== "darwin" || architecture !== "arm64") {
    throw new Error("此构建入口支持 Apple 芯片上的 macOS。");
  }
  const output = NodePath.resolve(outputPath);
  NodeChildProcess.execFileSync(
    process.execPath,
    [
      "scripts/build-desktop-artifact.ts",
      "--platform",
      "mac",
      "--arch",
      "arm64",
      "--target",
      "dir",
      "--output-dir",
      output,
    ],
    { cwd: repoRoot, stdio: "inherit" },
  );

  const app = NodePath.join(output, "mac-arm64", `${DESKTOP_ENHANCER_NAME}.app`);
  const appId = NodeChildProcess.execFileSync(
    "/usr/libexec/PlistBuddy",
    ["-c", "Print CFBundleIdentifier", NodePath.join(app, "Contents", "Info.plist")],
    { encoding: "utf8" },
  ).trim();
  if (appId !== DESKTOP_ENHANCER_APP_ID) {
    throw new Error(`不匹配的应用标识：${appId}`);
  }
  NodeChildProcess.execFileSync("/usr/bin/codesign", ["--verify", "--deep", "--strict", app], {
    stdio: "inherit",
  });
  console.log(app);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
