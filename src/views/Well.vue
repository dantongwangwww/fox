<template>
  <LayOut>
    <template #ctrl>
      <div id="myGdfMain"></div>
    </template>
  </LayOut>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LayOut from '../components/Layout.vue'
import wellList from '../data/wellList.js'
import { ElLoading } from 'element-plus';
import { useRoute } from 'vue-router';
defineOptions({
  // 命名当前组件
  name: "Well"
})
// eslint-disable-next-line
let gdf = gdfui;
let gdfCtrl = ref(null);
let showBg = ref(true);
let showLsolines = ref(true);
// 文件基础路径
const fileUrl = ref(window.webConfig.fileUrl);
onMounted(() => {
  init()
});
const route = useRoute();
// 初始化图形控件
function init() {
  let myctrl;
  myctrl = JSON.parse(JSON.stringify(gdfui.cache));
  myctrl.elemId = "myGdfMain";
  myctrl.apiUrl = window.webConfig.baseUrl;
  myctrl.isScrollBar = true;
  myctrl.isSingleWellTool = true;
  myctrl.ctrl = new gdf.gdfWellMapCtrlProxy(myctrl, function() {
    gdfCtrl.value = myctrl;
    if (route.query&&route.query.name) {
      addWell(route.query.name);
    }else{
      addWell('测井1');
    }
  });
};

function addWell(name) {
  let num = Math.floor(Math.random() * 5) + 1;
  var data = {
    wellName: name,
    startDepth: 1500,
    endDepth: 2000,
    depthScale: 1000,
    curveFile: `${fileUrl.value}/map/well/${num}.txt`,
    wellTemplateFile: `${fileUrl.value}/map/well/录井草图.dml`,
    depthFile: `${fileUrl.value}/map/well/depth.txt`,
  };
  gdfCtrl.value.ctrl.well.createMap(data, function() {
    // 开启滚动条
    gdfCtrl.value.ctrl.toolbar.onScrollBar();
    // 居中图道
    gdfCtrl.value.ctrl.mainCanvas.fitWidth();
  });
};

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
