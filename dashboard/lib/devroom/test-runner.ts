import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const exec = promisify(execFile);

export interface TestRunResult {
  pass: boolean;
  lintPass: boolean;
  testPass: boolean;
  output: string;
}

const TEST_AGENTS = new Set(["FORGE", "SHIELD", "CORE", "PIXEL"]);

export function shouldRunTests(codename: string): boolean {
  return TEST_AGENTS.has(codename.toUpperCase());
}

export async function runSandboxTests(cwd: string): Promise<TestRunResult> {
  const parts: string[] = [];
  let testPass = true;
  let lintPass = true;

  const pkg = path.join(cwd, "package.json");
  try {
    await exec("npm", ["run", "lint", "--if-present"], { cwd, timeout: 120_000, maxBuffer: 512_000 });
    parts.push("lint: pass");
  } catch (e) {
    lintPass = false;
    const msg = e instanceof Error ? e.message : String(e);
    parts.push(`lint: fail — ${msg.slice(0, 400)}`);
  }

  try {
    await exec("npm", ["test", "--if-present", "--", "--passWithNoTests"], {
      cwd,
      timeout: 180_000,
      maxBuffer: 512_000,
    });
    parts.push("test: pass");
  } catch (e) {
    testPass = false;
    const msg = e instanceof Error ? e.message : String(e);
    parts.push(`test: fail — ${msg.slice(0, 400)}`);
  }

  return {
    pass: testPass && lintPass,
    lintPass,
    testPass,
    output: parts.join("\n"),
  };
}
