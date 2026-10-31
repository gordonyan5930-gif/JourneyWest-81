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
