// pages/videos/videos.js
Page({
  data: {
    videos: [],
  },

  onLoad(options) {
    const app = getApp();
    
    this.setData({
      videos: app.globalData.earthVideos
    })
  }
})