# 18xsub 部署指南

## 🚀 快速部署到 Cloudflare Pages

### 准备工作
1. **GitHub 账户** - 用于托管代码
2. **Cloudflare 账户** - 用于部署应用
3. **Telegram 账户** (可选) - 用于推送通知

### 步骤 1: 获取代码

#### 方法一：直接下载
1. 下载本项目的完整代码包
2. 解压并上传到你自己的GitHub仓库

#### 方法二：Fork 项目
1. 访问原始项目仓库
2. 点击 "Fork" 按钮创建你自己的副本

### 步骤 2: 配置 Cloudflare Pages

1. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com
   - 选择你的账户

2. **创建 Pages 项目**
   - 点击左侧菜单 "Workers & Pages"
   - 选择 "Pages" 标签
   - 点击 "创建项目"
   - 选择 "连接到 Git"

3. **连接 GitHub 仓库**
   - 选择你上传/fork的18xsub仓库
   - 点击 "开始设置"

4. **配置构建设置**
   ```
   框架预设: 无
   构建命令: npm run build
   发布目录: dist
   根目录: (留空)
   环境变量: (见下方配置)
   ```

5. **环境变量配置** (可选但推荐)
   ```
   # Telegram 通知配置
   TELEGRAM_BOT_TOKEN=你的机器人Token
   TELEGRAM_CHAT_ID=你的频道ID
   
   # 管理员认证配置
   ADMIN_USERNAME=你的管理员用户名
   ADMIN_PASSWORD=你的管理员密码
   
   # 其他配置
   NODE_ENV=production
   ```

6. **保存并部署**
   - 点击 "保存并部署"
   - 等待构建完成

### 步骤 3: 配置 KV 存储

1. **创建 KV 命名空间**
   - 在 Cloudflare Dashboard 中
   - 点击 "Workers & Pages"
   - 选择 "KV"
   - 点击 "创建命名空间"
   - 名称: `misub-kv`

2. **绑定 KV 到 Pages 项目**
   - 进入你的 Pages 项目设置
   - 选择 "函数" 标签
   - 在 "KV 命名空间绑定" 部分
   - 添加绑定:
     ```
     变量名称: MISUB_KV
     KV 命名空间: misub-kv
     ```

### 步骤 4: Telegram 机器人配置 (可选)

1. **创建 Telegram 机器人**
   - 在 Telegram 中搜索 @BotFather
   - 发送 `/newbot` 命令
   - 按照提示创建机器人
   - 保存提供的 Bot Token

2. **获取频道 ID**
   - 将你的机器人添加到目标频道
   - 在频道中发送一条消息
   - 访问: `https://api.telegram.org/bot<你的Token>/getUpdates`
   - 找到频道 ID (负数)

3. **配置机器人权限**
   - 确保机器人有发送消息的权限
   - 设置为频道管理员

### 步骤 5: 自定义域名 (可选)

1. **添加自定义域名**
   - 在 Pages 项目设置中
   - 选择 "自定义域" 标签
   - 点击 "设置自定义域"
   - 输入你的域名

2. **配置 DNS**
   - 按照 Cloudflare 的指引配置 DNS
   - 通常需要添加 CNAME 记录

## 🔧 本地开发环境

### 系统要求
- Node.js 16+
- npm 或 yarn
- Git

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/18xsub.git
   cd 18xsub
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   访问: http://localhost:3000

4. **构建生产版本**
   ```bash
   npm run build
   ```

## 📋 配置说明

### 必要配置
- **KV 命名空间**: 必须绑定 `MISUB_KV`
- **构建命令**: `npm run build`
- **发布目录**: `dist`

### 可选配置
- **Telegram 通知**: 配置 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_CHAT_ID`
- **管理员认证**: 配置 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`
- **自定义域名**: 在 Pages 设置中配置

### 环境变量详解

```env
# Telegram 配置
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxyz
TELEGRAM_CHAT_ID=-1001234567890

# 管理员配置
ADMIN_USERNAME=admin
ADMIN_PASSWORD=securepassword123

# 应用配置
NODE_ENV=production
VITE_APP_NAME=18xsub
VITE_APP_VERSION=2.0.0
```

## 🧪 测试部署

### 功能测试清单
- [ ] 首页正常加载
- [ ] 管理员登录功能
- [ ] 访客模式访问
- [ ] 节点统计显示
- [ ] 订阅链接生成
- [ ] 二维码生成
- [ ] 批量替换功能
- [ ] Telegram推送 (如配置)

### 性能测试
- [ ] 页面加载速度
- [ ] PWA 功能正常
- [ ] 移动端适配
- [ ] 深色模式切换

## 🔍 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本
   - 确保依赖安装完整
   - 查看构建日志

2. **KV 绑定错误**
   - 确认 KV 命名空间已创建
   - 检查绑定变量名称是否正确
   - 查看函数日志

3. **Telegram 推送失败**
   - 检查 Bot Token 是否正确
   - 确认机器人有发送权限
   - 查看频道 ID 是否正确

4. **访问问题**
   - 检查域名配置
   - 确认 DNS 设置正确
   - 查看 Pages 部署状态

### 调试技巧

1. **查看日志**
   - Cloudflare Dashboard → Pages → 你的项目 → 函数 → 日志

2. **本地调试**
   ```bash
   npm run dev
   ```

3. **构建测试**
   ```bash
   npm run build
   npm run preview
   ```

## 📊 监控和维护

### 性能监控
- 使用 Cloudflare Analytics 监控访问情况
- 设置警报通知异常状况
- 定期检查 KV 存储使用情况

### 定期维护
- 更新依赖包版本
- 备份重要配置
- 监控 Telegram 推送状态
- 清理过期数据

## 🚀 高级配置

### 自定义地区映射
修改 `functions/[[path]].js` 中的 `REGION_MAPPING` 配置

### 自定义推送格式
修改 Telegram 推送模板，调整消息格式

### 添加新客户端支持
在订阅生成函数中添加新的客户端格式

---

**恭喜！** 🎉 完成以上步骤后，你的18xsub实例应该已经成功部署并运行。如有问题，请参考故障排除部分或提交Issue寻求帮助。