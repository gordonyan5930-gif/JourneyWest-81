# 资产清单

| ID / 版本 | 文件/规格 | 来源与状态 | 审核 |
|---|---|---|---|
| CONCEPT-QA-001 v0.1 | assets/concepts/quality-a-baiguling-v01.jpg；1672×941；RGB；PNG转JPEG仅格式压缩 | 本任务图像生成：初稿+修订共2次；提示摘要见assets/concepts/README.md；原创方向，非实机/生产资源 | 已被第三轮人物/第一轮场景选择覆盖，仅历史探索 |
| DEBUG-P0A-001 | src/main.ts程序几何图形 | 调试占位；保留旧版技术验证 | 明确不是正式美术 |
| MAP-QB-001 | 约2.5—3屏白骨岭、分层图、通行蒙版；设计1920×1080，实际视口验证 | 正式分层地图未制作；已另做一屏试制 | 方向已批准，运行资产待审 |
| HERO-QB-001 | 悟空4向动作；脚点中心、武器挂点、atlas页优先<=2048² | 4向完整样片未制作；8姿势单向图集已试制 | 方向已批准，动作/资产待审 |
| PARTY-QB-002 | 八戒/沙僧战斗状态；唐僧骑乘/步行/自保；白马骑乘/死亡/复活 | 未制作 | 悟空样片后制作 |
| ENEMY-QC-001 | 近战/弓兵/盾兵钻地、走、攻、伤、碎裂 | 未制作 | C |
| BOSS-QD-001 | 少女提篮、递饭、破相、Boss攻击/受伤/败退 | 未制作 | D |
| FX/HUD/AUDIO | 识破、幻化、打击、护盾、预警、原创图标与音效 | 未制作 | 分阶段 |

动作帧建议、角色身高、导出和人工依赖见quality/ASSET_PLAN.md及ART_DIRECTION.md。源PNG保留于工作区generated_images，Git仅存审核JPEG。生成资源不保证逐帧一致性；清线、补帧、分层地图、锚点、动作事件与音画同步需要专业2D处理或专用工具，尚未完成。

新增资产记录模板：ID、版本、文件、尺寸/格式、方向、动作帧数/时长/命中事件、脚点/挂点、生成提示或作者、许可依据、源文件位置、变更原因、用户批准证据、整合SHA、实机证据。未确认许可填待核查，不凭“AI生成”保证可商用。不得购买付费包。

## 正式视觉母版批准记录
来源：[用户决策6542578456](https://github.com/gordonyan5930-gif/JourneyWest-81/pull/1#issuecomment-6542578456)，2026-10-31北京时间19:05。CHAR-MASTER-R3第三轮角色图、SCENE-MASTER-R1第一轮游戏画面局部视觉方向已批准；视觉已收到；原始字节未可读取，原件尺寸/hash待核验、未无损入库。毛绒方向拒绝，动画/模型/生产图集/功能样片未批准。旧quality-a-baiguling-v01.jpg不是人物母版。见assets/references/README.md。

## 本轮视觉接收与v0.1运行资产
用户本轮明确提供正式母版视觉内容；原始附件未提供可读取路径/下载ID，所以CHAR-MASTER-R3、SCENE-MASTER-R1及第三张补充图仍没有原始字节数/SHA-256，见assets/references/manifest.json（null明确表示未知）。不以新生成图冒充原件。

- terrace-map v0.1-draft：assets/quality-b/terrace-map.webp，1672×941，941682字节；SHA-256 `3b54b8782ed0d1fbdb11df2859e666aad1e1fb960e67e5056418e490d1d19eb6`。新生成试制资产，待用户审核，非母版裁片。
- wukong-atlas v0.1-draft：assets/quality-b/wukong-atlas.webp，1774×887，1588024字节；SHA-256 `be9a3faf58ebc5a0637b59bf83ccdf04672c9f8a5a0c266b92ffb07434066c90`。新生成试制资产，待用户审核，非母版裁片。

悟空v0.2-draft：1448×1086，1,313,732字节；SHA-256 `2079b7da7df1b0d543e258ce5b33c9b1f574d7594840a841ebc1edcd99a35727`。12姿势，alpha64边距与脚线见assets/quality-b/wukong-audit.json；生成源hash见manifest。旧v0.1记录保留为历史，不再运行。梯田图hash未变。母版原件仍未归档，不以新生成资产代替。

## 正式PNG归档已完成（本轮权威状态）
用户ZIP原字节解压/复制至assets/references，两图均1672×941；人物3152697字节/SHA256 327411d5d8bef9b527e07c416524ae833ce45ee9ce54bf71a314699f76898bad；场景3204162字节/SHA256 e2e161a48c0d0b36add1115e01f11b00ccd697f208bb68fd03f27583160e0936。版本approved-original-v1，原件不作为运行素材。与审查5723126248复核一致，旧未收到状态保留为历史。

跑步研究v0.3-draft：wukong-run.webp，1774×887，1128304字节，SHA256 d65793dd442e74a2b6013965c6944983955e721fda7f5602c5ed68302472ed8c；8帧，与旧待机/攻击分图集。生成源hash/脚线/边距/限制见运行manifest和run-audit；不是母版改图，用户未批准生产动画。

RANGED-QB-EXPERIMENT v0.4：ranged-study.webp，1774×887、1350980字节，SHA256 b9cbf66a6f024e95f22fa8cc7bf640f854a1f1463dcaabb68345d345e72b63a1。仅辅助弓手4姿势/倒地、唐僧2姿势、飞行FX研究；不是正式批量角色。运行棍影为FX杆身裁窗，原WebP不修改，箭矢小纹理程序生成并真实飞行碰撞。许可/风格与动作最终审查待用户，源PNG留工作区、hash见manifest。

## 本轮同悟空最小姿势与原始声音（均待人工品质审核）
- wukong-recovery.webp v0.1：2560×640、4姿势、280516字节，SHA256 `093026abd07dca95b2e57d04a639eac5c0cf661dabf27f77e31bcb5d98ae33dc`。源为image_gen最小同角色研究，不是母版，不批量角色；脚线/透明边距见recovery-audit，打包脚本不重绘源。
- 生成原PNG：2172×724、1262226字节，SHA256 `06cd15d3e6d9521439c580950241621968312630e4064b37b5585516687652a8`。大blob调用未完成，采用4片原字节归档，顺序/校验见sources/recovery-source-archive.json；`npm run restore:recovery-source`还原并校验原图。正式母版assets/references仍为原PNG，未变更/重归档。
- attack/hit/danger/skill-v01.wav：项目原创确定性合成，PCM16/单声道/24kHz，无第三方采样、未购买。生成器scripts/generate-combat-audio.mjs、来源说明assets/audio/README.md；各文件字节数/SHA256见运行manifest，实际播放/静音测试与波形检测不等于正式听感认可。
- 新源图分片、运行图集、音效全部有实际校验；没有编造图像/模型额度与金额。动画、声音与生产许可/形象品质最终由用户审核，未替换IP母版。
