<template>
  <svg role="img" aria-hidden="true"   class="svg-icon">
    <use :href="prefix + name" :fill="color" class="svg-path"></use>
  </svg>
</template>

<script setup>
// 接收父组件传递过来的参数
defineProps({
  prefix: {
    type: String,
    default: "#icon-"
  },
  // svg名称
  name: String,
  // svg颜色
  color: {
    type: String,
    default: "#ffffff"
  },
  // svg宽度
  width: {
    type: String,
    default: "16px"
  },
  // svg高度
  height: {
    type: String,
    default: "16px"
  }
});
</script>

<style>
.svg-icon {
  display: inline-block;
  vertical-align: middle;
  width: v-bind("width");
  height: v-bind("height");
}
.svg-path {
  fill: v-bind("color") !important;
}
</style>