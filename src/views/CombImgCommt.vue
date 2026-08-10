<template>
  <LayOut>
    <template #ctrl>
      <div id="myGdfMain"></div>
    </template>
    <template #handle>
      <div class="handle-item">
        <span>图外注释</span>
        <el-switch v-model="showComment" @change="setComment" />
      </div>
      <div class="handle-item">
        <span>图例</span>
        <el-switch v-model="showGraph" @change="setGraph" />
      </div>
    </template>
  </LayOut>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import LayOut from '../components/Layout.vue';

const gdfCtrl = ref(null);

onMounted(() => {
  init();
});

let gdf = gdfui;
const fileUrl = ref(window.webConfig.fileUrl);
const notifyUrl = ref(window.webConfig.baseUrl);
let showComment = ref(false);
let showGraph = ref(false);
let isCommentInit = ref(false);
let isGraphInit = ref(false);
// 初始化打开图件
function init() {
  let myctrl;
  myctrl = JSON.parse(JSON.stringify(gdf.cache));
  myctrl.elemId = 'myGdfMain';
  myctrl.apiUrl = notifyUrl.value;
  myctrl.group = 'default';
  myctrl.isHtml = true;
  myctrl.isMeasure = false;
  myctrl.ctrl = new gdf.gdfPlanMapCtrlProxy(myctrl, function() {
    gdfCtrl.value = myctrl;
    gdfCtrl.value.ctrl.file.openFile(
      notifyUrl.value + '/map/某区域反射层深度构造图3MB.dfd',
      '.dfd',
      1,
      function(obj) {
        gdfCtrl.value.ctrl.mainCanvas.viewFitCenter();
      }
    );
  });
}

// 合并图件
function mergeFile(url, callback) {
  gdfCtrl.value.ctrl.file.mergeFile(url, '.dfd', 1, function(obj) {
    gdfCtrl.value.ctrl.mainCanvas.viewFitCenter(function() {
      gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function() {
        callback();
      });
    });
  });
}

function setComment() {
  let layer = "Layer:\\图外注释 Layer:\\图外注释\\等值线 Layer:\\图外注释\\断层 Layer:\\图外注释\\边框 Layer:\\图外注释\\测线道 Layer:\\图外注释\\测线 Layer:\\图外注释\\图名字";
  if (showComment.value) {
    if (!isCommentInit.value) {
      // 添加网格线图
      addComment()
    } else {
      //显示
      gdfCtrl.value.ctrl.showLayers(layer, function() {
        gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function() { });
      });
    }
  } else {
    //隐藏
    gdfCtrl.value.ctrl.hideLayers(layer, function() {
      gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function() { });
    });
  }
}
function setGraph() {
  let layer = "Layer:\\图外注释\\图例 Layer:\\图外注释\\图例\\符号 Layer:\\图外注释\\图例\\符号框 Layer:\\图外注释\\图例\\文字 Layer:\\图外注释\\图例\\图例框";
  if (showGraph.value) {
    if (!isGraphInit.value) {
      // 添加网格线图
      addGraph()
    } else {
      //显示
      gdfCtrl.value.ctrl.showLayers(layer, function() {
        gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function() { });
      });
    }
  } else {
    //隐藏
    gdfCtrl.value.ctrl.hideLayers(layer, function() {
      gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function() { });
    });
  }
}

function addComment() {
  mergeFile(notifyUrl.value + '/map/图外注释.dfd', function() {
    isCommentInit.value = true;
  });
}

function addGraph() {
  mergeFile(notifyUrl.value + '/map/图例.dfd', function() {
    isGraphInit.value = true;
  });
}
</script>

<style lang="scss" scoped>
.handle-item {
  padding: 0 20px;
  height: 40px;
  display: flex;
  justify-content: space-between;
  line-height: 40px;

  span {
    font-size: 14px;
    font-weight: 800;
  }
}
</style>
