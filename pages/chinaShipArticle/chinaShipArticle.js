Page({
  audioCtx: null,

  data: {
    title: "",
    audioUrl: "",
    imageUrl: "",
    date: "",
    type: "",

    healthKnowledgeFileID: "",
    peopleIntroFileID: "",
    doctorsFileID: "",
    storyFileID: "",

    healthKnowledge: "",
    peopleIntro: "",
    doctors: "",
    story: "",
    
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentTimeStr: "00:00",
    durationStr: "00:00"
  },
  
  onLoad: function() {
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('acceptData', async (data) => { 
      this.setData({
        title: data.title,
        contentUrl: data.contentUrl,
        audioUrl: data.audioUrl,
        imageUrl: data.imageUrl,
        date: data.date,
        type: data.type,

        healthKnowledgeFileID: data.healthKnowledgeFileID,
        peopleIntroFileID: data.peopleIntroFileID,
        doctorsFileID: data.doctorsFileID,
        storyFileID: data.storyFileID
      });

      await this.readTxtFile("healthKnowledge", this.data.healthKnowledgeFileID);
      await this.readTxtFile("peopleIntro", this.data.peopleIntroFileID);
      await this.readTxtFile("doctors", this.data.doctorsFileID);
      await this.readTxtFile("story", this.data.storyFileID);
      
      if (data.audioUrl) {
        this.initAudioPlayer(data.audioUrl);
      }
    });
  },

  async readTxtFile(fieldName, fileID) {
    try {
      if (!fileID) return; // 如果没有 fileID，直接返回

      const res = await wx.cloud.callFunction({
        name: "readTxtFile",
        data: {
          fileID: fileID
        }
      });
      
      if (res.result.success) {
        this.setData({ [fieldName]: res.result.content }); 
      } else {
        console.error("读取失败:", res.result.error);
      }
    } catch (err) {
      console.error("云函数调用失败:", err);
    }
  },

  onSliderChanging(e) {
    if (!this.audioCtx) return;
    const seekTime = e.detail.value;
    this.setData({
      currentTime: seekTime,
      currentTimeStr: this.formatTime(seekTime)
    });
  },  

  initAudioPlayer: function(url) {
    this.audioCtx = wx.createInnerAudioContext();
    this.audioCtx.src = url;
    
    this.audioCtx.onPlay(() => {
      this.setData({ isPlaying: true });
    });
    
    this.audioCtx.onPause(() => {
      this.setData({ isPlaying: false });
    });
    
    this.audioCtx.onStop(() => {
      this.setData({ isPlaying: false });
    });
    
    this.audioCtx.onTimeUpdate(() => {
      this.setData({
        currentTime: Math.floor(this.audioCtx.currentTime), // 保证是整数
        currentTimeStr: this.formatTime(this.audioCtx.currentTime)
      });
    });    
    
    this.audioCtx.onCanplay(() => {
      this.audioCtx.play();
      this.audioCtx.pause();
    
      const checkDuration = setInterval(() => {
        const d = this.audioCtx.duration;
        if (d && !isNaN(d) && d > 0) {
          clearInterval(checkDuration);
          this.setData({
            duration: d,
            durationStr: this.formatTime(d)
          });
        }
      }, 100);
    });    
    
    this.audioCtx.onEnded(() => {
      this.setData({
        isPlaying: false,
        currentTime: 0,
        currentTimeStr: "00:00"
      });
    });
  },
  
  togglePlay: function() {
    if (!this.audioCtx) {
      console.error("音频未初始化");
      return;
    }
    if (this.data.isPlaying) {
      this.audioCtx.pause();
    } else {
      this.audioCtx.play();
    }
  },
  
  onSliderChange: function(e) {
    if (!this.audioCtx) return;
    const seekTime = e.detail.value;
    this.audioCtx.seek(seekTime);
    this.setData({
      currentTime: seekTime,
      currentTimeStr: this.formatTime(seekTime)
    });
  },
  
  formatTime: function(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min < 10 ? '0' + min : min}:${sec < 10 ? '0' + sec : sec}`;
  },
  
  onUnload: function() {
    if (this.audioCtx) {
      this.audioCtx.stop();
      this.audioCtx.destroy();
    }
  }
});