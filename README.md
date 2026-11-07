# 西游：通关文牒 · 当前 Quality-B 战斗品质草稿

当前入口：`http://localhost:5173/?sample=quality-b&play=escort`。Node 22.12+ / 24：`npm ci` → `npm run dev`；生产构建仍为 `npm run build`，输出 `dist`。

[受保护分支试玩](https://journeywest-81-git-feat-p0-a-prototype-suibo.vercel.app/?sample=quality-b&play=escort)需要Vercel登录。PR #1保持Draft，技术检查不等于美术/玩法或真实设备性能通过。

开始后自动护卫。点地面移动，右键可强制地面落点；破空击→点弓手身体或目标按钮。看蓄势条/反击提示，技能命中后才伤害/打断，已发箭不会被追回。回援恢复护卫；倒地后至少3秒、35能量手动复活。菜单内重试、全景、声音开关与开发面板（渲染器、采样、蒙版）。本轮仅悟空/辅助唐僧/现有两弓手，不发完整白骨岭印章。

本轮占位/布局和动作声音样板见 [COMBAT_POLISH](docs/quality/COMBAT_POLISH.md)。地图/正式PNG母版保留；4姿势补充和原创合成声音仍待人工品质审核。原生成姿势PNG以字节分片保存在私有仓库，`npm run restore:recovery-source`可还原并验证整图SHA-256；常规构建/试玩无需还原源PNG。

下文保留原P0-A技术入口说明；根路由及压力模式用于历史回归，不代表当前品质版或本轮新增角色/密集波次。

---

# 西游：通关文牒 · 白骨岭 P0-A
Phaser + TypeScript + Vite。当前是**P0-A待独立复验草稿**。详见 docs/QA_REPORT.md。

## 启动
Node.js 22.12+ 或 24：
```bash
npm ci
npm run dev
```
打开终端输出的本机地址（默认 http://localhost:5173）。云端端口需由宿主转发，未公开部署。

## 操作
默认自动护送。点选悟空、八戒、沙僧或唐僧，再点地图下令；白龙马只支持查看/复活，骑乘时跟随唐僧。全队归阵恢复自动。悟空可离队，八戒沙僧自动护卫。山体阻挡，树林浅水减速。白马死亡唐僧步行；其他角色倒地3秒后，点底部按钮消耗35共享灵力复活。唐僧死亡立即失败，可重新出发。
到出口仅提示P0-A演示到达，不是完整关卡胜利。

## 检查
```bash
npm run build
npm test
npx playwright install --with-deps chromium
npm run test:e2e
```
浏览器测试生成 docs/p0-a-screenshot.png。GitHub Actions负责完整构建、单元与真实交互测试；具体运行结果与工件链接见 docs/QA_REPORT.md。Codex云端本机代理故障与Actions运行结果分别记录。

## 结构
- src/game/world.ts：数据配置、地形、寻路、护送战斗模拟及剧情扩展接口
- src/main.ts：Phaser绘制与交互
- tests：单元、浏览器验证
- docs：完整设计、阶段、进度、QA和用量
- assets：原创资产说明

未实现：四段剧情、Boss、主动技能与召唤、成长、通关文牒、存档与其余关卡。P0-A运行验证及独立验收前不继续新增功能。
