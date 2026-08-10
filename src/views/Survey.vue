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
//import "../../public/gdfui.js"
defineOptions({
  // 命名当前组件
  name: "Survey"
})
// eslint-disable-next-line
let gdf = gdfui;
const gdfCtrl = ref(null);
// 文件基础路径
onMounted(() => {
  init()
});
const fileUrl = ref(window.webConfig.fileUrl);
const notifyUrl = ref(window.webConfig.baseUrl);
// 初始化图形控件
function init() {
  let myctrl;
  myctrl = JSON.parse(JSON.stringify(gdf.cache));
  myctrl.elemId = 'myGdfMain';
  myctrl.apiUrl = window.webConfig.baseUrl;
  myctrl.group = 'default';
  myctrl.isHtml = true;
  myctrl.isSelect = true;
  myctrl.isDrawLine = false;
  myctrl.isNavigator = false;// 是否显示导航
  myctrl.isLayerTree = false;// 是否显示层位树
  myctrl.isSurveyLine = true;
  myctrl.ctrl = new gdf.gdfPlanMapCtrlProxy(myctrl, function() {
    gdfCtrl.value = myctrl;
    gdfCtrl.value.ctrl.mapCtrl.mainCanvas.surveyDbClick = function(data) {
      targetUrl(data);
    };
    addSurvey()
  });
};


function addSurvey() {
  var toolbar = gdfCtrl.value.ctrl.mapCtrl.toolbar;
  toolbar.setRuler(true);
  gdfCtrl.value.ctrl.plane.getSurveyList(function(res) {
    gdfCtrl.value.ctrl.plane.addSurvey(res.data.Data.result.records[0].surveyId, function() {
      var layerStr = `Layer:\\Survey\\${res.data.Data.result.records[0].surveyName}`;
      gdfCtrl.value.ctrl.mainCanvas.activation(layerStr, function() {
        gdfCtrl.value.ctrl.mainCanvas.viewFitCenter(function() {
          toolbar.disabledSurveyBtn(false);
          toolbar.setInLine(true);
        });
      });
    });
  });
}

function targetUrl(data) {
  window.open(`/seismics?line=${data.lineVal}&type=${data.lineType}`);
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
