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
