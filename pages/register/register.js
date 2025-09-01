Page({
  data: {
    isEditMode: false,
    nickname: '',
    birthDate: '',
    regionArray: [
      [
        '北京市','天津市','上海市','重庆市',
        '河北省','山西省','辽宁省','吉林省','黑龙江省',
        '江苏省','浙江省','安徽省','福建省','江西省','山东省',
        '河南省','湖北省','湖南省','广东省','海南省',
        '四川省','贵州省','云南省','陕西省','甘肃省','青海省',
        '台湾省','内蒙古自治区','广西壮族自治区','西藏自治区','宁夏回族自治区','新疆维吾尔自治区',
        '香港特别行政区','澳门特别行政区'
      ],
      // 默认使用第一个省（北京市）的城市列表作为第二列初始值
      ['北京市']
    ],
    regionIndex: [0, 0],
    regionText: '',
    agreeProtocol: false
  },

  onLoad: function (options) {
    console.log('注册页面参数:', options);

    // 检查是否是编辑模式
    const isEditMode = options.edit === 'true';

    // 只设置isEditMode状态
    this.setData({ isEditMode });

    // 如果是编辑模式，尝试从云端获取已有用户信息并回填
    if (isEditMode) {
      // 为避免 showLoading 重复调用导致的警告，先 hide 再 show
      try { wx.hideLoading(); } catch (e) {}
      wx.showLoading({ title: '加载中...' });
      wx.cloud.callFunction({
        name: 'userOps',
        data: { action: 'getUserInfo' },
        success: res => {
          if (res && res.result && res.result.success && res.result.data) {
            const user = res.result.data;
            // 回填基础字段
            const regionText = user.regionText || '';
            let regionIndex = [0, 0];
            // 尝试将 regionText 按空格或其他分隔解析为省、市
            if (regionText) {
              const parts = regionText.split(/\s+/);
              const provinceName = parts[0] || '';
              const cityName = parts[1] || '';
              const pIndex = this.data.regionArray[0].indexOf(provinceName);
              if (pIndex >= 0) {
                const cities = this.getCitiesForProvince(pIndex);
                const cIndex = cities.indexOf(cityName);
                regionIndex[0] = pIndex;
                regionIndex[1] = cIndex >= 0 ? cIndex : 0;
                // 更新市级列表为对应省的城市
                this.setData({ 'regionArray[1]': cities });
              }
            }

            this.setData({
              nickname: user.nickname || '',
              birthDate: user.birthDate || '',
              regionText: regionText,
              regionIndex
            });
          } else {
            console.warn('编辑模式下未能获取用户信息', res);
          }
        },
        fail: err => {
          console.error('编辑模式获取用户信息失败', err);
        },
        complete: () => wx.hideLoading()
      });
    }

    console.log('当前模式:', isEditMode ? '编辑模式' : '注册模式');
  },

  onNicknameInput: function (e) {
    this.setData({ nickname: e.detail.value });
  },

  onBirthChange: function (e) {
    this.setData({ birthDate: e.detail.value });
  },

  onRegionChange: function (e) {
    const regionIndex = e.detail.value;
    const province = this.data.regionArray[0][regionIndex[0]];
    const city = this.data.regionArray[1][regionIndex[1]] || ''; // 防止 undefined
    const regionText = `${province} ${city}`;
    this.setData({ regionIndex, regionText });
  },

  onRegionColumnChange: function (e) {
    const column = e.detail.column;
    const value = e.detail.value;

    if (column === 0) {
      // 当省份列变化时，更新市级数据
      const cities = this.getCitiesForProvince(value);
      this.setData({
        'regionArray[1]': cities,
        'regionIndex[0]': value,
        'regionIndex[1]': 0 // 重置市级选择
      });
    }
  },

  getCitiesForProvince: function (provinceIndex) {
    // 映射：index -> 常用市列表（仅包含部分常用地级市以提供选择）
    const map = {
      0: ['北京市'],
      1: ['天津市'],
      2: ['上海市'],
      3: ['重庆市'],
      4: ['石家庄市','唐山市','保定市','秦皇岛市','邯郸市','邢台市','沧州市','承德市','衡水市','廊坊市'], // 河北
      5: ['太原市','大同市','阳泉市','长治市','晋城市','朔州市','忻州市','吕梁市','晋中市','临汾市','运城市'], // 山西
      6: ['沈阳市','大连市','鞍山市','抚顺市','本溪市','丹东市','锦州市','营口市','阜新市','辽阳市','盘锦市','铁岭市','朝阳市'], // 辽宁
      7: ['长春市','吉林市','四平市','辽源市','通化市','白山市','松原市','白城市'], // 吉林
      8: ['哈尔滨市','齐齐哈尔市','牡丹江市','佳木斯市','绥化市','大庆市','伊春市','鸡西市','鹤岗市','双鸭山'], // 黑龙江
      9: ['南京市','无锡市','徐州市','常州市','苏州市','南通市','盐城市','扬州市','镇江市','泰州市','宿迁市'], // 江苏
      10: ['杭州市','宁波市','温州市','嘉兴市','湖州市','绍兴市','金华市','衢州市','舟山市','台州市','丽水市'], // 浙江
      11: ['合肥市','芜湖市','蚌埠市','淮南市','马鞍山市','淮北市','铜陵市','安庆市','黄山市','滁州市','阜阳市','宿州市','巢湖市','六安市','亳州市','池州市','宣城市'], // 安徽
      12: ['福州市','厦门市','莆田市','三明市','泉州市','漳州市','南平市','龙岩市','宁德市'], // 福建
      13: ['南昌市','景德镇市','萍乡市','九江市','新余市','鹰潭市','赣州市','吉安市','宜春市','抚州市','上饶市'], // 江西
      14: ['济南市','青岛市','淄博市','枣庄市','东营市','烟台市','潍坊市','济宁市','泰安市','威海市','日照市','临沂市','德州市','聊城市','滨州市','菏泽市'], // 山东
      15: ['郑州市','开封市','洛阳市','平顶山市','安阳市','鹤壁市','新乡市','焦作市','濮阳市','许昌市','漯河市','三门峡市','南阳市','商丘市','信阳市','周口市','驻马店市'], // 河南
      16: ['武汉市','黄石市','十堰市','宜昌市','襄阳市','鄂州市','荆门市','孝感市','荆州市','黄冈市','咸宁市','随州市','恩施土家族苗族自治州'], // 湖北
      17: ['长沙市','株洲市','湘潭市','衡阳市','邵阳市','岳阳市','常德市','张家界市','益阳市','娄底市','郴州市','永州市','怀化市','湘西土家族苗族自治州'], // 湖南
      18: ['广州市','深圳市','珠海市','汕头市','佛山市','韶关市','湛江市','肇庆市','江门市','茂名市','惠州市','梅州市','汕尾市','河源市','阳江市','清远市','东莞市','中山市','潮州市','揭阳市','云浮市'], // 广东
      19: ['海口市','三亚市','三沙市','儋州市'], // 海南
      20: ['成都市','绵阳市','德阳市','自贡市','攀枝花市','广元市','遂宁市','内江市','乐山市','南充市','眉山市','宜宾市','广安市','达州市','雅安市','巴中市','资阳市','阿坝藏族羌族自治州','甘孜藏族自治州','凉山彝族自治州'], // 四川
      21: ['贵阳市','六盘水市','遵义市','安顺市','毕节市','铜仁市','黔西南布依族苗族自治州','黔东南苗族侗族自治州','黔南布依族苗族自治州'], // 贵州
      22: ['昆明市','曲靖市','玉溪市','保山市','昭通市','丽江市','普洱市','临沧市','楚雄彝族自治州','红河哈尼族彝族自治州','文山壮族苗族自治州','西双版纳傣族自治州','大理白族自治州','德宏傣族景颇族自治州','怒江傈僳族自治州','迪庆藏族自治州'], // 云南
      23: ['西安市','宝鸡市','咸阳市','渭南市','延安市','汉中市','榆林市','安康市','商洛市'], // 陕西
      24: ['兰州市','嘉峪关市','金昌市','白银市','天水市','武威市','张掖市','平凉市','酒泉市','庆阳市','定西市','陇南市','临夏回族自治州','甘南藏族自治州'], // 甘肃
      25: ['西宁市','海东市','海北藏族自治州','黄南藏族自治州','海南藏族自治州','果洛藏族自治州','玉树藏族自治州','海西蒙古族藏族自治州'], // 青海
      26: ['台北市','高雄市','台中市','台南市','基隆市','新竹市','嘉义市'], // 台湾（简要）
      27: ['呼和浩特市','包头市','乌海市','赤峰市','通辽市','鄂尔多斯市','呼伦贝尔市','巴彦淖尔市','乌兰察布市','兴安盟','锡林郭勒盟','阿拉善盟'], // 内蒙古
      28: ['南宁市','柳州市','桂林市','梧州市','北海市','防城港市','钦州市','贵港市','玉林市','百色市','贺州市','河池市','来宾市','崇左市'], // 广西
      29: ['拉萨市','日喀则市','昌都市','林芝市','山南市','那曲地区','阿里地区'], // 西藏
      30: ['银川市','石嘴山市','吴忠市','固原市','中卫市'], // 宁夏
      31: ['乌鲁木齐市','克拉玛依市','吐鲁番市','哈密市','和田地区','阿克苏地区','喀什地区','克孜勒苏柯尔克孜自治州','巴音郭楞蒙古自治州','昌吉回族自治州','博尔塔拉蒙古自治州','伊犁哈萨克自治州','塔城地区','阿勒泰地区'], // 新疆
      32: ['香港岛','九龙','新界'], // 香港（简要）
      33: ['澳门半岛','离岛'] // 澳门（简要）
    };

    return map[provinceIndex] || ['未知市'];
  },

  onProtocolChange: function (e) {
    // checkbox-group 的 value 为数组，这里判断是否包含 agree
    const checked = Array.isArray(e.detail.value) ? e.detail.value.indexOf('agree') !== -1 : !!e.detail.value;
    this.setData({ agreeProtocol: checked });
  },
onSubmit: function (e) {
  // 使用 form.bindsubmit 提供的值，避免 input 未同步的问题
  const formValues = (e && e.detail && e.detail.value) || {};
  
  // 表单验证
  if (!formValues.nickname) {
    wx.showToast({ title: '请输入会员名称', icon: 'none' });
    return;
  }
  
  if (!this.data.birthDate) {
    wx.showToast({ title: '请选择出生年份', icon: 'none' });
    return;
  }
  
  if (!this.data.regionText) {
    wx.showToast({ title: '请选择所在省市', icon: 'none' });
    return;
  }
  
  if (!this.data.agreeProtocol) {
    wx.showToast({ title: '请同意注册协议', icon: 'none' });
    return;
  }
  
  // 准备提交的数据
  const userData = {
    nickname: formValues.nickname,
    birthDate: this.data.birthDate,
    regionText: this.data.regionText,
  };
  
  // 显示加载状态
  wx.showLoading({ title: '提交中...' });
  
  // 调用云函数保存用户信息
  wx.cloud.callFunction({
    name: 'userOps',
    data: {
      action: this.data.isEditMode ? 'updateUserInfo' : 'saveUserInfo',
      userInfo: userData
    },
    success: res => {
      console.log('提交结果:', res.result);
      if (res.result && res.result.success) {
        wx.showToast({
          title: this.data.isEditMode ? '修改成功' : '注册成功',
          icon: 'success'
        });
        
        // 保存成功后返回会员中心
        setTimeout(() => {
          wx.navigateBack({ delta: 1 });
        }, 1500);
      } else {
        wx.showToast({
          title: res.result?.message || '提交失败',
          icon: 'none'
        });
      }
    },
    fail: err => {
      console.error('提交失败:', err);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    },
    complete: () => {
      wx.hideLoading();
    }
  });
},

  onBackHome: function () {
    wx.navigateBack();
  }
});

