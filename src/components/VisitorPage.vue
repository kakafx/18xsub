<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-950 py-8">
    <div class="max-w-6xl mx-auto px-4">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          18xsub 订阅服务
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          免费获取高速稳定的代理节点订阅
        </p>
      </div>

      <!-- Statistics Card -->
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📊 节点统计
        </h2>
        
        <div v-if="loadingStats" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p class="mt-2 text-gray-600 dark:text-gray-400">加载统计中...</p>
        </div>
        
        <div v-else-if="stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Total Nodes -->
          <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div class="text-2xl font-bold">{{ stats.total }}</div>
            <div class="text-blue-100">总节点数</div>
          </div>
          
          <!-- Region Stats -->
          <div v-for="(region, code) in sortedRegions" :key="code" 
               class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ region.flag }} {{ region.name }}
                </div>
                <div class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {{ region.count }}
                </div>
              </div>
              <div class="text-3xl">{{ region.flag }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Subscription Links -->
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🔗 订阅链接
        </h2>
        
        <div v-if="loadingSubs" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p class="mt-2 text-gray-600 dark:text-gray-400">加载订阅中...</p>
        </div>
        
        <div v-else-if="subscriptions" class="space-y-4">
          <div v-for="(config, format) in subscriptionConfigs" :key="format" 
               class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center">
                <span class="text-2xl mr-2">{{ config.icon }}</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ config.name }}
                </span>
              </div>
              <span class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="config.color">
                {{ config.tag }}
              </span>
            </div>
            
            <div class="space-y-3">
              <!-- URL Display -->
              <div class="flex items-center space-x-2">
                <input 
                  :ref="el => urlInputs[format] = el"
                  :value="subscriptions[format] || ''"
                  readonly
                  class="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-mono text-gray-900 dark:text-white"
                  @click="selectText(format)"
                />
                <button
                  @click="copySubscription(format)"
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
                  :class="{ 'bg-green-600 hover:bg-green-700': copied[format] }"
                >
                  {{ copied[format] ? '✓ 已复制' : '📋 复制' }}
                </button>
              </div>
              
              <!-- QR Code -->
              <div v-if="qrcodes[format]" class="flex justify-center">
                <div class="bg-white p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                  <img :src="qrcodes[format]" :alt="`${format}二维码`" 
                       class="w-32 h-32 object-contain">
                </div>
              </div>
            </div>
            
            <!-- Usage Instructions -->
            <div class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p class="text-sm text-blue-800 dark:text-blue-200">
                💡 {{ config.instruction }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="mt-8 text-center">
        <p class="text-gray-600 dark:text-gray-400 text-sm">
          📱 支持 Clash、Sing-Box、Surge、Loon 等主流客户端
        </p>
        <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">
          🔄 订阅链接会定期更新，建议收藏此页面
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';

// Reactive data
const loadingStats = ref(true);
const loadingSubs = ref(true);
const stats = ref(null);
const subscriptions = ref(null);
const qrcodes = ref({});
const copied = ref({});
const urlInputs = ref({});

// Subscription format configurations
const subscriptionConfigs = {
  general: {
    name: '通用格式',
    icon: '📄',
    tag: '通用',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    instruction: '适用于支持通用订阅格式的客户端，直接导入即可使用'
  },
  base64: {
    name: 'Base64格式',
    icon: '🔐',
    tag: '加密',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    instruction: 'Base64编码格式，兼容大部分订阅转换工具'
  },
  clash: {
    name: 'Clash配置',
    icon: '⚔️',
    tag: 'Clash',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    instruction: '专为Clash客户端优化的配置文件，支持规则分流'
  },
  singbox: {
    name: 'Sing-Box配置',
    icon: '📦',
    tag: 'Sing-Box',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    instruction: 'Sing-Box客户端专用配置，性能优异支持多协议'
  },
  surge: {
    name: 'Surge配置',
    icon: '⚡',
    tag: 'Surge',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    instruction: 'Surge客户端专用配置，macOS和iOS平台首选'
  },
  loon: {
    name: 'Loon配置',
    icon: '🌙',
    tag: 'Loon',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    instruction: 'Loon客户端专用配置，iOS平台轻量级选择'
  }
};

// Computed properties
const sortedRegions = computed(() => {
  if (!stats.value) return {};
  
  return Object.entries(stats.value.regions)
    .sort(([,a], [,b]) => b.count - a.count)
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
});

// Methods
const fetchVisitorData = async () => {
  try {
    const response = await fetch('/api/visitor/subscriptions');
    if (response.ok) {
      const data = await response.json();
      subscriptions.value = data.subscriptions;
      stats.value = data.stats;
      qrcodes.value = data.qrcodes;
    }
  } catch (error) {
    console.error('获取访客数据失败:', error);
  } finally {
    loadingStats.value = false;
    loadingSubs.value = false;
  }
};

const copySubscription = async (format) => {
  if (!subscriptions.value[format]) return;
  
  try {
    await navigator.clipboard.writeText(subscriptions.value[format]);
    copied.value[format] = true;
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      copied.value[format] = false;
    }, 2000);
  } catch (error) {
    console.error('复制失败:', error);
    // Fallback for older browsers
    selectText(format);
  }
};

const selectText = async (format) => {
  await nextTick();
  const input = urlInputs.value[format];
  if (input) {
    input.select();
    input.setSelectionRange(0, 99999); // For mobile devices
  }
};

// Lifecycle
onMounted(() => {
  fetchVisitorData();
});
</script>

<style scoped>
/* Custom styles for better mobile experience */
@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

/* Smooth transitions */
.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Custom scrollbar for better aesthetics */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.dark ::-webkit-scrollbar-thumb {
  background: #4a5568;
}
</style>