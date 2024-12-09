<template>
  <div class="chat-container">
    <div class="chat-box">
      <div class="messages">
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="message-wrapper"
          :class="message.role === 'user' ? 'user-message' : 'ai-message'"
        >
          <div class="message" v-html="renderMessageContent(message.content)"></div>
        </div>
      </div>
    </div>
    <div class="input-box">
      <textarea
        v-model="userInput"
        placeholder="请输入您的问题..."
        @keyup.enter="sendMessage"
      ></textarea>
      <button @click="sendMessage">发送</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css' // 引入代码高亮样式
// 初始化 Markdown-it，并配置代码高亮
const md = new MarkdownIt({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return '' // 如果未指定语言，则返回原始代码
  },
})

// WebSocket 初始化
const socket = new WebSocket('ws://localhost:3000')
const messages = ref([]) // 聊天记录
const userInput = ref('') // 用户输入内容
let isStreaming = false // 是否正在流式接收数据
let streamingMessage = '' // 当前正在接收的消息
// 渲染消息内容（支持 Markdown 和普通文本）
const renderMessageContent = (content) => {
  return md.render(content)
}

// 监听后端发送的消息
socket.onmessage = (event) => {
  const data = JSON.parse(event.data)

  if (data.isStreaming) {
    isStreaming = true
    streamingMessage = ''
    messages.value.push({ role: 'assistant', content: '' })
  } else if (isStreaming && data.reply) {
    streamingMessage += data.reply
    messages.value[messages.value.length - 1].content = streamingMessage
  } else {
    isStreaming = false
  }
}

// 发送消息给后端
const sendMessage = () => {
  if (!userInput.value.trim()) return

  messages.value.push({ role: 'user', content: userInput.value })

  socket.send(
    JSON.stringify({
      content: userInput.value,
    }),
  )

  userInput.value = ''
}
</script>

<style scoped>
.chat-container {
  height: 100vh;
  background-color: #f6f7f9;
  overflow: hidden;
}

.chat-box {
  height: calc(100% - 60px);
  box-sizing: border-box;
  padding: 16px;
  overflow-y: auto;
  background-color: #ffffff;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-wrapper {
  display: flex;
}

.message {
  max-width: 70%;
  padding: 5px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.user-message {
  justify-content: flex-end;
}

.message {
  background-color: #0084ff;
  color: #ffffff;
  text-align: right;
  border-bottom-right-radius: 4px;
}

.ai-message {
  justify-content: flex-start;
}

.message {
  background-color: #f1f0f0;
  color: #333333;
  text-align: left;
  border-bottom-left-radius: 4px;
}

pre {
  background-color: #f6f8fa;
  padding: 10px;
  border-radius: 6px;
  overflow-x: auto;
}

.input-box {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #e5e5e5;
  border-top: 1px solid #e5e5e5;
  padding: 0 10px;
}

button {
  padding: 5px 20px;
  background-color: #0084ff;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 132, 255, 0.3);
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #006bbf;
}

button:active {
  background-color: #0056a3;
}

textarea {
  flex: 1;
  padding: 10px;
  border: 1px solid #d5d5d5;
  border-radius: 15px;
  resize: none;
  font-size: 14px;
  background-color: #ffffff;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  outline: none;
  height: 20px;
}

textarea:focus {
  border-color: #0084ff;
  box-shadow: inset 0 1px 4px rgba(0, 132, 255, 0.2);
}
</style>
