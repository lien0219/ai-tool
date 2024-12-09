const Koa = require('koa')
const websocket = require('koa-websocket')
const OpenAI = require('openai')
require('dotenv').config()

const app = websocket(new Koa())

// 配置 Moonshot AI 客户端
const client = new OpenAI({
  apiKey: 'sk-LxZ5LFPRGys5Jo6AV3N15Hqj7vxMyQY2KaktNqhy66lVxBgg',
  baseURL: 'https://api.moonshot.cn/v1', // Moonshot API 基础路径
})

// WebSocket 路由
app.ws.use((ctx) => {
  console.log('WebSocket connected') // 初始化上下文消息

  let messages = [
    {
      role: 'system',
      content:
        '你是 Kimi，由 Moonshot AI 提供的人工智能助手，你更擅长中文和英文的对话。用户问什么问题,你都阴阳怪气他!',
    },
  ] // 监听前端发送的消息

  ctx.websocket.on('message', async (message) => {
    const { content } = JSON.parse(message) // 获取用户输入
    // 添加用户输入到上下文消息中
    messages.push({ role: 'user', content })

    try {
      // 开启流式输出
      const stream = await client.chat.completions.create({
        model: 'moonshot-v1-8k',
        messages,
        temperature: 0.3,
        stream: true,
      })

      ctx.websocket.send(JSON.stringify({ reply: '', isStreaming: true }))

      let fullReply = '' // 用于记录完整回复
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta
        if (delta?.content) {
          ctx.websocket.send(JSON.stringify({ reply: delta.content }))
          fullReply += delta.content
        }
      } // 将 AI 回复添加到上下文消息中

      messages.push({ role: 'assistant', content: fullReply })
    } catch (error) {
      console.error('调用 Moonshot API 出错:', error.message)
      ctx.websocket.send(JSON.stringify({ reply: 'Kimi 暂时无法回答您的问题，请稍后再试。' }))
    }
  })
})

// 启动服务器
app.listen(3000, () => {
  console.log('服务已启动，监听 ws://localhost:3000')
})
