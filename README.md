# 琉璃番茄钟 | ZenSpace Pomodoro & Ambient Soundboard

<p align="center">
  <img src="https://img.shields.io/badge/Vite-5.4.21-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite Version" />
  <img src="https://img.shields.io/badge/Web_Audio-API-red?style=for-the-badge&logo=web-audio-api&logoColor=white" alt="Web Audio API" />
  <img src="https://img.shields.io/badge/HTML5-Semantic-orange?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-Glassmorphism-blue?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/Licence-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

**琉璃番茄钟 (ZenSpace)** 是一款极具现代美学感、专注身心平衡的番茄工作钟与白噪音混音看板。

项目采用 **Glassmorphism（毛玻璃/琉璃）** 视觉美学，结合 **100% 纯代码音频合成技术 (Web Audio Synthesis)**，在不加载任何外部庞大音频包的情况下，通过实时振荡器算法为用户模拟出沉浸式的雨声、篝火声、风声、脑波冥想、Lofi 音乐与多种机械键盘按键声，同时配备了正念呼吸训练和墨水屏模式，是您桌面上最精致的专注伴侣。

---

## ✨ 核心特性 (Key Features)

### 🎨 1. 琉璃光影美学 (Glassmorphism UI)
*   **极光流体背景**：背景三个极光光斑以平滑贝塞尔曲线进行缓慢漂移。
*   **状态主题色过渡**：界面主色调会随着**专注**、**短休**、**长休**三种阶段平滑转变为玫瑰粉、翡翠绿与深空紫。
*   **微交互发光**：按钮、卡片、滑动条均包含高性能的霓虹阴影与 Hover 微震动动效。

### 🎵 2. 纯代码合成白噪音 (Web Audio Synthesis)
*   **深山落雨 (Rain)**：使用粉色噪声 (Pink Noise) 结合低通滤波器模拟温暖雨声。
*   **林中篝火 (Campfire)**：棕色噪声 (Brown Noise) 产生燃烧重音，叠加基于随机频率衰减算法的木材燃烧“噼啪”爆裂声。
*   **松涛微风 (Wind)**：内置 0.06Hz 极低频振荡器 (LFO) 动态微调滤波器频段，实现微风拂过树梢的周期起伏。
*   **深空冥想 (Space)**：左右声道发射 80Hz 和 84Hz 双耳差频正弦波，形成 4Hz 的 Theta 脑波搏动，迅速引导静心。
*   **禅意 Lofi (Zen Lofi)**：程序实时合成慢速和弦 Pad (Cmaj7-Am7-Fmaj7-G7) 并利用五声音阶随机演奏主旋律，同时连入反馈式 Echo (延迟/回音) 环路，生成无限的 generative 音乐。

### 🎹 3. 机械键盘轴体工坊 (Keyboard Switch Workshop)
*   **青轴 (Blue)**：高频扫频 + 4.8kHz 锯齿波高通金属弹片声，提供爽快的脆响段落感。
*   **茶轴 (Tea)**：平衡的中频段落 + 轻微 transient 瞬态回弹，适合温润打字。
*   **红轴 (Red)**：深沉的低频三角波扫频 + 320Hz 低通滤波，带来静音的“石墨/木鱼”敲击声。

### 🌬️ 4. 正念呼吸教练 (Breathing Guide)
*   当番茄钟切换到休息模式时，自动淡入霓虹呼吸光圈。
*   配合 8 秒一个周期的 CSS 动画，动态引导用户 **“吸气 (4s) / 呼气 (4s)”**，平缓心率。

### 🌓 5. 墨水屏极简纸质模式 (E-Ink Paper Theme)
*   专为废旧 Kindle/Boox 等电子墨水屏设备打造的极致护眼主题。
*   一键关闭所有彩色渐变与动态模糊，界面切换为纯白背景、粗黑硬投影边框、高对比度衬线体（Georgia / Serif），成为完美的桌面摆件。

### 📸 6. “专注胶囊”拍立得卡片导出 (Polaroid Card Export)
*   每次专注结束后，您可以录入专注心得。
*   应用会利用 HTML5 Canvas 实时为您渲染并导出一张高颜值的**复古拍立得打卡卡片**，记录您的完成番茄数、日期、心得和当时的白噪音调色配方。

---

## 🛠️ 技术栈说明 (Tech Stack)

项目秉持 **“轻量、纯净、无庞大第三方库”** 的现代化 Vanilla 原生构建原则：
*   **构建工具**：Vite 5.2.0 (极速打包和热更新开发体验)
*   **核心语言**：ES6 JavaScript Modules & Semantic HTML5
*   **样式系统**：CSS 自定义变量（Tokens）、Keyframes 动画和 Flexbox/Grid 布局
*   **音频内核**：W3C Web Audio API (振荡器、滤波器、延迟节点、立体声合成)
*   **数据统计**：LocalStorage 浏览器本地存储与原生 SVG 动态图表绘制

---

## ⚡ 快速开始 (Quick Start)

### 本地运行步骤

1.  **克隆或解压本项目**
2.  **安装开发依赖**（仅需安装 Vite 开发环境）：
    ```bash
    npm install
    ```
3.  **启动开发服务器**：
    ```bash
    npm run dev
    ```
4.  **打开浏览器**：
    Vite 会自动开启并在默认浏览器打开 `http://localhost:3000`。

### 编译打包

如需将其打包为静态生产环境网页：
```bash
npm run build
```
打包生成的所有文件将输出至 `dist/` 文件夹，该文件夹包含极小的 `index.html`、`CSS` 和 `JS`，可部署在任意静态托管服务器上。

---

## 📦 部署指南 (Deployment)

由于本项目编译后是纯静态资源，您可以将其一键部署在以下静态托管平台：
*   **GitHub Pages**：将 `dist` 文件夹推送到 `gh-pages` 分支。
*   **Vercel / Netlify**：直接关联 GitHub 仓库，将构建命令设为 `npm run build`，发布目录设为 `dist`。

---

## 📄 开源许可证 (License)

本项目采用 [MIT License](LICENSE) 开源许可证。
