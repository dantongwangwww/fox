<template>
  <LayOut>
    <template #ctrl>
      <div id="myGdfMain"></div>
    </template>
    <template #handle>
      <div class="collapse-box">
        <el-collapse v-model="activeNames" @change="handleChange">
          <el-collapse-item title="断层" name="1">
            <div>
              <ul>
                <li v-for="(item, index) in faultItems" :key="index" @click="faultCheckbox(index, item)">
                  <el-checkbox v-model="item.checked" size="large" @click.stop />
                  <div>{{ item.title }}</div>
                </li>
              </ul>
            </div>
          </el-collapse-item>
          <el-collapse-item title="层位" name="2">
            <div>
              <ul>
                <li v-for="(item, index) in horizonItems" :key="index" @click="horizonCheckbox(index, item)">
                  <el-checkbox v-model="item.checked" size="large" @click.stop />
                  <div>{{ item.title }}</div>
                </li>
              </ul>
            </div>
          </el-collapse-item>
          <el-collapse-item title="井" name="3">
            <div>
              <ul>
                <li v-for="(item, index) in wellItems" :key="index" @click="wellCheckbox(index, item)">
                  <el-checkbox v-model="item.checked" size="large" @click.stop />
                  <div>{{ item.title }}</div>
                </li>
              </ul>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </template>
  </LayOut>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import LayOut from '../components/Layout.vue';
defineOptions({
  // 命名当前组件
  name: "Seismic"
})

const activeNames = ref(['1', '2', '3']) // 默认展开所有面板
const handleChange = (val) => {
}
const faultItems = ref([
  { title: "F1", name: 'F1', checked: true },
  { title: "F2", name: 'F10', checked: true },
  { title: "F3", name: 'ult', checked: true },
]);
const horizonItems = ref([
  { title: "H1", name: 'wt1', checked: true },
  { title: "H2", name: 'wt2', checked: true },
  { title: "H3", name: 'wt2qn2', checked: true },
]);
const wellItems = ref([
  { title: "W1", name: 'Q124', checked: true },
  { title: "W2", name: 'Q109', checked: true },
]);

function faultCheckbox(index, item) {
  // let layerNames = `Layer:\\fault3D\\${item.name}`
  // changeLayer(faultItems.value[index].checked, layerNames);
  faultItems.value[index].checked = !faultItems.value[index].checked;
}
function horizonCheckbox(index, item) {
  // let layerNames = `Layer:\\horizon3D\\${item.name}`
  // changeLayer(horizonItems.value[index].checked, layerNames);
  horizonItems.value[index].checked = !horizonItems.value[index].checked;
}
function wellCheckbox(index, item) {
  // let layerNames = `Layer:\\well\\${item.name}`
  // changeLayer(wellItems.value[index].checked, layerNames);
  wellItems.value[index].checked = !wellItems.value[index].checked;
}

function changeLayer(isShow, layerNames) {
  if (isShow) {
    //隐藏
    gdfCtrl.value.ctrl.hideLayers(layerNames, function() {
      gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function() { });
    });
  } else {
    //显示
    gdfCtrl.value.ctrl.showLayers(layerNames, function() {
      gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function() { });
    });
  }
}

faultItems.value.forEach((item, index) => {
  watch(
    () => item.checked,
    (isChecked) => {
      const layerNames = `Layer:\\fault3D Layer:\\fault3D\\${item.name}`;
      changeLayer(!isChecked, layerNames);
    }
  );
});
horizonItems.value.forEach((item, index) => {
  watch(
    () => item.checked,
    (isChecked) => {
      const layerNames = `Layer:\\horizon3D Layer:\\horizon3D\\${item.name}`;
      changeLayer(!isChecked, layerNames);
    }
  );
});

wellItems.value.forEach((item, index) => {
  watch(
    () => item.checked,
    (isChecked) => {
      const layerNames = `Layer:\\well Layer:\\well\\${item.name}`;
      changeLayer(!isChecked, layerNames);
    }
  );
});

// eslint-disable-next-line
let gdf = gdfui;
console.log(gdfui);

const gdfCtrl = ref(null);
// 文件基础路径
const fileUrl = ref(window.webConfig.fileUrl);
onMounted(() => {
  init()
});
// 初始化图形控件
function init() {
  let uname = "cool";
  let group = "default";
  var ctrlSeismic;
  ctrlSeismic = JSON.parse(JSON.stringify(gdfui.cache));
  ctrlSeismic.elemId = "myGdfMain";
  ctrlSeismic.apiUrl = window.webConfig.baseUrl;
  ctrlSeismic.group = group;
  ctrlSeismic.isHtml = true;
  ctrlSeismic.isLayerTree = false;
  ctrlSeismic.isScrollBar = true;
  ctrlSeismic.isRefresh = false;
  ctrlSeismic.isZoomOut = true;
  ctrlSeismic.isZoomIn = true;
  ctrlSeismic.isNavigator = false;
  // ctrlSeismic.isSaveFile = false;
  ctrlSeismic.isSetSeiLine = false;
  ctrlSeismic.ctrl = new gdfui.gdfSeismicMapCtrlProxy(ctrlSeismic, function() {
    var toolbar = ctrlSeismic.ctrl.mapCtrl.toolbar;
    gdfCtrl.value = ctrlSeismic;
    ctrlSeismic.ctrl.file.openFile(fileUrl.value + "/map/地震剖面演示.dfd", ".dfd", 1, function(obj) {
      ctrlSeismic.ctrl.mainCanvas.viewFitBespread(function() {
        toolbar.setRuler(true);
        ctrlSeismic.ctrl.seismic.getAmplitudeScale(function(obj) {
          ctrlSeismic.ctrl.viewRefresh(0x01);
          // 获取当前振幅系数
          var AmplitudeScale = JSON.parse(obj.data.Data.data);
          const inputs = document.querySelectorAll('#setAmplitudeScale input');
          inputs.forEach(input => {
            input.value = String(AmplitudeScale);
          })
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
