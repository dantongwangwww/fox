/**
 * 微件通信事件契约（基于 lib/eventEmitter.umd.js —— IDEAS 平台微件通信 SDK）
 *
 * 职责：
 *  1. 统一管理事件名常量（与父框架约定的通信契约）
 *  2. 集中声明 sendEvents / receiveEvents（emit 对象格式的校验依赖）
 *  3. 封装 $eventEmitter 的常用操作，业务代码不直接触碰库
 *
 * 机制要点（库的行为，勿改动）：
 *  - emit 对象格式 {name, action} 必须先在 sendEvents 注册，eventClassify 含"标准消息"
 *  - 回调回执 triggereStatus 只有 SUCCESS/FAIL，不带数据；查询类用"请求-响应事件对"
 *  - 平台事件 pbc:platform:save_workstate / close_tab 的监听函数返回值会被回传给父框架
 */

// ---------------- 事件名常量 ----------------
export const EVENTS = {
  // ===== 微件上报（emit 给父框架/其他微件）=====
  WELL_READY: "well:ready",                       // 单井图创建完成
  WELL_LOADING: "well:loading",                   // 加载中
  WELL_LOAD_ERROR: "well:loadError",              // 加载失败
  WELL_CHANGED: "well:wellChanged",               // 切换井
  WELL_DEPTH_RANGE_CHANGED: "well:depthRangeChanged", // 深度范围/比例变化
  WELL_TOOL_CHANGED: "well:toolChanged",          // 工具栏模式切换
  WELL_STATE_RESPONSE: "well:stateResponse",      // 状态查询应答（与 well:getState 配对）

  // ===== 微件接收（on 父框架指令）=====
  WELL_LOAD: "well:loadWell",                     // 加载指定井
  WELL_SET_DEPTH_RANGE: "well:setDepthRange",     // 设置深度范围
  WELL_SET_DEPTH_SCALE: "well:setDepthScale",     // 设置深度比例
  WELL_ZOOM: "well:zoom",                         // 视图缩放（fit/fitHeight/fitCenter/fitBespread）
  WELL_GET_STATE: "well:getState",                // 查询当前状态（应答走 WELL_STATE_RESPONSE）
  WELL_EXPORT_IMAGE: "well:exportImage",          // 导出图片（微件内触发下载）

  // ===== 平台事件（必须实现，返回值回传父框架）=====
  PLATFORM_SAVE_WORKSTATE: "pbc:platform:save_workstate",
  PLATFORM_CLOSE_TAB: "pbc:platform:close_tab",
};

// ---------------- 注册表（事件契约）----------------
// 微件"可发送"事件（emit 对象格式校验依赖 sendEvents）
export const SEND_EVENTS = [
  { name: EVENTS.WELL_READY, eventClassify: ["标准消息"], actionArrName: ["select"] },
  { name: EVENTS.WELL_LOADING, eventClassify: ["标准消息"], actionArrName: ["select"] },
  { name: EVENTS.WELL_LOAD_ERROR, eventClassify: ["标准消息"], actionArrName: ["select"] },
  { name: EVENTS.WELL_CHANGED, eventClassify: ["标准消息"], actionArrName: ["select"] },
  { name: EVENTS.WELL_DEPTH_RANGE_CHANGED, eventClassify: ["标准消息"], actionArrName: ["select"] },
  { name: EVENTS.WELL_TOOL_CHANGED, eventClassify: ["标准消息"], actionArrName: ["select"] },
  { name: EVENTS.WELL_STATE_RESPONSE, eventClassify: ["标准消息"], actionArrName: ["select"] },
];

// 微件"可接收"事件（父框架可据此查询；字符串 eventName 实际直接匹配本地 events Map）
export const RECEIVE_EVENTS = [
  { name: EVENTS.WELL_LOAD, eventClassify: ["标准消息"], actionArrName: ["select"] },
  { name: EVENTS.WELL_SET_DEPTH_RANGE, eventClassify: ["标准消息"], actionArrName: ["select"] },
  { name: EVENTS.WELL_SET_DEPTH_SCALE, eventClassify: ["标准消息"], actionArrName: ["select"] },
  { name: EVENTS.WELL_ZOOM, eventClassify: ["标准消息"], actionArrName: ["select"] },
  { name: EVENTS.WELL_GET_STATE, eventClassify: ["标准消息"], actionArrName: ["select"] },
  { name: EVENTS.WELL_EXPORT_IMAGE, eventClassify: ["标准消息"], actionArrName: ["select"] },
];

// ---------------- 通信日志钩子（供微件侧监视浮层使用） ----------------
const logListeners = [];

/** 订阅通信日志（收/发事件） */
export function onEventLog(cb) {
  logListeners.push(cb);
}

function notifyLog(dir, name, data) {
  logListeners.forEach((cb) => {
    try { cb({ dir, name, data, ts: Date.now() }); } catch (e) { /* 忽略 */ }
  });
}

// ---------------- 封装 ----------------
let emitter = null;

/** 获取微件通信实例（优先 $eventEmitter 单例） */
export function getEmitter() {
  if (!emitter) emitter = window.$eventEmitter || null;
  return emitter;
}

/**
 * 初始化通信（声明可发送/可接收事件）
 * 需在首次 emit 之前调用；建议在组件 onMounted 中调用
 */
export function initEventBus() {
  const ee = getEmitter();
  if (!ee) return null;
  ee.sendEvents = SEND_EVENTS;
  ee.receiveEvents = RECEIVE_EVENTS;
  return ee;
}

/**
 * 发送标准消息（对象格式，经 sendEvents 校验）
 * @param {string} name 事件名（EVENTS 常量）
 * @param {*} data 负载
 * @returns {boolean|undefined} true=已发送；undefined=校验失败（库已 console.error）
 */
export function emitEvent(name, data) {
  const ee = getEmitter();
  if (!ee) return false;
  const ok = ee.emit({ name, action: "select" }, data);
  notifyLog("out", name, data);
  return ok;
}

/**
 * 注册接收指令（父框架下发）
 * @param {string} name 事件名
 * @param {Function} handler (data, message) => void
 */
export function onCommand(name, handler) {
  const ee = getEmitter();
  if (!ee) return;
  ee.on(name, function (data, msg) {
    notifyLog("in", name, data);
    return handler(data, msg); // 保留返回值（平台事件会回传给父框架）
  });
}

/**
 * 给 DOMContentLoaded 后创建的第二个实例（__EVENT_EMITTER__）补注册平台事件，
 * 避免它因"事件未注册"报错（库的双实例特性）
 */
export function registerPlatformEventsForSecondaryInstance(handlers) {
  window.addEventListener("DOMContentLoaded", () => {
    const ee2 = window.__EVENT_EMITTER__;
    if (!ee2) return;
    handlers.forEach(({ name, handler }) => ee2.on(name, handler));
  });
}
