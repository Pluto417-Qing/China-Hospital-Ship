// 云函数 getBanners/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  try {
    const bannerFiles = [
      'banner1.jpg',
      'banner2.jpg',
      'banner3.jpg',
      'banner4.jpg',
      'banner5.jpg',
      'banner6.jpg',
      'banner7.jpg',
      'banner8.jpg',
      'banner9.jpg',
      'banner10.jpg',
      'banner11.jpg',
      'banner12.jpg',
    ]

    const fileList = bannerFiles.map(name => ({
      fileID: `cloud://cloudbase-1g4b1jysc952b1f5.636c-cloudbase-1g4b1jysc952b1f5-1367750649/banners/${name}`,
      maxAge: 60 * 60
    }))

    const res = await cloud.getTempFileURL({ fileList })
    
    return {
      code: 0,
      data: res.fileList.map(file => ({
        fileID: file.fileID,
        tempFileURL: file.tempFileURL,
      }))
    }
  } catch (err) {
    return {
      code: -1,
      message: err.toString() 
    }
  }
}