// pages/articles/moreArticles.js
Page({
    data: {
      chosenArticleSection: "",
      articles: [],
      loading: false
    },

    onLoad(options) {
      const app = getApp();

      this.setData({
        chosenArticleSection: options.chosenArticleSection,
        articles: app.globalData.articles.filter(article => article.type === options.chosenArticleSection)
      })

      // this.getArticles(options.chosenArticleSection)
    },

    // 点击文章
    onArticleTap: function(e) {
      const id = e.detail.id;
      const article = this.data.articles.find(item => item.id === id);
      
      wx.showLoading({ title: '加载中...', mask: true });
      
      // 先获取文件临时URL
      wx.cloud.getTempFileURL({
        fileList: [article.audio, article.image].filter(Boolean)
      }).then(res => {
        const audioUrl = res.fileList[0]?.tempFileURL || '';
        const imageUrl = res.fileList[1]?.tempFileURL || '';
        
        wx.navigateTo({
          url: `/pages/chinaShipArticle/chinaShipArticle`,
          success: (res) => {
            res.eventChannel.emit('acceptData', {
              title: article.title, 
              audioUrl: audioUrl,     
              imageUrl: imageUrl,     
              date: article.date,

              healthKnowledgeFileID: article.healthKnowledge,
              peopleIntroFileID: article.peopleIntro,
              doctorsFileID: article.doctors,
              storyFileID: article.story
            });
          },
          fail: (err) => {
            console.error('跳转失败:', err);
            wx.showToast({ title: '跳转失败', icon: 'none' });
          },
          complete: () => wx.hideLoading()
        });
      }).catch(err => {
        console.error('获取文件URL失败:', err);
        wx.hideLoading();
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
    },
})