# 项目看板

当前阶段：P0-Quality A / 工作室管理基础。P0-A技术验证保留，产品体验被用户否决。**商业品质完成度：未认可，不提供虚构百分比。**

- PR：[现有#1](https://github.com/gordonyan5930-gif/JourneyWest-81/pull/1)，保持Draft、不合并main。
- [受保护Vercel Preview](https://journeywest-81-git-feat-p0-a-prototype-suibo.vercel.app)：既有游戏技术版，不是高品质竖切片；最新READY由Vercel连接实时核验，CI不会伪造live状态。
- 最新待审图：assets/concepts/quality-a-baiguling-v01.jpg，非实机；美术规范ART_BIBLE.md。
- 实际旧版截图：docs/p0-a-screenshot.png，仅代表旧技术画面。
- 本次自动证据：Actions → Build and test → studio-evidence，含dashboard.json/md、单元/浏览器JSON、HTML、压力截图和webm；已核验代码run 41190391919通过（24单元/5浏览器）。
- 阻碍：用户美术批准、专业动画/分层制作能力、正式片段玩法与性能、Codex自动Review设置核验、账户实际用量。
- 自动化：PR推送触发构建/回归/报告；无定时日报、无后台四服务、无自动合并/阶段推进。
- 下一步：先审概念方向，再做一个角色与一屏场景样片；不批量后续关卡。

## 每日报告模板（北京时间，尚未启用定时）
1. 数据采集时间、仓库、分支、源SHA；数据未取得写unknown。
2. 当前阶段、批准证据、剩余任务；不以代码比例代替产品完成度。
3. 过去24小时提交/PR及链接，CI运行ID与成功/失败/进行中。
4. Vercel游戏项目部署状态、对应SHA和受保护URL；不读取或修改工业网站。
5. 可查看截图、视频、性能采样及工件过期日；区分概念/本地实机/在线实机。
6. 待审资产版本、用户决定、缺陷、风险和阻碍。
7. 实际可核实的用量、口径与来源；余额未知填需人工核对；预测列假设与区间，不伪装账单。
8. 预计剩余工作、下一步与需要用户授权/决策项。

每次CI自动报告可从真实GitHub API读取PR和同SHA运行，不把运行中的自己写为最终成功。Vercel需要已授权连接另行查询；CI未配置该凭据时明确未实时核验。

## 已核验快照（2026-10-31北京时间17:54）
- [技术CI](https://github.com/gordonyan5930-gif/JourneyWest-81/actions/runs/41190391919)：24单元、5浏览器全部成功；源c148ce1。
- [截图/5视频/报告工件](https://github.com/gordonyan5930-gif/JourneyWest-81/actions/runs/41190391919/artifacts/13038707344)：20,116,275字节，11月7日17:54到期。下载后打开playwright-report/index.html或reports/dashboard.md。
- 当前围攻基线8.52FPS / p95 132.5ms，未达品质目标；不是用户设备性能。
- 人工美术/玩法批准：无；自动进入下阶段：禁止。

## 恢复快照 · 2026-10-31
GitHub源b249848，最新审查5722276074、用户视觉决策6542578456已读取。工作室技术体系通过，人物与场景视觉大方向已批准（第三轮人物/第一轮游戏画面），不是旧概念获批。正式参考文件未收到；动画/生产图集/实机未批准。当前优先处理性能，分离逻辑/无录像/有录像采样；不要按旧“人物方向未定”重复探索。
