# Jev × Codex

将范围明确的连续浏览器操作、工具输出整理、搜索结果筛选和证据复核交给 Jev，Codex 负责规划、复杂判断、输入和最终验收。

| 模式 | 能力 |
| --- | --- |
| browser | 连续导航、点击、滚动和标签切换，遇到输入或不确定情况交回 Codex |
| context | 按原文片段保留、摘录或归档工具输出，始终保存原文 |
| search | 选择查询解释与来源策略，对已有结果排序；Codex 负责搜索和核实 |
| review | 核对结论与证据，提出下一步建议；不自动修改代码或授权操作 |

## 安装

仓库为私有，需要先获得访问权限。下载或克隆仓库后，把 `jev-codex` 文件夹放入 `~/.codex/skills/`（自定义 CODEX_HOME 时放入对应的 skills 目录）。

需要 Node.js 20+ 和自己的 TypeSafe API Key。浏览器模式另外需要 agent-browser 和 Chrome。

详细说明：[安装与配置](INSTALL.zh-CN.md) · [技能说明](jev-codex/SKILL.md) · [验证与限制](jev-codex/references/validation.md)

使用示例：

> 用 $jev-codex 完成这个任务，机械步骤交给 Jev。

## 检查

```bash
node --test jev-codex/scripts/test.mjs
```

本仓库不包含 API 密钥、本机路径配置、浏览器会话或原始测试日志。实际调用使用运行者自己的 TypeSafe 额度。

这是工作流 skill，不是底层工具拦截插件；不能删除已经进入对话的上下文，也不保证固定倍数加速。精确计算和最终执行校验应由代码完成。
