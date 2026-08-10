/**
 * gdfui 加载工具函数
 * 用于异步加载 gdfui.js，避免首页加载时的性能损耗
 */

// 存储加载状态和Promise
let gdfuiLoadingPromise = null;
let gdfuiLoaded = false;

/**
 * 加载 gdfui.js
 * @returns {Promise} 加载完成的Promise
 */
export function loadGdfui() {
  // 如果已经加载完成，直接返回
  if (gdfuiLoaded) {
    return Promise.resolve(window.gdfui);
  }
  
  // 如果正在加载，返回正在进行的Promise
  if (gdfuiLoadingPromise) {
    return gdfuiLoadingPromise;
  }
  
  // 创建新的加载Promise
  gdfuiLoadingPromise = new Promise((resolve, reject) => {
    // 创建script标签
    const script = document.createElement('script');
    script.src = window.webConfig.gdfUrl;
    script.type = 'text/javascript';
    script.async = true;
    
    // 加载成功回调
    script.onload = () => {
      gdfuiLoaded = true;
      gdfuiLoadingPromise = null;
      resolve(window.gdfui);
    };
    
    // 加载失败回调
    script.onerror = (error) => {
      gdfuiLoadingPromise = null;
      reject(new Error('Failed to load gdfui.js'));
    };
    
    // 插入到head中
    document.head.appendChild(script);
  });
  
  return gdfuiLoadingPromise;
}

/**
 * 检查 gdfui 是否已加载
 * @returns {boolean} 是否已加载
 */
export function isGdfuiLoaded() {
  return gdfuiLoaded;
}

/**
 * 获取 gdfui 实例
 * @returns {object|null} gdfui实例或null
 */
export function getGdfui() {
  return gdfuiLoaded ? window.gdfui : null;
}
