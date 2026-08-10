<template>
  <LayOut>
    <template #ctrl>
      <iframe src="/wellGraphSuit/wellGraphSuit.html" frameborder="0" height="100%" width="100%"></iframe>
    </template>
  </LayOut>
</template>
<script setup>
import LayOut from '../components/Layout.vue'
defineOptions({
  // 命名当前组件
  name: "WellGraphSuit"
})

</script>

<style lang="scss" scoped>
</style>
