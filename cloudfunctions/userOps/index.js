// index.js 云函数入口文件（CommonJS）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const userCollection = 'users'

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (event.action) {
    case 'getUserInfo':
      return getUserInfo(openid)
    case 'saveUserInfo':
      return saveUserInfo(openid, event.userInfo)
    case 'checkRegistration':
      return checkRegistration(openid)
    case 'logout':
      return logoutUser(openid)
    case 'setUserStatus':
      return setUserStatus(event.openid, event.status)
    case 'updateRewards':
      return updateRewards(openid, event.increment)
    default:
      return {
        success: false,
        message: '未知操作'
      }
  }
}

// 更新奖励函数
async function updateRewards(openid, increment = 1) {
  try {
    const result = await db.collection(userCollection).where({ 
      _openid: openid 
    }).update({
      data: {
        rewards: _.inc(increment), // 使用inc操作符原子增加
        updateTime: db.serverDate()
      }
    });
    
    if (result.stats.updated === 0) {
      return { success: false, message: '用户不存在' };
    }
    
    // 返回更新后的数据
    const userRes = await db.collection(userCollection).where({ _openid: openid }).get();
    return {
      success: true,
      rewards: userRes.data[0].rewards,
      user: userRes.data[0]
    };
  } catch (err) {
    console.error('更新奖励失败:', err);
    return { success: false, message: '更新奖励失败' };
  }
}

// 获取用户信息
async function getUserInfo(openid) {
  try {
    const userRes = await db.collection(userCollection).where({
      _openid: openid
    }).get()
    
    if (userRes.data.length > 0) {
      return {
        success: true,
        data: userRes.data[0]
      }
    } else {
      return {
        success: false,
        message: '未找到用户信息'
      }
    }
  } catch (err) {
    console.error('获取用户信息失败', err)
    return {
      success: false,
      message: '获取用户信息失败',
      error: err
    }
  }
}

// 保存用户信息
async function saveUserInfo(openid, userInfo) {
  try {
    // 检查用户是否已存在
    const userRes = await db.collection(userCollection).where({
      _openid: openid
    }).get()

    let readerNo = '';
    if (userRes.data.length > 0) {
      // 用户存在，保留原编号
      readerNo = userRes.data[0].readerNo || '';
    } else {
      // 新用户，分配编号
      let prefix = '';
      if (userInfo.regionText) {
        let region = userInfo.regionText.replace(/(省|市|区|县)/g, '');
        if (!region) region = '未知地区';
        if (region.length > 4) region = region.slice(0, 4);
        prefix = region;
      } else {
        prefix = '未知地区';
      }
      // 查询该前缀下最大编号
      const last = await db.collection(userCollection)
        .where({ readerNo: db.RegExp({ regexp: `^${prefix}\\d{6}$` }) })
        .orderBy('readerNo', 'desc').limit(1).get();
      let nextNo = '000001';
      if (last.data.length > 0) {
        const lastNo = last.data[0].readerNo;
        const num = parseInt(lastNo.slice(prefix.length)) + 1;
        nextNo = num.toString().padStart(6, '0');
      }
      readerNo = prefix + nextNo;
    }

    // 奖励统计字段
    const rewards = typeof userInfo.rewards === 'number' ? userInfo.rewards : 
                   (userRes.data.length > 0 ? (userRes.data[0].rewards || 0) : 0);
    // 移除userInfo中的readerNo，防止覆盖
    if ('readerNo' in userInfo) delete userInfo.readerNo;
    let result;
    if (userRes.data.length > 0) {
      // 用户存在，更新信息
      result = await db.collection(userCollection).where({
        _openid: openid
      }).update({
        data: {
          readerNo,
          ...userInfo,
          rewards,
          updateTime: db.serverDate()
        }
      })
    } else {
      // 新用户，插入记录
      result = await db.collection(userCollection).add({
        data: {
          _openid: openid,
          readerNo,
          ...userInfo,
          rewards,
          createTime: db.serverDate(),
          updateTime: db.serverDate(),
          hasRegistered: true,
          status: 'active' // 活跃、非活跃、回归
        }
      })
    }
    // 返回完整用户数据用于前端调试
    const userDoc = await db.collection(userCollection).where({ _openid: openid }).get();
    return {
      success: true,
      message: '保存成功',
      readerNo,
      user: userDoc.data[0] || null
    }
  } catch (err) {
    console.error('保存用户信息失败', err)
    return {
      success: false,
      message: '保存用户信息失败',
      error: err
    }
  }
}

// 检查用户是否已注册
async function checkRegistration(openid) {
  try {
    const userRes = await db.collection(userCollection).where({
      _openid: openid,
      hasRegistered: true
    }).get()
    
    return {
      success: true,
      hasRegistered: userRes.data.length > 0
    }
  } catch (err) {
    console.error('检查用户注册状态失败', err)
    return {
      success: false,
      message: '检查用户注册状态失败',
      error: err
    }
  }
}

// 注销用户（不删除数据，仅标记）
async function logoutUser(openid) {
  try {
    const result = await db.collection(userCollection).where({ _openid: openid }).update({
      data: {
        hasRegistered: false,
        status: 'inactive', // 标记为非活跃
        updateTime: db.serverDate()
      }
    });
    return {
      success: true,
      message: '注销成功，数据已保留',
      result
    };
  } catch (err) {
    console.error('注销用户失败', err);
    return {
      success: false,
      message: '注销用户失败',
      error: err
    };
  }
} 

// 后台设置用户状态（活跃、非活跃、回归）
async function setUserStatus(openid, status) {
  if (!openid || !['active', 'inactive', 'return'].includes(status)) {
    return {
      success: false,
      message: '参数错误，openid和status必填且status必须为active/inactive/return'
    };
  }
  try {
    const result = await db.collection(userCollection).where({ _openid: openid }).update({
      data: {
        status,
        updateTime: db.serverDate()
      }
    });
    return {
      success: true,
      message: '用户状态已更新',
      result
    };
  } catch (err) {
    console.error('设置用户状态失败', err);
    return {
      success: false,
      message: '设置用户状态失败',
      error: err
    };
  }
} 