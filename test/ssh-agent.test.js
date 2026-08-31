import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { format } from "../lib/ssh-agent.js";

describe("ssh_agent_hint", () => {
  it("formats", () => {
    assert.match(format({ ok: true }), /ok/i);
  });
});
