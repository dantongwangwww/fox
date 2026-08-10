<template>
  <LayOut>
    <template #ctrl>
      <div id="myGdfMain"></div>
      <!-- 微件通信监视浮层：实时显示收到的指令与上报的事件 -->
      <div class="ee-monitor" :class="{ collapsed: monitorCollapsed }">
        <div class="ee-monitor-head" @click="monitorCollapsed = !monitorCollapsed">
          <span>微件通信监视</span>
          <span class="ee-monitor-id">{{ widgetId }}</span>
          <span class="ee-monitor-count">{{ eventLogs.length }}</span>
          <span class="ee-monitor-toggle">{{ monitorCollapsed ? '展开' : '收起' }}</span>
        </div>
        <div class="ee-monitor-body" v-if="!monitorCollapsed">
          <div v-if="!eventLogs.length" class="ee-monitor-empty">暂无通信记录</div>
          <div v-for="(item, idx) in eventLogs" :key="idx" class="ee-log-item">
            <span class="ee-dir" :class="item.dir">{{ item.dir === 'in' ? '收' : '发' }}</span>
            <b>{{ item.name }}</b>
            <span class="ee-log-time">{{ new Date(item.ts).toLocaleTimeString('zh-CN', { hour12: false }) }}</span>
            <pre>{{ item.summary }}</pre>
          </div>
        </div>
      </div>
    </template>
  </LayOut>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LayOut from '../components/Layout.vue'
import wellList from '../data/wellList.js'
import { ElLoading } from 'element-plus';
import { useRoute } from 'vue-router';
import { EVENTS, initEventBus, emitEvent, onCommand, onEventLog, registerPlatformEventsForSecondaryInstance } from '../utils/eventBus.js';
defineOptions({
  // 命名当前组件
  name: "Well"
})
// eslint-disable-next-line
let gdf = gdfui;
let gdfCtrl = ref(null);
let showBg = ref(true);
let showLsolines = ref(true);
// 文件基础路径
const fileUrl = ref(window.webConfig.fileUrl);
const route = useRoute();

// ================= 微件通信（eventBus） =================
const currentWellName = ref('测井1');
let lastDepthKey = null;   // 深度输入框轮询对比
let lastToolKey = null;    // 工具栏模式轮询对比

const monitorCollapsed = ref(false);
const eventLogs = ref([]);
const widgetId = ref('');

// 订阅通信日志（收/发）到监视浮层
onEventLog(({ dir, name, data, ts }) => {
  let summary = '';
  try { summary = JSON.stringify(data); } catch (e) { summary = String(data); }
  eventLogs.value.unshift({ dir, name, summary, ts });
  if (eventLogs.value.length > 20) eventLogs.value.length = 20;
});

onMounted(() => {
  initEventBus();
  widgetId.value = (window.$eventEmitter && window.$eventEmitter.id) || '';
  registerCommands();
  // 库的双实例特性：给 DOMContentLoaded 后创建的 __EVENT_EMITTER__ 补注册平台事件，避免"事件未注册"报错
  registerPlatformEventsForSecondaryInstance([
    { name: EVENTS.PLATFORM_SAVE_WORKSTATE, handler: () => getWellState() },
    { name: EVENTS.PLATFORM_CLOSE_TAB, handler: () => ({ ready: true, wellName: currentWellName.value }) },
  ]);
  init();
  startStatePolling();
});

// 读取 gdfui 深度输入框的值（#StartDepth / #EndDepth / #DepthScale）
function readDepthValue(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const v = parseFloat(el.value);
  return Number.isNaN(v) ? null : v;
}

// 当前工具栏模式（getViewState 返回数组，如 ["select"]）
function currentTool() {
  const ctrl = window.__wellCtrl && window.__wellCtrl.ctrl;
  if (!ctrl || !ctrl.toolbar || typeof ctrl.toolbar.getViewState !== 'function') return '';
  return (ctrl.toolbar.getViewState() || []).join(',');
}

// 聚合当前状态（save_workstate / stateResponse 共用）
function getWellState() {
  return {
    wellName: currentWellName.value,
    startDepth: readDepthValue('StartDepth'),
    endDepth: readDepthValue('EndDepth'),
    depthScale: readDepthValue('DepthScale'),
    tool: currentTool(),
    widgetId: (window.$eventEmitter && window.$eventEmitter.id) || '',
    ts: Date.now(),
  };
}

// gdfui 是黑盒无深度变化回调，轮询深度输入框与工具栏模式，变化即上报
function startStatePolling() {
  setInterval(() => {
    const depthKey = [
      (document.getElementById('StartDepth') || {}).value ?? '',
      (document.getElementById('EndDepth') || {}).value ?? '',
      (document.getElementById('DepthScale') || {}).value ?? '',
    ].join('|');
    if (depthKey !== lastDepthKey) {
      const changed = lastDepthKey !== null;
      lastDepthKey = depthKey;
      if (changed) {
        emitEvent(EVENTS.WELL_DEPTH_RANGE_CHANGED, {
          wellName: currentWellName.value,
          startDepth: readDepthValue('StartDepth'),
          endDepth: readDepthValue('EndDepth'),
          depthScale: readDepthValue('DepthScale'),
        });
      }
    }
    const tool = currentTool();
    if (tool !== lastToolKey) {
      const changed = lastToolKey !== null;
      lastToolKey = tool;
      if (changed) emitEvent(EVENTS.WELL_TOOL_CHANGED, { wellName: currentWellName.value, tool });
    }
  }, 800);
}

// 视图缩放（in/out 本地缩放系数，fit 系列自适应）
function zoomMap(action) {
  const ctrl = window.__wellCtrl && window.__wellCtrl.ctrl;
  if (!ctrl) return;
  const mc = ctrl.mainCanvas;
  try {
    switch (action) {
      case 'in':
        if (typeof mc.viewZoomInOut === 'function') mc.viewZoomInOut(1.5);
        else if (typeof mc.zoomInOut === 'function') mc.zoomInOut(1.5, 0, 0);
        break;
      case 'out':
        if (typeof mc.viewZoomInOut === 'function') mc.viewZoomInOut(0.67);
        else if (typeof mc.zoomInOut === 'function') mc.zoomInOut(0.67, 0, 0);
        break;
      case 'fitHeight': mc.fitHeight(); break;
      case 'fitCenter': mc.fitCenter(); break;
      case 'fitBespread': mc.fitBespread(); break;
      case 'fit':
      default: mc.fitWidth(); break;
    }
  } catch (e) { console.error('zoomMap failed:', e); }
}

// 设置深度范围+比例：走 gdfui 原生 setWellInfo 路径
// （服务端设置 + 更新本地 wellInfo 配置 + viewRefreshApi(1) 刷新视图）
function applyDepth(scale, start, end) {
  const ctrl = window.__wellCtrl && window.__wellCtrl.ctrl;
  if (!ctrl || !ctrl.mapCtrl) return;
  try {
    // 1) 先把值写入 gdfui 深度输入框（setWellInfo 内部从输入框读取）
    if (scale != null) { const el = document.getElementById('DepthScale'); if (el) el.value = scale; }
    if (start != null) { const el = document.getElementById('StartDepth'); if (el) el.value = start; }
    if (end != null) { const el = document.getElementById('EndDepth'); if (el) el.value = end; }
    // 2) 调用 gdfui 自己的 setWellInfo（变化检测 + 服务端设置 + 配置同步 + 刷新视图）
    const proxy = ctrl.mapCtrl.ctrlProxy;
    if (proxy && typeof proxy.setWellInfo === 'function') {
      proxy.setWellInfo();
      return;
    }
    // 3) 兜底：手动执行等价逻辑
    const wi = ctrl.mapCtrl.wellInfo || {};
    if (scale != null && !isNaN(scale)) wi.DepthScale = Number(scale);
    if (start != null && !isNaN(start)) wi.StartDepth = Number(start);
    if (end != null && !isNaN(end)) wi.EndDepth = Number(end);
    if (scale != null && !isNaN(scale)) ctrl.well.setDepthScale(currentWellName.value, Number(scale), function () { });
    if (start != null && end != null && !isNaN(start) && !isNaN(end)) {
      ctrl.well.setDepthRange(currentWellName.value, Number(start), Number(end), function () { });
    }
    if (typeof ctrl.mapCtrl.viewRefreshApi === 'function') ctrl.mapCtrl.viewRefreshApi(1);
  } catch (e) { console.error('applyDepth failed:', e); }
}

// 导出图片（gdfui 触发下载）
function exportImage(format, filename) {
  const ctrl = window.__wellCtrl && window.__wellCtrl.ctrl;
  if (!ctrl || !ctrl.mainCanvas.exportImage) return;
  try {
    ctrl.mainCanvas.exportImage(format || 'png', filename || currentWellName.value + '-' + Date.now());
  } catch (e) { console.error('exportImage failed:', e); }
}

// 注册父框架指令
function registerCommands() {
  onCommand(EVENTS.WELL_LOAD, (data) => {
    if (data && data.wellName && gdfCtrl.value) addWell(data.wellName);
  });
  onCommand(EVENTS.WELL_SET_DEPTH_RANGE, (data) => {
    if (!data || data.startDepth == null || data.endDepth == null) return;
    applyDepth(readDepthValue('DepthScale') || 1000, data.startDepth, data.endDepth);
  });
  onCommand(EVENTS.WELL_SET_DEPTH_SCALE, (data) => {
    if (!data || data.depthScale == null) return;
    applyDepth(data.depthScale, readDepthValue('StartDepth') || 1500, readDepthValue('EndDepth') || 2000);
  });
  onCommand(EVENTS.WELL_ZOOM, (data) => { zoomMap(data && data.action); });
  onCommand(EVENTS.WELL_GET_STATE, (data) => {
    emitEvent(EVENTS.WELL_STATE_RESPONSE, { requestId: data && data.requestId, state: getWellState() });
  });
  onCommand(EVENTS.WELL_EXPORT_IMAGE, (data) => { exportImage(data && data.format, data && data.filename); });
  // 平台事件：监听函数返回值会回传给父框架
  onCommand(EVENTS.PLATFORM_SAVE_WORKSTATE, () => getWellState());
  onCommand(EVENTS.PLATFORM_CLOSE_TAB, () => ({ ready: true, wellName: currentWellName.value }));
}

// ================= 原有 gdfui 初始化逻辑 =================
// 初始化图形控件
function init() {
  let myctrl;
  myctrl = JSON.parse(JSON.stringify(gdfui.cache));
  myctrl.elemId = "myGdfMain";
  myctrl.apiUrl = window.webConfig.baseUrl;
  myctrl.isScrollBar = true;
  myctrl.isSingleWellTool = true;
  myctrl.ctrl = new gdf.gdfWellMapCtrlProxy(myctrl, function() {
    gdfCtrl.value = myctrl;
    window.__wellCtrl = myctrl; // 暴露控件实例（事件上报/调试用）
    if (route.query && route.query.name) {
      addWell(route.query.name);
    } else {
      addWell('测井1');
    }
  });
};

function addWell(name) {
  if (!name || !gdfCtrl.value) return;
  currentWellName.value = name;
  emitEvent(EVENTS.WELL_LOADING, { wellName: name, loading: true });
  let num = Math.floor(Math.random() * 5) + 1;
  var data = {
    wellName: name,
    startDepth: 1500,
    endDepth: 2000,
    depthScale: 1000,
    curveFile: `${fileUrl.value}/map/well/${num}.txt`,
    wellTemplateFile: `${fileUrl.value}/map/well/录井草图.dml`,
    depthFile: `${fileUrl.value}/map/well/depth.txt`,
  };
  try {
    gdfCtrl.value.ctrl.well.createMap(data, function() {
      // 开启滚动条
      gdfCtrl.value.ctrl.toolbar.onScrollBar();
      // 居中图道
      gdfCtrl.value.ctrl.mainCanvas.fitWidth();
      emitEvent(EVENTS.WELL_LOADING, { wellName: name, loading: false });
      emitEvent(EVENTS.WELL_READY, getWellState());
      emitEvent(EVENTS.WELL_CHANGED, { wellName: name });
    });
  } catch (e) {
    console.error('createMap failed:', e);
    emitEvent(EVENTS.WELL_LOADING, { wellName: name, loading: false });
    emitEvent(EVENTS.WELL_LOAD_ERROR, { wellName: name, error: String(e) });
  }
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
</style>


<style lang="scss" scoped>
.ee-monitor {
  position: fixed;
  top: 90px;
  right: 12px;
  z-index: 9999;
  width: 300px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #d0d7de;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  font-size: 12px;
  overflow: hidden;

  &.collapsed .ee-monitor-body { display: none; }

  .ee-monitor-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: #1d3d62;
    color: #fff;
    cursor: pointer;
    font-weight: 700;

    .ee-monitor-id {
      font-weight: 400;
      opacity: 0.8;
    }
    .ee-monitor-count {
      background: #00a27c;
      border-radius: 10px;
      padding: 0 6px;
      font-size: 11px;
    }
    .ee-monitor-toggle {
      margin-left: auto;
      font-weight: 400;
      opacity: 0.8;
    }
  }

  .ee-monitor-body {
    max-height: 320px;
    overflow: auto;
    padding: 6px;
  }

  .ee-monitor-empty {
    color: #999;
    text-align: center;
    padding: 12px;
  }

  .ee-log-item {
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 4px 6px;
    margin-bottom: 4px;

    b { font-size: 12px; }
    .ee-log-time { float: right; color: #999; font-size: 11px; }
    pre {
      margin: 2px 0 0;
      font-size: 10px;
      white-space: pre-wrap;
      word-break: break-all;
      color: #57606a;
      max-height: 60px;
      overflow: auto;
    }
    .ee-dir {
      display: inline-block;
      width: 18px;
      text-align: center;
      border-radius: 3px;
      margin-right: 4px;
      font-size: 10px;
      color: #fff;
      &.in { background: #0969da; }
      &.out { background: #00a27c; }
    }
  }
}
</style>
