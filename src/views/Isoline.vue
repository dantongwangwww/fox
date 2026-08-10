<template>
  <LayOut>
    <template #ctrl>
      <div id="myGdfMain"></div>
    </template>
    <template #handle>
      <div class="handle-item">
        <span>背景色</span>
        <el-switch v-model="showBg" @change="setBg" />
      </div>
      <div class="handle-item">
        <span>网格线</span>
        <el-switch v-model="showGridLine" @change="setGridLine" />
      </div>
      <div class="handle-item">
        <el-button @click="setContourParam" style="width: 100%" color="#e8e8e8">设置网格化参数</el-button>
      </div>
      <div class="handle-item">
        <span>推荐参数</span>
      </div>
      <div class="param-list">
        <div class="param-section">
          <h4>网格化参数</h4>
          <div class="param-row">
            <span>方法:</span>
            <span>最小曲率法</span>
          </div>
          <div class="param-row">
            <span>网格加密次数:</span>
            <span>2</span>
          </div>
        </div>
        <div class="param-section">
          <h4>等值线</h4>
          <div class="param-row">
            <span>极小值:</span>
            <span>0</span>
          </div>
          <div class="param-row">
            <span>极大值:</span>
            <span>50</span>
          </div>
          <div class="param-row">
            <span>步长:</span>
            <span>0.8</span>
          </div>
          <div class="param-row">
            <span>隔几根上数:</span>
            <span>0.8</span>
          </div>
        </div>
      </div>
    </template>
  </LayOut>
</template>

<script setup>
import { ref, onMounted } from "vue";
import LayOut from "../components/Layout.vue";
defineOptions({
  // 命名当前组件
  name: "Isoline",
});
// eslint-disable-next-line
let gdf = gdfui;
const gdfCtrl = ref(null);
let gridX = ref(null);
let gridY = ref(null);
let showBg = ref(true);
let showGridLine = ref(false);
// 文件基础路径
const fileUrl = ref(window.webConfig.fileUrl);
onMounted(() => {
  init();
});
// 初始化图形控件
function init() {
  let myctrl;
  myctrl = JSON.parse(JSON.stringify(gdf.cache));
  myctrl.elemId = "myGdfMain";
  myctrl.apiUrl = window.webConfig.baseUrl;
  myctrl.group = "default";
  myctrl.isHtml = true;
  myctrl.isNavigator = false; // 是否显示导航
  myctrl.isLayerTree = false; // 是否显示层位树
  myctrl.isSendDF = true;
  myctrl.ctrl = new gdf.gdfPlanMapCtrlProxy(myctrl, function () {
    gdfCtrl.value = myctrl;
    addContour();
    // addContourToLayer();
  });
}

// 等值线数据网格化
function addContourToLayer() {
  var layerName = "Layer:\\A";
  var faultFileUrl = ``;
  var borderFileUrl = `${fileUrl.value}/map/等值线/边界.dfd`;
  //  合并图件参数
  //  1.文件路径
  //  2.文件类型
  //  3.是否自动投影 1是 0否
  //  4.图层名称(模板中包含图层Layer:\\A, 则不需要传图层名)
  //  5.回调函数
  gdfCtrl.value.ctrl.file.mergeFile(`${fileUrl.value}/map/等值线/等值线模板A.dml`, ".dml", 1, "", function () {
    gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function () {
      // 获取等值线成图数据
      gdfCtrl.value.ctrl.plane.getContourData(`${fileUrl.value}/map/等值线/厚度XYZ散点.xyz`, ".xyz", ``, "", `${borderFileUrl}`, ".dfd", 0, function (data) {
        // eslint-disable-next-line
        var griddingParam = {
          Method: "2", //方法(1快速反距离加权法/2全局克里格法/0最小曲率法)
          Infill: "0", //网格加密次数
          Precision: "0.237287", //精度
          Smooth: "10", //平滑次数
          Fault: "0", //考虑断层次数
          Search: "8", //临近点数量
          GridX: {
            //X方向
            Min: "590361.040000", //极小值
            Max: "629658.530000", //极大值
            Step: "785.9497999999999", //步长
            Num: "50",
          },
          GridY: {
            //Y方向
            Min: "3104672.190000", //极小值
            Max: "3150948.230000", //极大值
            Step: "925.5208000000007", //步长
            Num: "50", //网格数
          },
          GridZ: {
            //Z方向 不可修改
            Min: "-2223.330000", //极小值
            Max: "149.540000", //极大值
            Step: "0.000000", //步长
            Num: "0", //网格数
          },
          Contour: {
            //等值线
            Min: "-2223.330000", //极小值
            Max: "149.540000", //极大值
            Step: "50", //步长
            Mark: "5", //隔几根上数
          },
        };
        // 设置等值线成图参数
        //  1.等值线参数
        //  2.图层名称
        //  3.子图层名称
        //  4.回调函数
        data.griddingParam.Method = "0";
        data.griddingParam.Contour.Step = "0.8";
        data.griddingParam.Contour.Mark = "0.8";
        data.griddingParam.Contour.Max = "50";
        data.griddingParam.Contour.Min = "0";
        data.griddingParam.Infill = "2";
        gdfCtrl.value.ctrl.plane.setContourParam(data.griddingParam, layerName, faultFileUrl, borderFileUrl, function () {
          changeBgColor();
          // gdfCtrl.value.ctrl.mainCanvas.viewFitCenter(function() { });
          // gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function() {
          // });
          // 存一下网格数据,在设置颜色的回调中添加网格
          gridX.value = data.griddingParam.GridX;
          gridY.value = data.griddingParam.GridY;
          gdfCtrl.value.ctrl.file.setMapName("xx地区砂岩厚度预测图");
        });
      });
    });
  });
}
let contourParam = ref(null);
function addContour() {
  gdfCtrl.value.ctrl.file.mergeFile(`${fileUrl.value}/map/等值线/等值线模板.dml`, ".dml", 1, "", function () {
    gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function () {
      gdfCtrl.value.ctrl.plane.createContourMap(`${fileUrl.value}/map/等值线/厚度XYZ散点.xyz`, ".xyz", ``, "", `${fileUrl.value}/map/等值线/边界.dfd`, ".dfd", 0, function (data, param) {
        console.log(data, param);
        contourParam.value = param;
        gridX.value = param.GridX;
        gridY.value = param.GridY;
        gdfCtrl.value.ctrl.file.setMapName("xx地区砂岩厚度预测图");
        // gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function() {
        //   gdfCtrl.value.ctrl.mainCanvas.viewFitCenter();
        // });
        changeBgColor();
      });
    });
  });
}

function setContourParam() {
  gdfCtrl.value.ctrl.mapCtrl.mainCanvas.selectParas(contourParam.value, function (data, param) {
    contourParam.value = param;
    gridX.value = param.GridX;
    gridY.value = param.GridY;
    changeBgColor();
  });
}

// 设置网格线
function setGridLine() {
  if (showGridLine.value) {
    if (!isGridInit.value) {
      // 添加网格线图
      addGrid();
    } else {
      //显示
      gdfCtrl.value.ctrl.showLayers("Layer:\\A\\gridLines", function () {
        gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function () {});
      });
    }
  } else {
    //隐藏
    gdfCtrl.value.ctrl.hideLayers("Layer:\\A\\gridLines", function () {
      gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function () {});
    });
  }
}

// 设置背景
function setBg() {
  let layerNames = "Layer: Layer:\\Background";
  if (!showBg.value) {
    //隐藏
    gdfCtrl.value.ctrl.hideLayers(layerNames, function () {
      gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function () {});
    });
  } else {
    //显示
    gdfCtrl.value.ctrl.showLayers(layerNames, function () {
      gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function () {});
    });
  }
}

// 设置色表
function changeBgColor() {
  // 获取图层颜色
  var layerName = "Layer:\\"; //根节点
  gdfCtrl.value.ctrl.mainCanvas.getLayerColor(layerName, function (obj) {
    // 颜色示例 在图例中颜色条最下方z值为0,最上方z值为1
    let colorObj = [
      { Z: 3, R: 128, G: 255, B: 255 },
      { Z: 5.6, R: 128, G: 255, B: 128 },
      { Z: 6.4, R: 255, G: 255, B: 128 },
      { Z: 7.2, R: 255, G: 218, B: 181 },
      { Z: 8, R: 255, G: 188, B: 121 },
      { Z: 10.4, R: 255, G: 128, B: 64 },
      { Z: 12, R: 255, G: 77, B: 0 },
    ];
    obj.alpha = 0; //透明度0-100 100为完全透明
    obj.Item = colorObj;
    // 设置图层颜色
    gdfCtrl.value.ctrl.mainCanvas.setLayerColor(
      layerName,
      obj,
      1, //0:阶梯，1:平滑
      1, //0:使用自定义z值 1:自动计算z值
      function () {
        // 刷新画布(更新图层树、更新小窗导航、更新视图)
        gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function () {
          gdfCtrl.value.ctrl.mainCanvas.viewFitCenter();
        });
      },
    );
  });
}

let isGridInit = ref(false);
function addGrid() {
  function countGridPoint(gridX, gridY) {
    let linesObj = [];
    let x = gridX.Min * 1 + gridX.Step * 1;
    for (var a = 0; a < gridX.Num - 2; a++) {
      linesObj.push({
        LineName: `x${a}`,
        dataList: [
          {
            x: x,
            y: gridY.Min * 1,
          },
          {
            x: x,
            y: gridY.Max * 1 - gridY.Step * 1,
          },
        ],
      });
      x += gridX.Step * 1;
    }
    let y = gridY.Min * 1;
    for (var b = 0; b < gridY.Num - 1; b++) {
      linesObj.push({
        LineName: `y${b}`,
        dataList: [
          {
            x: gridX.Min * 1 + gridX.Step * 1,
            y: y,
          },
          {
            x: gridX.Max * 1 - gridX.Step * 1,
            y: y,
          },
        ],
      });
      y += gridY.Step * 1;
    }
    return linesObj;
  }
  let iType = 2;
  let objLines = countGridPoint(gridX.value, gridY.value);
  let layerName = "Layer:\\A\\gridLines";
  //  iType - 线类型iType(2=x,y两列, 3=x,y,z三列, 4=x,y,z,桩号四列)
  //  objLines - 线文件对象
  //  layerName - 图层名称
  gdfCtrl.value.ctrl.plane.addLinesObj(iType, objLines, layerName, function () {
    gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function () {
      gdfCtrl.value.ctrl.mainCanvas.viewFitCenter();
      isGridInit.value = true;
    });
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

.param-list {
  padding: 0 20px 20px;
  font-size: 14px;
}

.param-section {
  margin-bottom: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.param-section h4 {
  margin: 0;
  padding: 8px 10px;
  background-color: #f5f5f5;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid #e0e0e0;
}

.param-row {
  padding: 8px 10px;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.param-detail {
  flex: 1;
  margin-left: 10px;

  p {
    margin: 4px 0;
    font-size: 12px;
    line-height: 1.4;
  }
}
</style>
