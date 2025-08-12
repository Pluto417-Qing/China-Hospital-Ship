// pages/articles/moreArticles.js
Page({
    data: {
      chosenArticleSection: "",
      articles: [],
      loading: false
    },

    onLoad(options) {
      this.setData({
        chosenArticleSection: options.chosenArticleSection
      })

      this.getArticles(options.chosenArticleSection)
    },

    // 获取文章列表
    getArticles: function(type) {
      wx.showLoading({
        title: '加载中...',
      });
      
      const db = wx.cloud.database();
      db.collection('articles')
        .where({
          type: type || "中国医院船" 
        })
        .orderBy('date', 'desc')
        .get()
        .then(res => {
          this.setData({
            articles: res.data,  
            loading: false
          });
          wx.hideLoading();
        })
        .catch(err => {
          console.error('获取文章失败:', err);
          wx.hideLoading();
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          });
        });
    },
    
    
})