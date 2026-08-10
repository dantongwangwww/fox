<template>
  <el-card>
    <img :src="resolvedImageSrc" @click="open" style="width: 100%" />
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <el-button plain color="#1d3d62" @click="open">在线演示</el-button>
  </el-card>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageSrc: {
    type: String,
    required: true
  },
  targetUrl: {
    type: String,
    required: true
  }
});

const resolvedImageSrc = new URL(`../assets/${props.imageSrc}`, import.meta.url).href;

const open = () => {
  // 用 router.resolve 生成带 base 前缀的完整路径（如 /doublefoxapp/Well），避免丢 base
  const { href } = router.resolve(props.targetUrl);
  window.open(href);
};

</script>

<style lang="scss" scoped>
.el-card {
  max-width: 450px;
  text-align: center;

  @media screen and (width >=48rem) {
    max-width: 480px;
  }

  img {
    &:hover {
      cursor: pointer;
    }
  }

  h3 {
    font-size: 20px;
    font-weight: 700;
    margin: 10px 0;
  }

  p {
    height: 100px;
    font-size: 14px;
  }

  .el-button {
    border-radius: 0;
    font-weight: 700;
    width: 180px;
    height: 36px;
  }
}
</style>