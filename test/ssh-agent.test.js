import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSshAgentAdvice,
  detectNpiperelay,
  format,
  hasSshPrivateKeys,
} from "../lib/ssh-agent.js";

describe("ssh_agent_hint", () => {
  it("detects npiperelay candidate", () => {
    const p = detectNpiperelay({
      env: {},
      exists: (x) => x === "/usr/local/bin/npiperelay.exe",
    });
    assert.equal(p, "/usr/local/bin/npiperelay.exe");
  });

  it("detects private key filenames only", () => {
    assert.equal(
      hasSshPrivateKeys({
        home: "/home/u",
        exists: (p) => p === "/home/u/.ssh",
        readdir: () => ["id_ed25519", "id_ed25519.pub", "known_hosts"],
      }),
      true,
    );
  });

  it("advises when sock missing", () => {
    const tips = buildSshAgentAdvice({ sock: "", sockAlive: false, keyCount: 0, hasPrivateKeys: true });
    assert.ok(tips.some((t) => /SSH_AUTH_SOCK is unset/i.test(t)));
    assert.ok(tips.some((t) => /cred_hint/i.test(t)));
  });

  it("formats", () => {
    assert.match(format({ ok: true, sock: "/tmp/ssh", advice: ["tip"] }), /SSH_AUTH_SOCK/);
  });
});
