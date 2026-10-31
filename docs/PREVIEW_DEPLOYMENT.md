# 受保护的P0-A云端预览

## 当前状态
团队授权已生效，已先只读检查账户、团队和全部项目，再新建独立项目 `journeywest-81`（prj_ZeCHC7I2vdSMfYsPqsuOffNkhEGN）。仅关联游戏私有仓库。现有 `sensor-sorting-review` 项目未作写入，其updatedAt核对保持1793421932328。

已成功构建的受保护预览：[打开P0-A预览](https://journeywest-81-3mvpictue-suibo.vercel.app)。部署ID dpl_4ecuRpHNVvHnrWE5XgVvu2pcfb36，状态READY，API目标staging（预览），分支feat/p0-a-prototype，源SHA e16c0a5f00f4463bc5775bb6e86168f0245342b0。

Vercel项目回读确认ssoProtection.enabled=true、deploymentType=prod_deployment_urls_and_all_previews。没有创建绕过认证的分享链接，没有购买或升级服务。npm ci及npm run build成功，产物为dist。当前工具无法读取或操作用户的已登录浏览器，因此在线地图、选角、移动和战斗尚未实际验证；网页抓取工具也无法访问该保护地址，不能据此断言访问保护测试通过。已向用户提供真实HTTPS地址用于登录访问确认。

异常记录：首次请求显式target=preview，但服务返回target=production；预览专用门禁立刻跳过，记录dpl_GfAW5LZkw2pZxFpj15zyXM6b4j9z最终CANCELED，未成功发布。按REST API支持的target=staging重试后，构建环境确认为preview并成功。不使用Production链接作为试玩地址。

后续推送更新预览的实际结果待核验；本文件本次更新将触发Git集成，核对新部署分支和SHA后再确认。

## 构建配置
- 框架：Vite；Node.js 24；Root Directory为仓库根目录。
- 安装：`npm ci`；构建：`npm run build`；输出：`dist`。
- vercel.json仅允许feat/p0-a-prototype自动部署。Ignored Build Step脚本只在preview环境且分支精确匹配时返回1允许构建；其他环境、分支或缺失元数据返回0跳过。
- Vite默认base为`/`，适用于Vercel根路径，当前游戏没有客户端子路由，无需修改Vite配置。
- X-Robots-Tag仅限制索引，**不是访问保护**。

## 授权与项目设置（必须在首个部署之前完成）
1. 在ChatGPT设置的应用中连接Vercel，登录你自己的账户；不要发送密码或token到聊天。
2. Vercel GitHub集成只授权私有仓库gordonyan5930-gif/JourneyWest-81；保持Private。连接ChatGPT的Vercel与授权Vercel读取GitHub仓库是两步。
3. 先创建独立的journeywest-81项目并配置，再发起部署。不要使用会立即创建Production部署的一键Import/Deploy流程。
4. 项目级Settings → Deployment Protection启用Vercel Authentication，覆盖Preview（Standard Protection或账户已有可用的更严格范围）；保存并回读确认。不得生成绕过保护的公开分享链接，不开启付费功能或试用。
5. 项目Production Branch不得设为feat/p0-a-prototype。禁止Production部署；main没有本分支的vercel.json，**本分支配置不能替代项目级限制**。项目级Ignored Build Step也应设置同等环境/分支门禁（使用内联命令，避免main缺少脚本）：
   `if [ "$VERCEL_ENV" = "preview" ] && [ "$VERCEL_GIT_COMMIT_REF" = "feat/p0-a-prototype" ]; then exit 1; else exit 0; fi`
6. 使用Git源分支feat/p0-a-prototype，明确指定Preview目标。验证部署类型为Preview、源SHA与PR头一致、保护已启用，再提供HTTPS地址。
7. 关联该私有仓库后，本分支后续推送应自动更新对应分支预览URL；每次部署的唯一URL可用于复核版本。需要核验Git集成及分支别名，不能仅凭配置宣称已生效。

## 运行与保护验证
- 未登录浏览器应显示Vercel登录或访问请求，不能直接得到游戏或JS资源。
- 获授权并登录的真实浏览器打开部署URL：检查Canvas地图、连续角色选择、地图移动、山体阻挡及自然帧战斗。
- 保存实际预览URL、源SHA、Vercel部署ID、构建日志、保护检查及截图；不能把本地CI截图当作在线预览验证。
- 当前原有CI使用本地Vite启动，不代表已验证Vercel站点。Vercel授权浏览器会话不可用时明确标记交互未验证，不关闭保护、不绕过登录。

## 受阻时的替代路径
优先由用户连接Vercel后继续。若集成无法写项目设置，可由用户在Vercel完成项目创建、保护与Git授权，再交由已授权工具创建Preview。若Vercel账户本身无法使用，可另行采用带账户访问控制的私有预览托管；必须先核验访问保护和免费可用条件，不自动改用公开GitHub Pages或公开静态站点。

参考：[Vercel Git配置](https://vercel.com/docs/project-configuration/git-configuration)、[Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication)。
