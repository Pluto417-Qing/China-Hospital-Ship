Component({
  properties: {
    // 可以添加需要的属性
  },

  data: {
    userInfo: getApp().globalData.userInfo
  },

  methods: {
    makeComment: function() {
      wx.showLoading({
        title: '提交中...',
        mask: true // 防止用户重复点击
      });
      
      wx.cloud.callFunction({
        name: 'userOps',
        data: {
          action: 'updateRewards',
          increment: 1 // 增加1个五角星
        },
        success: res => {
          wx.hideLoading(); // 先隐藏加载提示
          
          if (res.result.success) {
            // 更新本地数据
            const updatedUserInfo = {
              ...this.data.userInfo,
              rewards: res.result.rewards
            };
            getApp().globalData.userInfo = updatedUserInfo;
            this.setData({ userInfo: updatedUserInfo });
            
            // 显示成功提示
            wx.showToast({
              title: '评价成功！',
              icon: 'success',
              duration: 2000 // 显示2秒
            });
          } else {
            // 显示失败提示
            wx.showToast({
              title: res.result.message || '评价失败',
              icon: 'none',
              duration: 2000
            });
          }
        },
        fail: err => {
          wx.hideLoading();
          console.error('云函数调用失败:', err);
          wx.showToast({
            title: '网络错误，请重试',
            icon: 'none',
            duration: 2000
          });
        }
      });
    }
  }
})