# C 盘占用检查

检查日期：2026-10-30，约 22:30～22:34（北京时间）。报告、脚本均保存在 F 盘项目内。扫描了用户 .cache、.codex、AppData/Local、AppData/Roaming 和 Windows/Temp；不跟随目录链接，约 7.4 万个文件，1 个位置不可访问。

## 主要发现

| 路径 | 当前文件逻辑大小 | 创建时间线 | 说明 |
|---|---:|---|---|
| C:\Users\sx_71\.cache\codex-runtimes\codex-primary-runtime | 1.35 GiB | 今天 12:26 | Codex 共享 Node、Python、文档和表格运行时，并非游戏资源 |
| C:\Users\sx_71\AppData\Local\OpenAI\Codex | 700 MiB | 今天 11:08 | Codex 程序及电脑控制运行时 |
| C:\Users\sx_71\.codex\plugins\.plugin-appserver | 454 MiB | 今天 12:01 | 插件服务程序；codex.exe 检查为独立文件，并非与应用目录共享的硬链接 |
| C:\Users\sx_71\.cache\codex-runtimes\codex-runtime-install-* | 约 102 MiB，扫描中仍变化 | 今天 21:14、22:27 | 运行时下载临时目录；观察到其中一个下载文件从 0 增长至约 12 MiB，不宜按废弃缓存直接移动 |
| C:\Users\sx_71\AppData\Roaming\Codex | 约 190 MiB，扫描中仍变化 | 今天创建，晚上也有更新 | 内置网页等应用数据；21 点之后创建的文件约 62 MiB |
| C:\Users\sx_71\AppData\Local\Temp\Tencent | 260 MiB | 今天 12:27 | 腾讯会议临时文件，与游戏项目无关 |
| C:\pagefile.sys | 1.25 GiB | 今天 20:14 创建，晚上更新 | Windows 虚拟内存文件；不知道早间大小，不能认为它全部属于今天新增 |

检查时 C 盘剩余约 2.44 GiB（约 2.62 GB）。以上是文件逻辑大小，非逐扇区实际分配量；创建时间也不能代替早间磁盘快照。没有早间基线，无法精确还原从“四个多 G”到“两 G 多”的每一笔净变化。

最大的已确认今日创建项目是 Codex 共享运行时及程序/插件服务；它们足以解释今天数 GiB 的占用来源。部分文件早于晚间游戏开发，因此不能把它们全部归因于当前聊天。晚上另有持续下载、Codex 网页缓存及 Windows 分页文件变化。

## 本次处理范围

- 已确认游戏第二版发布成功，公开网页与客户端匿名 HTTP 请求均为 200，客户端包含探头和每秒回血 20 的更新。
- 游戏源码、Excel 配表、机制文档、依赖和构建包都在 F 盘。项目 npm 缓存指向 .cache/npm，项目临时目录指向 .cache/tmp。
- 检查先前涉及的 C 盘项目临时路径，没有发现可归属于本项目且需要迁移的产物。
- 未删除或直接迁移正在运行的 Codex 共享运行时、插件服务、浏览器资料或系统分页文件。这些不是游戏目录，直接搬走可能让当前 Codex 失效；如需迁移，应退出应用后使用保留原路径的目录联接方案，并先验证回退路径。
- 未清理腾讯、微信、WPS、浏览器等其他应用数据。用户本轮要求是定位来源，没有把其他应用的临时文件当成可随意删除的数据。

原始目录大小报告：项目 outputs/disk-audit.json。扫描脚本：scripts/disk-audit.py。
