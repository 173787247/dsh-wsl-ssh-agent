# dsh-wsl-ssh-agent

DeepSeek Harness 插件：提示如何把 Windows OpenSSH agent 转发进 WSL（不导出密钥）。

配套 **[dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit)**。

[English → README.md](./README.md)

## 安装

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-ssh-agent
```

重启 `dsh web` 并开**新**会话。工具名：`ssh_agent_hint`。

## 许可

MIT
