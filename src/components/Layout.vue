<template>
  <div class="layout" id="layout">
    <SceneHeader :title=title />
    <Fab @handlepaly="handleFabClick" class="fab" v-if="$slots.handle" />
    <div class="content" id="content">
      <div class="map-box">
        <slot name="ctrl"></slot>
      </div>
      <div :class="['map-handle', { 'collapsed': isHandleCollapsed }]" v-if="$slots.handle">
        <slot name="handle"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import SceneHeader from '../components/SceneHeader.vue';
import Fab from './Fab.vue';
defineProps({
  title: {
    type: String,
    default: document.title
  }
})

const isHandleCollapsed = ref(false);
const handleFabClick = () => {
  isHandleCollapsed.value = !isHandleCollapsed.value;
};
</script>

<style lang="scss" scoped>
.layout {
  .content {
    margin: 10px;
    height: calc(100dvh - 91px);
    display: flex;

    .map-box {
      flex: 80vw;
      width: calc(100% - 380px);
    }

    .map-handle {
      background-color: #fff;
      height: 100%;
      flex: 20vw;
    }
  }
}

.fab {
  display: none;
}

// 'xs': '480px',
// 'sm': '640px',
// 'md': '768px',
// 'lg': '1024px',
// 'xl': '1280px',
// '2xl': '1536px',
@media screen and (min-width: 0px) and (max-width: 640px) {
  .map-handle.collapsed {
    height: calc(100dvh - 71px) !important;
    width: 50vw;
    z-index: 2002;
    display: block;
    position: absolute;
    top: 71px;
    left: -10px;
    border-right: 1px solid #d3d3d6;
  }

  .map-handle {
    display: none;
  }

  .fab {
    display: block;
  }
}

@media screen and (min-width: 640px) and (max-width: 768px) {
  .main .content .map-box {
    flex: 3;
  }

  .map-handle.collapsed {
    height: calc(100dvh - 71px) !important;
    width: 40vw;
    z-index: 2002;
    display: block;
    position: absolute;
    top: 71px;
    border-right: 1px solid #d3d3d6;
  }

  .map-handle {
    display: none;
  }

  .fab {
    display: block;
  }
}

@media screen and (min-width: 768px) and (max-width: 1024px) {
  .main .content .map-box {
    flex: 3;
  }

  .map-handle.collapsed {
    height: calc(100dvh - 71px) !important;
    width: 40vw;
    z-index: 2002;
    display: block;
    position: absolute;
    top: 71px;
    border-right: 1px solid #d3d3d6;
  }

  .map-handle {
    display: none;
  }

  .fab {
    display: block;
  }
}

@media screen and (min-width: 1024px) and (max-width: 1280px) {
  .main .content .map-box {
    flex: 2;
  }
}

@media screen and (min-width: 1280px) and (max-width: 1536px) {
  .main .content .map-box {
    flex: 2;
  }
}
</style>
