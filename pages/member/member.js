Page({
  data: {
    userInfo: {
      selectedHealthIssues: [],
      selectedHobbies: [],
      selectedFamilyMembers: []
    },
    hasRegistered: true
  },

  onLoad: function (options) {
    this.getUserInfoFromCloud();
  },

  onShow: function() {
    // 每次页面显示时都重新加载用户信息
    this.getUserInfoFromCloud();
  },

  getUserInfoFromCloud: function() {
    wx.showLoading({
      title: '加载中',
    });
    
    wx.cloud.callFunction({
      name: 'userOps',
      data: {
        action: 'getUserInfo'
      },
      success: res => {
        const app = getApp()

        console.log('获取用户信息结果:', res.result);
        if (res.result.success && res.result.data) {
          const userInfo = res.result.data;

          // 确保所有新字段存在
          userInfo.selectedHealthIssues = Array.isArray(userInfo.selectedHealthIssues) ? userInfo.selectedHealthIssues : [];
          userInfo.selectedHobbies = Array.isArray(userInfo.selectedHobbies) ? userInfo.selectedHobbies : [];
          userInfo.selectedFamilyMembers = Array.isArray(userInfo.selectedFamilyMembers) ? userInfo.selectedFamilyMembers : [];
          userInfo.rewards = userInfo.rewards || 0;
          userInfo.nickname = userInfo.nickname || '';
          userInfo.birthDate = userInfo.birthDate || '';
          userInfo.regionText = userInfo.regionText || '';
          userInfo.character = userInfo.character || '';
          userInfo.height = userInfo.height || '';
          userInfo.weight = userInfo.weight || '';
          userInfo.readerNo = userInfo.readerNo || '';
          
          console.log('处理后的用户信息:', userInfo);
          
          app.globalData.userInfo = userInfo
          // 更新页面数据和本地缓存
          this.setData({ userInfo, hasRegistered: true });
          wx.setStorageSync('userInfo', userInfo);
        } else {
          this.setData({ hasRegistered: false });
          wx.showToast({
            title: '获取信息失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('完整错误信息:', {
          errCode: err.errCode,
          errMsg: err.errMsg,
          errDetail: err
        });
        wx.showToast({
          title: `网络错误: ${err || '未知错误'}`,
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },
  
  onEdit: function() {
    // 导航到注册页面进行资料修改
    wx.navigateTo({
      url: '/pages/register/register?edit=true',
    })
  },

  onRegister: function() {
    wx.navigateTo({ url: '/pages/register/register' });
  },

  onLogin: function() {
    // 重新获取用户信息，模拟登录
    const that = this;
    wx.showLoading({ title: '正在登录...' });
    wx.cloud.callFunction({
      name: 'userOps',
      data: { action: 'getUserInfo' },
      success: res => {
        wx.hideLoading();
        if (res.result.success && res.result.data) {
          // 已注册，刷新页面
          that.setData({ userInfo: res.result.data, hasRegistered: true });
          wx.setStorageSync('userInfo', res.result.data);
        } else {
          // 未注册，跳转注册页
          wx.showModal({
            title: '未注册',
            content: '您还没有注册，请先注册。',
            confirmText: '去注册',
            showCancel: false,
            success() {
              wx.navigateTo({ url: '/pages/register/register' });
            }
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  onLogout: function() {
    const that = this;
    wx.showModal({
      title: '退出登录',
      content: '退出后可重新登录，历史数据后台保留。确定要退出吗？',
      confirmText: '退出',
      cancelText: '取消',
      success(res) {
        if (res.confirm) {
          wx.showLoading({ title: '正在退出...' });
          // 仅清除本地缓存和状态，不调用云函数
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('hasRegistered');
          that.setData({ hasRegistered: false, userInfo: {} });
          wx.hideLoading();
          wx.showToast({ title: '已退出', icon: 'success' });
        }
      }
    });
  }
})
