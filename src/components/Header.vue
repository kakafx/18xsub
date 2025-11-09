<template>
  <header class="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <h1 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              18xsub
            </h1>
          </div>
          <div class="ml-4 hidden sm:block">
            <span class="text-sm text-gray-500 dark:text-gray-400">
              基于 Cloudflare 的订阅转换和管理工具
            </span>
          </div>
        </div>

        <!-- Navigation Actions -->
        <div class="flex items-center space-x-4">
          <!-- Visitor Mode Toggle -->
          <template v-if="!isLoggedIn">
            <button
              v-if="!isVisitorMode"
              @click="$emit('enter-visitor')"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              👥 访客入口
            </button>
            
            <button
              v-else
              @click="$emit('exit-visitor')"
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              🔙 返回登录
            </button>
          </template>

          <!-- User Actions -->
          <template v-if="isLoggedIn">
            <!-- Theme Toggle -->
            <ThemeToggle />
            
            <!-- User Menu -->
            <div class="relative">
              <button
                @click="toggleUserMenu"
                class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <div class="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <span class="text-indigo-600 dark:text-indigo-400 font-medium">
                    {{ userInitial }}
                  </span>
                </div>
              </button>

              <!-- Dropdown Menu -->
              <transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <div
                  v-if="showUserMenu"
                  class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-900 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                >
                  <div class="py-1">
                    <button
                      @click="handleLogout"
                      class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      🚪 退出登录
                    </button>
                  </div>
                </div>
              </transition>
            </div>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSessionStore } from '../stores/session';
import ThemeToggle from './ThemeToggle.vue';

// Props
const props = defineProps({
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  isVisitorMode: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['logout', 'enter-visitor', 'exit-visitor']);

// Store
const sessionStore = useSessionStore();
const { user } = storeToRefs(sessionStore);

// State
const showUserMenu = ref(false);

// Computed
const userInitial = computed(() => {
  return user.value?.username?.charAt(0)?.toUpperCase() || 'U';
});

// Methods
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
};

const handleLogout = () => {
  showUserMenu.value = false;
  emit('logout');
};

// Close menu when clicking outside
document.addEventListener('click', (event) => {
  if (showUserMenu.value && !event.target.closest('.relative')) {
    showUserMenu.value = false;
  }
});
</script>