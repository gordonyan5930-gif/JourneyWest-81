# P0-A QA 报告

2026-10-31（北京时间）。仅覆盖P0-A；保留Draft，最终验收由独立验收员决定。

## 环境与此前失败的准确记录
- Codex云端本机：代理 proxy:8080 无法连接，未在该机器成功安装依赖或启动浏览器。本轮不重复尝试失效代理。
- GitHub Actions [41184901710](https://github.com/gordonyan5930-gif/JourneyWest-81/actions/runs/41184901710)：依赖安装、构建、6项单元测试、Chromium安装成功。失败发生在Playwright点击悟空按钮，原因是按钮每帧替换导致 detached from DOM；不是Actions依赖安装失败。

## 审查修复
1. 角色按钮只初始化一次；每帧仅更新状态文字、选中类与aria-pressed，点击目标节点保持稳定。
2. 唐僧主动路线在自动推进之前执行，使用正确的骑乘/步行速度；近身危险时暂时避险，保留目的地，危险解除后继续指令。修复接近目标时路线不能完成的问题。
3. 白龙马随唐僧移动，UI明确标记仅查看/复活；模拟层拒绝白马独立移动命令。
4. 利用Actions生成真实package-lock.json，执行npm ci；锁文件落库后移除临时生成步骤。
5. 浏览器回归使用真实按钮与地图鼠标操作；战斗、死亡测试仅使用测试接口设置初始场景，随后由正常动画帧或UI执行验证。

## 回归覆盖与结果
- 9项单元测试：地形绕山及非法目标、默认队形和推进、自动护卫战斗、四角色复活、能量与延迟限制、唐僧死亡冻结、手动移动速度、避险恢复目的地、白马拒绝移动。
- 4项Chromium浏览器测试：普通游戏URL下按钮跨帧稳定及地图指令；唐僧UI绕山、实际到达且不穿山；白马状态与UI复活、失败和重试；护卫逐帧战斗并保存截图。
- 首轮修复验证 [41185947034](https://github.com/gordonyan5930-gif/JourneyWest-81/actions/runs/41185947034)：npm ci、build、9项单元测试成功；浏览器3项通过，唐僧绕山测试的模拟时钟推进超过30秒。改为观察真实动画帧后重跑，保留路径与到达断言。
- 修复后完整运行 [41186150313](https://github.com/gordonyan5930-gif/JourneyWest-81/actions/runs/41186150313)：npm ci、build、9项单元测试、4项Chromium浏览器测试全部通过（浏览器45.5秒）。真实截图与锁文件工件：[browser-evidence](https://github.com/gordonyan5930-gif/JourneyWest-81/actions/runs/41186150313/artifacts/13036902452)。
- package-lock.json和真实截图已由Actions提交至同一开发分支（868ce902）；临时锁文件生成与写仓库步骤已移除。最终配置只读仓库、直接npm ci；配置复跑 [41186362926](https://github.com/gordonyan5930-gif/JourneyWest-81/actions/runs/41186362926) 的npm ci、build、9项单元测试、4项浏览器测试及工件上传全部成功。最新提交检查状态见PR Checks。

## 截图与未验证范围
真实截图由Actions中的Playwright在运行游戏、完成护卫战斗后拍摄：docs/p0-a-screenshot.png，并随browser-evidence工件保存。
Safari、真实MacBook设备、移动端和8—15分钟长局体验仍未验证。美术仍为原创简化程序绘图；平衡和队形转弯观感需独立试玩。无完整剧情、Boss、主动技能、成长、文牒或存档，不进入P0-B。

## 在线预览任务
待Vercel账户授权。仓库Private已通过GitHub元数据核验。新增预览部署门禁验证：仅preview + feat/p0-a-prototype可构建，Production、main、其他分支和缺失元数据均跳过。尚无实际Vercel部署，因此无HTTPS试玩链接、在线保护验证或在线交互测试结论。已有CI截图不作为在线预览证据。

预览准备验证结果：Actions run 41187064839的npm ci、build、15项单元测试、4项浏览器测试均成功。Vercel连接成功且仓库可读；项目团队suibo未授权导致403，官方团队授权待用户完成。没有部署URL，也没有在线浏览器或访问保护验证结果。

## Vercel部署结果
已READY：dpl_4ecuRpHNVvHnrWE5XgVvu2pcfb36，target=staging，源e16c0a5/feat/p0-a-prototype。构建日志确认预览门禁允许、npm ci成功、tsc及vite build成功，dist产出并发布。项目API回读确认Vercel Authentication已启用。首次错误标记production的请求被门禁取消（CANCELED），未成功发布。现有工业网站updatedAt未变。
限制：无已登录浏览器控制工具，未执行在线地图、点击移动和战斗验证；未登录访问的抓取失败也不等于保护验证成功。此前CI测试及截图仍仅代表本地服务器。构建日志npm audit报告3项依赖告警（1 moderate、2 critical），尚未逐项审计；本任务不使用force升级依赖。

补充证据：用户实际打开受保护预览并回复“显示地图了”，仅标记地图加载为用户确认。自动Git更新已核验：cb8e6e2触发新预览dpl_BduuWMWMxmyi3DdjUSvWyPXCDqJZ并READY，稳定分支URL为https://journeywest-81-git-feat-p0-a-prototype-suibo.vercel.app。未将用户地图反馈扩大为选角、移动和战斗全部验证通过。

# 品质验收重置 · 2026-10-31（优先于早期技术结论）
用户实际试玩判定P0-A产品体验未通过。既有构建、单元和浏览器通过结果仅证明当时技术项，不代表美术或玩法合格。
本轮证据为src/game/world.ts、src/main.ts与浏览器测试的静态审计，详见quality/AUDIT.md。确认单怪7秒循环、即时扣血、统一敌人目标和几何占位渲染；性能风险为假设，没有新增FPS数据。
A规范/概念待审，B/C/D未实施；没有新的实际游戏截图/录屏，不将生成概念图当实机。新美术/玩法/性能清单见quality/ACCEPTANCE.md。只修改文档与后续概念资产，不宣称品质验收通过。

A概念审核图：assets/concepts/quality-a-baiguling-v01.jpg。五角色与怪物/场景/UI统一方向待用户认可；非实机。初稿出现少女替代白马HUD及等级文字，已重新生成修订，不将初稿错误作为需求。

# 工作室自动化增量
独立QA只读验证：默认World仅正常update和原刷怪，347.6模拟秒唐僧自然死亡，未调用damage/改HP；此时已到出口且避险很久，不能视为首段体验验收。25普通敌人环形压力在10.3模拟秒自然失败，适合真实帧测试，但属于开发压力场景。
新增CI测试与报告待实际运行；所有视频/截图为当前几何占位版技术证据。美术A仍待用户批准，B/C/D未开始。自动Code Review服务开关与分支保护设置未核验，定时报告和预算硬限额未启用。

独立QA二次复核发现并要求修复：步骤全success但测试JSON缺失会假报技术通过。现已改为同时核对必需报告、有效测试数量与失败/跳过计数；缺失/破损标incomplete，失败计数标failed，报告步骤返回非零阻断。增加7种报表回归（成功、步骤失败、跳过、缺失、损坏、单测失败、浏览器失败）。短时压力阈值字段改为observedFrameThresholdsMet，并显式productQualityApproved=false；本地/CI设备来源分开标记。等待修复后CI。

首轮工作室CI实际证据：run 41190134941 完整成功，19项单元、5项浏览器测试通过，25怪自然攻击失败的浏览器测试27.5秒，浏览器合计约1.6分钟。私有studio-evidence工件13038242120含20文件，19,956,141字节，2026-11-07到期。首轮成功不代替独立QA随后指出的报表边界修复，最新修复需重新验证。当前视频与截图均为旧技术美术版，不是Quality B画面。

# 工作室最终代码验证证据
Actions [41190391919](https://github.com/gordonyan5930-gif/JourneyWest-81/actions/runs/41190391919)，源c148ce1db3ff94f188d4bba7a035dc64ead37be6：npm ci、TypeScript/Vite、24项单元、5项Chromium浏览器、报告与上传全部成功。浏览器约99.1秒。报告实际列出5个video.webm，压力视频3,098,774字节，所有证据工件[13038707344](https://github.com/gordonyan5930-gif/JourneyWest-81/actions/runs/41190391919/artifacts/13038707344)共20,116,275字节，2026-11-07北京时间17:54到期。
压力采样191帧，平均8.52FPS、p95帧间隔132.5ms，约9.98模拟秒唐僧自然死亡；observedFrameThresholdsMet=false，productQualityApproved=false。此为当前占位版带录屏Linux CI基线，不满足商业品质/120秒正式性能验收，也不代表用户MacBook帧率。技术响应守卫通过不等于性能品质通过。
独立QA实际重跑8种报表输入，确认缺失/破损/失败不假报通过，advanceAllowed始终false；原阻断已关闭。真实普通剧情的自然失败/可赢对照、Safari与专业美术仍待B/C/D。

# 恢复任务：性能优化待验证
采用PR最新正式审查5722276074与用户决策6542578456。原工作室24/5通过不自动代表新提交通过。新增路径复用/地形版本失效测试、无录像/有录像对照与逻辑基准，记录逻辑/绘制/DOM耗时、对象数、heap、UA与硬件并发数。本地Node仅逻辑before平均0.458ms/p95 1.239ms，after平均0.122ms/p95 0.438ms，属于本次工作区Xeon Linux样本，非浏览器或Mac。自然失败仍可发生（此配置变为约445.8模拟秒），手动绕山到达且不穿山检查通过；完整CI待运行。静态美术批准仅方向，母版未收到，不构成实机批准。
恢复任务追加回归：路径缓存不能让连续避险只移动首帧，也不能丢失主动目的地。避险路线现在保留到下一帧，威胁消失后按manualGoal重建路线；新增连续避险/恢复目标测试，本地正常规则模拟仍会自然失败（约453秒，不作为难度指标）。
恢复首个完整验证：run 41197645065（源5f94cfe）26单元/7浏览器成功。CI逻辑meanStep 0.308→0.180ms；录像渲染10.62FPS/p95 100.1ms，无录像11.68FPS/p95 100.1ms，均未解除性能阻断。文字池29、场景对象33；logic/draw提交/DOM各低于0.4ms，CPU提交耗时不等于GPU实际渲染完成时间。继续补Canvas后端对照和真实WebGL renderer信息，不凭低JS耗时宣称性能达标。
