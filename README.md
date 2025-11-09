# 18xsub - 增强版订阅管理工具

基于 [MiSub](https://github.com/imzyb/MiSub) 项目开发的增强版代理订阅管理工具，支持节点地区统计、Telegram推送、批量替换和访客模式等高级功能。

## ✨ 主要特性

### 🌍 节点地区统计与可视化
- 自动检测节点所属地区（中国、香港、台湾、澳门、日本、韩国、新加坡等）
- 使用国旗emoji标识各地区节点
- 实时统计各地区节点数量和占比
- 支持大洲级别的统计汇总

### 📢 Telegram自动推送
- 订阅更新后自动推送节点统计到指定Telegram频道
- 包含总节点数、各地区节点数统计
- 支持自定义推送内容和格式

### 🔄 批量节点管理
- 批量替换节点主机地址、UUID、SNI、ProxyIP等信息
- 智能节点重命名，自动添加地区标识
- 支持预览替换效果，确保操作安全

### 👥 访客模式
- 无需登录即可访问订阅链接
- 支持多种客户端格式的订阅链接
- 自动生成订阅链接二维码
- 访客可查看节点统计信息

### 📱 多客户端支持
- **通用格式**: 标准VLESS/VMess/Trojan链接
- **Base64格式**: 编码后的订阅内容
- **Clash配置**: 完整的Clash客户端配置
- **Sing-Box配置**: 高性能代理客户端配置
- **Surge配置**: macOS/iOS平台专用
- **Loon配置**: iOS轻量级客户端配置

### 🔧 技术特性
- 基于Cloudflare Workers和Pages部署
- PWA支持，可安装为桌面/移动应用
- 响应式设计，完美适配各种设备
- 深色模式支持
- 无服务器架构，高性能低延迟

## 🚀 快速开始

### 部署到Cloudflare

1. **Fork本项目**到你的GitHub账户

2. **登录Cloudflare Dashboard**
   - 进入Workers & Pages
   - 创建新的Pages项目

3. **连接GitHub仓库**
   - 选择你fork的18xsub仓库
   - 配置构建设置：
     ```
     构建命令: npm run build
     发布目录: dist
     ```

4. **配置环境变量**（可选）
   ```env
   # Telegram通知配置
   TELEGRAM_BOT_TOKEN=你的机器人Token
   TELEGRAM_CHAT_ID=目标频道ID
   
   # 管理员认证
   ADMIN_USERNAME=管理员用户名
   ADMIN_PASSWORD=管理员密码
   ```

5. **部署**并访问你的18xsub实例

### 本地开发

```bash
# 克隆项目
git clone https://github.com/yourusername/18xsub.git
cd 18xsub

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 📖 使用指南

### 管理后台
1. 访问你的18xsub实例
2. 使用管理员账号登录
3. 添加订阅源和管理节点
4. 查看节点统计和进行批量操作

### 访客模式
1. 点击首页"访客入口"按钮
2. 查看节点统计信息
3. 复制所需的订阅链接
4. 扫描二维码快速导入

### Telegram推送配置
1. 创建Telegram机器人
2. 获取机器人Token和频道ID
3. 在Cloudflare环境变量中配置
4. 订阅更新将自动推送到频道

## 🔧 配置说明

### 地区映射配置
工具内置了以下地区识别映射：

| 地区代码 | 名称 | 国旗 | 大洲 |
|---------|------|------|------|
| CN | 中国 | 🇨🇳 | 亚洲 |
| HK | 香港 | 🇭🇰 | 亚洲 |
| TW | 台湾 | 🇨🇳 | 亚洲 |
| MO | 澳门 | 🇲🇴 | 亚洲 |
| JP | 日本 | 🇯🇵 | 亚洲 |
| KR | 韩国 | 🇰🇷 | 亚洲 |
| SG | 新加坡 | 🇸🇬 | 亚洲 |
| TH | 泰国 | 🇹🇭 | 亚洲 |
| IL | 以色列 | 🇮🇱 | 中东 |
| GB | 英国 | 🇬🇧 | 欧洲 |
| FR | 法国 | 🇫🇷 | 欧洲 |
| DE | 德国 | 🇩🇪 | 欧洲 |
| US | 美国 | 🇺🇸 | 北美 |
| CA | 加拿大 | 🇨🇦 | 北美 |
| AU | 澳大利亚 | 🇦🇺 | 大洋洲 |
| RU | 俄罗斯 | 🇷🇺 | 欧亚 |

其他地区自动归类并使用相应大洲标识。

### 批量替换示例
替换前节点：
```
vless://f934df12-b33a-43cc-9382-9444e80d3124@173.245.58.97:443/?type=ws&encryption=none&host=dl.ouuuo.ggff.net&path=%2Fip%3Dproxyip.fxxk.dedyn.io&security=tls&sni=dl.ouuuo.ggff.net&fp=random&packetEncoding=xudp#%28%E2%97%94.%CC%AE%E2%97%94%29%20-%20CF%E4%BC%98%E9%80%89-%E7%94%B5%E4%BF%A1%E3%80%90TG%3Apikpak18x%E3%80%91
```

配置替换：
- 主机地址: `www.baidu.com`
- UUID: `f934d012-b30a-40cc-9380-0444e80d3124`
- SNI: `www.12306.cn`
- 节点名称: `TG@pikpak18x`
- ProxyIP: `www.4399.com`

替换后节点：
```
vless://f934d012-b30a-40cc-9380-0444e80d3124@173.245.58.97:443/?type=ws&encryption=none&host=www.baidu.com&path=www.4399.com&security=tls&sni=www.12306.cn&fp=random&packetEncoding=xudp#🇭🇰香港-TG@pikpak18x
```

## 🛡️ 安全说明

- 所有数据处理在客户端完成，保护隐私
- 支持HTTPS加密传输
- 管理员认证基于会话机制
- 敏感信息存储在Cloudflare KV中
- 支持CORS跨域安全控制

## 📄 许可证

本项目基于 [MiSub](https://github.com/imzyb/MiSub) 开发，遵循原项目许可证。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📞 联系方式

- Telegram频道: [@pikpak18x](https://t.me/pikpak18x)
- GitHub Issues: [项目Issues页面](https://github.com/imzyb/MiSub/issues)

---

**注意**: 本项目仅供学习和研究使用，请勿用于非法用途。使用本服务即表示您同意遵守当地法律法规。