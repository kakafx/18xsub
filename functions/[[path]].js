import yaml from 'js-yaml';
import { StorageFactory, DataMigrator, STORAGE_TYPES } from './storage-adapter.js';

/**
 * 修复Clash配置中的WireGuard问题
 * @param {string} content - Clash配置内容
 * @returns {string} - 修复后的配置内容
 */
function clashFix(content) {
    if (content.includes('wireguard') && !content.includes('remote-dns-resolve')) {
        let lines;
        if (content.includes('\r\n')) {
            lines = content.split('\r\n');
        } else {
            lines = content.split('\n');
        }

        let result = "";
        for (let line of lines) {
            if (line.includes('type: wireguard')) {
                const 备改内容 = `, mtu: 1280, udp: true`;
                const 正确内容 = `, mtu: 1280, remote-dns-resolve: true, udp: true`;
                result += line.replace(new RegExp(备改内容, 'g'), 正确内容) + '\n';
            } else {
                result += line + '\n';
            }
        }
        return result;
    }
    return content;
}

const OLD_KV_KEY = 'misub_data_v1';
const KV_KEY_SUBS = 'misub_subscriptions_v1';
const KV_KEY_PROFILES = 'misub_profiles_v1';
const KV_KEY_SETTINGS = 'worker_settings_v1';
const COOKIE_NAME = 'auth_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000;

// Region mapping configuration
const REGION_MAPPING = {
    'CN': { name: '中国', flag: '🇨🇳', continent: '亚洲' },
    'HK': { name: '香港', flag: '🇭🇰', continent: '亚洲' },
    'TW': { name: '台湾', flag: '🇨🇳', continent: '亚洲' },
    'MO': { name: '澳门', flag: '🇲🇴', continent: '亚洲' },
    'JP': { name: '日本', flag: '🇯🇵', continent: '亚洲' },
    'KR': { name: '韩国', flag: '🇰🇷', continent: '亚洲' },
    'SG': { name: '新加坡', flag: '🇸🇬', continent: '亚洲' },
    'TH': { name: '泰国', flag: '🇹🇭', continent: '亚洲' },
    'IL': { name: '以色列', flag: '🇮🇱', continent: '中东' },
    'GB': { name: '英国', flag: '🇬🇧', continent: '欧洲' },
    'FR': { name: '法国', flag: '🇫🇷', continent: '欧洲' },
    'DE': { name: '德国', flag: '🇩🇪', continent: '欧洲' },
    'US': { name: '美国', flag: '🇺🇸', continent: '北美' },
    'CA': { name: '加拿大', flag: '🇨🇦', continent: '北美' },
    'AU': { name: '澳大利亚', flag: '🇦🇺', continent: '大洋洲' },
    'RU': { name: '俄罗斯', flag: '🇷🇺', continent: '欧亚' }
};

const CONTINENT_FLAGS = {
    '亚洲': '🏴东南亚',
    '中东': '🏴中东',
    '欧洲': '🏴欧洲',
    '北美': '🏴北美',
    '南美': '🏴南美',
    '非洲': '🏴非洲',
    '大洋洲': '🏴大洋洲'
};

/**
 * 计算数据的简单哈希值，用于检测变更
 * @param {any} data - 要计算哈希的数据
 * @returns {string} - 数据的哈希值
 */
function calculateDataHash(data) {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
    }
    return hash.toString();
}

/**
 * 检测数据是否发生变更
 * @param {any} oldData - 旧数据
 * @param {any} newData - 新数据
 * @returns {boolean} - 是否发生变更
 */
function hasDataChanged(oldData, newData) {
    if (!oldData && !newData) return false;
    if (!oldData || !newData) return true;
    return calculateDataHash(oldData) !== calculateDataHash(newData);
}

/**
 * 条件性写入KV存储，只在数据真正变更时写入
 * @param {Object} env - Cloudflare环境对象
 * @param {string} key - KV键名
 * @param {any} newData - 新数据
 * @param {any} oldData - 旧数据（可选）
 * @returns {Promise<boolean>} - 是否执行了写入操作
 */
async function conditionalKVPut(env, key, newData, oldData = null) {
    // 如果没有提供旧数据，先从KV读取
    if (oldData === null) {
        try {
            oldData = await env.MISUB_KV.get(key, 'json');
        } catch (error) {
            // 读取失败时，为安全起见执行写入
            await env.MISUB_KV.put(key, JSON.stringify(newData));
            return true;
        }
    }

    // 检测数据是否变更
    if (hasDataChanged(oldData, newData)) {
        await env.MISUB_KV.put(key, JSON.stringify(newData));
        return true;
    } else {
        return false;
    }
}

// {{ AURA-X: Add - 批量写入优化机制. Approval: 寸止(ID:1735459200). }}
/**
 * 批量写入队列管理器
 */
class BatchWriteQueue {
    constructor() {
        this.queue = new Map();
        this.processing = false;
    }

    add(key, data) {
        this.queue.set(key, data);
        if (!this.processing) {
            this.processQueue();
        }
    }

    async processQueue() {
        this.processing = true;
        while (this.queue.size > 0) {
            const entries = Array.from(this.queue.entries());
            this.queue.clear();
            
            for (const [key, data] of entries) {
                try {
                    await conditionalKVPut(data.env, key, data.value, data.oldValue);
                } catch (error) {
                    console.error(`批量写入失败: ${key}`, error);
                }
            }
        }
        this.processing = false;
    }
}

const batchWriteQueue = new BatchWriteQueue();

/**
 * 检测节点所属地区
 * @param {string} nodeUrl - 节点URL
 * @param {string} nodeName - 节点名称
 * @returns {Object} - 地区信息
 */
function detectNodeRegion(nodeUrl, nodeName = '') {
    const combinedText = (nodeUrl + ' ' + nodeName).toLowerCase();
    
    // 检测特定地区关键词
    for (const [code, region] of Object.entries(REGION_MAPPING)) {
        const keywords = [
            code.toLowerCase(),
            region.name.toLowerCase(),
            region.name.toLowerCase().replace(/[^\u4e00-\u9fa5]/g, ''),
            region.name.includes('国') ? region.name.replace('国', '') : null
        ].filter(Boolean);
        
        if (keywords.some(keyword => combinedText.includes(keyword))) {
            return { code, ...region };
        }
    }
    
    // 检测IP地址段（简化版）
    const ipMatch = nodeUrl.match(/@(\d+\.\d+\.\d+\.\d+)/);
    if (ipMatch) {
        const ip = ipMatch[1];
        const firstOctet = parseInt(ip.split('.')[0]);
        
        // 简化的IP段检测
        if (firstOctet === 1) return { code: 'CN', ...REGION_MAPPING.CN }; // 中国
        if (firstOctet === 8) return { code: 'US', ...REGION_MAPPING.US }; // 美国
        if (firstOctet === 27) return { code: 'AU', ...REGION_MAPPING.AU }; // 澳大利亚
    }
    
    // 默认返回其他地区
    return { 
        code: 'OTHER', 
        name: '其他', 
        flag: '🏴其他', 
        continent: '其他' 
    };
}

/**
 * 统计节点地区分布
 * @param {Array} nodes - 节点数组
 * @returns {Object} - 统计结果
 */
function analyzeNodeDistribution(nodes) {
    const stats = {
        total: nodes.length,
        regions: {},
        continentStats: {}
    };
    
    for (const node of nodes) {
        const region = detectNodeRegion(node.url, node.name);
        
        // 统计具体地区
        if (!stats.regions[region.code]) {
            stats.regions[region.code] = {
                name: region.name,
                flag: region.flag,
                count: 0
            };
        }
        stats.regions[region.code].count++;
        
        // 统计大洲
        if (!stats.continentStats[region.continent]) {
            stats.continentStats[region.continent] = {
                name: region.continent,
                flag: CONTINENT_FLAGS[region.continent] || '🏴其他',
                count: 0
            };
        }
        stats.continentStats[region.continent].count++;
    }
    
    return stats;
}

/**
 * 发送Telegram通知
 * @param {Object} env - Cloudflare环境
 * @param {Object} stats - 节点统计信息
 */
async function sendTelegramNotification(env, stats) {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
        console.log('Telegram通知未配置，跳过发送');
        return;
    }
    
    try {
        let message = `🔔 频道订阅已更新\n\n`;
        message += `📊 节点总数：*${stats.total}*个\n\n`;
        
        // 添加各地区统计
        const sortedRegions = Object.values(stats.regions).sort((a, b) => b.count - a.count);
        for (const region of sortedRegions) {
            if (region.count > 0) {
                message += `${region.flag} ${region.name}节点：*${region.count}*个\n`;
            }
        }
        
        // 添加其他地区统计
        const otherCount = stats.total - Object.values(stats.regions)
            .filter(r => r.name !== '其他')
            .reduce((sum, r) => sum + r.count, 0);
        
        if (otherCount > 0) {
            message += `🏴其他地区节点：*${otherCount}*个\n`;
        }
        
        message += `\n💬 评论区回复"订阅"获取订阅链接\n`;
        message += `🌐 或访问网站首页进行获取`;
        
        const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: env.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            })
        });
        
        if (!response.ok) {
            throw new Error(`Telegram API错误: ${response.status}`);
        }
        
        console.log('Telegram通知发送成功');
    } catch (error) {
        console.error('发送Telegram通知失败:', error);
    }
}

/**
 * 批量替换节点信息
 * @param {Array} nodes - 原始节点数组
 * @param {Object} replacements - 替换配置
 * @returns {Array} - 替换后的节点数组
 */
function batchReplaceNodeInfo(nodes, replacements) {
    return nodes.map(node => {
        let modifiedUrl = node.url;
        
        // 检测节点地区
        const region = detectNodeRegion(node.url, node.name);
        
        // 替换主机地址
        if (replacements.host) {
            modifiedUrl = modifiedUrl.replace(/@([^:]+):/, `@${replacements.host}:`);
        }
        
        // 替换UUID
        if (replacements.uuid) {
            modifiedUrl = modifiedUrl.replace(/vless:\/\/([^@]+)/, `vless://${replacements.uuid}`);
            modifiedUrl = modifiedUrl.replace(/vmess:\/\/([^@]+)/, `vmess://${replacements.uuid}`);
            modifiedUrl = modifiedUrl.replace(/trojan:\/\/([^@]+)/, `trojan://${replacements.uuid}`);
        }
        
        // 替换SNI
        if (replacements.sni) {
            modifiedUrl = modifiedUrl.replace(/sni=([^&]+)/, `sni=${replacements.sni}`);
        }
        
        // 替换proxyip
        if (replacements.proxyip) {
            modifiedUrl = modifiedUrl.replace(/path=([^&]+)/, `path=${replacements.proxyip}`);
        }
        
        // 替换节点名称
        let newName = node.name;
        if (replacements.name) {
            newName = `${region.flag}${region.name}-${replacements.name}`;
        }
        
        // 重新构建URL
        const namePart = modifiedUrl.split('#')[1] || '';
        const baseUrl = modifiedUrl.split('#')[0];
        const finalUrl = `${baseUrl}#${encodeURIComponent(newName)}`;
        
        return {
            ...node,
            url: finalUrl,
            name: newName
        };
    });
}

/**
 * 生成二维码数据URL
 * @param {string} text - 要生成二维码的文本
 * @returns {string} - 二维码数据URL
 */
function generateQRCode(text) {
    // 简化的二维码生成（实际项目中应使用专门的库）
    return `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
            <rect width="200" height="200" fill="white"/>
            <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="8">
                ${text}
            </text>
            <text x="100" y="180" text-anchor="middle" font-family="monospace" font-size="6">
                扫描二维码复制链接
            </text>
        </svg>
    `)}`;
}

// 其余函数保持不变...

export default {
    async fetch(request, env, ctx) {
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            const url = new URL(request.url);
            const path = url.pathname;
            
            // 访客访问订阅链接
            if (path === '/api/visitor/subscriptions' && request.method === 'GET') {
                const settings = await env.MISUB_KV.get(KV_KEY_SETTINGS, 'json') || {};
                const subscriptionLinks = settings.subscriptionLinks || {};
                
                // 获取节点统计
                const allNodes = [];
                const subs = await env.MISUB_KV.get(KV_KEY_SUBS, 'json') || [];
                
                for (const sub of subs) {
                    if (sub.nodes && Array.isArray(sub.nodes)) {
                        allNodes.push(...sub.nodes);
                    }
                }
                
                const stats = analyzeNodeDistribution(allNodes);
                
                return new Response(JSON.stringify({
                    subscriptions: subscriptionLinks,
                    stats: stats,
                    qrcodes: Object.fromEntries(
                        Object.entries(subscriptionLinks).map(([key, url]) => [
                            key, generateQRCode(url)
                        ])
                    )
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            // 节点统计API
            if (path === '/api/nodes/stats' && request.method === 'GET') {
                const allNodes = [];
                const subs = await env.MISUB_KV.get(KV_KEY_SUBS, 'json') || [];
                
                for (const sub of subs) {
                    if (sub.nodes && Array.isArray(sub.nodes)) {
                        allNodes.push(...sub.nodes);
                    }
                }
                
                const stats = analyzeNodeDistribution(allNodes);
                
                return new Response(JSON.stringify(stats), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            // 批量替换节点信息
            if (path === '/api/nodes/batch-replace' && request.method === 'POST') {
                const auth = await checkAuth(request, env);
                if (!auth.authenticated) {
                    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                        status: 401,
                        headers: corsHeaders
                    });
                }
                
                const { replacements, applyToAll = false } = await request.json();
                const subs = await env.MISUB_KV.get(KV_KEY_SUBS, 'json') || [];
                
                let totalModified = 0;
                
                for (let i = 0; i < subs.length; i++) {
                    if (subs[i].nodes && Array.isArray(subs[i].nodes)) {
                        const originalCount = subs[i].nodes.length;
                        subs[i].nodes = batchReplaceNodeInfo(subs[i].nodes, replacements);
                        totalModified += originalCount;
                    }
                }
                
                await env.MISUB_KV.put(KV_KEY_SUBS, JSON.stringify(subs));
                
                // 重新生成所有订阅格式
                await regenerateAllSubscriptions(env);
                
                return new Response(JSON.stringify({
                    success: true,
                    modified: totalModified,
                    message: `成功修改 ${totalModified} 个节点`
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            // 其余API保持不变...
            
        } catch (error) {
            console.error('API错误:', error);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: corsHeaders
            });
        }
    }
};

/**
 * 重新生成所有订阅格式
 * @param {Object} env - Cloudflare环境
 */
async function regenerateAllSubscriptions(env) {
    const subs = await env.MISUB_KV.get(KV_KEY_SUBS, 'json') || [];
    const allNodes = [];
    
    for (const sub of subs) {
        if (sub.nodes && Array.isArray(sub.nodes)) {
            allNodes.push(...sub.nodes);
        }
    }
    
    // 生成各种格式的订阅链接
    const subscriptions = {
        general: generateGeneralSubscription(allNodes),
        base64: generateBase64Subscription(allNodes),
        clash: generateClashSubscription(allNodes),
        singbox: generateSingBoxSubscription(allNodes),
        surge: generateSurgeSubscription(allNodes),
        loon: generateLoonSubscription(allNodes)
    };
    
    // 保存订阅链接
    const settings = await env.MISUB_KV.get(KV_KEY_SETTINGS, 'json') || {};
    settings.subscriptionLinks = subscriptions;
    await env.MISUB_KV.put(KV_KEY_SETTINGS, JSON.stringify(settings));
    
    // 发送Telegram通知
    const stats = analyzeNodeDistribution(allNodes);
    await sendTelegramNotification(env, stats);
}

// 简化的订阅格式生成函数
function generateGeneralSubscription(nodes) {
    return nodes.map(node => node.url).join('\n');
}

function generateBase64Subscription(nodes) {
    const content = generateGeneralSubscription(nodes);
    return btoa(content);
}

function generateClashSubscription(nodes) {
    const config = {
        'proxies': nodes.map(node => ({
            'name': node.name,
            'type': 'vless',
            'server': node.server,
            'port': node.port,
            'uuid': node.uuid,
            'tls': true
        }))
    };
    return yaml.dump(config);
}

function generateSingBoxSubscription(nodes) {
    return JSON.stringify({
        'outbounds': nodes.map(node => ({
            'type': 'vless',
            'tag': node.name,
            'server': node.server,
            'server_port': node.port,
            'uuid': node.uuid
        }))
    }, null, 2);
}

function generateSurgeSubscription(nodes) {
    return nodes.map(node => 
        `${node.name} = vless, ${node.server}, ${node.port}, username=${node.uuid}`
    ).join('\n');
}

function generateLoonSubscription(nodes) {
    return nodes.map(node => 
        `${node.name} = vless://${node.uuid}@${node.server}:${node.port}`
    ).join('\n');
}

/**
 * 检查认证状态
 * @param {Request} request - 请求对象
 * @param {Object} env - 环境变量
 * @returns {Object} - 认证结果
 */
async function checkAuth(request, env) {
    const cookie = request.headers.get('Cookie');
    if (!cookie) return { authenticated: false };
    
    const sessionCookie = cookie.split(';').find(c => c.trim().startsWith(`${COOKIE_NAME}=`));
    if (!sessionCookie) return { authenticated: false };
    
    const sessionId = sessionCookie.split('=')[1];
    const sessionData = await env.MISUB_KV.get(`session:${sessionId}`, 'json');
    
    if (!sessionData || Date.now() > sessionData.expires) {
        return { authenticated: false };
    }
    
    return { authenticated: true, user: sessionData.user };
}