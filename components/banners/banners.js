// components/banners/banners.js
Component({
  data: {
    banners: [],
    loading: true
  },

  lifetimes: {
    attached() {
      this.getBanners()
    }
  },

  methods: {
    async getBanners() {
      this.setData({ loading: true })
      
      try {
        const res = await wx.cloud.callFunction({
          name: 'getBanners'
        })

        if (res.result.code === 0) {
          this.setData({
            banners: res.result.data.map((file, index) => ({
              id: index + 1,
              image: file.tempFileURL,
              title: '',
            })),
            loading: false
          })
        } else {
          throw new Error(res.result.message)
        }
      } catch (err) {
        wx.showToast({
          title: '加载banner失败',
          icon: 'none'
        })
      }
    }
  }
})