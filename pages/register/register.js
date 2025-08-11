Page({
  data: {
    isEditMode: false,
    avatarUrl: '',
    nickname: '',
    birthDate: '',
    regionArray: [], // 省市二维数组
    regionIndex: [0, 0],
    regionText: '',
    gradeArray: ['小学1年级','小学2年级','小学3年级','小学4年级','小学5年级','小学6年级','初一','初二','初三','高一','高二','高三'],
    gradeIndex: 0,
    familyArray: ['父亲','母亲','哥哥','姐姐','弟弟','妹妹','爷爷','奶奶','外公','外婆','叔叔','姑姑','舅舅'],
    familyIndex: 0,
    hobbyArray: ['运动','绘画','阅读','器乐','唱歌','跳舞','游戏','美食','旅游'],
    hobbyIndex: 0,
    healthArray: ['运动系统','消化系统','呼吸系统','泌尿系统','生殖系统','内分泌系统','免疫系统','神经系统','循环系统'],
    selectedHealth: [],
    characterArray: ['外向','内向','正常'],
    characterIndex: 0,
    heightArray: ['偏高','正常','偏矮'],
    heightIndex: 0,
    weightArray: ['偏重','正常','偏轻'],
    weightIndex: 0,
    agreeProtocol: false,
    selectedFamilyMembers: []
  },
  onLoad: function (options) {
    console.log('注册页面参数:', options);
    
    // 检查是否是编辑模式
    const isEditMode = options.edit === 'true';
    
    // 只设置isEditMode状态
    this.setData({ isEditMode });
    
    console.log('当前模式:', isEditMode ? '编辑模式' : '注册模式');
      
    // 如果是编辑模式，从云数据库获取用户信息
    if (isEditMode) {
      this.getUserInfoFromCloud();
    } else {
      // 非编辑模式，获取微信用户信息
      const wxUserInfo = wx.getStorageSync('wxUserInfo') || {};
      if (wxUserInfo) {
        this.setData({
          avatarUrl: wxUserInfo.avatarUrl || '',
          nickname: wxUserInfo.nickName || ''
        });
      }
    }

    // 初始化省市二级联动数据
    const provinces = [
      '北京市','天津市','上海市','重庆市','河北省','山西省','辽宁省','吉林省','黑龙江省','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省','湖南省','广东省','海南省','四川省','贵州省','云南省','陕西省','甘肃省','青海省','台湾省','内蒙古自治区','广西壮族自治区','西藏自治区','宁夏回族自治区','新疆维吾尔自治区','香港特别行政区','澳门特别行政区'
    ];
    const cities = [
      ['东城区','西城区','朝阳区','丰台区','石景山区','海淀区','门头沟区','房山区','通州区','顺义区','昌平区','大兴区','怀柔区','平谷区','密云区','延庆区'], // 北京市
      ['和平区','河东区','河西区','南开区','河北区','红桥区','东丽区','西青区','津南区','北辰区','武清区','宝坻区','滨海新区','宁河区','静海区','蓟州区'], // 天津市
      ['黄浦区','徐汇区','长宁区','静安区','普陀区','虹口区','杨浦区','闵行区','宝山区','嘉定区','浦东新区','金山区','松江区','青浦区','奉贤区','崇明区'], // 上海市
      ['万州区','涪陵区','渝中区','大渡口区','江北区','沙坪坝区','九龙坡区','南岸区','北碚区','綦江区','大足区','渝北区','巴南区','黔江区','长寿区','江津区','合川区','永川区','南川区','璧山区','铜梁区','潼南区','荣昌区','开州区','梁平区','武隆区','城口县','丰都县','垫江县','忠县','云阳县','奉节县','巫山县','巫溪县','石柱土家族自治县','秀山土家族苗族自治县','酉阳土家族苗族自治县','彭水苗族土家族自治县'], // 重庆市
      ['石家庄市','唐山市','秦皇岛市','邯郸市','邢台市','保定市','张家口市','承德市','沧州市','廊坊市','衡水市'], // 河北省
      ['太原市','大同市','阳泉市','长治市','晋城市','朔州市','晋中市','运城市','忻州市','临汾市','吕梁市'], // 山西省
      ['沈阳市','大连市','鞍山市','抚顺市','本溪市','丹东市','锦州市','营口市','阜新市','辽阳市','盘锦市','铁岭市','朝阳市','葫芦岛市'], // 辽宁省
      ['长春市','吉林市','四平市','辽源市','通化市','白山市','松原市','白城市','延边朝鲜族自治州'], // 吉林省
      ['哈尔滨市','齐齐哈尔市','鸡西市','鹤岗市','双鸭山市','大庆市','伊春市','佳木斯市','七台河市','牡丹江市','黑河市','绥化市','大兴安岭地区'], // 黑龙江省
      ['南京市','无锡市','徐州市','常州市','苏州市','南通市','连云港市','淮安市','盐城市','扬州市','镇江市','泰州市','宿迁市'], // 江苏省
      ['杭州市','宁波市','温州市','嘉兴市','湖州市','绍兴市','金华市','衢州市','舟山市','台州市','丽水市'], // 浙江省
      ['合肥市','芜湖市','蚌埠市','淮南市','马鞍山市','淮北市','铜陵市','安庆市','黄山市','滁州市','阜阳市','宿州市','巢湖市','六安市','亳州市','池州市','宣城市'], // 安徽省
      ['福州市','厦门市','莆田市','三明市','泉州市','漳州市','南平市','龙岩市','宁德市'], // 福建省
      ['南昌市','景德镇市','萍乡市','九江市','新余市','鹰潭市','赣州市','吉安市','宜春市','抚州市','上饶市'], // 江西省
      ['济南市','青岛市','淄博市','枣庄市','东营市','烟台市','潍坊市','济宁市','泰安市','威海市','日照市','莱芜市','临沂市','德州市','聊城市','滨州市','菏泽市'], // 山东省
      ['郑州市','开封市','洛阳市','平顶山市','安阳市','鹤壁市','新乡市','焦作市','濮阳市','许昌市','漯河市','三门峡市','南阳市','商丘市','信阳市','周口市','驻马店市','济源市'], // 河南省
      ['武汉市','黄石市','十堰市','宜昌市','襄阳市','鄂州市','荆门市','孝感市','荆州市','黄冈市','咸宁市','随州市','恩施土家族苗族自治州','仙桃市','潜江市','天门市','神农架林区'], // 湖北省
      ['长沙市','株洲市','湘潭市','衡阳市','邵阳市','岳阳市','常德市','张家界市','益阳市','郴州市','永州市','怀化市','娄底市','湘西土家族苗族自治州'], // 湖南省
      ['广州市','韶关市','深圳市','珠海市','汕头市','佛山市','江门市','湛江市','茂名市','肇庆市','惠州市','梅州市','汕尾市','河源市','阳江市','清远市','东莞市','中山市','潮州市','揭阳市','云浮市'], // 广东省
      ['海口市','三亚市','三沙市','儋州市','省直辖县级行政区划'], // 海南省
      ['成都市','自贡市','攀枝花市','泸州市','德阳市','绵阳市','广元市','遂宁市','内江市','乐山市','南充市','眉山市','宜宾市','广安市','达州市','雅安市','巴中市','资阳市','阿坝藏族羌族自治州','甘孜藏族自治州','凉山彝族自治州'], // 四川省
      ['贵阳市','六盘水市','遵义市','安顺市','铜仁市','黔西南布依族苗族自治州','黔东南苗族侗族自治州','黔南布依族苗族自治州'], // 贵州省
      ['昆明市','曲靖市','玉溪市','保山市','昭通市','丽江市','普洱市','临沧市','楚雄彝族自治州','红河哈尼族彝族自治州','文山壮族苗族自治州','西双版纳傣族自治州','大理白族自治州','德宏傣族景颇族自治州','怒江傈僳族自治州','迪庆藏族自治州'], // 云南省
      ['西安市','铜川市','宝鸡市','咸阳市','渭南市','延安市','汉中市','榆林市','安康市','商洛市'], // 陕西省
      ['兰州市','嘉峪关市','金昌市','白银市','天水市','武威市','张掖市','平凉市','酒泉市','庆阳市','定西市','陇南市','临夏回族自治州','甘南藏族自治州'], // 甘肃省
      ['西宁市','海东市','海北藏族自治州','黄南藏族自治州','海南藏族自治州','果洛藏族自治州','玉树藏族自治州','海西蒙古族藏族自治州'], // 青海省
      ['台北市','高雄市','基隆市','台中市','台南市','新竹市','嘉义市','新北市','宜兰县','桃园县','新竹县','苗栗县','彰化县','南投县','云林县','嘉义县','屏东县','台东县','花莲县','澎湖县','金门县','连江县'], // 台湾省
      ['呼和浩特市','包头市','乌海市','赤峰市','通辽市','鄂尔多斯市','呼伦贝尔市','巴彦淖尔市','乌兰察布市','兴安盟','锡林郭勒盟','阿拉善盟'], // 内蒙古自治区
      ['南宁市','柳州市','桂林市','梧州市','北海市','防城港市','钦州市','贵港市','玉林市','百色市','贺州市','河池市','来宾市','崇左市'], // 广西壮族自治区
      ['拉萨市','日喀则市','昌都市','林芝市','山南市','那曲市','阿里地区'], // 西藏自治区
      ['银川市','石嘴山市','吴忠市','固原市','中卫市'], // 宁夏回族自治区
      ['乌鲁木齐市','克拉玛依市','吐鲁番市','哈密市','昌吉回族自治州','博尔塔拉蒙古自治州','巴音郭楞蒙古自治州','阿克苏地区','克孜勒苏柯尔克孜自治州','喀什地区','和田地区','伊犁哈萨克自治州','塔城地区','阿勒泰地区','石河子市','阿拉尔市','图木舒克市','五家渠市','北屯市','铁门关市','双河市','可克达拉市','昆玉市','胡杨河市'], // 新疆维吾尔自治区
      ['中西区','湾仔区','东区','南区','油尖旺区','深水埗区','九龙城区','黄大仙区','观塘区','荃湾区','屯门区','元朗区','北区','大埔区','西贡区','沙田区','葵青区','离岛区'], // 香港特别行政区
      ['花地玛堂区','圣安多尼堂区','大堂区','望德堂区','风顺堂区','嘉模堂区','路凼填海区','圣方济各堂区'] // 澳门特别行政区
    ];
    const defaultProvince = provinces[0];
    const defaultCity = cities[0][0];
    this.setData({
      regionArray: [provinces, cities[0]],
      regionIndex: [0, 0],
      regionText: defaultProvince + defaultCity
    });
  },
  
  // 从云数据库获取用户信息
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
        console.log('获取用户信息结果:', res.result);
        if (res.result.success && res.result.data) {
          const userInfo = res.result.data;
          
          // 预填所有表单项，确保数组不为null或undefined
          this.setData({
            avatarUrl: userInfo.avatarUrl || '',
            nickname: userInfo.nickname || '',
            birthDate: userInfo.birthDate || '',
            regionIndex: [0, 0], // 默认省市
            regionText: userInfo.regionText || '',
            gradeIndex: this.data.gradeArray.indexOf(userInfo.selectedGrade) || 0,
            selectedFamilyMembers: Array.isArray(userInfo.selectedFamilyMembers) ? userInfo.selectedFamilyMembers : [],
            hobbyIndex: this.data.hobbyArray.indexOf(userInfo.selectedHobbies[0]) || 0,
            selectedHealth: Array.isArray(userInfo.selectedHealthIssues) ? userInfo.selectedHealthIssues : [],
            characterIndex: this.data.characterArray.indexOf(userInfo.character) || 0,
            heightIndex: this.data.heightArray.indexOf(userInfo.height) || 0,
            weightIndex: this.data.weightArray.indexOf(userInfo.weight) || 0,
            agreeProtocol: userInfo.agreeProtocol || false
          });
          
          console.log('预填后的数据:', {
            selectedHealthIssues: this.data.selectedHealthIssues,
            selectedHobbies: this.data.selectedHobbies,
            selectedFamilyMembers: this.data.selectedFamilyMembers
          });
        } else {
          wx.showToast({
            title: '获取信息失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('获取用户信息失败', err);
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
  
  onShow: function() {
    // 页面显示时再次确认数据已加载
    if (this.data.isEditMode) {
      console.log('页面显示 - 确认数据:', this.data);
    }
  },
  // 选择头像
  chooseAvatar: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // tempFilePath可以作为img标签的src属性显示图片
        const tempFilePath = res.tempFilePaths[0];
        console.log('选择的图片:', tempFilePath);
        
        // 保存临时文件路径
        this.setData({
          avatarUrl: tempFilePath
        });
        
        // 上传图片到云存储
        this.uploadImage(tempFilePath);
      }
    })
  },
  
  // 上传图片到云存储
  uploadImage: function(filePath) {
    wx.showLoading({
      title: '上传中',
    });
    
    const cloudPath = `userAvatars/${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: res => {
        console.log('上传成功，fileID:', res.fileID);
        // 更新头像URL为云存储路径
        this.setData({
          avatarUrl: res.fileID
        });
      },
      fail: err => {
        console.error('上传失败', err);
        wx.showToast({
          title: '图片上传失败',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },
  
  onNicknameInput(e) {
    // 只允许汉字
    const value = e.detail.value.replace(/[^\u4e00-\u9fa5]/g, '');
    this.setData({ nickname: value });
  },
  onBirthChange(e) {
    this.setData({ birthDate: e.detail.value });
  },
  // 省市二级联动picker列切换
  onRegionColumnChange(e) {
    const column = e.detail.column;
    const value = e.detail.value;
    let regionArray = this.data.regionArray;
    let regionIndex = this.data.regionIndex;
    // 省份数据
    const provinces = [
      '北京市','天津市','上海市','重庆市','河北省','山西省','辽宁省','吉林省','黑龙江省','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省','湖南省','广东省','海南省','四川省','贵州省','云南省','陕西省','甘肃省','青海省','台湾省','内蒙古自治区','广西壮族自治区','西藏自治区','宁夏回族自治区','新疆维吾尔自治区','香港特别行政区','澳门特别行政区'
    ];
    const cities = [
      ['东城区','西城区','朝阳区','丰台区','石景山区','海淀区','门头沟区','房山区','通州区','顺义区','昌平区','大兴区','怀柔区','平谷区','密云区','延庆区'],
      ['和平区','河东区','河西区','南开区','河北区','红桥区','东丽区','西青区','津南区','北辰区','武清区','宝坻区','滨海新区','宁河区','静海区','蓟州区'],
      ['黄浦区','徐汇区','长宁区','静安区','普陀区','虹口区','杨浦区','闵行区','宝山区','嘉定区','浦东新区','金山区','松江区','青浦区','奉贤区','崇明区'],
      ['万州区','涪陵区','渝中区','大渡口区','江北区','沙坪坝区','九龙坡区','南岸区','北碚区','綦江区','大足区','渝北区','巴南区','黔江区','长寿区','江津区','合川区','永川区','南川区','璧山区','铜梁区','潼南区','荣昌区','开州区','梁平区','武隆区','城口县','丰都县','垫江县','忠县','云阳县','奉节县','巫山县','巫溪县','石柱土家族自治县','秀山土家族苗族自治县','酉阳土家族苗族自治县','彭水苗族土家族自治县'],
      ['石家庄市','唐山市','秦皇岛市','邯郸市','邢台市','保定市','张家口市','承德市','沧州市','廊坊市','衡水市'],
      ['太原市','大同市','阳泉市','长治市','晋城市','朔州市','晋中市','运城市','忻州市','临汾市','吕梁市'],
      ['沈阳市','大连市','鞍山市','抚顺市','本溪市','丹东市','锦州市','营口市','阜新市','辽阳市','盘锦市','铁岭市','朝阳市','葫芦岛市'],
      ['长春市','吉林市','四平市','辽源市','通化市','白山市','松原市','白城市','延边朝鲜族自治州'],
      ['哈尔滨市','齐齐哈尔市','鸡西市','鹤岗市','双鸭山市','大庆市','伊春市','佳木斯市','七台河市','牡丹江市','黑河市','绥化市','大兴安岭地区'],
      ['南京市','无锡市','徐州市','常州市','苏州市','南通市','连云港市','淮安市','盐城市','扬州市','镇江市','泰州市','宿迁市'],
      ['杭州市','宁波市','温州市','嘉兴市','湖州市','绍兴市','金华市','衢州市','舟山市','台州市','丽水市'],
      ['合肥市','芜湖市','蚌埠市','淮南市','马鞍山市','淮北市','铜陵市','安庆市','黄山市','滁州市','阜阳市','宿州市','巢湖市','六安市','亳州市','池州市','宣城市'],
      ['福州市','厦门市','莆田市','三明市','泉州市','漳州市','南平市','龙岩市','宁德市'],
      ['南昌市','景德镇市','萍乡市','九江市','新余市','鹰潭市','赣州市','吉安市','宜春市','抚州市','上饶市'],
      ['济南市','青岛市','淄博市','枣庄市','东营市','烟台市','潍坊市','济宁市','泰安市','威海市','日照市','莱芜市','临沂市','德州市','聊城市','滨州市','菏泽市'],
      ['郑州市','开封市','洛阳市','平顶山市','安阳市','鹤壁市','新乡市','焦作市','濮阳市','许昌市','漯河市','三门峡市','南阳市','商丘市','信阳市','周口市','驻马店市','济源市'],
      ['武汉市','黄石市','十堰市','宜昌市','襄阳市','鄂州市','荆门市','孝感市','荆州市','黄冈市','咸宁市','随州市','恩施土家族苗族自治州','仙桃市','潜江市','天门市','神农架林区'],
      ['长沙市','株洲市','湘潭市','衡阳市','邵阳市','岳阳市','常德市','张家界市','益阳市','郴州市','永州市','怀化市','娄底市','湘西土家族苗族自治州'],
      ['广州市','韶关市','深圳市','珠海市','汕头市','佛山市','江门市','湛江市','茂名市','肇庆市','惠州市','梅州市','汕尾市','河源市','阳江市','清远市','东莞市','中山市','潮州市','揭阳市','云浮市'],
      ['海口市','三亚市','三沙市','儋州市','省直辖县级行政区划'],
      ['成都市','自贡市','攀枝花市','泸州市','德阳市','绵阳市','广元市','遂宁市','内江市','乐山市','南充市','眉山市','宜宾市','广安市','达州市','雅安市','巴中市','资阳市','阿坝藏族羌族自治州','甘孜藏族自治州','凉山彝族自治州'],
      ['贵阳市','六盘水市','遵义市','安顺市','铜仁市','黔西南布依族苗族自治州','黔东南苗族侗族自治州','黔南布依族苗族自治州'],
      ['昆明市','曲靖市','玉溪市','保山市','昭通市','丽江市','普洱市','临沧市','楚雄彝族自治州','红河哈尼族彝族自治州','文山壮族苗族自治州','西双版纳傣族自治州','大理白族自治州','德宏傣族景颇族自治州','怒江傈僳族自治州','迪庆藏族自治州'],
      ['西安市','铜川市','宝鸡市','咸阳市','渭南市','延安市','汉中市','榆林市','安康市','商洛市'],
      ['兰州市','嘉峪关市','金昌市','白银市','天水市','武威市','张掖市','平凉市','酒泉市','庆阳市','定西市','陇南市','临夏回族自治州','甘南藏族自治州'],
      ['西宁市','海东市','海北藏族自治州','黄南藏族自治州','海南藏族自治州','果洛藏族自治州','玉树藏族自治州','海西蒙古族藏族自治州'],
      ['台北市','高雄市','基隆市','台中市','台南市','新竹市','嘉义市','新北市','宜兰县','桃园县','新竹县','苗栗县','彰化县','南投县','云林县','嘉义县','屏东县','台东县','花莲县','澎湖县','金门县','连江县'],
      ['呼和浩特市','包头市','乌海市','赤峰市','通辽市','鄂尔多斯市','呼伦贝尔市','巴彦淖尔市','乌兰察布市','兴安盟','锡林郭勒盟','阿拉善盟'],
      ['南宁市','柳州市','桂林市','梧州市','北海市','防城港市','钦州市','贵港市','玉林市','百色市','贺州市','河池市','来宾市','崇左市'],
      ['拉萨市','日喀则市','昌都市','林芝市','山南市','那曲市','阿里地区'],
      ['银川市','石嘴山市','吴忠市','固原市','中卫市'],
      ['乌鲁木齐市','克拉玛依市','吐鲁番市','哈密市','昌吉回族自治州','博尔塔拉蒙古自治州','巴音郭楞蒙古自治州','阿克苏地区','克孜勒苏柯尔克孜自治州','喀什地区','和田地区','伊犁哈萨克自治州','塔城地区','阿勒泰地区','石河子市','阿拉尔市','图木舒克市','五家渠市','北屯市','铁门关市','双河市','可克达拉市','昆玉市','胡杨河市'],
      ['中西区','湾仔区','东区','南区','油尖旺区','深水埗区','九龙城区','黄大仙区','观塘区','荃湾区','屯门区','元朗区','北区','大埔区','西贡区','沙田区','葵青区','离岛区'],
      ['花地玛堂区','圣安多尼堂区','大堂区','望德堂区','风顺堂区','嘉模堂区','路凼填海区','圣方济各堂区']
    ];
    if (column === 0) {
      // 省份切换，更新城市
      regionArray[1] = cities[value];
      regionIndex[0] = value;
      regionIndex[1] = 0;
    } else if (column === 1) {
      regionIndex[1] = value;
    }
    this.setData({
      regionArray,
      regionIndex
    });
  },
  onRegionChange(e) {
    const regionIndex = e.detail.value;
    const province = this.data.regionArray[0][regionIndex[0]];
    const city = this.data.regionArray[1][regionIndex[1]];
    this.setData({
      regionIndex,
      regionText: province + city
    });
  },
  onGradeChange(e) {
    this.setData({ gradeIndex: e.detail.value });
  },
  onFamilyChange(e) {
    this.setData({ selectedFamilyMembers: e.detail.value });
  },
  onHobbyChange(e) {
    this.setData({ hobbyIndex: e.detail.value });
  },
  onHealthChange(e) {
    this.setData({ selectedHealth: e.detail.value });
  },
  onCharacterChange(e) {
    this.setData({ characterIndex: e.detail.value });
  },
  onHeightChange(e) {
    this.setData({ heightIndex: e.detail.value });
  },
  onWeightChange(e) {
    this.setData({ weightIndex: e.detail.value });
  },
  onProtocolChange(e) {
    this.setData({ agreeProtocol: e.detail.value.length > 0 });
  },
  onSubmit: function () {
    // 严格校验所有字段
    if (!this.data.nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (!/^[\u4e00-\u9fa5]+$/.test(this.data.nickname)) {
      wx.showToast({ title: '昵称仅限汉字', icon: 'none' });
      return;
    }
    if (!this.data.birthDate) {
      wx.showToast({ title: '请选择出生年月', icon: 'none' });
      return;
    }
    if (!this.data.regionText) {
      wx.showToast({ title: '请选择省市', icon: 'none' });
      return;
    }
    if (!this.data.agreeProtocol) {
      wx.showToast({ title: '请同意注册协议', icon: 'none' });
      return;
    }
    // 显示加载提示
    wx.showLoading({ title: '保存中', });
    // 构建用户信息对象
    const userInfo = {
      avatarUrl: this.data.avatarUrl,
      nickname: this.data.nickname,
      birthDate: this.data.birthDate,
      regionText: this.data.regionText,
      selectedGrade: this.data.gradeArray[this.data.gradeIndex],
      selectedFamilyMembers: this.data.selectedFamilyMembers,
      selectedHobbies: [this.data.hobbyArray[this.data.hobbyIndex]],
      selectedHealthIssues: this.data.selectedHealth,
      character: this.data.characterArray[this.data.characterIndex],
      height: this.data.heightArray[this.data.heightIndex],
      weight: this.data.weightArray[this.data.weightIndex],
      agreeProtocol: this.data.agreeProtocol
    };
    wx.cloud.callFunction({
      name: 'userOps',
      data: {
        action: 'saveUserInfo',
        userInfo: userInfo
      },
      success: res => {
        wx.hideLoading();
        if (res.result.success) {
          wx.setStorageSync('hasRegistered', true);
          wx.setStorageSync('readerNo', res.result.readerNo);
          // 展示编号和奖励统计
          wx.showModal({
            title: '注册成功',
            content: `您的编号：${res.result.readerNo}\n红五星：0个`,
            showCancel: false,
            success: () => {
              wx.switchTab({ url: '/pages/member/member' });
            }
          });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  },
  
  // 添加返回主页的方法
  onBackHome: function() {
    wx.switchTab({
      url: '/pages/home/home',
    });
  },
  
  onUsernameInput: function (e) {
    this.setData({ username: e.detail.value })
  },
  onGradeChange: function (e) {
    this.setData({ selectedGrade: this.data.gradeLevels[e.detail.value] })
  },
  onProvinceChange: function (e) {
    this.setData({ selectedProvince: this.data.provinces[e.detail.value] })
  },
  
  // 复选框组处理函数
  onHealthIssueChange: function(e) {
    console.log('健康问题变更:', e.detail.value);
    
    this.setData({
      selectedHealthIssues: e.detail.value
    });
  },
  
  onHobbyChange: function(e) {
    console.log('爱好变更:', e.detail.value);
    
    this.setData({
      selectedHobbies: e.detail.value
    });
  },
  
  onFamilyMemberChange: function(e) {
    console.log('家庭成员变更:', e.detail.value);
    
    this.setData({
      selectedFamilyMembers: e.detail.value
    });
  }
})
