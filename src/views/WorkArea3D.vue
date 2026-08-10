<template>
  <LayOut>
    <template #ctrl>
      <div id="myGdfMain"></div>
    </template>
    <template #handle>
      <div class="handle-item" style="line-height: 30px">
        <span>地震剖面</span>
        <el-switch v-model="seismicShowFlag" @change="showSeismic" />
      </div>
      <div class="handle-item" style="line-height: 30px">
        <span>地震切片</span>
        <el-switch v-model="sliceShowFlag" @change="showSlice" />
      </div>
      <div class="handle-item" style="line-height: 30px">
        <span>层位</span>
        <el-switch v-model="horizonShowFlag" @change="showHorizon" />
      </div>
      <div class="handle-item" style="line-height: 30px">
        <span>断面</span>
        <el-switch v-model="faultShowFlag" @change="showFault" />
      </div>
      <div class="handle-item" style="line-height: 30px">
        <span>井位</span>
        <el-switch v-model="wellShowFlag" @change="showWell" />
      </div>
    </template>
  </LayOut>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import LayOut from '../components/Layout.vue';

import horizonData from '../data/3dSurvey_horizon_wt1.json';
import imgInline600 from '../data/3dSurvey_inline600.png';
import imgCrossline500 from '../data/3dSurvey_crossline500.png';
import falutData from '../data/3dSurvey_fault.json';
import wellData from '../data/3dSurvey_well.json';
import sliceData from '../data/3dSurvey_slice1450.json';

const horizonShowFlag = ref(false);
const seismicShowFlag = ref(true);
const faultShowFlag = ref(false);
const wellShowFlag = ref(true);
const sliceShowFlag = ref(true);

onMounted(() => {
  init();
});

let horizon_wt1 = null;
let seismic_inline600 = null;
let seismic_crossline500 = null;
let faultArr = [];
let wellArr = [];
let slice1450 = null;

const notifyUrl = window.webConfig.baseUrl;
let map = null;
let ctrl3d = JSON.parse(JSON.stringify(gdfui.cache));
let group = 'default';

function init() {
  ctrl3d.elemId = 'myGdfMain';
  ctrl3d.apiUrl = notifyUrl;
  ctrl3d.group = group;
  ctrl3d.isHtml = true;
  ctrl3d.isSelect = true;
  ctrl3d.isDrawLine = true;
  ctrl3d.isLayerTree = false;
  ctrl3d.ctrl = new gdfui.gdf3dMapCtrlProxy(ctrl3d, function() {
    var mm = gdfui.gdfMapManage;
    var xy3 = [
      new mm.basePoint(565278.23, 4965063.67),
      new mm.basePoint(568078.23, 4969913.41),
      new mm.basePoint(573594.03, 4960258.01),
    ];
    var ranges = [500, 780, 220, 700, 0, 2500];
    var lt3 = [
      new mm.basePoint(ranges[0], ranges[2]),
      new mm.basePoint(ranges[1], ranges[2]),
      new mm.basePoint(ranges[0], ranges[3]),
    ];
    var survey = new gdfui.gdfMapManage.gdfTransform(xy3, lt3);
    survey.create();
    var toXYArr = function(l, t, z) {
      const result = survey.toXY(l, t);
      return [result.x, result.y, -z];
    };
    survey.to3dXY = toXYArr;
    ctrl3d.ctrl.openFile();

    const mainCanvas = ctrl3d.ctrl.mapCtrl.mainCanvas;
    const map = mainCanvas.map;
    const mm3d = gdfui.gdf3dMapManager;

    mainCanvas.map.directionalLight.intensity = 0.1;
    map.getScene().background = new gdfui.THREE.Color(0x000000);
    map.setScaleZ(2);
    map.getScene().updateMatrix();
    map.setIntervalX(5000);
    map.setIntervalY(5000);
    map.setRange([563000, 578000, 4958000, 4971000, 0, 3000]).buildDrawer();
    const surveyDrawer = new mm3d.Gdf3dDrawer(toXYArr, ranges, [], ['Inline', 'Crossline', 'time']);
    surveyDrawer.addToMap(map);
    map.lookAtDrawer(surveyDrawer);

    ctrl3d.ctrl.mapCtrl.toolbar.onDrawer();
    // 层位
    let colorList = [
      { z: 0, r: 0, g: 128, b: 251 },
      { z: 0.25, r: 192, g: 255, b: 255 },
      { z: 0.5, r: 70, g: 255, b: 255 },
      { z: 0.75, r: 255, g: 255, b: 0 },
      { z: 1, r: 255, g: 0, b: 0 },
    ];
    horizon_wt1 = mainCanvas.addHorizonToMap(toXYArr, 500, 220, 281, 481, horizonData.data[0], colorList, -9999);
    showHorizon(false);
    // 地震剖面
    seismic_inline600 = new mm3d.Seismic(toXYArr, ranges, 'inline', 600, imgInline600);
    seismic_inline600.addToMap(map);
    seismic_crossline500 = new mm3d.Seismic(toXYArr, ranges, 'xline', 500, imgCrossline500);
    seismic_crossline500.addToMap(map);
    // 断层
    falutData.forEach((e, i) => {
      const fault = e.data;
      if (!fault.data[0]) return;

      const fault3d = new gdfui.gdf3dMapManager.Fault(
        toXYArr,
        fault.data[0].map((line) => line.data.map((p) => [p.lineNo, p.cmpNo, p.value])),
        JSON.parse(e.triangleFault),
        `rgb(${fault.red}, ${fault.green}, ${fault.blue})`,
        `rgb(${255 - fault.red}, ${255 - fault.green}, ${255 - fault.blue})`,
        `rgb(${parseInt(0.3 * fault.red)}, ${parseInt(0.58 * fault.green)}, ${parseInt(0.11 * fault.blue)})`,
        true
      );
      fault3d.addToMap(map);
      faultArr.push(fault3d);
    });

    showFault(false);
    // 井位
    wellData.forEach((e, i) => {
      const well3d = new mm3d.Well(
        undefined,
        [e.surfaceCoord.x, e.surfaceCoord.y, ranges[4], e.surfaceCoord.x, e.surfaceCoord.y, ranges[5]],
        10,
        e.name
      );
      well3d.addToMap(map);
      wellArr.push(well3d);
    });
    // 切片
    const sliceColor = [
      { z: 0, r: 176, g: 15, b: 15 },
      { z: 0.111, r: 181, g: 56, b: 48 },
      { z: 0.222, r: 189, g: 108, b: 90 },
      { z: 0.333, r: 196, g: 160, b: 130 },
      { z: 0.444, r: 204, g: 211, b: 170 },
      { z: 0.555, r: 210, g: 240, b: 240 },
      { z: 0.666, r: 156, g: 181, b: 181 },
      { z: 0.777, r: 103, g: 121, b: 121 },
      { z: 0.888, r: 51, g: 60, b: 60 },
      { z: 1, r: 0, g: 0, b: 0 },
    ];
    slice1450 = new mm3d.Slice(toXYArr, 1500, 500, 220, 480, 280, sliceData.dataFloat, sliceColor);
    slice1450.addToMap(map);
    console.log(map);
  });
}

function showHorizon(val) {
  if (val) {
    horizon_wt1.show();
  } else {
    horizon_wt1.hide();
  }
}

function showSeismic(val) {
  if (val) {
    seismic_inline600.show();
    seismic_crossline500.show();
  } else {
    seismic_inline600.hide();
    seismic_crossline500.hide();
  }
}

function showFault(val) {
  if (val) {
    faultArr.forEach((e) => e.show());
  } else {
    faultArr.forEach((e) => e.hide());
  }
}

function showWell(val) {
  if (val) {
    wellArr.forEach((e) => e.show());
  } else {
    wellArr.forEach((e) => e.hide());
  }
}

function showSlice(val) {
  if (val) {
    slice1450.show();
  } else {
    slice1450.hide();
  }
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
