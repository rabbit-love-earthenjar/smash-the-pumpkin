# 打爆南瓜 · Smash the Pumpkin

京都夜神社的小狐狸与 AI 小幽灵，用雕刻南瓜打一场排球。玩家在右、电脑在左。支持中文／日文／英文、手机触屏和电脑键盘；独立 H5 番外，不需要安装依赖。

在线试玩：[打爆南瓜](https://smash-the-pumpkin.dongfangjin69.chatgpt.site/) · 源码：[GitHub](https://github.com/rabbit-love-earthenjar/smash-the-pumpkin)

## 直接游玩

用 Chrome / Edge 双击打开 `dist/打爆南瓜.html`。这是已将代码、样式与既有角色／幽灵图内嵌的单文件版本，可以离线游玩并单独复制。

源码入口为 `dist/index.html`，也能直接打开，但请保留同目录代码和 assets 文件夹。

## 操作与规则

| 操作 | 按键 |
| --- | --- |
| 左右移动 | A / D |
| 跳跃 | W，松开后可再次起跳 |
| 快速下落 | 空中按 S |
| 挥击 | 空格；可按住连续挥击，有冷却 |
| 暂停 / 继续 | Esc / P，或右上角按钮 |

- 手机只显示左右两个大按钮；靠近南瓜自动挥击，高球接近时自动起跳。对局中操作栏固定在屏幕底部，隐藏键盘说明和长篇介绍。
- 南瓜落在对方半场得 1 分，每局先得 3 分获胜，不要求净胜两分。
- 连续赢下 3 局触发结局；输 1 局会将连胜归零，输单个球不会。
- AI 会预测落点、追球、跳跃和挥击；第一局入门、第二局进阶、第三局挑战，速度与反应逐局提高，接球误差逐局降低。输局回到第一档。
- 3 连胜后南瓜变成炸弹，倒数 3 → 2 → 1，然后炸成糖果，显示原样文案 **happy hallow day**。
- 换窗口或切换标签页会自动暂停；结局可重新挑战。音效由浏览器本地合成，点击开始后启用，可静音。
- 顶部为距离下一次 10 月 31 日的天数，按 Asia/Tokyo 日历自动计算；2026-10-20 为 11 天。

## 本地开发

需要 Node.js，无额外包：

```powershell
node serve.cjs
# 默认 http://127.0.0.1:4173/；端口占用时：node serve.cjs 4174
node --test tests/engine.test.cjs
node build-standalone.cjs
```

`engine.js` 集中保存可调规则 CONFIG、物理、AI 与流程；`renderer.js` 负责 Canvas 球场/角色/特效；`app.js` 负责输入、HUD、触屏、音效、倒计时和暂停；`i18n.js` 为三个轻量语言包；`styles.css` 负责网页布局。修改源码后重新运行单文件打包。

## 资源与验证边界

四张 `miko_*_transparent.png` 原样复制自项目 `Assets/Art`，来源为 `Stage_1_2.unity` 的既有角色引用。电脑使用作者最终指定的 `Assets/Art/easy_ghost.png`，完整原样复制。该图为黑底 RGB，Canvas 的 screen 合成保留蓝光并使黑底融入夜景；没有处理原图或生成裁片。没有改动源图、`.meta`、Unity Import Settings 或重新导入。球场、雕刻南瓜和特效由 Canvas 绘制。

本次 Node 自动测试与浏览器检查在项目开发记录中留档。自动获胜脚本验证玩法可达，不代表真人三连胜、真实手机设备手感或趣味性验收。原 Unity 项目未启动或重验。

本目录包含浏览器版与离线版。GitHub 仅发布此小游戏的代码与必要资源；Unity 项目及其既有 Git 变更未暂存或提交。角色资源沿用项目所有权，未额外授予素材再分发许可证。
