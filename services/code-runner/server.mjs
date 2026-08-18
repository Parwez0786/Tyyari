import http from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const PORT = Number(process.env.PORT || 2000);
const TIMEOUT_MS = Number(process.env.RUNNER_TIMEOUT_MS || 30000);
const MAX_FILES = 50;
const MAX_FILE_BYTES = 1_000_000;

const RUNTIMES = [
  { language: "java", version: "21.0.0", aliases: [] },
  { language: "python", version: "3.12.0", aliases: ["py", "python3"] },
  { language: "cpp", version: "13.0.0", aliases: ["c++", "cxx"] },
];

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  try {
    if (req.method === "GET" && req.url?.startsWith("/api/v2/runtimes")) {
      return json(res, 200, RUNTIMES);
    }
    if (req.method === "POST" && req.url?.startsWith("/api/v2/execute")) {
      const body = await readJson(req);
      const result = await execute(body);
      return json(res, 200, result);
    }
    json(res, 404, { message: "Not found" });
  } catch (err) {
    json(res, err.status || 400, { message: err.message || "Runner error" });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`tyyari-runner listening on ${PORT}`);
});

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 8_000_000) {
        reject(Object.assign(new Error("Payload too large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(Object.assign(new Error("Invalid JSON"), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

async function execute(body) {
  const language = String(body.language || "").toLowerCase();
  const files = Array.isArray(body.files) ? body.files : [];
  if (!files.length) throw Object.assign(new Error("files is required"), { status: 400 });
  if (files.length > MAX_FILES) throw Object.assign(new Error("Too many files"), { status: 400 });
  const safe = files.map((file, index) => {
    const name = safeName(file.name || `file${index}`);
    const content = String(file.content ?? "");
    if (Buffer.byteLength(content, "utf8") > MAX_FILE_BYTES) {
      throw Object.assign(new Error(`${name} is too large`), { status: 400 });
    }
    return { name, content };
  });
  const stdin = String(body.stdin || "");
  const dir = await mkdtemp(path.join(tmpdir(), "tyyari-"));
  try {
    for (const file of safe) {
      const full = path.join(dir, file.name);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, file.content);
    }
    if (language === "java") return await runJava(dir, safe, stdin);
    if (language === "python" || language === "python3" || language === "py") {
      return { language: "python", version: "3.12.0", run: await runCmd(dir, ["python3", safe[0].name], stdin) };
    }
    if (language === "cpp" || language === "c++") {
      return await runCpp(dir, safe, stdin);
    }
    throw Object.assign(new Error("Supported languages are Java, Python, and C++"), { status: 400 });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function runJava(dir, files, stdin) {
  const sources = files.filter((file) => file.name.endsWith(".java")).map((file) => file.name);
  if (!sources.length) throw Object.assign(new Error("No .java files"), { status: 400 });
  const compile = await runCmd(dir, ["javac", ...sources], "");
  if (compile.code) {
    return { language: "java", version: "21.0.0", compile, run: emptyResult() };
  }
  const run = await runCmd(dir, javaCommand(files), stdin);
  return { language: "java", version: "21.0.0", compile, run };
}

async function runCpp(dir, files, stdin) {
  const sources = files.filter((file) => /\.(cpp|cc|cxx)$/i.test(file.name)).map((file) => file.name);
  if (!sources.length) throw Object.assign(new Error("No C++ files"), { status: 400 });
  const compile = await runCmd(dir, ["g++", "-std=c++17", "-O0", "-I.", "-o", "main", ...sources], "");
  if (compile.code) {
    return { language: "cpp", version: "13.0.0", compile, run: emptyResult() };
  }
  const run = await runCmd(dir, ["./main"], stdin);
  return { language: "cpp", version: "13.0.0", compile, run };
}

function runCmd(cwd, argv, stdin) {
  return new Promise((resolve) => {
    const child = spawn(argv[0], argv.slice(1), {
      cwd,
      env: {
        PATH: process.env.PATH,
        HOME: cwd,
        LANG: "C.UTF-8",
        JAVA_HOME: process.env.JAVA_HOME || "",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const cap = (buf, next) => {
      const value = buf + next;
      return value.length > 200_000 ? `${value.slice(0, 200_000)}\n…truncated` : value;
    };
    child.stdout.on("data", (chunk) => {
      stdout = cap(stdout, chunk.toString());
    });
    child.stderr.on("data", (chunk) => {
      stderr = cap(stderr, chunk.toString());
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
    }, TIMEOUT_MS);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        output: stdout || stderr,
        code: code ?? 1,
        signal: signal || null,
        message: signal === "SIGKILL" ? "Time limit exceeded" : null,
        status: signal === "SIGKILL" ? "TO" : code ? "RE" : null,
      });
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        stdout: "",
        stderr: err.message,
        output: err.message,
        code: 1,
        signal: null,
        message: err.message,
        status: "XX",
      });
    });
    if (stdin) child.stdin.write(stdin);
    child.stdin.end();
  });
}

function safeName(name) {
  const parts = String(name).replace(/\\/g, "/").split("/").filter((part) => part && part !== "." && part !== "..");
  if (!parts.length) {
    throw Object.assign(new Error("Invalid file name"), { status: 400 });
  }
  const cleaned = parts.map((part) => part.replace(/[^\w.\-]/g, "")).filter(Boolean);
  if (!cleaned.length || cleaned.length !== parts.length) {
    throw Object.assign(new Error("Invalid file name"), { status: 400 });
  }
  return cleaned.join("/");
}

function javaCommand(files) {
  const withMain = files.find((file) => file.name.endsWith(".java") && /public\s+static\s+void\s+main\s*\(/.test(file.content || ""));
  const file = withMain || files.find((file) => /(^|\/)Main\.java$/.test(file.name)) || files.find((file) => file.name.endsWith(".java"));
  const pkg = (file?.content || "").match(/package\s+([\w.]+)\s*;/)?.[1];
  const cls = classFromName(file?.name || "Main.java");
  if (pkg) return ["java", "-cp", ".", `${pkg}.${cls}`];
  const dir = path.posix.dirname(file.name.replace(/\\/g, "/"));
  return ["java", "-cp", dir === "." ? "." : dir, cls];
}

function classFromName(name) {
  return name.replace(/\\/g, "/").split("/").pop().replace(/\.java$/i, "");
}

function emptyResult() {
  return { stdout: "", stderr: "", output: "", code: 1, signal: null, message: null, status: "RE" };
}
