# 本轮工件存储阻碍与恢复

2026-11-04北京时间。Actions41815362169/a0532a26：127单元通过，4浏览器通过/1地形诊断失败/35未执行；所有4次上传被GitHub拒绝，当前运行工件0个。原文：`Artifact storage quota has been hit. Unable to upload any new artifacts. Usage is recalculated every 6-12 hours.` 不购买、不自动删除、不把上传失败改成成功。

地形失败已在本地确认为测试路线与真实胜利冻结竞争（唐僧先到终点41.846秒、悟空873.702/536.554）；不修改胜利条件。改为先近处浅滩，再北侧树林1192,344，观察真实停步，不依赖固定400ms；两次独立普通操作38.4/41.4秒通过。失败样本motion-terrain-race.json保留。

CI新加不足1KB存储预检，失败时先停止，不安装依赖/不跑整套录屏、不继续重复上传；这是工件容量可写性，不是账户余额/消费比例监控。预检工件按run_attempt命名，便于原SHA重跑失败job。当前motion范围仍运行全部40浏览器及单元，全部机器JSON/MD/音频和失败附件保留，仅不重复上传与本轮无关的成功历史录像/截图；清单记录omitted文件、字节和哈希。单包175MiB暂存/200MB下载上限不变。

## 用户可选择的候选清理（未执行）

仅旧失败运行#41779862816的下列文件，共475204074字节；先下载备份再由用户决定是否清理。保留其报告、截图、音频及已验收f228/完整285等基线。删除不可撤销，不能保证足以恢复额度，GitHub说明刷新可能6–12小时；也可保留全部等待自然过期。不要求付款/提供密码或令牌。当前工具无删除工件能力，不宣称已自动清理。

| 候选文件 | 实际ZIP字节 | GitHub SHA-256 | 到期北京时间 |
|---|---:|---|---|
| [studio-video-01](https://github.com/gordonyan5930-gif/JourneyWest-81/actions/runs/41779862816/artifacts/13299453131) | 173209762 | `231b6616643072d8e4184740a5ab1b7450c700815f07dc4426cc6f6f77506064` | 2026-11-11 14:00:55 +08 |
| [studio-video-02](https://github.com/gordonyan5930-gif/JourneyWest-81/actions/runs/41779862816/artifacts/13299368484) | 182640691 | `7e4fa0ea68542ee40006276de9c59ae931513f7c61f194c55f9c1c9562773354` | 2026-11-11 14:01:01 +08 |
| [studio-debug-01](https://github.com/gordonyan5930-gif/JourneyWest-81/actions/runs/41779862816/artifacts/13299303651) | 13685566 | `b16d8c4c30c0f84c67ba0da76bcab1db42e902c5a3e22d95a093fa3629231db3` | 2026-11-11 14:01:13 +08 |
| [studio-video-03](https://github.com/gordonyan5930-gif/JourneyWest-81/actions/runs/41779862816/artifacts/13299238749) | 105668055 | `d7424e1af5ce5d7456c4d0e549ce53a3ff4e17dd8a22203f4320174681a90ad1` | 2026-11-11 14:01:07 +08 |

存储恢复后重跑当前失败verify job即可验证同SHA，无需重写游戏或制造新提交。恢复前只交本地针对性证据与受保护Preview，最终完整CI/下载交付仍标未完成，禁止进入下一阶段。
