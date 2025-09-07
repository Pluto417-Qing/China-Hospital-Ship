// components/slogan/slogan.js
Component({
  properties: {
    show: { type: Boolean, value: false }
  },
  methods: {
    onClose() {
      this.triggerEvent('close')
    }
  }
})