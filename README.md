# Jev × Codex

将范围明确的连续浏览器操作、工具输出整理、搜索结果筛选、候选方案评审和证据复核交给 Jev，Codex 负责规划、复杂判断、输入和最终验收。

| 模式 | 能力 |
| --- | --- |
| browser | 连续导航、点击、滚动和标签切换，遇到输入或不确定情况交回 Codex |
| context | 辅助 Codex compact：规划保留与合并，复核接续摘要的遗漏和失真；原文可追溯 |
| search | 选择查询解释与来源策略，对已有结果排序；Codex 负责搜索和核实 |
| supervisor | 比较候选方案、评估反对意见与硬约束；Codex 必须回应反馈并修改或解释分歧 |
| review | 核对结论与证据，提出下一步建议；不自动修改代码或授权操作 |

## 安装

仓库已公开，任何人都可以直接下载或克隆，无需邀请。下载或克隆仓库后，把 `jev-codex` 文件夹放入 `~/.codex/skills/`（自定义 CODEX_HOME 时放入对应的 skills 目录）。

需要 Node.js 20+ 和自己的 TypeSafe API Key。浏览器模式另外需要 agent-browser 和 Chrome。

详细说明：[安装与配置](INSTALL.zh-CN.md) · [技能说明](jev-codex/SKILL.md) · [验证与限制](jev-codex/references/validation.md)

使用示例：

> 用 $jev-codex 完成这个任务，机械步骤交给 Jev。

## 检查

```bash
node --test jev-codex/scripts/test.mjs jev-codex/scripts/supervisor.test.mjs jev-codex/scripts/compact.test.mjs jev-codex/scripts/compact-hook.test.mjs
```

本仓库不包含 API 密钥、本机路径配置、浏览器会话或原始测试日志。实际调用使用运行者自己的 TypeSafe 额度。

这是工作流 skill，不是底层工具拦截插件；不能删除已经进入对话的上下文，也不保证固定倍数加速。精确计算和最终执行校验应由代码完成。

方案监督示例：

> 用 $jev-codex 的 supervisor 比较这些方案，挑战你偏好的方案，再根据反馈给出推荐。

Jev 提供结构化判断；反对意见候选与最终解释由 Codex 撰写。详见 [方案监督](jev-codex/references/supervisor.md)。

## 辅助上下文压缩（compact）

Codex 整理任务目标、约束、进展、决策和待办 → Jev 判断保留与合并 → Codex 撰写接续摘要 → Jev 检查遗漏与失真 → Codex 核查并保存摘要及原文引用。

这不会触发或替换 Codex 内置 compact，也不能删除已有对话。原有工具输出筛选仍可使用。详见 [compact 工作流](jev-codex/references/compact.md)。

## 可选：接入原生 compact 生命周期

新增 PreCompact → PostCompact → SessionStart(compact) 处理程序：压缩前让 Jev 选择关键历史片段，原生压缩成功后自动补回有界摘录。需要另外安装并信任三个钩子；安装 skill 不会自动启用。

每次压缩会将限定的、经过脱敏的用户消息及助手最终回复发送给 TypeSafe。只对明确配置的项目启用，不读取隐藏推理或原始工具数据；脱敏不是对所有秘密格式的保证。此功能侧重减少遗忘，不保证省时或省 Token。

已通过 33 项离线测试、真实 Jev API 冒烟测试，以及 Codex CLI/App Server 0.153.4 的原生 compact 端到端验证：三个钩子成功执行，回填内容进入后续模型上下文。其他版本及已运行的桌面会话是否热加载配置需要另行确认。详见 [钩子配置与验证](jev-codex/references/hooks.md)。
