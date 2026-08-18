export function formatOutput(output) {
  if (!output) return { text: "Run code with ⌘/Ctrl + Enter.", tone: "text-mute" };
  if (output.status === "running") return { text: "Running…", tone: "text-mute" };
  if (output.status === "error") return { text: output.message, tone: "text-rose-400" };
  const compile = output.data?.compile;
  const run = output.data?.run;
  const parts = [];
  if (compile?.stderr) parts.push(compile.stderr.trim());
  if (compile?.stdout) parts.push(compile.stdout.trim());
  if (run?.stdout) parts.push(run.stdout.replace(/\s+$/, ""));
  if (run?.stderr) parts.push(run.stderr.trim());
  if (run?.message) parts.push(run.message);
  const code = run?.code;
  const signal = run?.signal;
  if (signal) parts.push(`Signal: ${signal}`);
  else if (typeof code === "number") parts.push(`Exit code: ${code}`);
  const failed = Boolean(compile?.code) || Boolean(run?.code) || Boolean(signal);
  return {
    text: parts.filter(Boolean).join("\n") || "(no output)",
    tone: failed ? "text-rose-400" : "text-ink",
  };
}
