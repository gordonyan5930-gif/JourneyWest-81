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
