<template>
  <div class="gdfBox" style="width: calc(100vw - 8px); height: calc(100vh - 8px); padding: 4px">
    <div id="myGdfMain"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router';
// 获取当前路由实例
const route = useRoute();
defineOptions({
  // 命名当前组件
  name: "Plan"
})
// eslint-disable-next-line
let gdf = gdfui;
const gdfCtrl = ref(null);
// 文件基础路径
const fileUrl = ref(window.webConfig.fileUrl);
onMounted(() => {
  init()
});
// 初始化图形控件
function init() {
  let myctrl;
  myctrl = JSON.parse(JSON.stringify(gdf.cache));
  myctrl.elemId = 'myGdfMain';
  myctrl.apiUrl = notifyUrl.value;
  myctrl.group = 'default';
  myctrl.isHtml = true;
  myctrl.isSelect = true;
  myctrl.isDrawLine = false;
  myctrl.isNavigator = true;// 是否显示导航
  myctrl.isLayerTree = true;// 是否显示层位树
  myctrl.isMeasure = false;
  myctrl.isSelectPolygon = false;
  myctrl.isSelectRect = false;
  myctrl.isDataTree = false;
  myctrl.ctrl = new gdf.gdfPlanMapCtrlProxy(myctrl, function() {
    gdfCtrl.value = myctrl;
    // 打开图件
    const { fileServer, grguid, name, keyFile, fileType } = route.query;
    console.log(route.query);
    if (fileServer && grguid && name && keyFile && fileType) {
      gdfCtrl.value.ctrl.file.openFile(`${fileServer}/${keyFile}`, fileType, 1, function(obj) {
        gdfCtrl.value.ctrl.mainCanvas.viewFitCenter();
      });
    }
  });
};



</script>

<style lang="scss" scoped></style>
