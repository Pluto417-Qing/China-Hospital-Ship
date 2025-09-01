// components/article/article.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {
      article: {
        type: Object,
        value: {}
      }
    },

    /**
     * 组件的初始数据
     */
    data: {
     
    },

    /**
     * 组件的方法列表
     */
    methods: {
      // 点击文章
      onArticleTap: function() {
        const article = this.properties.article; 
        
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
                type: article.type,

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
    }
})