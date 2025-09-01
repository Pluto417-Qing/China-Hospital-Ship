// index.js 云函数入口文件（CommonJS）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const userCollection = 'users'
const readingThoughtsCollection = 'readingthoughts' // 注意：集合名要一致

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  console.log('云函数调用:', event.action, 'openid:', openid)
  
  try {
    switch (event.action) {
      case 'getUserInfo':
        return await getUserInfo(openid)
      case 'saveUserInfo':
        return await saveUserInfo(openid, event.userInfo)
      case 'checkRegistration':
        return await checkRegistration(openid)
      case 'logout':
        return await logoutUser(openid)
      case 'getReadingThoughts':
        return await getReadingThoughts(openid);
      case 'setUserStatus':
        return await setUserStatus(event.openid, event.status)
      case 'updateRewards':
        return await updateRewards(openid, event.increment, event.content)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('云函数执行错误:', error)
    return {
      success: false,
      message: '服务器内部错误',
      error: error.message
    }
  }
}

// 更新奖励函数 - 修复版
async function updateRewards(openid, increment = 1, content) {
  try {
    console.log('开始更新奖励，openid:', openid, '内容长度:', content?.length)
    
    // 1. 内容校验
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return { success: false, message: '读后感内容不能为空' }
    }

    const serverDate = db.serverDate()

    // 2. 先检查用户是否存在
    const userCheck = await db.collection(userCollection).where({ 
      _openid: openid 
    }).get()
    
    if (userCheck.data.length === 0) {
      return { success: false, message: '用户不存在，请先注册' }
    }

    // 3. 保存读后感内容到readingthoughts集合
    const thoughtRes = await db.collection(readingThoughtsCollection).add({
      data: {
        _openid: openid,
        content: content.trim(),
        createTime: serverDate,
        updateTime: serverDate,
        month: new Date().getMonth() + 1,
        status: 1 // 1-正常, 0-已删除
      }
    })

    console.log('读后感保存成功，ID:', thoughtRes._id)

    // 4. 更新用户奖励
    const result = await db.collection(userCollection).where({ 
      _openid: openid 
    }).update({
      data: {
        rewards: _.inc(increment),
        updateTime: serverDate
      }
    });

    if (result.stats.updated === 0) {
      return { success: false, message: '用户不存在' };
    }
    
    // 5. 返回更新后的数据
    const userRes = await db.collection(userCollection).where({ _openid: openid }).get();
    
    return {
      success: true,
      rewards: userRes.data[0].rewards || 0,
      thoughtId: thoughtRes._id, // 返回读后感的ID
      content: content.trim(),   // 返回存储的内容
      user: userRes.data[0],
      message: '提交成功！+1⭐'
    };
    
  } catch (err) {
    console.error('更新奖励失败:', err);
    console.error('错误堆栈:', err.stack);
    return { 
      success: false, 
      message: '更新奖励失败: ' + err.message
    };
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
// 在文件末尾添加查询读后感的函数
// 添加查询函数（与comment提交逻辑对应）
async function getReadingThoughts(openid) {
  try {
    // 查询当前用户提交的所有读后感（与comment.js中提交的集合保持一致）
    const res = await db.collection(readingThoughtsCollection)
      .where({
        _openid: openid,
        status: 1  // 确保只查询正常状态的读后感
      })
      .orderBy('createTime', 'desc')
      .get();

    return {
      success: true,
      data: res.data
    };
  } catch (err) {
    console.error('获取读后感失败:', err);
    return {
      success: false,
      message: '获取失败: ' + err.message
    };
  }
}