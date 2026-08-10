<template>
  <LayOut>
    <template #ctrl>
      <div id="myGdfMain"></div>
    </template>
    <template #handle>
      <div class="handle-item" style="line-height: 30px">
        <span>视角切换</span>
        <el-switch v-model="viewChanged" @change="onViewChange" />
      </div>
    </template>
  </LayOut>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import LayOut from '../components/Layout.vue';

defineOptions({
  // 命名当前组件
  name: '3D',
});
const viewChanged = ref(true);

onMounted(() => {
  init();
});

// 文件基础路径
const fileUrl = ref(window.webConfig.fileUrl);
let map = null;
let myctrl = JSON.parse(JSON.stringify(gdfui.cache));
function init() {
  myctrl.elemId = 'myGdfMain';
  myctrl.apiUrl = window.webConfig.baseUrl;
  myctrl.isDataTree = false;
  myctrl.isLayerTree = true;
  myctrl.isNavigator = false;
  myctrl.isDrawLine = true;
  myctrl.isSaveFile = false;
  myctrl.ctrl = new gdfui.gdf3dMapCtrlProxy(myctrl, function() {
    myctrl.ctrl.openFile(fileUrl.value + '/map/3D/底面构造图（三角网）.DML', '.DML', 1, () => {
      map = myctrl.ctrl.mapCtrl.mainCanvas.map;
      map.getControls().panSpeed = 0.02;

      onViewChange(true);

      const layerTree = myctrl.ctrl.mapCtrl.layerTree;
      let names = layerTree.getLayerChildNames('Layer:\\修饰信息');
      layerTree.mapCtrl.mainCanvas.showLayers(names.split(' '), false);
    });
  });

  // 双指操作时禁用平移
  document.addEventListener('touchstart', onTouchStart);
  document.addEventListener('touchend', onTouchEnd);
}

function onTouchStart(event) {
  const touches = event.touches;
  if (touches.length === 2) map.getControls().noPan = true;
}
function onTouchEnd(event) {
  const touches = event.touches;
  if (touches.length === 2) map.getControls().noPan = false;
}

function onViewChange(val) {
  if (val) {
    changeModel([438130.51, 467840.2002, 3449542.35, 3473688.2, 3000, 3825], 100, 11);
    // myctrl.ctrl.mapCtrl.toolbar.onViewAngle(1);
    myctrl.ctrl.mapCtrl.mainCanvas.map
      .getCamera()
      .position.set(452969.34599722346, 3428198.5640824256, -8053.2502780759205);
  } else {
    changeModel([438130.51, 467840.2002, 3449542.35, 3473688.2, 0, 3825], 1000, 1);
    myctrl.ctrl.mapCtrl.toolbar.onViewAngle(3);
  }
  myctrl.ctrl.mapCtrl.toolbar.onDrawer();
}

const changeModel = function(rangeVal, zInterval, scaleZ) {
  let drawer = map.getDrawer();
  let d = drawer;

  map.deleteObject(d);

  d = new gdfui.gdf3dMapManager.Gdf3dDrawer(drawer.transFunc, rangeVal, [10000, 10000, zInterval], drawer.axisName);
  d.uuid = drawer.uuid;
  //   d.gridColor = gridColor;
  //   d.planeColor = planeColor;
  d.hasFrame = true;
  d.hasText = true;
  d.hasLine = true;
  d.hasPlane = false;
  d.font.size = 16;

  map.setScaleZ(scaleZ);
  d.name = 'mapDrawer';
  map.setDrawer(d);
  map.setRange(rangeVal);
  map.lookAtDrawer(d);
  d.addToMap(map);

  map.getControls().dispatchEvent({ type: 'change' });
  d.traverse((e) => e.layers.disable(0));
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

@media (max-width: 768px) {

  // 调整操作栏样式，适配窄屏
  .handle-item {
    padding: 0 10px; // 减小左右内边距，避免内容溢出
    height: 36px; // 适当降低高度，节省垂直空间
    line-height: 36px; // 保持文字垂直居中
  }

  .handle-item span {
    font-size: 13px; // 缩小文字，避免换行
  }

  // 调整3D场景容器样式，确保占满移动端屏幕
  #myGdfMain {
    width: 100vw !important; // 强制占满屏幕宽度
    height: calc(100vh - 60px) !important; // 减去操作栏高度，避免溢出（根据实际布局调整数值）
    min-height: 300px; // 确保小屏幕下有基础高度
  }

  // 若LayOut组件有默认间距，移动端可去除
  ::v-deep .lay-out-container {
    // 假设LayOut组件外层类名为lay-out-container，需根据实际组件调整
    padding: 0 !important;
    margin: 0 !important;
  }
}
</style>
