import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'ValPoint',
  description: 'Valorant 点位管理与分享平台',
  lang: 'zh-CN',
  base: '/wiki/',

  head: [
    ['link', { rel: 'icon', href: '/wiki/logo.svg', type: 'image/svg+xml' }],
    ['script', { src: 'https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js' }]
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '首页', link: '/' },
      { text: '用户指南', link: '/guide/快速开始' },
      { text: '开发文档', link: '/dev/项目概览' },
      { text: '返回应用', link: 'https://valpoint.cn' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '网站概述',
          link: '/guide/项目概述',
        },
        {
          text: '开始使用',
          items: [
            { text: '快速开始', link: '/guide/快速开始' },
            {
              text: '前置准备',
              collapsed: true,
              items: [
                { text: '数据库建表', link: '/guide/数据库建表' },
                { text: '图床配置', link: '/guide/图床配置' },
              ],
            },
            { text: '部署指南', link: '/guide/部署指南' },
          ],
        },
        {
          text: '功能分区',
          items: [
            { text: '使用流程', link: '/guide/使用流程' },
            { text: '个人库功能详解', link: '/guide/个人库功能详解' },
            { text: '共享库功能详解', link: '/guide/共享库功能详解' },
            { text: '瞄点编辑器', link: '/guide/瞄点编辑器' },
            { text: '移动端详解', link: '/guide/移动端详解' },
            { text: '后台详解', link: '/guide/后台详解' }
          ],
        },
        {
          text: '其他',
          items: [

            { text: '项目起源', link: '/guide/项目起源' },
            { text: '作者信息自动获取', link: '/guide/作者信息自动获取' },
            { text: '常见问题', link: '/guide/常见问题' },
            { text: '未来计划', link: '/guide/未来计划' },
            { text: '更新日志', link: '/guide/更新日志' },

          ],

        },
      ],
      '/dev/': [
        {
          text: '开始',
          items: [
            { text: '项目概览', link: '/dev/项目概览' },
            { text: '技术架构', link: '/dev/技术架构' },
          ],
        },
        {
          text: '开发指南',
          items: [
            { text: '开发规范', link: '/dev/开发规范' },
            { text: '作者信息解析', link: '/dev/作者信息解析' }
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/xiongaox/valpoint' }],

    footer: {
      message: 'Made with ♥ for Valorant Players',
      copyright: 'MIT License',
    },

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档',
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                },
              },
            },
          },
        },
      },
    },

    outline: {
      label: '页面导航',
      level: [2, 3],
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short',
      },
    },
  },
});
