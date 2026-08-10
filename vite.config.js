import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { ViteEjsPlugin } from "vite-plugin-ejs";

import path from "path";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
const timestamp = new Date().getTime(); // 获取当前时间戳
// 定义路径别名
const resolvePath = (p) => path.resolve(process.cwd(), p);

export default defineConfig(({ mode }) => {
  return {
    base: "/doublefoxapp",
    plugins: [
      vue(),
      ViteEjsPlugin({
        buildTime: new Date().toISOString(),
      }),
      createSvgIconsPlugin({
        // 指定需要缓存的图标文件夹
        iconDirs: [
          // 这里分为了一般icon文件夹和文件图标类型文件夹，方便管理，可以按照需求设置更多分类
          path.resolve(process.cwd(), "src/icons"),
        ],
        // 指定symbolId格式
        symbolId: "icon-[name]",
      }),
    ],
    resolve: {
      alias: {
        // 配置基础路径别名
        "@": resolvePath("src"),
      },
      // 自动解析扩展名
      extensions: [".js", ".vue", ".json", ".css", ".scss"],
    },
    compilerOptions: {
      types: ["element-plus/global"],
    },
    server: {
      host: "192.168.1.173", // 替换为你的域名
      port: 5555, // 你可以指定端口号
      historyApiFallback: true, // 路由重定向
      proxy: {
        "/api": {
          target: "http://192.168.1.89:19100",
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist/doublefoxapp",
      emptyOutDir: true,
      chunkSizeWarningLimit: 2000, // 单位 KB
      rollupOptions: {
        output: {
          chunkFileNames: `static/js/[name]-[hash].${timestamp}.js`,
          entryFileNames: `static/js/[name]-[hash].${timestamp}.js`,
          assetFileNames: `static/[ext]/[name]-[hash].${timestamp}.[ext]`,
        },
      },
    },
    preview: {
      port: 5173, //打包后执行命令预览 npm run preview
    },
  };
});
