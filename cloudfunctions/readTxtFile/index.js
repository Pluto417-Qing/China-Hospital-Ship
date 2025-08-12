// cloudfunctions/readTxtFile/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  try {
    // 1. 获取云存储文件 ID（如 "cloud://xxx/example.txt"）
    const fileID = event.fileID
    
    // 2. 获取文件下载链接
    const res = await cloud.downloadFile({ fileID })
    const buffer = res.fileContent
    
    // 3. 如果是纯文本（txt），直接转为字符串
    const content = buffer.toString('utf-8')
    
    return {
      success: true,
      content: content
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
}