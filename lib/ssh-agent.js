import { existsSync } from "node:fs";

export function notWsl() {
  return { ok: false, error: "not running in WSL" };
}

export function parameters() {
  return { type: "object", additionalProperties: false, properties: {} };
}

export function outputSchema() {
  return { type: "object", additionalProperties: true };
}

export function format(v) {
  const lines = [`ssh_agent_hint ok=${v.ok} SSH_AUTH_SOCK=${v.sock || "(unset)"}`];
  for (const a of v.advice || []) lines.push(`- ${a}`);
  return lines.join("\n");
}

export async function execute() {
  const sock = process.env.SSH_AUTH_SOCK || "";
  const alive = sock && existsSync(sock);
  const advice = [
    "Do not paste private keys into chat.",
    "Windows OpenSSH agent: set SSH_AUTH_SOCK via npiperelay/socat to \\\\.\\pipe\\openssh-ssh-agent, or use keychain inside WSL.",
    "Verify with: ssh-add -l",
  ];
  return { ok: Boolean(alive), sock, advice };
}
