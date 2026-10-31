# QA 报告
2026-10-31 · 尚未完成运行验证

| 检查 | 实际结果 |
|---|---|
| npm install | 未完成：网络代理 proxy:8080 无法连接 |
| npm run build | 失败：tsc: not found，依赖未安装 |
| curl registry.npmjs.org | 失败：Could not connect to proxy port 8080 |
| 单元测试 | 已编写，未运行 |
| 浏览器启动、地图显示、移动及点击绕行 | 已编写 Playwright 检查，未运行 |
| 山体阻挡、战斗护卫、失败、复活 | 已编写逻辑及浏览器测试，未运行 |
| 截图 | 未生成，不使用设计图冒充游戏截图 |

单元测试覆盖：绕山路径及非法目标、队形和行进、自动战斗、四角色复活、复活延迟与能量限制、下马、唐僧死亡停止模拟。
浏览器测试覆盖：Canvas加载、真实点击角色及目标、路线生成、战斗和生死状态、页面错误、自动截图。
浏览器测试中的战斗与死亡使用 test 查询参数开启的模拟接口，仍需独立人工长局试玩。Chrome/Safari兼容性、长时间战斗和队形转弯尚未验证。

已知限制：简化原创程序绘图；不含Boss与剧情；出口仅显示演示提示，不发放印章；未验证平衡、避险效果与队形拐弯质量；尚无锁文件。
没有最终验收结论。

补充实际验证：使用 Node 24 `--experimental-transform-types` 直接执行 world.ts 的断言脚本，山体绕行路径、四名非唐僧角色复活、自动战斗击杀、唐僧死亡失败全部通过。该检查不替代 TypeScript 编译、Vitest 或真实浏览器验证。

## 正式审查后的验证更正
已读取 Actions run [41184901710](https://github.com/gordonyan5930-gif/JourneyWest-81/actions/runs/41184901710) / job 124489742880：npm install、build、6项单元测试、Chromium安装成功；Playwright在悟空按钮点击处因 DOM 每帧重建超时。
当前修复及新增回归正在 Actions 验证。Safari 与长局体验仍未验证；仍保持 Draft，等待独立复验，不进入P0-B。
