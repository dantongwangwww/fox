<template>
  <LayOut :title="title">
    <template #ctrl>
      <div id="myGdfMain"></div>
    </template>
  </LayOut>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router'
import LayOut from '@/components/Layout';
//import "../../public/gdfui.js"
defineOptions({
  // 命名当前组件
  name: "Seismics"
})
const route = useRoute()
const queryParams = ref({})
const title = ref()

// eslint-disable-next-line
let gdf = gdfui;
const gdfCtrl = ref(null);
let loadingInstance = ref(null);
// 文件基础路径
const fileUrl = ref(window.webConfig.fileUrl);
onMounted(() => {
  // 获取查询参数
  queryParams.value = route.query
  title.value = `${queryParams.value.type}-${queryParams.value.line}`
  document.title = title.value;
  init()
});
// 初始化图形控件
function init() {
  let uname = "cool";
  let group = "default";
  var ctrlSeismic;
  // 平面图 paramsData
  ctrlSeismic = JSON.parse(JSON.stringify(gdfui.cache));
  ctrlSeismic.elemId = "myGdfMain";
  ctrlSeismic.apiUrl = notifyUrl.value;
  ctrlSeismic.group = group;
  ctrlSeismic.isHtml = true;
  ctrlSeismic.isLayerTree = false;
  ctrlSeismic.isScrollBar = true;
  ctrlSeismic.isRefresh = false;
  ctrlSeismic.isZoomOut = true;
  ctrlSeismic.isZoomIn = true;
  // ctrlSeismic.isSaveFile = false;
  ctrlSeismic.isSetSeiLine = false;
  ctrlSeismic.ctrl = new gdfui.gdfSeismicMapCtrlProxy(ctrlSeismic, function() {
    var toolbar = ctrlSeismic.ctrl.mapCtrl.toolbar;
    gdfCtrl.value = ctrlSeismic;
    ctrlSeismic.ctrl.file.openFile(notifyUrl.value + `/map/survey/${queryParams.value.type}/${Math.floor(Math.random() * (5)) + 1}.dfd`, ".dfd", 1, function(obj) {
      ctrlSeismic.ctrl.mainCanvas.viewFitBespread(function() {
        toolbar.setRuler(true);
        // loadingInstance.value.close();
        ctrlSeismic.ctrl.seismic.getAmplitudeScale(function(obj) {
          ctrlSeismic.ctrl.viewRefresh(0x01, function() {
          });
          // 获取当前振幅系数
          var AmplitudeScale = JSON.parse(obj.data.Data.data);
          const inputs = document.querySelectorAll('#setAmplitudeScale input');
          inputs.forEach(input => {
            input.value = String(AmplitudeScale);
          });
        });
      });
    });
  });
};


</script>

<style lang="scss" scoped>
.collapse-box {
  overflow-y: auto;
  padding: 0 10px 0 10px;
  height: calc(100vh - 94px);

  ul li {
    display: flex;
    align-items: center;
    cursor: pointer;
    border-radius: 4px;
    padding: 0 0 0 10px;

    div {
      margin-left: 10px;
    }
  }

  ul li:hover {
    background-color: #f0f2f5;
    transition: background-color 0.3s ease;
    cursor: pointer;
  }
}
</style>
