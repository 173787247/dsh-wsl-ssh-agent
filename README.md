# dsh-wsl-ssh-agent

DeepSeek Harness plugin: Hint how to forward the Windows OpenSSH agent into WSL without dumping secrets.

Part of **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**.

[中文说明 → README.zh.md](./README.zh.md)

## Install

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-ssh-agent
# or local:
dsh plugin --profile web add /absolute/path/to/dsh-wsl-ssh-agent
```

Restart `dsh web` and open a **new** session. Tool: `ssh_agent_hint`.

## License

MIT
