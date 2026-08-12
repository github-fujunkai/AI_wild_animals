import {
  AlertOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  PictureOutlined,
  ReloadOutlined,
  RobotOutlined,
  SendOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Badge, Button, Collapse, Empty, Input, Spin, Table, Tag, Tooltip } from 'antd'
import type { CollapseProps } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { agentApi } from '@/services/api'
import type { AgentDataSource, AgentRecognitionEngine, AgentReply, AgentReplyBlock, AgentSession, AgentToolCall, AgentWorkOrder } from '@/services/api'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content?: string
  image?: string
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
          '您好！我是生态监测 AI Agent（受控智能体）🤖\n\n我基于 LLM + RAG 检索增强，并具备受控的工具调用能力，可以自主规划并调用以下只读工具完成分析：\n\n• � 查询监测数据 — 检索近7天抓拍、识别与设备运行数据\n• � 查询告警 — 获取告警事件、级别与分布\n• � 查询点位信息 — 获取各监测点位与区域信息\n\n🧠 我每步都会展示思考过程与工具调用日志，全程透明可溯源。\n\n� 受控边界：我仅执行只读查询，不会修改任何业务数据，也不会自动创建工单；涉及巡护处置时我会给出建议，由您确认后执行。\n\n请描述您的问题，例如「分析最近一周的告警情况」。',
      },
      {
        type: 'stats',
        items: [
          { label: '接入数据源', value: 5 },
          { label: '可用工具', value: 3 },
          { label: '监测记录', value: 1280 },
          { label: '物种知识', value: 156 },
        ],
      },
    ],
    references: [{ source: '系统初始化', snippet: '受控 Agent 已就绪，工具与 RAG 知识库已加载' }],
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
        <p style="color:#999;font-size:12px;text-align:center;">由生态监测 AI 助手（LLM+RAG）自动生成 · ${new Date().toLocaleString('zh-CN')}</p>
        <p style="color:#b45309;font-size:12px;text-align:center;margin-top:8px;">💡 本报告由 AI 基于监测数据自动生成，仅供业务参考；正式上报前请核对原始监测数据。</p>
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
        <div className="mx-2 mt-2 rounded-md border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-[11px] leading-relaxed text-amber-200/80">
          💡 本报告由 AI 基于监测数据自动生成，仅供业务参考；正式上报请以原始监测数据为准。
        </div>
      </div>
    </div>
  )
}

// ─── 受控 Agent：思考过程与工具调用日志 ─────────────────────────────────────

const TOOL_ICONS: Record<AgentToolCall['tool'], ReactNode> = {
  query_monitor_data: <DatabaseOutlined />,
  query_alerts: <AlertOutlined />,
  query_sites: <EnvironmentOutlined />,
}

function ToolCallRow({ call }: { call: AgentToolCall }) {
  const [status, setStatus] = useState<'running' | 'success'>('running')
  useEffect(() => {
    const t = setTimeout(() => setStatus('success'), 400)
    return () => clearTimeout(t)
  }, [call.id])

  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-indigo-300">{TOOL_ICONS[call.tool]}</span>
        <span className="text-[11px] font-medium text-slate-200">{call.name}</span>
        <code className="truncate text-[10px] text-slate-500">{call.params}</code>
        <span className="ml-auto shrink-0">
          {status === 'running' ? (
            <span className="flex items-center gap-1 text-[10px] text-amber-300">
              <Spin size="small" /> 执行中
            </span>
          ) : (
            <span className="text-[10px] text-emerald-300">✓ 完成</span>
          )}
        </span>
      </div>
      {status === 'success' && (
        <div className="mt-1 border-t border-white/[0.04] pt-1 text-[11px] leading-relaxed text-slate-400">
          <span className="text-slate-500">↳ 返回：</span>
          {call.result}
        </div>
      )}
    </div>
  )
}

function AgentPanel({ agent }: { agent: NonNullable<AgentReply['agent']> }) {
  const [revealed, setRevealed] = useState(0)
  const done = revealed >= agent.toolCalls.length

  useEffect(() => {
    if (agent.toolCalls.length === 0) return
    const timer = setInterval(() => {
      setRevealed((n) => {
        if (n >= agent.toolCalls.length) {
          clearInterval(timer)
          return n
        }
        return n + 1
      })
    }, 480)
    return () => clearInterval(timer)
  }, [agent])

  return (
    <div className="rounded-lg border border-indigo-500/25 bg-indigo-500/[0.05] px-3 py-2">
      <div className="flex items-center gap-2">
        <RobotOutlined className="text-indigo-300" />
        <span className="text-xs font-semibold text-indigo-200">受控 Agent · 思考与工具调用</span>
        {!done && <Spin size="small" className="ml-auto" />}
        {done && <span className="ml-auto text-[10px] text-emerald-300">工具执行完成</span>}
      </div>

      {/* 思考过程 */}
      <div className="mt-2 space-y-1">
        {agent.reasoning.map((r, i) => (
          <div key={i} className="flex gap-2 text-[11px] leading-relaxed text-slate-400">
            <span className="shrink-0 font-medium text-indigo-300/80">🧠 思考 {i + 1}</span>
            <span>{r}</span>
          </div>
        ))}
      </div>

      {/* 工具调用日志 */}
      <div className="mt-2 space-y-1.5">
        {agent.toolCalls.slice(0, revealed).map((call) => (
          <ToolCallRow key={call.id} call={call} />
        ))}
      </div>

      <div className="mt-2 border-t border-indigo-500/15 pt-1.5 text-[10px] text-slate-500">
        🔒 仅调用只读查询工具，不执行任何写操作；工单创建需人工确认。
      </div>
    </div>
  )
}

// ─── 巡护建议块：AI 只给建议，人工确认后才生成工单 ─────────────────────────

function AdviceBlock({ block }: { block: Extract<AgentReplyBlock, { type: 'advice' }> }) {
  const [confirming, setConfirming] = useState(false)
  const [order, setOrder] = useState<AgentWorkOrder | null>(null)

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      const created = await agentApi.createWorkOrder({
        title: 'AI 巡护建议工单',
        suggestions: block.suggestions,
      })
      setOrder(created)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.05] px-3 py-2">
      <div className="flex items-center gap-2">
        <ToolOutlined className="text-amber-400" />
        <span className="text-xs font-semibold text-amber-200">{block.title}</span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{block.content}</p>
      <ul className="mt-2 space-y-1">
        {block.suggestions.map((s, i) => (
          <li key={i} className="flex gap-2 text-[11px] leading-relaxed text-slate-300">
            <span className="shrink-0 text-amber-400">•</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
      {order ? (
        <div className="mt-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[11px] text-emerald-300">
          ✓ 已生成巡护工单 <b>{order.id}</b>（待处理），请前往
          <Link to="/patrol" className="mx-1 underline decoration-emerald-400/60 underline-offset-2 hover:text-emerald-200">巡护工单</Link>
          模块派发执行。
        </div>
      ) : (
        <Button size="small" type="primary" ghost loading={confirming} className="mt-2" onClick={handleConfirm}>
          <ToolOutlined /> 确认生成巡护工单
        </Button>
      )}
      <div className="mt-1 text-[10px] text-slate-500">由人工确认后执行，AI 不会自动创建工单。</div>
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
          case 'advice':
            return <AdviceBlock key={i} block={block} />
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
          <span className="text-sm text-slate-400">Agent 正在规划并调用工具检索数据...</span>
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
            {message.image && (
              <div className="mt-2">
                <img src={message.image} alt="上传影像" className="max-h-56 rounded-lg border border-white/20" />
                <div className="mt-1 text-[11px] text-emerald-100/80">📷 已上传红外影像，请求 AI 辅助研判</div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl rounded-tl-sm border border-white/[0.06] bg-white/[0.04] px-4 py-3">
            {message.reply?.agent && <AgentPanel agent={message.reply.agent} />}
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
  const [recognitionEngine, setRecognitionEngine] = useState<AgentRecognitionEngine>()
  const [quickQuestions, setQuickQuestions] = useState<string[]>([])
  const [sessions, setSessions] = useState<AgentSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>()
  const [image, setImage] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    agentApi.getDataSources().then(setDataSources)
    agentApi.getRecognitionEngine().then(setRecognitionEngine)
    agentApi.getQuickQuestions().then(setQuickQuestions)
    agentApi.getSessions().then(setSessions)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const handleSend = useCallback(
    async (text?: string, withImage?: string | null) => {
      const content = (text ?? input).trim()
      const imageToSend = withImage !== undefined ? withImage : image
      if ((!content && !imageToSend) || loading) return

      const userMsg: ChatMessage = {
        id: nextMsgId(),
        role: 'user',
        content,
        image: imageToSend ?? undefined,
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
      setImage(null)
      setLoading(true)

      try {
        const reply = await agentApi.sendMessage(content, imageToSend ?? undefined)
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
    [input, image, loading],
  )

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage(String(reader.result))
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleNewChat = () => {
    setMessages([WELCOME_MESSAGE])
    setActiveSessionId(undefined)
    setInput('')
    setImage(null)
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
              <span>受控智能体 · LLM+RAG · 工具调用 · 已接入 6 个数据源</span>
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
            <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-[11px] leading-relaxed text-amber-200/80">
              <span className="mt-0.5 shrink-0">💡</span>
              <span>AI 输出内容仅供业务参考，不执行任何业务写操作；正式上报请核对原始监测数据。</span>
            </div>
            {image && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] p-2">
                <img src={image} alt="待研判影像" className="h-16 w-16 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-200">红外影像待研判</div>
                  <div className="text-[11px] text-slate-500">将联动 AI 识别引擎 + 物种知识库进行辅助研判，结果仅供参考</div>
                </div>
                <Button size="small" type="text" icon={<CloseOutlined />} onClick={() => setImage(null)} aria-label="移除图片" />
              </div>
            )}
            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Tooltip title="上传红外影像，AI 辅助研判">
                <Button
                  icon={<PictureOutlined />}
                  className="!h-auto"
                  aria-label="上传图片"
                  onClick={() => fileInputRef.current?.click()}
                />
              </Tooltip>
              <Input.TextArea
                ref={inputRef as never}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={'输入您的问题，如"近期物种分布情况如何？"，或上传红外影像辅助研判...'}
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
                disabled={!input.trim() && !image}
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

          {/* AI 识别引擎（CV 推理引擎，与 RAG 知识库数据源区分） */}
          {recognitionEngine && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2">
                <PictureOutlined className="text-violet-400" />
                <span className="text-sm font-semibold text-slate-200">AI 识别引擎</span>
              </div>
              <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2">
                <div className="flex items-center gap-2">
                  <Badge status={statusColor[recognitionEngine.status]} />
                  <span className="truncate text-xs font-medium text-slate-200">{recognitionEngine.name}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  <span>模型版本：{recognitionEngine.modelVersion}</span>
                  <span>识别准确率：{recognitionEngine.accuracy}%</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500">{recognitionEngine.desc}</div>
              </div>
            </div>
          )}

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
