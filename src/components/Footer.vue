<template>
  <footer class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col items-center space-y-4">
        <!-- Logo and Description -->
        <div class="text-center">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            18xsub
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 max-w-md">
            基于 Cloudflare 的高性能订阅转换和管理工具，支持多种代理协议和客户端格式。
          </p>
        </div>

        <!-- Links -->
        <div class="flex items-center space-x-6">
          <a
            href="https://t.me/pikpak18x"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
          >
            📢 Telegram频道
          </a>
          
          <span class="text-gray-300 dark:text-gray-600">•</span>
          
          <a
            href="https://github.com/imzyb/MiSub"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
          >
            🔗 18SUB开源项目
          </a>
          
          <span class="text-gray-300 dark:text-gray-600">•</span>
          
          <button
            @click="showAbout = true"
            class="text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
          >
            ℹ️ 关于
          </button>
        </div>

        <!-- Copyright -->
        <div class="text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            © {{ currentYear }} 18xsub. 基于 
            <a href="https://github.com/imzyb/MiSub" target="_blank" rel="noopener noreferrer" 
               class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              MiSub项目
            </a> 开发
          </p>
        </div>

        <!-- PWA Install Prompt -->
        <div v-if="showInstallPrompt" class="text-center">
          <button
            @click="installPWA"
            class="inline-flex items-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
          >
            📱 安装应用
          </button>
        </div>
      </div>
    </div>

    <!-- About Modal -->
    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showAbout"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click="showAbout = false"
      >
        <div
          class="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6"
          @click.stop
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              关于 18xsub
            </h3>
            <button
              @click="showAbout = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div class="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              18xsub 是一个基于 Cloudflare Workers 和 Pages 的高性能代理订阅管理工具。
              支持多种代理协议和客户端格式，提供节点地区统计和自动更新功能。
            </p>
            
            <div class="space-y-2">
              <h4 class="font-medium text-gray-900 dark:text-white">✨ 主要特性：</h4>
              <ul class="list-disc list-inside space-y-1">
                <li>支持 VLESS、VMess、Trojan 等多种协议</li>
                <li>自动节点地区识别和统计</li>
                <li>支持 Clash、Sing-Box、Surge、Loon 等主流客户端</li>
                <li>Telegram 频道自动推送更新</li>
                <li>批量节点信息替换和重命名</li>
                <li>访客模式无需登录即可获取订阅</li>
                <li>PWA 支持，可安装为桌面应用</li>
              </ul>
            </div>
            
            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p class="text-xs">
                本项目仅供学习和研究使用，请勿用于非法用途。
                使用本服务即表示您同意遵守当地法律法规。
              </p>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </footer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// State
const showAbout = ref(false);
const showInstallPrompt = ref(false);
const deferredPrompt = ref(null);

// Computed
const currentYear = computed(() => new Date().getFullYear());

// Methods
const installPWA = async () => {
  if (!deferredPrompt.value) return;
  
  deferredPrompt.value.prompt();
  const { outcome } = await deferredPrompt.value.userChoice;
  
  if (outcome === 'accepted') {
    console.log('用户接受了PWA安装');
  }
  
  deferredPrompt.value = null;
  showInstallPrompt.value = false;
};

// Lifecycle
onMounted(() => {
  // Listen for PWA install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt.value = e;
    showInstallPrompt.value = true;
  });
  
  // Hide install prompt if app is already installed
  window.addEventListener('appinstalled', () => {
    showInstallPrompt.value = false;
  });
});
</script>