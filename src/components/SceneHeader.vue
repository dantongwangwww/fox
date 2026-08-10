<template>
  <div class="header-border-b">
    <div class="header">
      <div class="tit">
        <!-- 图标 -->
        <!-- <a href="/" target="_blank"> -->
          <img src="/src/assets/favicon.ico" alt="首页">
        <!-- </a> -->
        <!-- 竖线 -->
        <p></p>
        <!-- 标题 -->
        <span>
          <span class="tit-l">双狐演示：</span>
          <span>{{ title }}</span>
        </span>
      </div>
      <div class="handle">
        <el-popover placement="bottom-end" transition="el-zoom-in-top" :width="'80vw'" trigger="click">
          <template #reference>
            <el-button color="#e8e8e8" title="浏览演示">
              <p class="btn-text">浏览演示</p>
              <SvgIcon class="btn-icon" name="scene" color="#666" height="16px" />
              <el-icon class="el-icon-caret-bottom">
                <CaretBottom />
              </el-icon>
            </el-button>
          </template>
          <div class="grid-box">
            <div class="grid">
              <el-card @click="target(item)" shadow="hover" v-for="(item, index) in imgUrlList" :key="index">
                <img :src="item.imageSrc" style="width: 100%" />
                <h3>{{ item.title }}</h3>
              </el-card>
            </div>
          </div>
        </el-popover>
        <el-button title="帮助文档" color="#e8e8e8" @click="target({ targetUrl: `${helpUrl}` })">
          <p class="btn-text">帮助文档</p>
          <SvgIcon class="btn-icon" name="md" color="#666" height="16px" />
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  CaretBottom,
} from '@element-plus/icons-vue';
import sceneInfoList from "@/data/homeListData.js";
import { ref } from 'vue'
import { useRouter } from 'vue-router';

const router = useRouter();
const helpUrl = ref(`${window.webConfig.helpUrl}`)
let imgUrlList = sceneInfoList.map(item => {
  return {
    ...item,
    imageSrc: new URL(`../assets/${item.imageSrc}`, import.meta.url).href
  }
})
defineOptions({
  // 命名当前组件
  name: "SceneHeader"
})
defineProps({
  title: {
    type: String,
    default: document.title
  }
})
function target(data) {
   const { href } = router.resolve(data.targetUrl);
  window.open(href); 
}
</script>

<style lang="scss" scoped>
.header-border-b {
  border-bottom: 1px solid #d3d3d6;

  .header {
    margin: 10px;
    margin-bottom: 0;
    height: 60px;
    border-bottom: #181818;
    display: flex;

    .tit {
      flex: 1;
      color: #666;
      font-weight: 700;
      margin-top: -8px;
      display: flex;
      align-items: center;

      img {
        width: 36px;
        height: 36px;
      }

      p {
        height: 40px;
        width: 2px;
        background-color: #bbb;
        margin: 0 20px 0 15px;
      }

      span {
        font-size: 20px;
      }
    }

    .handle {
      flex: 1;
      display: flex;
      margin-bottom: 10px;
      align-items: center;
      justify-content: flex-end;
    }
  }
}

.tit-l {
  display: inline-block;
}

.grid-box {
  height: 70vh;
  overflow-y: auto;
  margin: 0 auto;

  & :hover {
    cursor: pointer;
  }

  .grid {
    display: grid;
    column-gap: 16px;
    row-gap: 32px;
    justify-items: center;

    @media screen and (width <=48rem) {
      max-width: 600px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media screen and (width >=48rem) {
      max-width: 760px;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media screen and (width >=64rem) {
      max-width: 960px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    @media screen and (width >=80rem) {
      max-width: 100%;
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }

    .el-card {
      max-width: 200px;
      text-align: center;

      @media screen and (width >=48rem) {
        max-width: 480px;
      }

      @media screen and (width >=80rem) {
        max-width: 480px;
      }

      h3 {
        font-size: 15px;
        font-weight: 700;
        margin: 10px 0 -10px 0;
      }
    }
  }
}

.btn-text {
  display: block;
}

.btn-icon {
  display: none;
}

@media screen and (min-width: 100px) and (max-width: 460px) {
  .tit-l {
    display: none;
  }
}

@media screen and (min-width: 300px) and (max-width: 610px) {
  .btn-text {
    display: none;
  }

  .btn-icon {
    display: block;
  }

  .header-border-b .header .tit {
    // flex: 1;
    color: #666;
    font-weight: 700;
    margin-top: -8px;
    display: flex;
    align-items: center;

    img {
      width: 32px;
      height: 32px;
    }

    p {
      height: 40px;
      width: 2px;
      background-color: #bbb;
      margin: 0 20px 0 15px;
    }

    span {
      font-size: 14px !important;
    }

    .handle {
      flex: 1;
      display: flex;
      margin-bottom: 10px;
      align-items: center;
      justify-content: flex-end;

      .el-button {
        width: 80px;
      }
    }
  }

}
</style>