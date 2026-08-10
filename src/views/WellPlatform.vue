<template>
  <LayOut>
    <template #ctrl>
      <div id="myGdfMain"></div>
    </template>
    <template #handle>
      <div class="handle-item">
        <el-button style="width: 100%;" color="#e8e8e8" @click="getWellPlatformEle">
          当前选中的井平台元素统计
        </el-button>
      </div>
    </template>
  </LayOut>
  <el-dialog v-model="eleDialogVisible" title="元素统计" width="50%" :z-index="99999999" top="6vh" draggable :fit="true">
    <el-table style="width: 100%" :data="eles" max-height="78vh">
      <el-table-column type="index" lable="序号" width="80" />
      <el-table-column property="name" label="名称" width="150" />
      <el-table-column property="layer" label="层位" width="150" :show-overflow-tooltip="true" />
      <el-table-column property="type" label="类型" width="100" />
      <el-table-column property="coor" label="坐标" width="360">
        <template #default="scope">
          <el-tag v-for="(item, index) in scope.row.coor" :key="index">{{ `x：${item.x}，y：${item.y}` }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LayOut from '../components/Layout.vue'
import { cloneDeep } from 'lodash';
//import "../../public/gdfui.js"
defineOptions({
  // 命名当前组件
  name: "WellPlatform"
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
  myctrl.isEditWellPlatform = true;
  myctrl.ctrl = new gdf.gdfPlanMapCtrlProxy(myctrl, function() {
    gdfCtrl.value = myctrl;
    // 打开图件
    addWellPlatforms();
  });
};

// 创建空图
// 添加井平台
function addWellPlatforms() {
  var templateFile = `${notifyUrl.value}/map/测试平台井通用模板.dml`;
  var platforms = [
    {
      WellName: "H47",
      WellType: "平台",
      x: 18509164.786682,
      y: 3239538.874324,
      extend: "属性",
    },
    {
      WellName: "H4",
      WellType: "平台",
      x: 18507086.033901,
      y: 3238763.47105,
      extend: "属性",
    },
  ];
  gdfCtrl.value.ctrl.plane.addPlatforms(templateFile, platforms, function(obj) {
    gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function() {
      addTargets();
    });
  });
};
function addTargets() {
  var wellTargets = [
    {
      //  平台信息
      platform: {
        WellName: "H47",
        WellType: "平台",
        x: 18509164.786682,
        y: 3239538.874324,
        extend: "属性",
      },
      // 上排靶点信息
      topWells: {
        in: [
          // 上排内侧靶点
          { WellName: "H47-1A", WellType: "上排靶点", x: 18509018, y: 3239716.25 },
          // { WellName: "H47-2A", WellType: "上排靶点", x: 18509166, y: 3239742.25 },
          // { WellName: "H47-3A", WellType: "上排靶点", x: 18509314, y: 3239768.25 },
          // { WellName: "H47-4A", WellType: "上排靶点", x: 18509462, y: 3239794.25 },
        ],
        out: [
          // 上排外侧靶点
          { WellName: "H47-1B", WellType: "上排靶点", x: 18508740, y: 3241291.75 },
          // { WellName: "H47-2B", WellType: "上排靶点", x: 18508888, y: 3241318 },
          // { WellName: "H47-3B", WellType: "上排靶点", x: 18509036, y: 3241344 },
          // { WellName: "H47-4B", WellType: "上排靶点", x: 18509184, y: 3241370 },
        ],
      },
      // 下排靶点信息
      bottomWells: {
        in: [
          // 下排内侧靶点
          //   { WellName: "H47-5A", WellType: "下排靶点", x: 18509310, y: 3239361.25 },
          //   { WellName: "H47-6A", WellType: "下排靶点", x: 18509162, y: 3239335.25 },
          //   { WellName: "H47-7A", WellType: "下排靶点", x: 18509014, y: 3239309.25 },
          //   { WellName: "H47-8A", WellType: "下排靶点", x: 18508866, y: 3239283.25 },
        ],
        out: [
          // 下排外侧靶点
          //   { WellName: "H47-5B", WellType: "下排靶点", x: 18509588, y: 3237785.75 },
          //   { WellName: "H47-6B", WellType: "下排靶点", x: 18509440, y: 3237759.5 },
          //   { WellName: "H47-7B", WellType: "下排靶点", x: 18509292, y: 3237733.5 },
          //   { WellName: "H47-8B", WellType: "下排靶点", x: 18509144, y: 3237707.5 },
        ],
      },
    },
    {
      platform: {
        WellName: "H4",
        WellType: "平台",
        x: 18507086.033901,
        y: 3238763.47105,
        extend: "属性",
      },
      topWells: {
        in: [
          { WellName: "H4-1A", WellType: "上排靶点", x: 18506970, y: 3238961.25 },
          { WellName: "H4-2A", WellType: "上排靶点", x: 18507120, y: 3238964.25 },
          { WellName: "H4-3A", WellType: "上排靶点", x: 18507270, y: 3238967 },
          { WellName: "H4-4A", WellType: "上排靶点", x: 18507420, y: 3238970 },
        ],
        out: [
          { WellName: "H4-1B", WellType: "上排靶点", x: 18506938, y: 3240561 },
          { WellName: "H4-2B", WellType: "上排靶点", x: 18507088, y: 3240564 },
          { WellName: "H4-3B", WellType: "上排靶点", x: 18507238, y: 3240566.75 },
          { WellName: "H4-4B", WellType: "上排靶点", x: 18507388, y: 3240569.75 },
        ],
      },
      bottomWells: {
        in: [
          { WellName: "H4-5A", WellType: "下排靶点", x: 18507164, y: 3238565 },
          { WellName: "H4-6A", WellType: "下排靶点", x: 18507014, y: 3238562 },
          { WellName: "H4-7A", WellType: "下排靶点", x: 18506864, y: 3238559.25 },
          { WellName: "H4-8A", WellType: "下排靶点", x: 18507314, y: 3238568 },
        ],
        out: [
          { WellName: "H4-5B", WellType: "下排靶点", x: 18507196, y: 3236965.25 },
          { WellName: "H4-6B", WellType: "下排靶点", x: 18507046, y: 3236962.5 },
          { WellName: "H4-7B", WellType: "下排靶点", x: 18506896, y: 3236959.5 },
          { WellName: "H4-8B", WellType: "下排靶点", x: 18507346, y: 3236968.25 },
        ],
      },
    },
  ];
  gdfCtrl.value.ctrl.plane.addPlatformTargets(wellTargets, function(obj) {
    gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function() {
      gdfCtrl.value.ctrl.mainCanvas.viewFitCenter(function() {
        var toolbar = gdfCtrl.value.ctrl.mapCtrl.toolbar;
        toolbar.setEditWellPlatform(true);
        let layerName = gdfCtrl.value.ctrl.layer.getLayerChildNames("Layer:\\")
        gdfCtrl.value.ctrl.layer.activation(layerName);
        gdfCtrl.value.ctrl.file.setMapName("井平台");
      });
    });
  });
}

let eleDialogVisible = ref(false);
let eles = ref([]);
function getWellPlatformEle() {
  eles.value = [];
  eles.value = cloneDeep(gdfCtrl.value.ctrl.mapCtrl.mainCanvas.item?.selectWellPlatformEles);
  console.log(eles.value);
  
  eles.value.forEach(item => {
    if (item.type === "Group") {
      item.coor = [item.coor];
    } 
  });
  eleDialogVisible.value = true;
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
