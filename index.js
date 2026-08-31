import { detectWsl } from "./lib/wsl-host.js";
import * as core from "./lib/ssh-agent.js";

export const name = "dsh-wsl-ssh-agent";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx, config = {}) {
  const timeoutMs = positive(config.timeoutMs, 15_000);
  const wsl = detectWsl();

  ctx.systemPrompt.section({
    name: "tool:ssh_agent_hint",
    order: 121,
    text: "Use ssh_agent_hint for WSL/Windows interop: Hint how to forward Windows OpenSSH agent into WSL.",
  });

  ctx.tools.register({
    name: "ssh_agent_hint",
    description: "Hint how to forward Windows OpenSSH agent into WSL.",
    parameters: core.parameters(config),
    output: {
      schema: core.outputSchema(),
      render: (_args, value) => [{ type: "text", text: core.format(value) }],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      if (!wsl) return core.notWsl ? core.notWsl() : { ok: false, error: "not running in WSL" };
      return core.execute(args, config);
    },
    presentCall: () => ({ card: "generic", title: "ssh_agent_hint" }),
    presentResult: (_args, result) => (
      result.isError
        ? { card: "generic", title: "ssh_agent_hint failed", content: result.content }
        : { card: "generic", title: "ssh_agent_hint", content: result.content }
    ),
  });
}

function positive(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
