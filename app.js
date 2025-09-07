App({
  globalData: {
    articles: [],
    openid: null, // 用户openid
    userInfo: {},
    earthVideos: []
  },

  onLaunch: function () {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        // env 参数决定接下来小程序发起的云开发调用会默认请求到哪个云环境的资源
        // 此处请填入环境 ID, 环境 ID 可打开云控制台查看
        // 如不填则使用默认环境（第一个创建的环境）
        env: 'cloudbase-1gl4e5sia9d92880', // 替换为你的环境ID
        traceUser: true,
        success: () => {
          // this.initArticles();
          // 获取用户的openid
          // this.getOpenid();
        }
      })
    }
  },
  
  getOpenid: function() {
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        this.globalData.openid = res.result.openid
        console.log('获取openid成功:', this.globalData.openid)
        
        // 如果页面已经加载，通知页面openid已获取
        if (this.openidReadyCallback) {
          this.openidReadyCallback(res.result.openid)
        }
      },
      fail: err => {
        console.error('获取openid失败', err)
      }
    })
  },

  initArticles: function() {
    wx.cloud.callFunction({
      name: 'initArticles',
      success: res => {
        console.error('init articles成功', res)
      },
      fail: err => {
        console.error('init articles失败', err)
      }
    })
  }
})
