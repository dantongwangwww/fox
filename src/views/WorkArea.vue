<template>
  <LayOut>
    <template #ctrl>
      <div id="myGdfMain"></div>
    </template>
    <template #handle>
      <div class="handle-item">
        <el-button @click="wellDialogVisible = true" style="width: 100%;" color="#e8e8e8">添加井</el-button>
      </div>
      <el-dialog v-model="wellDialogVisible" title="添加单井" width="800" align-center>
        <el-table :data="wellListData" style="width: 100%" max-height="250" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column prop="WellName" label="井名" width="150" />
          <el-table-column prop="WellType" label="井类型" width="150" />
          <el-table-column prop="x" label="x" />
          <el-table-column prop="y" label="y" />
          <el-table-column fixed="right" label="操作" min-width="120">
            <template #default="scope">
              <el-button link type="primary" size="small" @click="toWell(scope.row.WellName)">
                查看测井曲线
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="wellDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="addWells">
              确认
            </el-button>
          </div>
        </template>
      </el-dialog>
      <el-dropdown ref="dropdownRef" :virtual-ref="triggerRef" :show-arrow="false" :popper-options="{
        modifiers: [{ name: 'offset', options: { offset: [0, 0] } }],
      }" virtual-triggering trigger="contextmenu" placement="bottom-start" @command="openWell">
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="1">打开单井</el-dropdown-item>
            <el-dropdown-item command="2">查看连井剖面</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>
  </LayOut>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router';
import LayOut from '@/components/Layout.vue'
defineOptions({
  // 命名当前组件
  name: "WorkArea"
})
const router = useRouter()
// eslint-disable-next-line
const gdfCtrl = ref(null);
let showBg = ref(true);
let showLsolines = ref(true);
let wellDialogVisible = ref(false);
let multipleSelection = ref(null);
let wellListData = ref([
  {
    WellName: "侧沙23-8",
    WellType: "采油井",
    x: 20746453.38,
    y: 3633840.91,
  },
  {
    WellName: "侧沙X23",
    WellType: "采油井",
    x: 20746709.22,
    y: 3633957.07,
  },
  {
    WellName: "沙23-1",
    WellType: "采油井",
    x: 20746669.2,
    y: 3633855.01,
  },
  {
    WellName: "沙23-10",
    WellType: "采油井",
    x: 20746811.36,
    y: 3633936.69,
  },
  {
    WellName: "沙23-11",
    WellType: "注水井",
    x: 20747284.47,
    y: 3634097.05,
  },
  {
    WellName: "沙23-12",
    WellType: "注水井",
    x: 20747286.17,
    y: 3634093,
  },
  {
    WellName: "沙23-13",
    WellType: "采油井",
    x: 20745823.5,
    y: 3633658.18,
  },
  {
    WellName: "沙23-14",
    WellType: "采油井",
    x: 20745823.63,
    y: 3633653.84,
  },
  {
    WellName: "沙23-15",
    WellType: "注水井",
    x: 20745823.53,
    y: 3633647.6,
  },
  {
    WellName: "沙23-16",
    WellType: "采油井",
    x: 20746147.92,
    y: 3633676.54,
  },
  {
    WellName: "沙23-17",
    WellType: "注水井",
    x: 20746147.62,
    y: 3633671.66,
  },
  {
    WellName: "沙23-18",
    WellType: "采油井",
    x: 20746777.3,
    y: 3634066.49,
  },
  {
    WellName: "沙23-19",
    WellType: "注水井",
    x: 20746780.36,
    y: 3634035.61,
  },
  {
    WellName: "沙23-2",
    WellType: "采油井",
    x: 20746670.18,
    y: 3633859.57,
  },
  {
    WellName: "沙23-20",
    WellType: "采油井",
    x: 20746790.31,
    y: 3634036.65,
  },
  {
    WellName: "沙23-20A",
    WellType: "采油井",
    x: 20746790.31,
    y: 3634036.65,
  },
  {
    WellName: "沙23-3",
    WellType: "采油井",
    x: 20746311.5,
    y: 3633656,
  },
  {
    WellName: "沙23-4",
    WellType: "采油井",
    x: 20746984.2,
    y: 3633926.52,
  },
  {
    WellName: "沙23-5",
    WellType: "采油井",
    x: 20746755.93,
    y: 3633929.58,
  },
  {
    WellName: "沙23-6",
    WellType: "注水井",
    x: 20746756.13,
    y: 3633924.27,
  },
  {
    WellName: "沙23-7",
    WellType: "注水井",
    x: 20746495.49,
    y: 3633842.89,
  },
]);
// 文件基础路径
const fileUrl = ref(window.webConfig.fileUrl);
onMounted(() => {
  init()
});
let selectWellsEle = ref(null)
// 初始化图形控件
function init() {
  let newCtrl;
  newCtrl = JSON.parse(JSON.stringify(gdfui.cache));
  newCtrl.elemId = "myGdfMain";
  newCtrl.apiUrl = window.webConfig.baseUrl;
  newCtrl.group = "default";
  newCtrl.isHtml = true;
  newCtrl.isDataTree = false;
  newCtrl.isLayerTree = false;
  newCtrl.isNavigator = false;
  newCtrl.isSelectRect = false;
  newCtrl.isSelectPolygon = false;
  newCtrl.isDrawLine = true;
  newCtrl.isSaveFile = true;
  //初始化控件
  newCtrl.ctrl = new gdfui.gdfPlanMapCtrlProxy(newCtrl, function() {
    newCtrl.ctrl.file.openFile(fileUrl.value + "/map/底图.dfd", ".dfd", 1, function(obj) {
      newCtrl.ctrl.file.mergeFile(fileUrl.value + "/map/井位图模板.dml", ".dml", 1, "", function(obj) {
        gdfCtrl.value = newCtrl;
        var toolbar = gdfCtrl.value.ctrl.mapCtrl.toolbar;
        toolbar.setSelect(true);
        gdfCtrl.value.ctrl.mainCanvas.viewFitCenter(function() {
          gdfCtrl.value.ctrl.file.setMapName("xxx地层砂岩厚度图");
        });
      });
    });
    newCtrl.ctrl.oncanvasrightclick = function(e) {
      position.value = DOMRect.fromRect({
        x: e.event.clientX,
        y: e.event.clientY,
      })
      dropdownRef.value?.handleOpen()
      if (e.selectElements.length == 1) {
        selectEle.value = e.selectElements[0];
      } else if (e.element && e.element.getCoor().length) {
        var lineCoor = e.element.getCoor();
        var lineCoors = [];
        lineCoor.forEach((item, i) => {
          if (i < lineCoor.length - 1) {
            lineCoors.push([{ x: item.x, y: item.y }, { x: lineCoor[i + 1].x, y: lineCoor[i + 1].y }])
          }
        });
        let map = e.mainCanvas.map;
        var wellEles = [];
        if (map.getAllElements().length) {
          var groupEles = map.getAllElements().filter(item => item.getType() == "Group")
          wellEles = groupEles.filter(i => {
            const result = pointToPolylineDist({ x: i.getCoor().x, y: i.getCoor().y }, lineCoors);
            var length = result.minDist;
            var radius = 6 / gdfCtrl.value.ctrl.mapCtrl.mainCanvas.mapParam.scaleX;
            return length <= radius;
          });
        }
        selectWellsEle.value = wellEles;
      }
    };
  });

};

/**
 * 子函数：计算【单个点】到【单条线段】的最短距离
 * @param {Object} point 目标点，格式 {x: 数值, y: 数值}
 * @param {Object} segP1 线段起点，格式 {x: 数值, y: 数值}
 * @param {Object} segP2 线段终点，格式 {x: 数值, y: 数值}
 * @returns {Number} 点到线段的最短距离（浮点型）
 */
function pointToSegmentDist(point, segP1, segP2) {
  // 提取所有坐标值，简化后续计算
  const x0 = point.x, y0 = point.y;
  const x1 = segP1.x, y1 = segP1.y;
  const x2 = segP2.x, y2 = segP2.y;

  // 计算向量：线段向量、起点到目标点的向量
  const vecSegX = x2 - x1;
  const vecSegY = y2 - y1;
  const vecPointX = x0 - x1;
  const vecPointY = y0 - y1;

  // 向量点积（判断垂足位置的核心）
  const dotProduct = vecPointX * vecSegX + vecPointY * vecSegY;
  if (dotProduct <= 0) {
    // 垂足在起点外侧 → 距离 = 点到起点的直线距离
    return Math.hypot(x0 - x1, y0 - y1);
  }

  // 计算线段长度的平方（避免开方，提升性能）
  const segLenSq = vecSegX ** 2 + vecSegY ** 2;
  if (dotProduct >= segLenSq) {
    // 垂足在终点外侧 → 距离 = 点到终点的直线距离
    return Math.hypot(x0 - x2, y0 - y2);
  }

  // 垂足在线段中间 → 计算点到直线的垂直距离
  const t = dotProduct / segLenSq;
  const projX = x1 + t * vecSegX; // 垂足x坐标
  const projY = y1 + t * vecSegY; // 垂足y坐标
  return Math.hypot(x0 - projX, y0 - projY);
}

/**
 * 主函数：计算【单个点】到【整条折线】的最短距离
 * @param {Object} point 目标点，格式 {x: 数值, y: 数值}
 * @param {Array} polyline 折线数据，二维数组格式（与你的数据完全匹配）
 * @returns {Object} {minDist: 最短距离, nearestSegIdx: 最近线段索引}
 */
function pointToPolylineDist(point, polyline) {
  let minDist = Infinity; // 初始化最小距离为无穷大
  let nearestSegIdx = -1; // 记录距离最近的线段索引（从0开始）

  // 遍历折线的每一条线段，计算距离并更新最小值
  polyline.forEach((segment, idx) => {
    const segP1 = segment[0];
    const segP2 = segment[1];
    const dist = pointToSegmentDist(point, segP1, segP2);
    if (dist < minDist) {
      minDist = dist;
      nearestSegIdx = idx;
    }
  });

  return { minDist, nearestSegIdx };
}

let selectEle = ref(null);
const openWell = (a) => {
  if (a === '1') {
    toWell()
  } else if (a === '2') {
    toMultiWell()
  }
};
function addWells() {
  let data = {
    WellFile: [
      {
        WellName: "侧沙23-8",
        WellType: "采油井",
        x: 20746453.38,
        y: 3633840.91,
      },
      {
        WellName: "侧沙X23",
        WellType: "采油井",
        x: 20746709.22,
        y: 3633957.07,
      },
      {
        WellName: "沙23-1",
        WellType: "采油井",
        x: 20746669.2,
        y: 3633855.01,
      },
      {
        WellName: "沙23-10",
        WellType: "采油井",
        x: 20746811.36,
        y: 3633936.69,
      },
      {
        WellName: "沙23-11",
        WellType: "注水井",
        x: 20747284.47,
        y: 3634097.05,
      },
      {
        WellName: "沙23-12",
        WellType: "注水井",
        x: 20747286.17,
        y: 3634093,
      },
      {
        WellName: "沙23-13",
        WellType: "采油井",
        x: 20745823.5,
        y: 3633658.18,
      },
      {
        WellName: "沙23-14",
        WellType: "采油井",
        x: 20745823.63,
        y: 3633653.84,
      },
      {
        WellName: "沙23-15",
        WellType: "注水井",
        x: 20745823.53,
        y: 3633647.6,
      },
      {
        WellName: "沙23-16",
        WellType: "采油井",
        x: 20746147.92,
        y: 3633676.54,
      },
      {
        WellName: "沙23-17",
        WellType: "注水井",
        x: 20746147.62,
        y: 3633671.66,
      },
      {
        WellName: "沙23-18",
        WellType: "采油井",
        x: 20746777.3,
        y: 3634066.49,
      },
      {
        WellName: "沙23-19",
        WellType: "注水井",
        x: 20746780.36,
        y: 3634035.61,
      },
      {
        WellName: "沙23-2",
        WellType: "采油井",
        x: 20746670.18,
        y: 3633859.57,
      },
      {
        WellName: "沙23-20",
        WellType: "采油井",
        x: 20746790.31,
        y: 3634036.65,
      },
      {
        WellName: "沙23-20A",
        WellType: "采油井",
        x: 20746790.31,
        y: 3634036.65,
      },
      {
        WellName: "沙23-3",
        WellType: "采油井",
        x: 20746311.5,
        y: 3633656,
      },
      {
        WellName: "沙23-4",
        WellType: "采油井",
        x: 20746984.2,
        y: 3633926.52,
      },
      {
        WellName: "沙23-5",
        WellType: "采油井",
        x: 20746755.93,
        y: 3633929.58,
      },
      {
        WellName: "沙23-6",
        WellType: "注水井",
        x: 20746756.13,
        y: 3633924.27,
      },
      {
        WellName: "沙23-7",
        WellType: "注水井",
        x: 20746495.49,
        y: 3633842.89,
      },
    ],
    WellFile: multipleSelection.value,
    //"TraceFile": objTraceFile,   //可以为空
    //"TargetFile": objTargetFile, //可以为空
    bWellExtend: 1, // 是否有扩展属性，0=无，1=有
    bAddWellBottom: 1, // 是否添加井底
    nFormat: 0, // 明码
    layerWellTop: "",
  };
  gdfCtrl.value.ctrl.plane.createObjWellMap(data, function() {
    gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04, function() {
      gdfCtrl.value.ctrl.layer.activation("Layer:\\井位\\井口\\采油井 Layer:\\井位\\井口\\注水井");
    });
    gdfCtrl.value.ctrl.layer.activation("Layer:\\井位\\井口\\采油井 Layer:\\井位\\井口\\注水井");
    wellDialogVisible.value = false
  });

};

function toMultiWell(wellNames) {
  const route = router.resolve({
    path: '/MultiWell',
    query: { names: wellNames ? wellNames : selectWellsEle.value.map(item => item.name).join(',') }
  })
  window.open(route.href, '_blank');
}
function toWell(wellName) {
  const route = router.resolve({
    path: '/Well',
    query: { name: wellName ? wellName : selectEle.value.name }
  })
  window.open(route.href, '_blank')
  selectEle.value = null;
}

const handleSelectionChange = (val) => {
  multipleSelection.value = val
}

const dropdownRef = ref();
const position = ref({
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
})

const triggerRef = ref({
  getBoundingClientRect: () => position.value,
})



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
