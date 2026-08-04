import {
  AlertOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  ReloadOutlined,
  RobotOutlined,
  SendOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Badge, Button, Collapse, Empty, Input, Spin, Table, Tag, Tooltip } from 'antd'
import type { CollapseProps } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { agentApi } from '@/services/api'
import type { AgentDataSource, AgentReply, AgentReplyBlock, AgentSession } from '@/services/api'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content?: string
  reply?: AgentReply
  loading?: boolean
  time: string
}

function nowTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

let msgIdCounter = 0
function nextMsgId() {
  return `msg-${++msgIdCounter}`
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  time: nowTime(),
  reply: {
    blocks: [
      {
        type: 'text',
        content:
          '您好！我是生态监测 AI 助手 🤖\n\n我已接入物种知识库、历史监测数据、环境因子等多源数据（基于 RAG 检索增强生成），可以为您提供：\n\n• 📊 自然语言查询 — 用日常语言提问，即时获取分析结果\n• 📈 生态趋势分析 — 基于历史数据识别变化趋势与异常\n• 📝 监测报告生成 — 自动生成结构化生态监测报告\n\n请在下方输入您的问题，或点击右侧快捷问题开始对话。',
      },
      {
        type: 'stats',
        items: [
          { label: '物种知识库', value: 156 },
          { label: '监测记录', value: 1280 },
          { label: '环境数据', value: 856 },
          { label: '识别模型', value: 'v3.2' },
        ],
      },
    ],
    references: [{ source: '系统初始化', snippet: 'AI Agent 已就绪，RAG 知识库已加载' }],
  },
}

// ─── 富内容 block 渲染 ──────────────────────────────────────────────────────

function TextBlock({ content }: { content: string }) {
  return <div className="whitespace-pre-wrap leading-relaxed text-slate-200">{content}</div>
}

function StatsBlock({ items }: { items: { label: string; value: string | number; trend?: string; trendDir?: 'up' | 'down' }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-center"
        >
          <div className="text-lg font-semibold text-slate-50">{item.value}</div>
          <div className="mt-0.5 text-xs text-slate-400">{item.label}</div>
          {item.trend && (
            <div className={`mt-1 text-[11px] ${item.trendDir === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {item.trendDir === 'up' ? '↑' : '↓'} {item.trend}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function TableBlock({ block }: { block: Extract<AgentReplyBlock, { type: 'table' }> }) {
  const columns = block.columns.map((c) => ({ ...c, key: c.dataIndex }))
  const dataSource = block.rows.map((row, i) => ({ ...row, key: i }))
  return (
    <div>
      {block.title && <div className="mb-2 text-sm font-medium text-slate-300">{block.title}</div>}
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        size="small"
        className="agent-table"
      />
    </div>
  )
}

function ChartBlock({ block }: { block: Extract<AgentReplyBlock, { type: 'chart' }> }) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-slate-300">{block.title}</div>
      <ReactECharts
        option={block.option}
        style={{ height: 280 }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  )
}

function ReportBlock({ block }: { block: Extract<AgentReplyBlock, { type: 'report' }> }) {
  const handleExport = () => {
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    const sectionsHtml = block.sections
      .map((s) => `<h3 style="color:#1a1a2e;margin:16px 0 8px;">${s.heading}</h3><p style="line-height:1.8;color:#333;white-space:pre-wrap;">${s.content}</p>`)
      .join('')
    win.document.write(`
      <html><head><title>${block.title}</title></head>
      <body style="font-family:sans-serif;padding:40px;max-width:760px;margin:0 auto;">
        <h1 style="color:#1a5c3a;border-bottom:2px solid #2dd4a8;padding-bottom:12px;">${block.title}</h1>
        <p style="color:#666;margin-bottom:24px;">报告周期：${block.period}</p>
        ${sectionsHtml}
        <hr style="margin-top:32px;border:none;border-top:1px solid #ddd;" />
        <p style="color:#999;font-size:12px;text-align:center;">由生态监测 AI Agent 自动生成 · ${new Date().toLocaleString('zh-CN')}</p>
      </body></html>
    `)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }

  const collapseItems: CollapseProps['items'] = block.sections.map((s, i) => ({
    key: String(i),
    label: <span className="text-sm font-medium text-slate-200">{s.heading}</span>,
    children: <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{s.content}</p>,
  }))

  return (
    <div className="overflow-hidden rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03]">
      <div className="flex items-center justify-between border-b border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-emerald-400" />
          <div>
            <div className="text-sm font-semibold text-slate-50">{block.title}</div>
            <div className="text-xs text-slate-400">报告周期：{block.period}</div>
          </div>
        </div>
        <Button size="small" type="primary" ghost icon={<FileTextOutlined />} onClick={handleExport}>
          导出报告
        </Button>
      </div>
      <div className="px-2 py-2">
        <Collapse
          items={collapseItems}
          defaultActiveKey={block.sections.map((_, i) => String(i))}
          ghost
          className="agent-report-collapse"
        />
      </div>
    </div>
  )
}

function ReplyBlocks({ blocks }: { blocks: AgentReplyBlock[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'text':
            return <TextBlock key={i} content={block.content} />
          case 'stats':
            return <StatsBlock key={i} items={block.items} />
          case 'table':
            return <TableBlock key={i} block={block} />
          case 'chart':
            return <ChartBlock key={i} block={block} />
          case 'report':
            return <ReportBlock key={i} block={block} />
          default:
            return null
        }
      })}
    </div>
  )
}

function References({ references }: { references?: { source: string; snippet: string }[] }) {
  if (!references || references.length === 0) return null
  return (
    <div className="mt-3 space-y-1 border-t border-white/[0.06] pt-2">
      <div className="text-[11px] font-medium text-slate-500">📚 引用来源（RAG 检索）</div>
      {references.map((ref, i) => (
        <div key={i} className="rounded border-l-2 border-emerald-500/40 bg-white/[0.02] px-2 py-1">
          <span className="text-[11px] font-medium text-emerald-400/80">{ref.source}</span>
          <span className="ml-2 text-[11px] text-slate-400">{ref.snippet}</span>
        </div>
      ))}
    </div>
  )
}

// ─── 消息气泡 ───────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (message.loading) {
    return (
      <div className="flex gap-3">
        <Avatar size={36} icon={<RobotOutlined />} className="!bg-emerald-600/80" />
        <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-white/[0.06] bg-white/[0.04] px-4 py-3">
          <Spin size="small" />
          <span className="text-sm text-slate-400">正在检索知识库并分析...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Avatar
        size={36}
        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
        className={isUser ? '!bg-sky-600/80' : '!bg-emerald-600/80'}
      />
      <div className={`max-w-[calc(100%-52px)] ${isUser ? 'items-end' : 'items-start'}`}>
        {isUser ? (
          <div className="rounded-2xl rounded-tr-sm bg-emerald-600/80 px-4 py-2.5 text-sm leading-relaxed text-white">
            {message.content}
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl rounded-tl-sm border border-white/[0.06] bg-white/[0.04] px-4 py-3">
            {message.reply && <ReplyBlocks blocks={message.reply.blocks} />}
            {message.reply && <References references={message.reply.references} />}
          </div>
        )}
        <div className={`mt-1 text-[11px] text-slate-500 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.time}
        </div>
      </div>
    </div>
  )
}

// ─── 主页面 ─────────────────────────────────────────────────────────────────

export function EcoAgentPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dataSources, setDataSources] = useState<AgentDataSource[]>([])
  const [quickQuestions, setQuickQuestions] = useState<string[]>([])
  const [sessions, setSessions] = useState<AgentSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    agentApi.getDataSources().then(setDataSources)
    agentApi.getQuickQuestions().then(setQuickQuestions)
    agentApi.getSessions().then(setSessions)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const handleSend = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim()
      if (!content || loading) return

      const userMsg: ChatMessage = {
        id: nextMsgId(),
        role: 'user',
        content,
        time: nowTime(),
      }
      const loadingMsg: ChatMessage = {
        id: nextMsgId(),
        role: 'assistant',
        loading: true,
        time: nowTime(),
      }
      setMessages((prev) => [...prev, userMsg, loadingMsg])
      setInput('')
      setLoading(true)

      try {
        const reply = await agentApi.sendMessage(content)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMsg.id
              ? { ...m, loading: false, reply, time: nowTime() }
              : m,
          ),
        )
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingMsg.id
              ? {
                  ...m,
                  loading: false,
                  time: nowTime(),
                  reply: {
                    blocks: [
                      { type: 'text', content: '抱歉，分析过程中出现错误，请稍后重试。' },
                    ],
                  },
                }
              : m,
          ),
        )
      } finally {
        setLoading(false)
        inputRef.current?.focus()
      }
    },
    [input, loading],
  )

  const handleNewChat = () => {
    setMessages([WELCOME_MESSAGE])
    setActiveSessionId(undefined)
    setInput('')
    inputRef.current?.focus()
  }

  const statusColor: Record<string, 'success' | 'processing' | 'error'> = {
    ready: 'success',
    indexing: 'processing',
    error: 'error',
  }
  const statusText: Record<string, string> = {
    ready: '就绪',
    indexing: '索引中',
    error: '异常',
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15">
            <RobotOutlined className="text-xl text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-50">生态监测 AI Agent</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Badge status="success" />
              <span>LLM + RAG · 已接入 6 个数据源</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip title="自然语言查询">
            <Tag icon={<ThunderboltOutlined />} color="green" className="!m-0">智能问答</Tag>
          </Tooltip>
          <Tooltip title="趋势分析">
            <Tag icon={<BarChartOutlined />} color="blue" className="!m-0">趋势分析</Tag>
          </Tooltip>
          <Tooltip title="报告生成">
            <Tag icon={<FileTextOutlined />} color="purple" className="!m-0">报告生成</Tag>
          </Tooltip>
          <Button size="small" icon={<ReloadOutlined />} onClick={handleNewChat}>
            新建对话
          </Button>
        </div>
      </div>

      {/* 主体 */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* 对话区 */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
          {/* 消息列表 */}
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区 */}
          <div className="border-t border-white/[0.06] p-4">
            {quickQuestions.length > 0 && messages.length <= 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {quickQuestions.slice(0, 4).map((q, i) => (
                  <Button
                    key={i}
                    size="small"
                    className="!border-emerald-500/30 !bg-emerald-500/10 !text-emerald-300 hover:!bg-emerald-500/20"
                    onClick={() => handleSend(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <Input.TextArea
                ref={inputRef as never}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={'输入您的问题，如"近期物种分布情况如何？"...'}
                autoSize={{ minRows: 1, maxRows: 4 }}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                className="!resize-none"
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={loading}
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="!h-auto"
              >
                发送
              </Button>
            </div>
          </div>
        </div>

        {/* 右侧辅助面板 */}
        <div className="hidden w-80 shrink-0 flex-col gap-4 overflow-y-auto lg:flex">
          {/* 数据源状态 */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <DatabaseOutlined className="text-emerald-400" />
              <span className="text-sm font-semibold text-slate-200">RAG 数据源</span>
            </div>
            <div className="space-y-2">
              {dataSources.map((ds, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge status={statusColor[ds.status]} />
                      <span className="truncate text-xs font-medium text-slate-200">{ds.name}</span>
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-slate-500">
                      {ds.count} 条 · {statusText[ds.status]}
                    </div>
                  </div>
                  <Tooltip title={ds.desc}>
                    <span className="ml-2 shrink-0 text-[10px] text-slate-600">{ds.updatedAt.split(' ')[0]}</span>
                  </Tooltip>
                </div>
              ))}
            </div>
          </div>

          {/* 快捷问题 */}
          {quickQuestions.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2">
                <ThunderboltOutlined className="text-amber-400" />
                <span className="text-sm font-semibold text-slate-200">快捷问题</span>
              </div>
              <div className="space-y-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    disabled={loading}
                    className="w-full rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-left text-xs text-slate-300 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300 disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 会话历史 */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <ClockCircleOutlined className="text-sky-400" />
              <span className="text-sm font-semibold text-slate-200">会话历史</span>
            </div>
            {sessions.length === 0 ? (
              <Empty description="暂无历史会话" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSessionId(s.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                      activeSessionId === s.id
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : 'border-white/[0.04] bg-white/[0.02] hover:border-white/[0.1]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs font-medium text-slate-200">{s.title}</span>
                      <span className="ml-2 shrink-0 text-[10px] text-slate-500">{s.time}</span>
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-slate-500">{s.preview}</div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-600">
                      <AlertOutlined />
                      <span>{s.messageCount} 条消息</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
