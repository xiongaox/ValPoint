import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ValPoint',
  description: 'Valorant 点位管理与分享平台',
  lang: 'zh-CN',
  
  head: [
    // 默认头部配置
  ],
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: '首页', link: '/' },
      { text: '用户指南', link: '/guide/getting-started' },
      { text: '开发文档', link: '/dev/overview' },
      { text: '返回应用', link: 'https://valpoint.cn' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始使用',
          items: [
            { text: '快速开始', link: '/guide/getting-started' }
          ]
        },
        {
          text: '核心功能',
          items: [
            { text: '个人点位库', link: '/guide/personal-library' },
            { text: '共享点位库', link: '/guide/shared-library' },
            { text: '作者信息获取', link: '/guide/author-info' },
            { text: '地图标注', link: '/guide/map-annotation' },
            { text: '图床配置', link: '/guide/image-hosting' }
          ]
        },
        {
          text: '帮助',
          items: [
            { text: '常见问题', link: '/guide/faq' }
          ]
        }
      ],
      '/dev/': [
        {
          text: '开始',
          items: [
            { text: '项目概览', link: '/dev/overview' },
            { text: '技术架构', link: '/dev/architecture' }
          ]
        },
        {
          text: '开发指南',
          items: [
            { text: '开发规范', link: '/dev/coding-standards' },
            { text: '作者信息解析', link: '/dev/author-fetcher' },
            { text: '部署指南', link: '/dev/deployment' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/xiongaox/valpoint' }
    ],

    footer: {
      message: 'Made with ❤️ for Valorant Players',
      copyright: 'MIT License'
    },

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换'
                }
              }
            }
          }
        }
      }
    },

    outline: {
      label: '页面导航',
      level: [2, 3]
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    }
  }
})
