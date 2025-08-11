Page({
  data: {
    loading: false,
    showFeatures: false,
    appName: '健康会员服务'
  },
  onLoad: function (options) {
    // 页面加载时执行的逻辑
    this.showAnimations();
  },
  
  // 显示界面动画效果
  showAnimations: function() {
    // 延迟显示功能列表
    setTimeout(() => {
      this.setData({
        showFeatures: true
      });
    }, 500);
  },
  
  onGetUserProfile: function (e) {
    // 避免重复点击
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        // 获取微信的用户基本信息
        const wxUserInfo = res.userInfo;
        console.log('获取微信用户信息成功:', wxUserInfo);
        
        // 保存微信用户信息到本地，方便其他页面使用
        wx.setStorageSync('wxUserInfo', wxUserInfo);
        
        wx.showToast({
          title: '授权成功',
          icon: 'success',
          duration: 1500
        });

        // 检查用户是否已注册
        setTimeout(() => {
          this.checkRegistration();
        }, 1000);
      },
      fail: (err) => {
        console.error('获取微信用户信息失败:', err);
        wx.showToast({
          title: '授权失败，请重试',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    });
  },
  
  checkRegistration: function () {
    wx.showLoading({
      title: '正在登录...',
    });
    
    console.log('开始检查注册状态...');
    
    // 调用云函数检查用户是否已注册
    wx.cloud.callFunction({
      name: 'userOps',
      data: {
        action: 'checkRegistration'
      },
      success: res => {
        console.log('检查注册状态结果:', res.result);
        if (res.result.success) {
          const hasRegistered = res.result.hasRegistered;
          
          // 存储注册状态到本地缓存
          wx.setStorageSync('hasRegistered', hasRegistered);
          
          if (hasRegistered) {
            // 如果已注册，获取用户信息
            this.getUserInfo();
          } else {
            // 如果未注册，询问用户是否注册
            wx.showModal({
              title: '您尚未注册',
              content: '是否前往注册页面完善会员信息？',
              confirmText: '去注册',
              cancelText: '暂不注册',
              success: (res) => {
                if (res.confirm) {
                  wx.navigateTo({
                    url: '/pages/register/register'
                  });
                } else {
                  // 用户选择暂不注册，返回上一页
                  wx.navigateBack();
                }
              }
            });
          }
        } else {
          wx.showToast({
            title: '获取注册状态失败',
            icon: 'none'
          });
          this.setData({ loading: false });
        }
      },
      fail: err => {
        console.error('检查注册状态失败', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
        this.setData({ loading: false });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },
  
  getUserInfo: function() {
    wx.showLoading({
      title: '加载信息...',
    });
    
    wx.cloud.callFunction({
      name: 'userOps',
      data: {
        action: 'getUserInfo'
      },
      success: res => {
        console.log('获取用户信息结果:', res.result);
        if (res.result.success) {
          // 保存用户信息到本地缓存
          wx.setStorageSync('userInfo', res.result.data);
          
          // 跳转到会员页面
          wx.switchTab({
            url: '/pages/member/member'
          });
        } else {
          wx.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          });
          this.setData({ loading: false });
        }
      },
      fail: err => {
        console.error('获取用户信息失败', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
        this.setData({ loading: false });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 返回按钮
  onBackTap: function() {
    wx.navigateBack();
  }
});
