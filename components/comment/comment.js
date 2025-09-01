// comment.js
Component({
  properties: {
    // 可以添加需要的属性
  },

  data: {
    userInfo: getApp().globalData.userInfo || {},
    content: '', // 存储用户输入的读后感内容
    isSubmitting: false, // 防止重复提交
    submittedThoughts: [] // 存储已提交的读后感
  },

  methods: {
    onInputChange: function(e) {
      this.setData({
        content: e.detail.value
      });
    },
    
    // 提交读后感
    makeComments: function() {
      if (this.data.isSubmitting) return;
      
      const content = this.data.content.trim();
      if (!content) {
        wx.showToast({
          title: '请先输入读后感',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      this.setData({ isSubmitting: true });
      wx.showLoading({
        title: '提交中...',
        mask: true
      });

      wx.cloud.callFunction({
        name: 'userOps',
        data: {
          action: 'updateRewards',
          increment: 1,
          content: content
        },
        success: res => {
          wx.hideLoading();
          this.setData({ isSubmitting: false });
          
          if (res.result && res.result.success) {
            // 更新本地数据
            const updatedUserInfo = {
              ...this.data.userInfo,
              rewards: res.result.rewards
            };
            getApp().globalData.userInfo = updatedUserInfo;
            
            // 将新提交的读后感添加到已提交列表
            const newThought = {
              id: res.result.thoughtId || Date.now(),
              content: res.result.content || content,
              time: new Date().toLocaleString(),
              rewards: res.result.rewards
            };
            
            const updatedThoughts = [newThought, ...this.data.submittedThoughts];
            
            this.setData({ 
              userInfo: updatedUserInfo,
              content: '', // 清空输入框
              submittedThoughts: updatedThoughts
            });
            
            // 保存到本地存储
            this.saveThoughtsToStorage(updatedThoughts);
            
            wx.showToast({
              title: '提交成功！+1⭐',
              icon: 'success',
              duration: 2000
            });
            
            this.triggerEvent('submitSuccess', {
              thoughtId: res.result.thoughtId,
              content: res.result.content
            });
            
          } else {
            wx.showToast({
              title: res.result?.message || '评价失败',
              icon: 'none',
              duration: 2000
            });
          }
        },
        fail: err => {
          console.error('云函数调用失败:', err);
          wx.hideLoading();
          this.setData({ isSubmitting: false });
          wx.showToast({
            title: '网络错误，请重试',
            icon: 'none',
            duration: 2000
          });
        }
      });
    },
    
    // 保存读后感到本地存储
    saveThoughtsToStorage: function(thoughts) {
      try {
        wx.setStorageSync('submittedThoughts', thoughts);
        console.log('读后感已保存到本地存储');
      } catch (err) {
        console.error('保存到本地存储失败:', err);
      }
    },
    
    // 从本地存储加载读后感
    loadThoughtsFromStorage: function() {
      try {
        const thoughts = wx.getStorageSync('submittedThoughts') || [];
        console.log('从本地存储加载读后感:', thoughts.length, '条');
        this.setData({ submittedThoughts: thoughts });
        return thoughts;
      } catch (err) {
        console.error('从本地存储加载失败:', err);
        return [];
      }
    },
    
    // 从云端加载读后感（覆盖本地）
    loadThoughtsFromCloud: function() {
      wx.showLoading({ title: '加载中' });
      
      wx.cloud.callFunction({
        name: 'userOps',
        data: { action: 'getReadingThoughts' },
        success: res => {
          wx.hideLoading();
          if (res.result && res.result.success) {
            const formattedThoughts = res.result.data.map(thought => ({
              id: thought._id,
              content: thought.content,
              time: this.formatTime(thought.createTime),
              rewards: getApp().globalData.userInfo?.rewards || 0
            }));
            
            this.setData({ submittedThoughts: formattedThoughts });
            this.saveThoughtsToStorage(formattedThoughts);
          }
        },
        fail: err => {
          wx.hideLoading();
          console.error('从云端加载失败:', err);
        }
      });
    },
    
    // 时间格式化工具函数
    formatTime: function(date) {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}/${month}/${day} ${hours}:${minutes}`;
    },
    
    // 刷新按钮
    onRefresh: function() {
      this.loadThoughtsFromCloud();
    }
  },

  // 组件生命周期
  lifetimes: {
    attached: function() {
      // 先尝试从本地存储加载
      const localThoughts = this.loadThoughtsFromStorage();
      
      // 如果本地没有数据，再从云端加载
      if (localThoughts.length === 0) {
        this.loadThoughtsFromCloud();
      }
    }
  }
})