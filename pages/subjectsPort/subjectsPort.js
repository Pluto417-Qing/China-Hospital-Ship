Page({
  data: {
    subjects: [
      { code: '01', name: '哲学' },
      { code: '02', name: '经济学' },
      { code: '03', name: '法学' },
      { code: '04', name: '教育学' },
      { code: '05', name: '文学' },
      { code: '06', name: '历史学' },
      { code: '07', name: '理学' },
      { code: '08', name: '工学' },
      { code: '09', name: '农学' },
      { code: '10', name: '医学' },
      { code: '11', name: '军事学' },
      { code: '12', name: '管理学' },
      { code: '13', name: '艺术学' },
      { code: '14', name: '交叉学科' }
    ],
    selectedIndex: 0
  },
  onSubjectTap(e) {
    this.setData({
      selectedIndex: e.currentTarget.dataset.index
    });
    // 这里可以根据选择的学科做筛选等操作
  }
})