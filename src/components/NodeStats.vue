<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        📊 节点统计
      </h2>
      <button
        @click="refreshStats"
        :disabled="loading"
        class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg 
          :class="{ 'animate-spin': loading }"
          class="w-4 h-4 mr-1" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        {{ loading ? '刷新中...' : '刷新' }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !stats" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-400">加载统计中...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <div class="text-red-500 mb-2">❌</div>
      <p class="text-gray-600 dark:text-gray-400">{{ error }}</p>
      <button
        @click="refreshStats"
        class="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
      >
        重试
      </button>
    </div>

    <!-- Stats Content -->
    <div v-else-if="stats" class="space-y-6">
      <!-- Total Nodes Card -->
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-3xl font-bold">{{ stats.total }}</div>
            <div class="text-blue-100">总节点数</div>
          </div>
          <div class="text-4xl opacity-80">🌐</div>
        </div>
      </div>

      <!-- Region Distribution -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          地区分布
        </h3>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(region, code) in sortedRegions"
            :key="code"
            class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center">
                <span class="text-2xl mr-2">{{ region.flag }}</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ region.name }}
                </span>
              </div>
              <span class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {{ region.count }}
              </span>
            </div>
            
            <!-- Progress Bar -->
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                class="bg-indigo-600 dark:bg-indigo-400 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${(region.count / stats.total) * 100}%` }"
              ></div>
            </div>
            
            <!-- Percentage -->
            <div class="text-right mt-1">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ ((region.count / stats.total) * 100).toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Continent Stats -->
      <div v-if="stats.continentStats && Object.keys(stats.continentStats).length > 0">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          大洲统计
        </h3>
        
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div
            v-for="(stat, continent) in stats.continentStats"
            :key="continent"
            class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center"
          >
            <div class="text-xl mb-1">{{ stat.flag }}</div>
            <div class="text-sm font-medium text-gray-900 dark:text-white">
              {{ stat.name }}
            </div>
            <div class="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {{ stat.count }}
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          @click="showBatchReplace = true"
          class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
        >
          🔄 批量替换节点信息
        </button>
        
        <button
          @click="exportStats"
          class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          📊 导出统计
        </button>
      </div>
    </div>

    <!-- Batch Replace Modal -->
    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showBatchReplace"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click="showBatchReplace = false"
      >
        <div
          class="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          @click.stop
        >
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                🔄 批量替换节点信息
              </h3>
              <button
                @click="showBatchReplace = false"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            </div>

            <form @submit.prevent="submitBatchReplace" class="space-y-4">
              <!-- Host Replacement -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  主机地址替换
                </label>
                <input
                  v-model="replacementForm.host"
                  type="text"
                  placeholder="例如：www.baidu.com"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
              </div>

              <!-- UUID Replacement -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  UUID 替换
                </label>
                <input
                  v-model="replacementForm.uuid"
                  type="text"
                  placeholder="例如：f934d012-b30a-40cc-9380-0444e80d3124"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
              </div>

              <!-- SNI Replacement -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SNI 替换
                </label>
                <input
                  v-model="replacementForm.sni"
                  type="text"
                  placeholder="例如：www.12306.cn"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
              </div>

              <!-- Node Name Replacement -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  节点名称替换
                </label>
                <input
                  v-model="replacementForm.name"
                  type="text"
                  placeholder="例如：TG@pikpak18x"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
              </div>

              <!-- Proxy IP Replacement -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ProxyIP 替换
                </label>
                <input
                  v-model="replacementForm.proxyip"
                  type="text"
                  placeholder="例如：www.4399.com"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
              </div>

              <div class="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  @click="showBatchReplace = false"
                  class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  :disabled="replacing"
                  class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {{ replacing ? '处理中...' : '确认替换' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToastStore } from '../stores/toast';

// Props
const props = defineProps({
  subscriptions: {
    type: Array,
    default: () => []
  }
});

// Store
const toastStore = useToastStore();

// State
const loading = ref(false);
const error = ref(null);
const stats = ref(null);
const showBatchReplace = ref(false);
const replacing = ref(false);
const replacementForm = ref({
  host: '',
  uuid: '',
  sni: '',
  name: '',
  proxyip: ''
});

// Computed
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
const fetchStats = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await fetch('/api/nodes/stats');
    if (!response.ok) {
      throw new Error('获取统计数据失败');
    }
    
    stats.value = await response.json();
  } catch (err) {
    error.value = err.message || '获取统计数据失败';
    console.error('获取节点统计失败:', err);
  } finally {
    loading.value = false;
  }
};

const refreshStats = () => {
  fetchStats();
};

const exportStats = () => {
  if (!stats.value) return;
  
  const exportData = {
    timestamp: new Date().toISOString(),
    total: stats.value.total,
    regions: stats.value.regions,
    continentStats: stats.value.continentStats
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `节点统计_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  toastStore.showToast('统计数据导出成功', 'success');
};

const submitBatchReplace = async () => {
  replacing.value = true;
  
  try {
    const response = await fetch('/api/nodes/batch-replace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        replacements: replacementForm.value,
        applyToAll: true
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      toastStore.showToast(result.message || '节点信息替换成功', 'success');
      showBatchReplace.value = false;
      
      // Reset form
      replacementForm.value = {
        host: '',
        uuid: '',
        sni: '',
        name: '',
        proxyip: ''
      };
      
      // Refresh stats
      await fetchStats();
    } else {
      throw new Error(result.message || '替换失败');
    }
  } catch (error) {
    console.error('批量替换失败:', error);
    toastStore.showToast(error.message || '替换失败，请重试', 'error');
  } finally {
    replacing.value = false;
  }
};

// Lifecycle
onMounted(() => {
  fetchStats();
});
</script>