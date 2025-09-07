const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const FILE_MAP = {
  image: '插图.png',
  audio: '录音.m4a',
  peopleIntro: '人物介绍.txt',
  healthKnowledge: '健康知识.txt',
  doctors: '科普医师.txt',
  story: '病人故事.txt'
}

const directories = [
  "食管癌篇"
]

exports.main = async (event, context) => {
  let result = []
  for (let dir of directories) {
    // 检查是否已存在同名 title
    const exist = await db.collection('articles').where({ title: dir }).get()
    if (exist.data && exist.data.length > 0) {
      // 已存在，跳过
      continue
    }
    
    // 生成 fileID 字符串数组
    const fileList = Object.entries(FILE_MAP).map(([key, value]) =>
      `cloud://cloudbase-1gl4e5sia9d92880.636c-cloudbase-1gl4e5sia9d92880-1377444627/文章/${dir}/${value}`
    )

    const res = await cloud.getTempFileURL({ fileList })
    // 组装文章对象
    const article = { title: dir }
    Object.keys(FILE_MAP).forEach((key, idx) => {
      article[key] = res.fileList[idx]?.fileID || ''
    })
    article.date = '2025-8-11' // 或 new Date().toISOString().slice(0, 10)
    article.type = '中国医院船'

    await db.collection('articles').add({ data: article })
    result.push(article)
  }
  return { success: true, count: result.length }
}