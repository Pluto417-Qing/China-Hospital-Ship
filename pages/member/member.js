// member.js
Page({
  data: {
    userInfo: {
      nickname: '',
      birthDate: '',
      regionText: '',
      rewards: 0
    },
    hasRegistered: false,
    readingThoughts: [], // 用于存储读后感数据
    monthGroups: [] // 按月分组的读后感数据
  },

  onLoad: function (options) {
    this.getUserInfoFromCloud();
    this.getReadingThoughts(); // 加载读后感数据
  },

  onShow: function() {
    // 每次页面显示时都重新加载用户信息和读后感
    this.getUserInfoFromCloud();
    this.getReadingThoughts();
  },

  // 时间格式化工具函数 - 移到methods外层
  formatTime: function(date) {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return new Date().toLocaleString('zh-CN');
      }
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}/${month}/${day} ${hours}:${minutes}`;
    } catch (err) {
      console.error('时间格式化错误:', err);
      return new Date().toLocaleString('zh-CN');
    }
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
        const app = getApp();

        console.log('获取用户信息结果:', res.result);
        if (res.result.success && res.result.data) {
          const userInfo = res.result.data;

          // 确保字段存在
          userInfo.nickname = userInfo.nickname || '';
          userInfo.birthDate = userInfo.birthDate || '';
          userInfo.regionText = userInfo.regionText || '';
          userInfo.rewards = userInfo.rewards || 0;

          console.log('处理后的用户信息:', userInfo);

          app.globalData.userInfo = userInfo;
          // 更新页面数据和本地缓存
          this.setData({ 
            userInfo: userInfo, 
            hasRegistered: true 
          });
          wx.setStorageSync('userInfo', userInfo);
        } else {
          this.setData({ hasRegistered: false });
          wx.showToast({
            title: res.result.message || '未找到用户信息',
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
          title: '网络错误',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading(); // 确保在所有分支中调用
      }
    });
  },

  // 获取读后感数据
  getReadingThoughts: function() {
    wx.showLoading({
      title: '加载读后感...',
      mask: true
    });
    
    wx.cloud.callFunction({
      name: 'userOps',
      data: {
        action: 'getReadingThoughts'
      },
      success: res => {
        console.log('获取读后感结果:', res.result);
        if (res.result && res.result.success) {
          // 关键：严格按照comment组件的数据格式格式化
          const formattedThoughts = res.result.data.map(thought => {
            return {
              id: thought._id || thought.thoughtId, // 匹配comment的id字段
              content: thought.content,
              // 使用外部的formatTime函数
              time: thought.createTime 
                ? this.formatTime(thought.createTime) 
                : this.formatTime(new Date()),
              // rewards字段使用用户当前总奖励（与comment保持一致）
              rewards: getApp().globalData.userInfo?.rewards || 0
            };
          });

          // 按月份分组（基于comment的time格式处理）
          const groupedByMonth = {};
          formattedThoughts.forEach(thought => {
            // 从"2024/5/20 15:30:00"中提取"2024/5"作为月份标识
            const datePart = thought.time.split(' ')[0]; // 取"2024/5/20"
            const yearMonth = datePart.split('/').slice(0, 2).join('/'); // 取"2024/5"
            
            if (!groupedByMonth[yearMonth]) {
              groupedByMonth[yearMonth] = [];
            }
            groupedByMonth[yearMonth].push(thought);
          });

          // 转换分组格式并按时间倒序
          const monthGroups = Object.entries(groupedByMonth)
            .map(([month, thoughts]) => ({ 
              month: month.replace('/', '年') + '月', // 转为"2024年5月"用于展示
              thoughts: thoughts.sort((a, b) => b.time.localeCompare(a.time)) // 按时间倒序
            }))
            .sort((a, b) => b.month.localeCompare(a.month)); // 按月份倒序

          this.setData({ 
            readingThoughts: formattedThoughts,
            monthGroups: monthGroups
          });
        } else {
          wx.showToast({
            title: res.result?.message || '加载读后感失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('加载失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => wx.hideLoading()
    });
  },

  onEdit: function() {
    // 导航到注册页面进行资料修改
    wx.navigateTo({
      url: '/pages/register/register?edit=true',
    });
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
          const userInfo = res.result.data;
          that.setData({ 
            userInfo: userInfo, 
            hasRegistered: true 
          });
          wx.setStorageSync('userInfo', userInfo);
          // 重新加载读后感
          that.getReadingThoughts();
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
          // 清除本地缓存和状态
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('hasRegistered');
          that.setData({ 
            hasRegistered: false, 
            userInfo: {
              nickname: '',
              birthDate: '',
              regionText: '',
              rewards: 0
            }, 
            readingThoughts: [],
            monthGroups: [] 
          });
          wx.hideLoading();
          wx.showToast({ title: '已退出', icon: 'success' });
        }
      }
    });
  },

  // 显示读后感详情
  onViewThoughtDetail: function(e) {
    const thought = e.currentTarget.dataset.thought;
    wx.showModal({
      title: '读后感详情',
      content: thought.content,
      showCancel: false,
      confirmText: '知道了'
    });
  }
});