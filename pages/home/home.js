Page({
    data: {
      articles: [],
      hasOffLineActivity: true,
      offlineActivityText: {},
      banners: [
        {
          id: 1,
          image: '/images/swiper_images/banner1.png',
          title: ''
        },
        {
          id: 2,
          image: '/images/swiper_images/banner2.png',
          title: ''
        },
        {
          id: 3,
          image: '/images/swiper_images/banner3.png',
          title: ''
        }
      ],
      loading: true
    },
    
    onLoad: function() {
      this.getArticles();
      // this.getOfflineActivity(); 
    },
    
    // 获取线下活动信息
    getOfflineActivity: function() {
      wx.cloud.database().collection('activities')
        .where({ isActive: true })
        .get()
        .then(res => {
          console.log(res.data)
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
    getArticles: function() {
      wx.showLoading({
        title: '加载中...',
      });
      
      const db = wx.cloud.database();
      db.collection('articles')
        .orderBy('date', 'desc')
        .get()
        .then(res => {
          // 获取临时URL用于封面图显示
          const articles = res.data;
          const tasks = articles.map(async article => {
            const tempRes = await wx.cloud.getTempFileURL({
                  fileList: [article.coverImage]
              });
              article.coverImageUrl = tempRes.fileList[0].tempFileURL;
              return article;
          });
          
          return Promise.all(tasks);
        })
        .then(articlesWithUrls => {
          this.setData({
            articles: articlesWithUrls,
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
    
    // // 获取轮播图
    // getBanners: function() {
    //   const db = wx.cloud.database();
    //   db.collection('banners')
    //     .get()
    //     .then(res => {
    //       // 获取轮播图的临时URL
    //       const banners = res.data;
    //       const tasks = banners.map(async banner => {
    //         const tempRes = await wx.cloud.getTempFileURL({
    //               fileList: [banner.image]
    //           });
    //           banner.imageUrl = tempRes.fileList[0].tempFileURL;
    //           return banner;
    //       });
          
    //       return Promise.all(tasks);
    //     })
    //     .then(bannersWithUrls => {
    //       this.setData({
    //         banners: bannersWithUrls
    //       });
    //     })
    //     .catch(err => {
    //       console.error('获取轮播图失败:', err);
    //     });
    // },
    
    // 点击文章
    onArticleTap: function(e) {
      const id = e.currentTarget.dataset.id;
      const article = this.data.articles.find(item => item._id === id);
      
      // 先下载Word内容和音频文件
      wx.showLoading({ title: '加载内容...' });
      
      Promise.all([
        wx.cloud.downloadFile({ fileID: article.contentFile }),
        wx.cloud.downloadFile({ fileID: article.audioFile })
      ]).then(res => {
        const [contentRes, audioRes] = res;
        
        // 读取Word内容
        const fs = wx.getFileSystemManager();
        fs.readFile({
          filePath: contentRes.tempFilePath,
          encoding: 'utf8',
          success: textRes => {
            // 跳转到详情页，传递内容和音频路径
            wx.navigateTo({
              url: `/pages/article/detail?id=${id}`,
              success: function(res) {
                res.eventChannel.emit('acceptData', {
                  title: article.title,
                  content: textRes.data,
                  audioPath: audioRes.tempFilePath,
                  date: article.date
                });
              }
            });
          },
          fail: err => {
            console.error('读取Word失败:', err);
            wx.showToast({ title: '内容加载失败', icon: 'none' });
          },
          complete: () => wx.hideLoading()
        });
      }).catch(err => {
        console.error('下载文件失败:', err);
        wx.hideLoading();
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
    },
    
    // 点击轮播图
    onBannerTap: function(e) {
      const id = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: `/pages/activity/detail?id=${id}`
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