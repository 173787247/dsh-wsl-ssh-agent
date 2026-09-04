import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function notWsl() {
  return { ok: false, error: "not running in WSL", advice: [] };
}

export function parameters() {
  return { type: "object", additionalProperties: false, properties: {} };
}

export function outputSchema() {
  return { type: "object", additionalProperties: true };
}

export function format(v) {
  const lines = [`ssh_agent_hint ok=${v.ok} SSH_AUTH_SOCK=${v.sock || "(unset)"}`];
  if (v.sockAlive != null) lines.push(`sockAlive: ${v.sockAlive}`);
  if (v.keyCount != null) lines.push(`sshAddKeys: ${v.keyCount}`);
  if (v.hasPrivateKeys != null) lines.push(`hasPrivateKeysInHome: ${v.hasPrivateKeys}`);
  if (v.npiperelay != null) lines.push(`npiperelay: ${v.npiperelay}`);
  for (const a of v.advice || []) lines.push(`- ${a}`);
  return lines.join("\n");
}

export function detectNpiperelay({ env = process.env, exists = existsSync } = {}) {
  const candidates = [
    env.NPIPERELAY,
    "/usr/local/bin/npiperelay.exe",
    "/mnt/c/Users/Public/npiperelay.exe",
  ].filter(Boolean);
  // common scoop/user path via /mnt/c/Users/<from PATH>
  const m = (env.PATH || "").match(/\/mnt\/c\/Users\/([^/\\]+)/);
  if (m) {
    candidates.push(`/mnt/c/Users/${m[1]}/scoop/shims/npiperelay.exe`);
    candidates.push(`/mnt/c/Users/${m[1]}/go/bin/npiperelay.exe`);
  }
  for (const p of candidates) {
    if (p && exists(p)) return p;
  }
  return "";
}

export function hasSshPrivateKeys({ home = homedir(), exists = existsSync, readdir = readdirSync } = {}) {
  const dir = `${home}/.ssh`.replace(/\\/g, "/");
  if (!exists(dir)) return false;
  try {
    const names = readdir(dir);
    return names.some((n) => n === "id_ed25519" || n === "id_rsa" || n === "id_ecdsa" || /\.pem$/i.test(n));
  } catch {
    return false;
  }
}

export async function sshAddList({ execFileFn = execFileAsync } = {}) {
  try {
    const { stdout } = await execFileFn("ssh-add", ["-l"], {
      encoding: "utf8",
      timeout: 5_000,
    });
    const text = String(stdout || "").trim();
    if (/no identities/i.test(text)) return { ok: true, keyCount: 0, detail: text };
    const lines = text ? text.split(/\r?\n/).filter(Boolean) : [];
    return { ok: true, keyCount: lines.length, detail: lines.length ? `${lines.length} identities` : text };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // exit 1 often = no agent / no identities
    const code = err && typeof err === "object" && "code" in err ? err.code : undefined;
    return { ok: false, keyCount: 0, detail: msg, code: code == null ? "" : String(code) };
  }
}

export function buildSshAgentAdvice({
  sock,
  sockAlive,
  keyCount,
  hasPrivateKeys,
  npiperelay,
} = {}) {
  const tips = [
    "Do not paste private keys into chat.",
  ];
  if (!sock) {
    tips.push("SSH_AUTH_SOCK is unset — no agent socket in this process.");
  } else if (!sockAlive) {
    tips.push(`SSH_AUTH_SOCK=${sock} is set but the socket path is missing (stale agent).`);
  } else {
    tips.push("SSH_AUTH_SOCK points at a live socket.");
  }
  if (keyCount === 0 && sockAlive) {
    tips.push("ssh-add -l shows no identities — run ssh-add ~/.ssh/id_ed25519 (or forward Windows agent).");
  } else if (keyCount > 0) {
    tips.push(`Agent reports ${keyCount} loaded key(s).`);
  }
  if (hasPrivateKeys && !sockAlive) {
    tips.push("~/.ssh has private key files but no live agent — start ssh-agent or forward Windows OpenSSH agent.");
  }
  if (npiperelay) {
    tips.push(`Found npiperelay at ${npiperelay} — you can bridge \\\\.\\pipe\\openssh-ssh-agent into WSL.`);
  } else {
    tips.push(
      "Windows OpenSSH agent bridge: install npiperelay, then socat UNIX-LISTEN:$SSH_AUTH_SOCK,fork EXEC:\"npiperelay.exe -ei -s //./pipe/openssh-ssh-agent\",nofork",
    );
  }
  tips.push("HTTPS git push is separate — use cred_hint / Git Credential Manager; SSH remotes need this agent.");
  tips.push("Verify: ssh-add -l && ssh -T git@github.com");
  return tips;
}

export async function execute(_args, _config = {}, deps = {}) {
  const env = deps.env || process.env;
  const exists = deps.exists || existsSync;
  const sock = env.SSH_AUTH_SOCK || "";
  const sockAlive = Boolean(sock && exists(sock));
  const npiperelay = detectNpiperelay({ env, exists });
  const hasPrivateKeys = hasSshPrivateKeys({
    home: deps.home || homedir(),
    exists,
    readdir: deps.readdir || readdirSync,
  });
  const list = deps.sshAddList
    ? await deps.sshAddList()
    : await sshAddList({ execFileFn: deps.execFileFn || execFileAsync });
  const keyCount = list.keyCount || 0;
  const advice = buildSshAgentAdvice({
    sock,
    sockAlive,
    keyCount,
    hasPrivateKeys,
    npiperelay,
  });
  return {
    ok: sockAlive && keyCount > 0,
    sock,
    sockAlive,
    keyCount,
    hasPrivateKeys,
    npiperelay: npiperelay || "",
    sshAddDetail: list.detail || "",
    advice,
  };
}
