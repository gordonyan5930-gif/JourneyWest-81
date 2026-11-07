# AI游戏工作室运行方案

## 四类职责，不是四个收费常驻服务
| 角色 | 输入与责任 | 交付 | 禁止事项 |
|---|---|---|---|
| 开发Agent | 已批准设计/任务、地图/AI/战斗/技能/性能/Bug | 小范围提交、回归、可运行构建 | 自批美术、合并main、扩展其余关卡 |
| 美术Agent | ART_BIBLE和资产ID | 概念、角色/场景/动画、来源与版本 | 把生成图当实机，未批准就批量生产 |
| QA Agent | 当前SHA、设计、测试与实机 | 独立缺陷、复现、功能/性能证据、规则核对 | 给自己写的功能自行宣告产品合格 |
| PM Agent | GitHub/Vercel/资产/额度真实数据 | 看板、日报、阻碍、预算与下一步 | 编造百分比/额度，后台无限启动任务 |

现有Codex/ChatGPT按任务承担角色；GitHub Actions承担自动回归，Vercel只托管受保护游戏Preview。本次已调用只读独立QA协作审计，与开发提交职责分离；不声称存在4个24小时运行的Agent。

## 自动流水线
开发PR每次推送（pull_request synchronize）→ npm ci → tsc与Vite build → Vitest JSON → 安装Chromium → Playwright真实UI/自然伤害压力/截图/视频/JSON+HTML → always生成Markdown/JSON管理报告 → 私有工件7天保留。
测试失败使verify失败，无continue-on-error；skip/incomplete不写passed。报告advanceAllowed=false，人工门槛始终存在。游戏仍是P0-A技术版，CI不自动开发B/C/D。

默认自然死亡单测只使用正常World.update和原刷怪规则；25怪浏览器测试只配置初始普通敌人，随后真实帧正常攻击。不调用damage/改HP/判败。后者标开发压力，不冒充正式正常关卡。报告帧时间与低血量，不把旧版压力通过称商业性能达标。

## 定时报告方案与权限（未启用）
优先方案A：用户批准时间/频率后用现有ChatGPT/Codex自动化，每日读取已连接GitHub与仅journeywest-81的Vercel项目，更新报告或通知异常；需要自动化调度权限及相应连接，无需新收费服务。本轮不创建任务或cron。
备选方案B：GitHub Actions schedule/手动dispatch；schedule文件必须存在默认分支且由用户批准合并，因此当前不能靠开发分支宣称定时已生效。需要contents/read、pull-requests/read、actions/read；写回报告另需contents/write和独立报告分支，不应写main。Vercel状态查询需只读凭据由用户在Secrets配置，不能索取聊天明文。未授权前仅使用每次CI的GitHub快照，Vercel写未核验。
通知仅当失败、预算阈值、用户待决策或有意义进展，不默认对外发邮件/Slack。

## Codex Code Review核验
GitHub连接与PR可读不等于仓库已启用Codex自动审查。当前无可调用的Code Review设置管理API/浏览器控制工具，不能确认或启用开关；用户需要在https://chatgpt.com/codex/settings/code-review检查JourneyWest-81的Code Review与Automatic review（含Draft触发条件），并确认套餐/用量许可。不得启用额外付费额度或自动充值。
AGENTS.md已提供审查规则；确认启用后可按用户授权在PR请求@codex review。当前不发送可能消耗额度的审查请求，不宣称已启用。独立QA协作和CI不是Codex云端仓库Review的替代证明。
参考：https://developers.openai.com/blog/custom-code-review-rules-for-codex 与 https://learn.chatgpt.com/docs/third-party/github 。

## 工具和成本风险
| 能力 | 当前工具 | 数据/成本状态 |
|---|---|---|
| 开发/独立审计 | 现有Codex与协作QA | 真实token/余额无接口，需人工核对 |
| 概念 | 图像生成2次 | 无价格/消耗返回；没有购买外部资产 |
| 正式2D动画 | 待确认专门工具/人工清线补帧 | 未完成；不默认购买工具或委托 |
| CI与视频 | GitHub Actions、Chromium、私有工件7天 | 分钟数/存储需账户用量页面核对；视频增加存储，必要时缩短保留但不悄悄丢证据 |
| 托管 | 现有Vercel游戏项目Preview | 无新增付费计划；构建消耗需Vercel账单核对；不动工业项目 |
| 预算保护 | 任务台账+人工阈值判断 | 没有自动账户硬限额，无余额不计算百分比 |

60%关注趋势，80%停止新大型任务等待预算确认，90%停止新阶段。仅当已核验用量与预算口径一致才判断阈值；未知时状态为需人工核对，不是0%。自动化不得循环重试消耗配额，失败后保留证据并修复原因。

为避免同一提交push和PR双跑，技术流水线仅监听pull_request；同一PR新提交取消过时运行，取消状态不能当通过。无schedule，定时方案仍待批准。
