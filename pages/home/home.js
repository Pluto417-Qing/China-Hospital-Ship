Page({
    data: {
      articles: [],
      hasOffLineActivity: false,
      offlineActivityText: {},
      banners: [
        {
          id: 1,
          image: 'cloud://cloudbase-1g4b1jysc952b1f5.636c-cloudbase-1g4b1jysc952b1f5-1367750649/banners/banner1.png',
          title: ''
        },
        {
          id: 2,
          image: 'cloud://cloudbase-1g4b1jysc952b1f5.636c-cloudbase-1g4b1jysc952b1f5-1367750649/banners/banner2.png',
          title: ''
        },
        {
          id: 3,
          image: 'cloud://cloudbase-1g4b1jysc952b1f5.636c-cloudbase-1g4b1jysc952b1f5-1367750649/banners/banner3.png',
          title: ''
        }
      ],
      loading: true,
      chosenArticleSection: "中国医院船"
    },
    
    onLoad: function() {
      this.getArticles();
      this.getOfflineActivity(); 
    },

    // 修改展示的section
    changeSection: function(e) {
      const selectedType = e.currentTarget.dataset.type;
      this.setData({
        chosenArticleSection: selectedType
      });
      
      this.getArticles(selectedType);
    },

    // 弹窗，显示线下活动具体信息
    showActivityDetail: function() {
      wx.showModal({
        title: this.data.offlineActivityText.title,
        content: this.getActivityDesc(),
        showCancel: false, 
        confirmText: '关闭', 
        // success(res) {
        //   if (res.confirm) {
        //     console.log('用户点击了确定')
        //   }
        // }
      })
    },
    
    // 获取线下活动信息具体描述
    getActivityDesc: function() {
      const { 
        startTime, 
        endTime, 
        location, 
        description 
      } = this.data.offlineActivityText;
      
      return `
        时间：${startTime} 至 ${endTime} 
        地点：${location}
        详情：${description}
      `;
    },

    // 获取线下活动信息
    getOfflineActivity: function() {
      wx.cloud.database().collection('activities')
        .where({ isActive: true })
        .get()
        .then(res => {
          if (res.data.length > 0) {
            this.setData({
              offlineActivityText: res.data[0],
              hasOffLineActivity: true
            });
          } else {
            this.setData({
              hasOffLineActivity: false
            });
          }
        })
        .catch(err => {
          console.error('获取活动失败:', err);
          this.setData({
            hasOffLineActivity: false
          });
        });
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
    
    // 点击文章
    onArticleTap: function(e) {
      const id = e.currentTarget.dataset.id;
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
    
    // 查看更多文章
    seeMoreArticles: function() {
      wx.navigateTo({
        url: `/pages/articles/moreArticles?chosenArticleSection=${this.data.chosenArticleSection}`
      });
    },
    
    // 会员中心跳转（保持不变）
    goToMemberCenter: function() {
      const wxUserInfo = wx.getStorageSync('wxUserInfo');
      if (!wxUserInfo) {
        wx.navigateTo({
          url: '/pages/auth/auth'
        });
        return;
      }
  
      const hasRegistered = wx.getStorageSync('hasRegistered');
      if (hasRegistered) {
        wx.navigateTo({
          url: '/pages/member/member'
        });
      } else {
        wx.navigateTo({
          url: '/pages/register/register'
        });
      }
    }
  });