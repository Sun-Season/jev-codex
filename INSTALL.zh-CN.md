# Jev × Codex 分享包安装说明

这是完整 skill，包括执行脚本；请分享整个压缩包，不要只分享 SKILL.md。
不包含分享者的密钥、本机配置、浏览器会话或原始测试记录。

## 1. 安装

解压后，把整个 `jev-codex` 文件夹放入接收者的 Codex 技能目录：

- 默认：`~/.codex/skills/jev-codex/`
- 如自定义 CODEX_HOME：放入该目录的 `skills/jev-codex/`。

最终应能找到 `~/.codex/skills/jev-codex/SKILL.md`。
不要覆盖已有同名技能而不检查其内容。下一轮对话应可发现技能；若未显示，再重启 Codex。

也可以把解压目录交给 Codex 并说：
“请检查并安装这个目录里的 jev-codex skill，配置我自己的 TypeSafe API Key，并验证它可以运行。”

## 2. 配置自己的 TypeSafe API Key

需要 Node.js 20 或更新版本，以及接收者自己的 TypeSafe 账户/API Key。
四个数据模式无需安装 npm SDK。

选择一种方式：

- 在运行环境设置 `TYPESAFE_API_KEY`；或
- 在项目根目录创建 `.env.typesafe.local`，内容是 `TYPESAFE_API_KEY=你的密钥`；或
- 将密钥文件路径写入 skill 目录的 `local-config.json`：

```json
{
  "envFile": "/替换成你自己的绝对路径/.env.typesafe.local"
}
```

在 macOS/Linux 上可用 `chmod 600 /你的路径/.env.typesafe.local` 限制读取权限。
把密钥文件加入项目 Git 忽略规则。无需把密钥发送给分享者。

## 3. 浏览器模式的额外依赖

仅浏览器模式需要 agent-browser 和 Chrome；其余模式不依赖浏览器。
开发验证使用 agent-browser 0.38.1，可安装该版本：

```bash
npm install -g agent-browser@0.38.1
```

在 `local-config.json` 中配置实际路径，例如 macOS：

```json
{
  "envFile": "/替换成你的路径/.env.typesafe.local",
  "browserBin": "agent-browser",
  "browserExecutable": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
}
```

如果 Codex 的 PATH 找不到 agent-browser，把 browserBin 改成 `command -v agent-browser` 返回的绝对路径。
其他操作系统需要填写自己的 Chrome 可执行文件路径；本包的真实浏览器验证仅在 macOS 上完成。

## 4. 使用和检查

在 Codex 里说：
“用 $jev-codex 完成这个任务，机械步骤交给 Jev。”

离线检查（不调用 API）：

```bash
node --test ~/.codex/skills/jev-codex/scripts/test.mjs ~/.codex/skills/jev-codex/scripts/supervisor.test.mjs ~/.codex/skills/jev-codex/scripts/compact.test.mjs
```

任务 JSON 与脚本调用示例见 skill 内的 references/browser.md 和 references/data-modes.md、references/supervisor.md、references/compact.md。
实际运行会使用接收者的 TypeSafe 额度；浏览器只执行明确允许的有限动作。

这是工作流 skill，不是拦截所有工具的底层插件。它不能删除已进入对话的上下文，也不保证固定倍数加速。

## GitHub 下载与分享

仓库已公开：[Sun-Season/jev-codex](https://github.com/Sun-Season/jev-codex)。任何人都可以直接下载、克隆或分享仓库链接，无需邀请。
每位使用者需要配置自己的 TypeSafe API Key；公开仓库不提供共享密钥或 API 额度。
再次打包或上传时，不要包含 local-config.json、.env 文件或真实日志。
