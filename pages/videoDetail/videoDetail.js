Page({
  data: {
    video: {},
    // 其他需要的数据
  },
  onLoad(options) {
    if (options.video) {
      this.setData({ video: JSON.parse(decodeURIComponent(options.video)) });
    } else {
      const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel();
      if (eventChannel) {
        eventChannel.on('acceptData', (data) => {
          this.setData({ video: data.video });
        });
      }
    }
  },
  close() {
    wx.navigateBack();
  },
  stopScroll() {}
});