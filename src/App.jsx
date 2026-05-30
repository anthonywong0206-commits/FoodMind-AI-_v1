
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChefHat, ShoppingBag, Home, Sparkles, Refrigerator, Settings, Camera,
  Plus, Trash2, Search, Utensils, MapPin, Clock, HeartPulse, Wand2,
  CalendarDays, Leaf, AlertTriangle, Apple, Flame, Star, Image as ImageIcon,
  Save, KeyRound, Loader2, History, Salad, Soup, Coffee, Moon, SunMedium
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart,
  RadialBar, PolarAngleAxis
} from 'recharts'

const STORAGE_KEYS = {
  pantry: 'foodmind_pantry_v1',
  settings: 'foodmind_settings_v1',
  history: 'foodmind_history_v1',
  lastResult: 'foodmind_last_result_v1',
  weekly: 'foodmind_weekly_v1'
}

const defaultSettings = {
  apiKey: '',
  imageStyle: '超寫實美食攝影',
  dietPrefs: [],
  allergies: [],
  healthGoals: [],
  tastes: [],
  location: '香港',
  useMock: true
}

const mealOptions = [
  { id: '早餐', icon: Coffee },
  { id: '午餐', icon: SunMedium },
  { id: '晚餐', icon: Utensils },
  { id: '宵夜', icon: Moon }
]

const moodOptions = ['😊 開心', '😌 放鬆', '😴 好攰', '🤒 唔舒服', '😋 好想食好嘢', '🏃 健康模式']
const imageStyles = ['超寫實美食攝影', '水彩插畫', '可愛卡通', '日系手繪', '遊戲美術風', 'Instagram Food Style', '食譜書風格']
const dietPrefs = ['素食', '純素', '低碳', '高蛋白', '生酮', '地中海飲食', '清真', '無麩質']
const allergies = ['海鮮', '花生', '牛奶', '蛋類', '大豆', '堅果']
const healthGoals = ['減肥', '增肌', '維持體重', '控制血糖', '控制膽固醇', '高蛋白飲食', '低鹽飲食']
const tastes = ['甜', '酸', '辣', '鹹', '清淡', '重口味']

const demoImages = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80'
]

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : initialValue
    } catch {
      return initialValue
    }
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  return [value, setValue]
}

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function daysLeft(expiry) {
  if (!expiry) return null
  const now = new Date()
  const exp = new Date(expiry)
  return Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
}

async function callOpenAI({ apiKey, messages, temperature = 0.8 }) {
  if (!apiKey) throw new Error('未設定 OpenAI API Key')
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature,
      messages,
      response_format: { type: 'json_object' }
    })
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'OpenAI API 連線失敗')
  }
  const data = await res.json()
  return JSON.parse(data.choices?.[0]?.message?.content || '{}')
}

async function callVision({ apiKey, imageBase64 }) {
  if (!apiKey) throw new Error('未設定 OpenAI API Key')
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: '你是食材辨識助手。請辨識圖片內可見食材，輸出 JSON：{"items":[{"name":"食材名","category":"分類","quantity":"估算數量"}]}。只輸出 JSON。'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: '請辨識圖片中的食材。' },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }
      ]
    })
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return JSON.parse(data.choices?.[0]?.message?.content || '{}')
}

async function generateImage({ apiKey, prompt }) {
  if (!apiKey) throw new Error('未設定 OpenAI API Key')
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024'
    })
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  const b64 = data.data?.[0]?.b64_json
  return b64 ? `data:image/png;base64,${b64}` : ''
}

function mockFoodResult(form, settings, pantry) {
  const want = form.craving || '雞肉飯'
  const isDelivery = form.mode === '外賣'
  const title = isDelivery
    ? `${want} 招牌精選餐`
    : `蒜香${want}健康家常版`
  const calories = isDelivery ? 780 : 520
  return {
    title,
    type: form.mode,
    meal: form.meal,
    imagePrompt: `${settings.imageStyle}，${title}，高級美食攝影，柔和自然光，乾淨餐桌背景，令人有食慾`,
    imageUrl: demoImages[Math.floor(Math.random() * demoImages.length)],
    reason: [
      `配合你選擇的「${form.mood}」心情。`,
      `符合「${form.craving || '想食好嘢'}」方向。`,
      settings.healthGoals.length ? `已考慮健康目標：${settings.healthGoals.join('、')}。` : '以均衡、飽肚及容易入口為主。'
    ],
    places: isDelivery
      ? [
          { name: '附近茶餐廳 / 快餐店', distance: '約 300m', rating: '4.3', price: '$45–75' },
          { name: '日式便當店', distance: '約 650m', rating: '4.5', price: '$58–98' },
          { name: '健康飯盒店', distance: '約 900m', rating: '4.2', price: '$55–88' }
        ]
      : [],
    ingredients: isDelivery ? [] : [
      { name: want, amount: '1份' },
      { name: '蒜頭', amount: '2瓣' },
      { name: '洋蔥', amount: '半個' },
      { name: '蔬菜', amount: '1碗' },
      { name: '黑椒 / 鹽', amount: '少量' }
    ],
    steps: isDelivery ? [] : [
      '先將主要食材切好，用少量鹽及黑椒調味。',
      '熱鑊落少量油，爆香蒜頭及洋蔥。',
      '加入主要食材煎香或炒熟，再加入蔬菜。',
      '最後調味，上碟後可加少量芝麻或香草提升香氣。'
    ],
    time: isDelivery ? '約 25–40 分鐘送達' : '約 20 分鐘',
    difficulty: isDelivery ? '簡單' : '⭐⭐',
    nutrition: {
      calories,
      protein: isDelivery ? 38 : 32,
      fat: isDelivery ? 28 : 15,
      carbs: isDelivery ? 92 : 55,
      fiber: isDelivery ? 6 : 9,
      healthScore: isDelivery ? 72 : 86
    },
    tips: isDelivery
      ? '建議少汁、走凍飲，配一份蔬菜或湯，整體會健康好多。'
      : '如果屋企有即將到期食材，可以優先加入，減少浪費。'
  }
}

function Card({ children, className = '' }) {
  return <div className={cx('rounded-[2rem] border border-white/70 bg-white/80 shadow-soft backdrop-blur-xl', className)}>{children}</div>
}

function Button({ children, onClick, className = '', variant = 'primary', disabled = false, type = 'button' }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'rounded-2xl px-4 py-3 font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'bg-amber-500 text-white shadow-lg shadow-amber-300/40 hover:bg-amber-600',
        variant === 'dark' && 'bg-stone-900 text-white hover:bg-stone-800',
        variant === 'light' && 'bg-white text-stone-800 border border-stone-200 hover:bg-stone-50',
        variant === 'green' && 'bg-emerald-600 text-white hover:bg-emerald-700',
        className
      )}
    >
      {children}
    </button>
  )
}

function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={cx(
      'rounded-full border px-4 py-2 text-sm font-semibold transition',
      active ? 'border-amber-500 bg-amber-100 text-amber-900' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
    )}>{children}</button>
  )
}

function App() {
  const [tab, setTab] = useState('home')
  const [settings, setSettings] = useLocalStorage(STORAGE_KEYS.settings, defaultSettings)
  const [pantry, setPantry] = useLocalStorage(STORAGE_KEYS.pantry, [
    { id: crypto.randomUUID(), name: '雞蛋', quantity: '6隻', category: '蛋類', expiry: '', createdAt: todayISO() },
    { id: crypto.randomUUID(), name: '洋蔥', quantity: '2個', category: '蔬菜', expiry: '', createdAt: todayISO() }
  ])
  const [history, setHistory] = useLocalStorage(STORAGE_KEYS.history, [])
  const [lastResult, setLastResult] = useLocalStorage(STORAGE_KEYS.lastResult, null)
  const [weekly, setWeekly] = useLocalStorage(STORAGE_KEYS.weekly, null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({
    meal: '午餐',
    mode: '外賣',
    mood: '😋 好想食好嘢',
    craving: ''
  })

  async function handleGenerate() {
    setLoading(true)
    setNotice('')
    try {
      let result
      if (!settings.useMock && settings.apiKey) {
        const pantryText = pantry.map(x => `${x.name}(${x.quantity || '適量'})`).join('、')
        const payload = await callOpenAI({
          apiKey: settings.apiKey,
          messages: [
            { role: 'system', content: '你是 FoodMind AI，請用繁體中文/香港用語，輸出 JSON。格式：{"title":"","type":"","meal":"","reason":[],"places":[{"name":"","distance":"","rating":"","price":""}],"ingredients":[{"name":"","amount":""}],"steps":[],"time":"","difficulty":"","nutrition":{"calories":0,"protein":0,"fat":0,"carbs":0,"fiber":0,"healthScore":0},"tips":"","imagePrompt":""}' },
            { role: 'user', content: `用戶想食：${form.craving || '未指定'}；用餐：${form.meal}；方式：${form.mode}；心情：${form.mood}；食材庫：${pantryText || '沒有'}；飲食偏好：${settings.dietPrefs.join('、') || '無'}；過敏：${settings.allergies.join('、') || '無'}；健康目標：${settings.healthGoals.join('、') || '無'}；口味：${settings.tastes.join('、') || '無'}。請生成一個食物建議。外賣要有地點建議；自己煮要有食譜。` }
          ]
        })
        result = { ...payload, imageUrl: demoImages[Math.floor(Math.random() * demoImages.length)] }
        if (settings.apiKey) {
          try {
            const imageUrl = await generateImage({ apiKey: settings.apiKey, prompt: payload.imagePrompt || payload.title })
            if (imageUrl) result.imageUrl = imageUrl
          } catch {
            result.imageUrl = demoImages[Math.floor(Math.random() * demoImages.length)]
          }
        }
      } else {
        result = mockFoodResult(form, settings, pantry)
      }
      setLastResult(result)
      setHistory([{ id: crypto.randomUUID(), date: new Date().toLocaleString(), ...result }, ...history].slice(0, 30))
      setTab('result')
    } catch (e) {
      setNotice(`AI 生成失敗：${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function generateWeeklyPlan() {
    setLoading(true)
    try {
      const days = ['星期一','星期二','星期三','星期四','星期五','星期六','星期日']
      const plan = days.map((d, i) => ({
        day: d,
        breakfast: ['燕麥乳酪杯','雞蛋多士','香蕉花生醬多士','粟米蛋花粥'][i % 4],
        lunch: ['雞扒糙米飯','番茄牛肉意粉','日式三文魚飯','蔬菜雞肉湯麵'][i % 4],
        dinner: ['蒜香蝦仁炒菜','豆腐肉碎飯','清蒸魚配菜','牛肉蔬菜鍋'][i % 4]
      }))
      setWeekly(plan)
      setTab('settings')
    } finally {
      setLoading(false)
    }
  }

  const expiring = pantry.filter(x => {
    const d = daysLeft(x.expiry)
    return d !== null && d <= 3 && d >= 0
  })

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed,transparent_35%),linear-gradient(135deg,#fffaf0,#eef7ee_55%,#f7ede2)] text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-28 pt-5 md:px-8">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-3xl bg-amber-500 text-white shadow-lg shadow-amber-300/50">
              <ChefHat />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">FoodMind AI</h1>
              <p className="text-sm text-stone-500">今日食咩？交俾 AI 幫你決定。</p>
            </div>
          </div>
          <div className="hidden rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-emerald-700 shadow-soft md:block">
            AI 食物決策助手
          </div>
        </header>

        <AnimatePresence mode="wait">
          {tab === 'home' && (
            <motion.main key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
              <Card className="overflow-hidden">
                <div className="relative p-6 md:p-8">
                  <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-amber-200/60 blur-3xl" />
                  <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
                    <Sparkles size={16} /> Food Planner
                  </p>
                  <h2 className="mb-2 text-4xl font-black tracking-tight md:text-5xl">你諗緊想食咩？</h2>
                  <p className="mb-7 text-stone-500">輸入少少想法，AI 即刻幫你揀外賣或煮食方案。</p>

                  <div className="space-y-6">
                    <section>
                      <label className="mb-3 block text-sm font-black">用餐時段</label>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {mealOptions.map(({ id, icon: Icon }) => (
                          <button key={id} onClick={() => setForm({ ...form, meal: id })} className={cx(
                            'rounded-3xl border p-4 text-left transition',
                            form.meal === id ? 'border-amber-500 bg-amber-100 shadow-soft' : 'border-stone-200 bg-white hover:bg-stone-50'
                          )}>
                            <Icon className="mb-3 text-amber-600" />
                            <div className="font-black">{id}</div>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section>
                      <label className="mb-3 block text-sm font-black">飲食方式</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: '自己煮', icon: Home, desc: '生成食譜與材料步驟' },
                          { id: '外賣', icon: ShoppingBag, desc: '生成菜式與附近建議' }
                        ].map(({ id, icon: Icon, desc }) => (
                          <button key={id} onClick={() => setForm({ ...form, mode: id })} className={cx(
                            'rounded-3xl border p-4 text-left transition',
                            form.mode === id ? 'border-emerald-500 bg-emerald-50 shadow-soft' : 'border-stone-200 bg-white hover:bg-stone-50'
                          )}>
                            <Icon className="mb-3 text-emerald-700" />
                            <div className="font-black">{id}</div>
                            <div className="text-sm text-stone-500">{desc}</div>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section>
                      <label className="mb-3 block text-sm font-black">今日心情</label>
                      <div className="flex flex-wrap gap-2">
                        {moodOptions.map(m => <Pill key={m} active={form.mood === m} onClick={() => setForm({ ...form, mood: m })}>{m}</Pill>)}
                      </div>
                    </section>

                    <section>
                      <label className="mb-3 block text-sm font-black">想食類型</label>
                      <input
                        value={form.craving}
                        onChange={e => setForm({ ...form, craving: e.target.value })}
                        placeholder="例如：牛肉、雞翼、拉麵、飯、甜品、辣嘢、日式..."
                        className="w-full rounded-3xl border border-stone-200 bg-white px-5 py-4 text-lg outline-none focus:border-amber-500"
                      />
                    </section>

                    {notice && <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{notice}</p>}

                    <Button onClick={handleGenerate} disabled={loading} className="flex w-full items-center justify-center gap-2 py-4 text-lg">
                      {loading ? <Loader2 className="animate-spin" /> : <Wand2 />} AI 幫我揀
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="space-y-5">
                <Card className="overflow-hidden">
                  <img className="h-56 w-full object-cover" src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80" alt="food" />
                  <div className="p-5">
                    <h3 className="mb-2 text-xl font-black">打開就想揀嘢食</h3>
                    <p className="text-sm text-stone-500">整合心情、食材、偏好、健康目標，幫你減少每日「食咩好」嘅選擇困難。</p>
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="mb-3 flex items-center gap-2 font-black"><Refrigerator className="text-emerald-700" /> Smart Fridge</div>
                  {expiring.length ? (
                    <div className="space-y-2">
                      {expiring.map(item => <div key={item.id} className="rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{item.name} 還有 {daysLeft(item.expiry)} 日到期</div>)}
                    </div>
                  ) : <p className="text-sm text-stone-500">暫時未有即將到期食材。</p>}
                </Card>
              </div>
            </motion.main>
          )}

          {tab === 'result' && (
            <ResultPage result={lastResult} onBack={() => setTab('home')} onAgain={handleGenerate} loading={loading} />
          )}

          {tab === 'pantry' && (
            <PantryPage
              pantry={pantry}
              setPantry={setPantry}
              settings={settings}
              setNotice={setNotice}
              setTab={setTab}
              setLastResult={setLastResult}
              setHistory={setHistory}
              history={history}
            />
          )}

          {tab === 'settings' && (
            <SettingsPage
              settings={settings}
              setSettings={setSettings}
              history={history}
              weekly={weekly}
              generateWeeklyPlan={generateWeeklyPlan}
              loading={loading}
            />
          )}
        </AnimatePresence>
      </div>

      <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-[2rem] border border-white/70 bg-white/90 p-2 shadow-2xl backdrop-blur">
        <div className="grid grid-cols-4 gap-1">
          {[
            ['home', Home, '首頁'],
            ['result', Sparkles, '建議'],
            ['pantry', Refrigerator, '食材庫'],
            ['settings', Settings, '設定']
          ].map(([id, Icon, label]) => (
            <button key={id} onClick={() => setTab(id)} className={cx(
              'rounded-3xl px-2 py-3 text-xs font-black transition',
              tab === id ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100'
            )}>
              <Icon className="mx-auto mb-1" size={20} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

function ResultPage({ result, onBack, onAgain, loading }) {
  if (!result) {
    return (
      <motion.main key="emptyResult" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="p-8 text-center">
          <Sparkles className="mx-auto mb-3 text-amber-500" size={44} />
          <h2 className="text-2xl font-black">未有 AI 食物建議</h2>
          <p className="mb-5 text-stone-500">返首頁輸入想食咩，AI 就會幫你生成。</p>
          <Button onClick={onBack}>返首頁</Button>
        </Card>
      </motion.main>
    )
  }

  const chartData = [
    { name: '蛋白質', value: result.nutrition?.protein || 0 },
    { name: '脂肪', value: result.nutrition?.fat || 0 },
    { name: '碳水', value: result.nutrition?.carbs || 0 },
    { name: '纖維', value: result.nutrition?.fiber || 0 }
  ]

  return (
    <motion.main key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
      <Card className="overflow-hidden">
        <img src={result.imageUrl || demoImages[0]} alt={result.title} className="h-72 w-full object-cover md:h-96" />
        <div className="p-6">
          <p className="mb-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800">{result.meal}・{result.type}</p>
          <h2 className="mb-3 text-4xl font-black tracking-tight">{result.title}</h2>
          <div className="mb-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-bold"><Clock size={14} className="mr-1 inline" />{result.time}</span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-bold"><Flame size={14} className="mr-1 inline" />{result.nutrition?.calories || '-'} kcal</span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-bold"><Star size={14} className="mr-1 inline" />{result.difficulty}</span>
          </div>

          <h3 className="mb-2 text-lg font-black">推薦原因</h3>
          <div className="mb-6 grid gap-2">
            {(result.reason || []).map((r, i) => <div key={i} className="rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-900">✔ {r}</div>)}
          </div>

          {result.type === '外賣' ? (
            <>
              <h3 className="mb-2 text-lg font-black">推薦地點</h3>
              <div className="grid gap-3">
                {(result.places || []).map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-3xl border border-stone-200 bg-white p-4">
                    <div>
                      <div className="font-black"><MapPin className="mr-1 inline text-emerald-700" size={17} />{p.name}</div>
                      <div className="text-sm text-stone-500">{p.distance}・⭐ {p.rating}・{p.price}</div>
                    </div>
                    <Button variant="light" className="px-3 py-2">查看</Button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3 className="mb-2 text-lg font-black">材料清單</h3>
              <div className="mb-5 grid grid-cols-2 gap-2">
                {(result.ingredients || []).map((x, i) => <div key={i} className="rounded-2xl bg-white p-3 text-sm font-bold shadow-soft">{x.name} <span className="text-stone-400">{x.amount}</span></div>)}
              </div>
              <h3 className="mb-2 text-lg font-black">製作步驟</h3>
              <ol className="space-y-3">
                {(result.steps || []).map((s, i) => <li key={i} className="rounded-2xl bg-white p-4 text-sm shadow-soft"><b>Step {i + 1}</b>　{s}</li>)}
              </ol>
            </>
          )}

          <div className="mt-6 rounded-3xl bg-emerald-50 p-4">
            <h3 className="mb-1 font-black text-emerald-900">AI 小貼士</h3>
            <p className="text-sm text-emerald-800">{result.tips}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-black"><HeartPulse className="text-red-500" /> AI 營養分析</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-xl font-black">健康評分</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: 'score', value: result.nutrition?.healthScore || 75 }]} startAngle={180} endAngle={0}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar dataKey="value" cornerRadius={20} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-4xl font-black">{result.nutrition?.healthScore || 75}/100</div>
        </Card>

        <Button onClick={onAgain} disabled={loading} className="flex w-full items-center justify-center gap-2">
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} 再生成一次
        </Button>
      </div>
    </motion.main>
  )
}

function PantryPage({ pantry, setPantry, settings, setNotice, setTab, setLastResult, setHistory, history }) {
  const [item, setItem] = useState({ name: '', quantity: '', category: '其他', expiry: '' })
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState(null)
  const fileRef = useRef(null)

  const filtered = pantry.filter(x => x.name.toLowerCase().includes(query.toLowerCase()) || x.category.toLowerCase().includes(query.toLowerCase()))

  function saveItem() {
    if (!item.name.trim()) return
    if (editingId) {
      setPantry(pantry.map(x => x.id === editingId ? { ...x, ...item } : x))
      setEditingId(null)
    } else {
      setPantry([{ id: crypto.randomUUID(), ...item, createdAt: todayISO() }, ...pantry])
    }
    setItem({ name: '', quantity: '', category: '其他', expiry: '' })
  }

  function edit(x) {
    setEditingId(x.id)
    setItem({ name: x.name, quantity: x.quantity || '', category: x.category || '其他', expiry: x.expiry || '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        if (!settings.useMock && settings.apiKey) {
          const data = await callVision({ apiKey: settings.apiKey, imageBase64: reader.result })
          const items = (data.items || []).map(x => ({
            id: crypto.randomUUID(),
            name: x.name,
            quantity: x.quantity || '1份',
            category: x.category || '其他',
            expiry: '',
            createdAt: todayISO()
          }))
          setPantry([...items, ...pantry])
        } else {
          const demo = ['雞蛋', '蕃茄', '洋蔥', '牛肉'].map(name => ({
            id: crypto.randomUUID(), name, quantity: '1份', category: 'AI辨識', expiry: '', createdAt: todayISO()
          }))
          setPantry([...demo, ...pantry])
        }
      } catch (err) {
        setNotice(`圖片辨識失敗：${err.message}`)
      }
    }
    reader.readAsDataURL(file)
  }

  function generateFromPantry() {
    const fake = mockFoodResult({ meal: '晚餐', mode: '自己煮', mood: '🏃 健康模式', craving: pantry.slice(0, 3).map(x => x.name).join('、') || '家常菜' }, settings, pantry)
    setLastResult(fake)
    setHistory([{ id: crypto.randomUUID(), date: new Date().toLocaleString(), ...fake }, ...history].slice(0, 30))
    setTab('result')
  }

  return (
    <motion.main key="pantry" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <Card className="p-6">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
          <Refrigerator size={16} /> Pantry Manager
        </p>
        <h2 className="mb-5 text-3xl font-black">食材庫</h2>
        <div className="space-y-3">
          <input className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="食材名稱，例如雞蛋" value={item.name} onChange={e => setItem({ ...item, name: e.target.value })} />
          <input className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="數量，例如6隻 / 1包" value={item.quantity} onChange={e => setItem({ ...item, quantity: e.target.value })} />
          <input className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="分類，例如肉類 / 蔬菜" value={item.category} onChange={e => setItem({ ...item, category: e.target.value })} />
          <label className="block text-sm font-black text-stone-500">到期日</label>
          <input type="date" className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-emerald-500" value={item.expiry} onChange={e => setItem({ ...item, expiry: e.target.value })} />
          <Button onClick={saveItem} className="flex w-full items-center justify-center gap-2" variant="green"><Plus />{editingId ? '儲存修改' : '新增食材'}</Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <Button onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-2" variant="light"><Camera />拍照 / 上載圖片由 AI 紀錄</Button>
          <Button onClick={generateFromPantry} className="flex w-full items-center justify-center gap-2"><Sparkles />我現有材料可以整咩？</Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3">
          <Search className="text-stone-400" />
          <input className="w-full bg-transparent outline-none" placeholder="搜尋食材 / 分類" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map(x => {
            const left = daysLeft(x.expiry)
            return (
              <div key={x.id} className="rounded-3xl border border-stone-200 bg-white p-4 shadow-soft">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-black">{x.name}</h3>
                    <p className="text-sm text-stone-500">{x.quantity || '未填數量'}・{x.category || '其他'}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => edit(x)} className="rounded-full bg-stone-100 p-2 text-stone-600">✎</button>
                    <button onClick={() => setPantry(pantry.filter(p => p.id !== x.id))} className="rounded-full bg-red-50 p-2 text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="text-xs font-bold text-stone-400">建立：{x.createdAt}</div>
                {x.expiry && (
                  <div className={cx('mt-2 rounded-2xl p-2 text-xs font-black', left !== null && left <= 3 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-800')}>
                    {left !== null && left >= 0 ? `還有 ${left} 日到期` : '已過期 / 請檢查'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </motion.main>
  )
}

function SettingsPage({ settings, setSettings, history, weekly, generateWeeklyPlan, loading }) {
  function toggle(group, value) {
    const arr = settings[group] || []
    setSettings({ ...settings, [group]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] })
  }

  return (
    <motion.main key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
      <div className="space-y-5">
        <Card className="p-6">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-sm font-bold text-stone-700">
            <Settings size={16} /> Settings
          </p>
          <h2 className="mb-5 text-3xl font-black">個人化設定</h2>

          <label className="mb-2 flex items-center gap-2 text-sm font-black"><KeyRound size={16} /> OpenAI API Key</label>
          <input type="password" className="mb-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" placeholder="sk-..." value={settings.apiKey} onChange={e => setSettings({ ...settings, apiKey: e.target.value })} />
          <label className="mb-5 flex items-center gap-2 text-sm font-bold text-stone-500">
            <input type="checkbox" checked={settings.useMock} onChange={e => setSettings({ ...settings, useMock: e.target.checked })} />
            使用 Demo 模式（不用 API Key，適合部署測試）
          </label>

          <label className="mb-2 block text-sm font-black">地區 / 位置</label>
          <input className="mb-5 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" value={settings.location} onChange={e => setSettings({ ...settings, location: e.target.value })} />

          <label className="mb-2 flex items-center gap-2 text-sm font-black"><ImageIcon size={16} /> AI 圖片風格</label>
          <select className="w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-amber-500" value={settings.imageStyle} onChange={e => setSettings({ ...settings, imageStyle: e.target.value })}>
            {imageStyles.map(x => <option key={x}>{x}</option>)}
          </select>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-black"><History className="text-amber-600" /> Food History</h3>
          <div className="max-h-80 space-y-2 overflow-auto pr-1">
            {history.length ? history.map(h => (
              <div key={h.id} className="rounded-2xl bg-white p-3 shadow-soft">
                <div className="font-black">{h.title}</div>
                <div className="text-xs text-stone-500">{h.date}・{h.meal}・{h.type}</div>
              </div>
            )) : <p className="text-sm text-stone-500">暫時未有紀錄。</p>}
          </div>
        </Card>
      </div>

      <div className="space-y-5">
        <SettingGroup title="飲食偏好" icon={<Leaf />} options={dietPrefs} selected={settings.dietPrefs} onToggle={v => toggle('dietPrefs', v)} />
        <SettingGroup title="過敏設定" icon={<AlertTriangle />} options={allergies} selected={settings.allergies} onToggle={v => toggle('allergies', v)} />
        <SettingGroup title="健康目標" icon={<HeartPulse />} options={healthGoals} selected={settings.healthGoals} onToggle={v => toggle('healthGoals', v)} />
        <SettingGroup title="個人口味" icon={<Apple />} options={tastes} selected={settings.tastes} onToggle={v => toggle('tastes', v)} />

        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-black"><CalendarDays className="text-emerald-700" /> Weekly Meal Plan</h3>
          <Button onClick={generateWeeklyPlan} disabled={loading} variant="green" className="mb-4 flex w-full items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <Salad />} 生成一星期餐單
          </Button>
          {weekly && (
            <div className="grid gap-3">
              {weekly.map(d => (
                <div key={d.day} className="rounded-3xl bg-white p-4 shadow-soft">
                  <div className="mb-2 font-black">{d.day}</div>
                  <div className="grid gap-1 text-sm text-stone-600">
                    <span>早餐：{d.breakfast}</span>
                    <span>午餐：{d.lunch}</span>
                    <span>晚餐：{d.dinner}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="mb-2 text-xl font-black">FoodMind AI Pro 未來版本</h3>
          <div className="grid gap-2 text-sm font-bold text-stone-600 md:grid-cols-2">
            {['ChatGPT 語音助手','AI 營養師','AI 減肥教練','AI 買餸助手','超市價格比較','自動生成購物清單','Apple Health 同步','Google Fit 同步'].map(x => <div key={x} className="rounded-2xl bg-stone-50 p-3">✨ {x}</div>)}
          </div>
        </Card>
      </div>
    </motion.main>
  )
}

function SettingGroup({ title, icon, options, selected, onToggle }) {
  return (
    <Card className="p-5">
      <h3 className="mb-3 flex items-center gap-2 text-lg font-black">{React.cloneElement(icon, { className: 'text-emerald-700' })}{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map(x => <Pill key={x} active={selected.includes(x)} onClick={() => onToggle(x)}>{x}</Pill>)}
      </div>
    </Card>
  )
}

export default App
