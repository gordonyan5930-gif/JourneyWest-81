# 简短恢复入口 · 2026-10-31

- 仓库JourneyWest-81，分支feat/p0-a-prototype，PR #1保持Draft；不合并main，不部署Production，不改suibo工业项目。
- 已完成P0-A技术基线及AI工作室；用户否决旧产品品质，当前Quality Vertical Slice，不直接做原P0-B四段剧情。
- 最新用户决策：[6542578456](https://github.com/gordonyan5930-gif/JourneyWest-81/pull/1#issuecomment-6542578456)。第三轮史诗神话人物+第一轮游戏画面方向已批准，覆盖旧幼态Q版；动画/图集/模型/实机未批准，毛绒方向拒绝。
- 两张正式母版尚未收到：assets/references/README.md。不要重新抓整个聊天或误用旧quality-a-baiguling-v01.jpg；仅需这两张单独文件或可读取私有引用。
- 已继续性能审查任务：静态地图纹理、持久Text、增量DOM、按目标格/地形版本复用路径；保留连续避险、手动目标恢复、绕山、自然死亡及方案B。
- 验证代码18dfbce：Actions 41197932350，26单元/8浏览器全部成功；工件13041214742含逻辑对照、渲染指标、截图和视频。
- 同次CI逻辑均值0.191→0.111ms/步。WebGL为SwiftShader软件驱动；录像18.34FPS，无录像22.33FPS；Canvas对照59.80FPS/p95 16.7ms。都是5秒CI短样本，非120秒真实设备验收，性能Gate仍未解除。
- 默认渲染仍AUTO；?renderer=canvas仅作后端诊断入口。两张母版到齐后只做悟空+一屏地图试制，不批量资源或其余80关。
- 先读本文件/AGENTS/ART_BIBLE及PR最新审查，按需读GAME_DESIGN；不要导入历史聊天、大型附件或二进制工具输出。额度无接口，需人工核对；定时日报未启用。
