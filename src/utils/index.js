// 该函数用于移除文件名的后缀名
export function removeFileExtension(filename) {
  const parts = filename.split(".");
  if (parts.length === 1) return filename; // 没有后缀名
  return parts.slice(0, -1).join("."); // 取除最后一个部分外的所有部分
}

/**
 * @param {string} path
 * @returns {Boolean}
 */
export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path);
}

export function isMobile() {
  let flag = navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i);
  return flag;
}


