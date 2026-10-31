# 简短恢复入口 · 2026-10-31

- 仓库JourneyWest-81，分支feat/p0-a-prototype，PR #1保持Draft；不合并main，不部署Production，不改suibo工业项目。
- 已完成P0-A技术基线及AI工作室；用户否决旧产品品质，当前Quality Vertical Slice，不直接做原P0-B四段剧情。
- 最新用户决策：[6542578456](https://github.com/gordonyan5930-gif/JourneyWest-81/pull/1#issuecomment-6542578456)。第三轮史诗神话人物+第一轮游戏画面方向已批准，覆盖旧幼态Q版；动画/图集/模型/实机未批准，毛绒方向拒绝。
- 本轮三张母版/补充图视觉已收到；原始附件字节未可读取，尚不能无损入库或核对原件hash。见assets/references/manifest.json，禁止用生成图冒充原件。无需完整历史。
- 已继续性能审查任务：静态地图纹理、持久Text、增量DOM、按目标格/地形版本复用路径；保留连续避险、手动目标恢复、绕山、自然死亡及方案B。
- 验证代码18dfbce：Actions 41197932350，26单元/8浏览器全部成功；工件13041214742含逻辑对照、渲染指标、截图和视频。
- 同次CI逻辑均值0.191→0.111ms/步。WebGL为SwiftShader软件驱动；录像18.34FPS，无录像22.33FPS；Canvas对照59.80FPS/p95 16.7ms。都是5秒CI短样本，非120秒真实设备验收，性能Gate仍未解除。
- 默认渲染仍AUTO；?renderer=canvas仅作后端诊断入口。两张母版到齐后只做悟空+一屏地图试制，不批量资源或其余80关。
- 先读本文件/AGENTS/ART_BIBLE及PR最新审查，按需读GAME_DESIGN；不要导入历史聊天、大型附件或二进制工具输出。额度无接口，需人工核对；定时日报未启用。

- 正在交付独立Quality B单角色/地图试制入口?sample=quality-b：新绘底图、悟空跑/待机/棒击、路径与镜头、通行蒙版、设备JSON采样；素材hash见assets/quality-b/manifest.json。此样片非完整角色动画/少女剧情，待用户审查；本次CI待记录。
