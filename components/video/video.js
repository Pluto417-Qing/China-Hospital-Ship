Component({
  properties: {
    video: {
      type: Object,
      value: {}
    }
  },
  methods: {
    onVideoTap() {
      this.triggerEvent('videotap', { video: this.properties.video });
    }
  }
})