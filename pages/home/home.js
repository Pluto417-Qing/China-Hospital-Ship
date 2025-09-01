Page({
  data: {
    articles: [],

    filteredHealthArticles: [],
    filteredOtherArticles: [],
    earthVideos: [],
    earthVideosToShow: [],

    hasOffLineActivity: false,
    offlineActivityText: {},
    loading: true,
  },
  
  onLoad: function() {
    this.getArticles();
    this.getOfflineActivity(); 
    this.getVideos();
  },

  // 获取视频
  getVideos: function() {
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.database().collection('videos')
      .get()
      .then(res => {
        const app = getApp();
        this.setData({ 
          earthVideos: res.data,
          earthVideosToShow: res.data.length > 2 ? res.data.slice(0, 2) : res.data,
          loading: false
        });
        app.globalData.earthVideos = res.data;
        wx.hideLoading();
      })
      .catch(err => {
        console.error('获取视频失败:', err);
        wx.hideLoading();
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  // 获取文章
  getArticles: function() {
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.database().collection('articles')
      .orderBy('date', 'desc')
      .get()
      .then(res => {
        const app = getApp();
        this.setData({ 
          articles: res.data,
          filteredHealthArticles: res.data.filter(article => article.type == "中国医院船"),
          filteredNutritionArticles: res.data.filter(article => article.type == "少年百科港"),
          loading: false
        });
        app.globalData.articles = res.data;
        wx.hideLoading();
      })
      .catch(err => {
        console.error('获取文章失败:', err);
        wx.hideLoading();
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
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
  
  // 查看更多文章
  seeMoreArticles: function(e) {
    const type = e.target.dataset.type

    wx.navigateTo({
      url: `/pages/articles/moreArticles?chosenType=${type}`
    });
  },
  // 查看更多视频
  seeMoreVideos: function() {
    wx.navigateTo({
      url: "/pages/videos/videos?"
    });
  },

  // 查看少年百科港文章
  seeMorePortArticles: function() {
    wx.navigateTo({
      url: "/pages/subjectsPort/subjectsPort?"
    });
  },

  // 点击视频
  onVideoTap(e) {
    const video = e.detail.video;
    wx.navigateTo({
      url: '/pages/videoDetail/videoDetail?video=' + encodeURIComponent(JSON.stringify(video))
    });
  }
});