# 本轮原始合成音效 v0.1

四个PCM16/单声道/24000Hz WAV由项目内`scripts/generate-combat-audio.mjs`用固定种子噪声、正弦与包络合成：attack（挥棍）、hit（命中）、danger（危险钟声）、skill（棍影）。无外部采样、无受保护游戏音效、未购买资产或服务；来源与校验见运行manifest。

WebAudio在用户操作后解锁，最多5声部，命中按真实伤害事件触发；菜单可立即静音，重试停止旧声部但保留偏好。没有配音或最终音乐/混音。浏览器测试验证解码、实际播放事件、主增益静音与重试清理；CI没有真实扬声器，Playwright录屏不含系统音轨，另提供WAV试听，声音质感与音画听感仍待用户在线审核。

Round2 adds light/heavy/miss/hurt-v02.wav from the same deterministic project synthesis script. Light impact, heavy low thump, empty swing and incoming injury use distinct waveforms. Maximum simultaneous voices reduced5→3, individual gains0.065—0.14. No recordings/licensed packs/purchases. Headless tests verify buffers/mute/cleanup, not speaker quality; WAVs supplied separately because Playwright video has no audio track. Mix awaits user listening review.
