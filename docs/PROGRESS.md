# 开发进度
2026-10-31（北京时间） · v0.1.0 · P0-A修复，待独立复验

## 已编写
Phaser/TypeScript/Vite工程、正式方案B完整任务书、地形网格寻路、点选路线、自动队形与战斗护卫、唐僧避险、白马下马、共享能量复活、归阵、暂停与重试。StoryExtension预留剧情事件接口。

## PR #1 审查处理
读取正式独立审查和Actions失败日志。角色按钮改为持久节点；唐僧手动路线、骑乘/步行速度和近身避险恢复目标有回归覆盖；白马仅查看/复活，拒绝独立移动。新增真实UI、位置到达、山体阻挡、逐帧护卫战斗、UI复活与失败重试测试。
Actions run 41186150313已完整通过npm ci、build、9项单元测试和4项浏览器测试。真实锁文件与游戏截图已由Actions提交到本PR。移除一次性锁文件生成与写仓库步骤后，最终只读配置run 41186362926的安装、构建、9项单元测试、4项浏览器测试与工件上传也全部成功；等待独立复验。运行证据见QA_REPORT.md。

## 环境说明
此前失败的是Codex云端本机代理，不代表GitHub Actions依赖安装失败。原Actions已经完成安装、构建、6项单元测试；原浏览器失败是按钮每帧替换造成的真实缺陷。

## 范围与下一步
只处理P0-A和本PR审查；不创建新PR，不合并main，不进入P0-B。完整CI通过后提交独立复验，Safari和长局体验仍需检查。

## 受保护在线预览准备
2026-10-31：用户授权仅部署feat/p0-a-prototype的Preview，不部署Production、不改main、不公开仓库。已核验仓库Private。发现Vercel集成可连接但当前未连接，等待账户授权。准备vercel.json（npm ci / npm run build / dist）、仅预览分支构建门禁及配置说明；账号保护必须在项目端启用并验证，不能靠仓库JSON冒充认证。未部署、没有试玩URL、未做在线浏览器验证。

后续确认：用户已连接Vercel，插件读取账户成功，Vercel的GitHub集成确认可访问本Private仓库。默认团队suibo访问和项目创建返回403，已发起官方一次性团队授权流程，尚未创建项目或部署。Actions run 41187064839的npm ci、build、15项单元测试和4项浏览器测试全部成功；这些是本地服务器测试，不是在线预览验证。

## 独立游戏预览部署
团队授权生效后先只读检查项目；新建journeywest-81，未改现有sensor-sorting-review（updatedAt保持不变）。项目启用Vercel Authentication，Node24，npm ci/build/dist。预览dpl_4ecuRpHNVvHnrWE5XgVvu2pcfb36已READY，地址见PREVIEW_DEPLOYMENT.md。首次preview参数被服务标为production，但被预览专用门禁取消，未发布；改用REST staging得到真正预览。在线登录后交互仍待验证，当前没有已登录浏览器控制工具。不合并main，不进入P0-B。

自动更新已实证：cb8e6e2的Git推送触发dpl_BduuWMWMxmyi3DdjUSvWyPXCDqJZ，READY，target=null，分支别名已更新。用户在登录后浏览器确认地图显示；在线选角、移动和战斗仍待验证。

# 2026-10-31 品质路线调整（当前状态优先）
用户亲自试玩判定P0-A画面、地图、角色、移动节奏、敌人密度与战斗不达预期。P0-A仅技术验证，产品体验未通过，暂不合并PR #1，不直接进入原P0-B。
本轮审阅代码与现有测试，形成docs/quality/AUDIT.md；保留生命复活、地形语义、交互回归、工程与部署，计划渐进替换渲染、地图、遭遇和动作状态机。已编写A美术规范、资产生产依赖、B/C/D实施计划与独立验收清单，原创概念图已生成并修正HUD，待用户审核。尚未开始B/C/D实机开发，没有新增实机截图或录屏。

A概念审核图：assets/concepts/quality-a-baiguling-v01.jpg。五角色与怪物/场景/UI统一方向待用户认可；非实机。初稿出现少女替代白马HUD及等级文字，已重新生成修订，不将初稿错误作为需求。

# AI工作室管理建设（当前任务）
建立开发/美术/独立QA/PM职责；并非4个收费后台服务。新增ART_BIBLE、QUALITY_GATES、ASSET_MANIFEST、BACKLOG、PROJECT_DASHBOARD与STUDIO_OPERATIONS，保留GAME_DESIGN。
流水线扩展到单元/浏览器JSON、HTML、Markdown管理报告、正常规则自然死亡模拟、25普通敌人真实帧围攻、性能基线、截图与视频。待本次Actions实际运行，不能预先标通过。
独立QA已只读模拟确认默认规则347.6秒自然失败，限制是已到出口并长时间避险；不代表正式片段难度合格。Codex自动Review未能核验开关，定时日报未启用，账户用量需人工核对。B/C/D正式编码未开始，概念待用户审批。
独立QA复核已捕获并修复报表证据缺失假通过问题；测试证据和步骤状态双重校验，新增7种报表状态回归。压力数据只表示本次短时观察，不作为产品性能通过。等待最终CI证据。
首轮工作室CI 41190134941完整通过并产生studio-evidence（19单元、5浏览器）。独立QA后的证据缺失、压力语义修复继续验证；不宣称商业品质完成。

工作室代码验证最终结果：run 41190391919完整通过24单元/5浏览器，5真实视频与截图/JSON/HTML/Markdown已上传。质量仍阻断：CI围攻基线8.52FPS、p95 132.5ms未达目标；美术待用户批准，Codex自动Review/定时日报/真实余额未授权或不可核验。没有开始B/C/D正式功能开发。
