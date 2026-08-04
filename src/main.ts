import { initNavigation } from "./lib/navigation";

initNavigation();

// 入场淡入：直接打开/刷新/导航进入页面时，通过 pagereveal 添加 reveal 类播放 page-reveal。
// 跨文档 View Transition 已停用（transitions.css 已移除），无过渡快照，因此不会出现透明快照白屏。
document.documentElement.classList.add("reveal");
