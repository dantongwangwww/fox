<template>
  <div class="main">
    <div class="content">
      <div class="logo" @click="refreshPage">
        <img src="/src/assets/favicon.ico">
        <span>{{ title }}</span>
      </div>
      <div class="lineks" v-show="isLineksVisible">
        <div class="lineks-box">
          <!-- <el-link type="primary" :underline="false" href="http://www.gdfoil.com" target="_blank">双狐官网</el-link> -->
          <el-link type="primary" :underline="false" :href="helpUrl" target="_blank">帮助文档</el-link>
          <!-- <el-link type="primary" :underline="false" href="http://www.gdfoil.com:8888"
            target="_blank">双狐地质图件管理系统</el-link> -->
          <el-link type="primary" :underline="false" target="_blank" @click="showAboutDialog = true">关于</el-link>
        </div>
      </div>
      <button class="reset-btn menu-hamburger hamburger" @click="activeBtn" ref="menuHamburger" aria-label="移动端导航"
        aria-expanded="true" aria-controls="full-screen" data-v-5278b8c5="">
        <span class="hamburger-1"></span>
        <span class="hamburger-2"></span>
        <span class="hamburger-3"></span>
      </button>
    </div>
  </div>
  <!-- 系统关于 -->
  <div class="about-mask" v-if="showAboutDialog" @click="showAboutDialog = false">
    <div class="about-modal" @click.stop>
      <!-- 弹窗头部 -->
      <div class="about-modal-header">
        <h4>关于</h4>
        <span class="close-btn" @click="showAboutDialog = false">×</span>
      </div>
      <!-- 弹窗内容区 -->
      <div class="about-modal-content">
        <div class="about-section">
          <div class="system-logo"><img src="/src/assets/favicon.ico"></div>
          <p class="version-name">{{ title }}</p>
          <p class="version-info">版本号：{{ version }}</p>
          <!-- <p class="update-info">更新时间：2025-12-30</p>
          <p class="version-desc">本次更新：优化3D模型加载速度、新增双狐V6.0文件兼容、修复坐标偏移问题</p> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 常量定义
const MOBILE_BREAKPOINT = 768
const menuHamburger = ref(null)
const isLineksVisible = ref(false)
const isMobile = ref(false)
// 控制弹窗显隐
const showAboutDialog = ref(false)
const helpUrl = ref(`${window.webConfig.helpUrl}`)
const title = ref(`${window.webConfig.title}`)
const version = ref(`${window.webConfig.version}`)

// 防抖处理
const resizeHandler = (() => {
  let ticking = false
  return () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleResize()
        ticking = false
      })
      ticking = true
    }
  }
})()

function toggleBodyScroll(hide) {
  document.body.style.overflow = hide ? 'hidden' : ''
}

function handleResize() {
  const isDesktop = window.innerWidth > MOBILE_BREAKPOINT

  if (isDesktop) {
    // 桌面端逻辑
    isLineksVisible.value = true
    if (menuHamburger.value?.classList.contains('active')) {
      menuHamburger.value.classList.remove('active')
    }
    toggleBodyScroll(false)
    isMobile.value = false
  } else {
    // 移动端逻辑
    if (!isMobile.value) {
      isMobile.value = true
      isLineksVisible.value = false
    }
  }
}

function activeBtn() {
  // 切换菜单状态
  if (menuHamburger.value) {
    menuHamburger.value.classList.toggle('active')
  }

  // 同步状态并控制滚动条
  isLineksVisible.value = !isLineksVisible.value
  if (window.innerWidth < MOBILE_BREAKPOINT) {
    toggleBodyScroll(isLineksVisible.value)
  }
}

// 生命周期钩子
onMounted(() => {
  document.body.addEventListener('swipeleft', () => {
    if (isLineksVisible.value) activeBtn()
  })
  window.addEventListener('resize', resizeHandler)
  handleResize() // 初始化
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler)
  toggleBodyScroll(false) // 恢复初始状态
})
</script>
<style lang="scss" scoped>
button.reset-btn {
  display: none;
  font-family: inherit;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
}

.menu-hamburger {
  width: 20px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  justify-content: center;
  height: 55px;
  margin: 0 14px;
}

.menu-hamburger>span.hamburger-1 {
  width: 50%;
}

.menu-hamburger>span {
  background-color: #303133;
  border-radius: 10px;
  height: 2px;
  margin: 2px 0;
  transition: all .3s cubic-bezier(.645, .045, .355, 1);
  width: 100%;
}

.menu-hamburger>span {
  background-color: #303133;
  border-radius: 10px;
  height: 2px;
  margin: 2px 0;
  transition: all .3s cubic-bezier(.645, .045, .355, 1);
  width: 100%;
}

.menu-hamburger>span.hamburger-3 {
  width: 75%;
}

.menu-hamburger>span {
  background-color: #303133;
  border-radius: 10px;
  height: 2px;
  margin: 2px 0;
  transition: all .3s cubic-bezier(.645, .045, .355, 1);
  width: 100%;
}

.menu-hamburger.active .hamburger-1 {
  transform-origin: bottom;
  transform: rotate(45deg) translate(13px);
}

.menu-hamburger.active .hamburger-2 {
  transform-origin: top;
  transform: rotate(-45deg);
}

.menu-hamburger.active .hamburger-3 {
  transform-origin: bottom;
  width: 50%;
  transform: translate(2px, -10px) rotate(45deg);
}

.main {
  position: fixed; // 关键属性
  top: 0;
  left: 0;
  z-index: 1000; // 确保层级高于其他内容
  height: 78px;
  width: 100%;
  background: rgba(255, 255, 255, 0.95); // 防止内容透过导航栏
  border-bottom: 1px solid #d3d3d3;

  .content {
    margin: auto;
    width: 1308px;
    padding: 0 16px;
    height: 78px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        cursor: pointer;
      }

      img {
        width: 36px;
        height: 36px;
      }

      span {
        font-family: "Poppins", sans-serif !important;
        margin-left: 10px;
        font-size: 20px;
        font-weight: 700;
      }
    }

    .lineks {
      .el-link {
        font-family: "Poppins", sans-serif !important;
        font-size: 13px;
        font-weight: bold;
        color: #1d3d62;
        margin-left: 20px;

        &:hover {
          color: #00a27c;
        }
      }
    }
  }
}

@media (max-width: 1308px) {
  .content {
    width: 100% !important; // 宽度自适应视口
  }
}

@media (max-width: 768px) {
  .lineks {
    position: fixed;
    background: #fff;
    width: 100%;
    height: 100%;
    top: 78px;
    left: 50%;
    padding: 0 18%;
    transform: translateX(-50%); // 向左移动自身宽度的 50%
    z-index: 999; // 确保层级高于其他内容
    overflow: hidden;

    .lineks-box {
      display: flex;
      flex-direction: column;

      .el-link {
        padding: 20px 0;
        border-bottom: 1px solid #d3d3d3;
        font-family: "Poppins", sans-serif !important;
        font-size: 13px;
        font-weight: bold;
        color: #1d3d62;

        &:hover {
          color: #00a27c;
        }
      }
    }
  }

  button.reset-btn {
    display: flex;
  }
}


/* 弹窗遮罩层 */
.about-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* 弹窗主体 */
.about-modal {
  width: 580px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

/* 弹窗头部 */
.about-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background: #f5f7fa;
  border-bottom: 1px solid #e8e8e8;
}

.close-btn {
  font-size: 24px;
  color: #999;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

/* 弹窗内容区 */
.about-modal-content {
  padding: 24px;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

/* 内容分区样式 */
.about-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px dashed #e8e8e8;
}

.about-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

/* 系统logo与版本信息 */
.system-logo {
  font-size: 30px;
  text-align: center;
  margin-bottom: 12px;

  img {
    width: 42px;
    height: 42px;
  }
}

.version-name {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.version-info {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.update-info {
  text-align: center;
  color: #666;
  margin: 0 0 8px 0;
}

.version-desc {
  text-align: center;
  color: #666;
  font-size: 13px;
  margin: 0;
}
</style>