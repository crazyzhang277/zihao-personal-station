export interface AboutContent {
  name: string;
  nameEn: string;
  role: string;
  bio: string;
  shortBio: string;
  interests: string[];
  contacts: ContactLink[];
  statement: string;
}

export interface ContactLink {
  label: string;
  value: string;
  href?: string;
}

export const aboutContent: AboutContent = {
  name: "西太平洋观测站",
  nameEn: "WEST PACIFIC OBSERVATION",
  role: "观测者 / 开发者 / 记录者",
  bio: "西太平洋观测站是一座把真实世界接入数字界面的观测台，关注气象、网络与那些让设备“活起来”的小系统，也喜欢把复杂数据整理成可以被安静阅读的页面。这里是持续观测、实验与记录的地方。",
  shortBio: "把天气、网络与真实世界的信号整理成可读的界面。",
  interests: [
    "气象与台风路径的可视化",
    "网络延迟与连接质量探针",
    "个人工具与小实验",
    "编辑风界面与信息设计",
  ],
  contacts: [
    { label: "GitHub", value: "github.com/crazyzhang277/west-pacific-station", href: "https://github.com/crazyzhang277/west-pacific-station" },
    { label: "位置", value: "上海 / 中国" },
  ],
  statement: "我相信好的工具应该像一本好刊物：有秩序、有呼吸感，也始终为真实世界保留位置。",
};