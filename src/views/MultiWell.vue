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
import { useRoute } from 'vue-router';
const route = useRoute();
defineOptions({
  // 命名当前组件
  name: "MultiWell"
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
  // myctrl.isNavigator = true;// 是否显示导航
  // myctrl.isLayerTree = true;// 是否显示层位树
  myctrl.isMeasure = false;
  myctrl.isSelectPolygon = false;
  myctrl.isSelectRect = false;
  myctrl.isDataTree = false;
  myctrl.ctrl = new gdfui.gdfMulitWellMapCtrlProxy(myctrl, function() {
    if (route.query && route.query.names) {
      let names = route.query.names.split(',')
      let wells = names.map(item => {
        let num = Math.floor(Math.random() * 5) + 1;
        return {
          wellName: item, // 井名"多井剖面井1"
          x: "20352426.71", // x坐标  20342426.71
          y: "4117834.05", // y坐标 4177834.05
          elevation: 0, // 补心海拔
          startDepth: 1600,
          endDepth: 2200,
          depthScale: 500,
          curveFile: `${fileUrl.value}/map/well/${num}.txt`,
          depthFile: `${fileUrl.value}/map/well/depth.txt`,
        }
      });
      gdfCtrl.value = myctrl;
      create(wells);
    } else {
      return;
    }

  });
};

function addWell(well, callback) {
  gdfCtrl.value.ctrl.section.addWell(well, function(obj) {
    gdfCtrl.value.ctrl.section.setDepthRange(well.wellName, well.startDepth, well.endDepth); //obj[0].sdep,obj[0].edep
    gdfCtrl.value.ctrl.section.setDepthScale(well.wellName, well.depthScale);
    gdfCtrl.value.ctrl.section.setDepthFile(well.wellName, well.depthFile, function(obj) { });
    gdfCtrl.value.ctrl.section.setCurveFile(well.wellName, well.curveFile, function(obj) {
      typeof callback === "function" && callback();
    });
  });
}
function create(wells) {
  gdfCtrl.value.ctrl.section.createMap("多井剖面", `${fileUrl.value}/map/well/录井草图.dml`, function(obj) {
    // 初始化 wellInfo 数组
    if (!gdfCtrl.value.ctrl.mapCtrl.wellInfo) {
      gdfCtrl.value.ctrl.mapCtrl.wellInfo = [];
    }

    // 递归处理井数据
    function processWells(index) {
      if (index >= wells.length) {
        // 所有井添加完成，执行后续操作
        gdfCtrl.value.ctrl.section.setSpace(200, function() {
          gdfCtrl.value.ctrl.mainCanvas.viewFitWidth(function() {
            gdfCtrl.value.ctrl.viewRefreshApi(0x01, function() {
              var $ = gdfui.$;
              wells.forEach((item) => {
                $("#ddlWells").append(new Option(item.wellName, item.wellName));
                gdfCtrl.value.ctrl.mapCtrl.wellInfo.push({
                  wellName: item.wellName,
                  startDepth: item.startDepth,
                  endDepth: item.endDepth,
                  depthScale: item.depthScale,
                });
              });
            });
          });
        });
        return;
      }

      addWell(wells[index], function() {
        processWells(index + 1);
      });
    }

    processWells(0);
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
