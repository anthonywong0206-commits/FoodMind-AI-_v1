
import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChefHat, Sparkles, Refrigerator, Settings, Camera, Plus, Trash2, Search,
  Utensils, MapPin, Clock, HeartPulse, Wand2, CalendarDays, Leaf,
  AlertTriangle, Apple, Flame, Star, Loader2, History, Salad, Coffee,
  Moon, SunMedium, ShieldCheck, Home, ShoppingBag, RotateCcw, Bookmark,
  Crown, Soup, ClipboardList
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts'

const STORAGE_KEYS = {
  pantry: 'foodmind_pantry_v4_luxury',
  settings: 'foodmind_settings_v4_luxury',
  history: 'foodmind_history_v4_luxury',
  lastResult: 'foodmind_last_result_v4_luxury',
  weekly: 'foodmind_weekly_v4_luxury'
}

const defaultSettings = {
  dietPrefs: [],
  allergies: [],
  healthGoals: [],
  tastes: [],
  location: '香港',
  useDemo: false
}

const mealOptions = [
  { id: '早餐', icon: Coffee },
  { id: '午餐', icon: SunMedium },
  { id: '晚餐', icon: Utensils },
  { id: '宵夜', icon: Moon }
]

const moodOptions = ['😊 開心', '😌 放鬆', '😴 好攰', '🤒 唔舒服', '😋 好想食好嘢', '🏃 健康模式']
const dietPrefs = ['素食', '純素', '低碳', '高蛋白', '生酮', '地中海飲食', '清真', '無麩質']
const allergies = ['海鮮', '花生', '牛奶', '蛋類', '大豆', '堅果']
const healthGoals = ['減肥', '增肌', '維持體重', '控制血糖', '控制膽固醇', '高蛋白飲食', '低鹽飲食']
const tastes = ['甜', '酸', '辣', '鹹', '清淡', '重口味']

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

async function postJson(url, body, timeoutMs = 30000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'API request failed')
    return data
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('AI 回應逾時，請稍後再試或開啟 Demo 模式')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

function mockFoodResult(form, settings) {
  const want = form.craving || '雞肉飯'
  const isDelivery = form.mode === '外賣'
  const title = isDelivery ? `${want} 主廚精選套餐` : `香煎${want}配時蔬`
  return {
    title,
    type: form.mode,
    meal: form.meal,
    reason: [
      `配合你選擇的「${form.mood}」心情。`,
      `符合「${form.craving || '想食好嘢'}」方向。`,
      settings.healthGoals.length ? `已考慮健康目標：${settings.healthGoals.join('、')}。` : '以均衡、飽肚及容易入口為主。'
    ],
    places: isDelivery
      ? [
          { name: '附近港式茶餐廳', distance: '約 0.3 km', rating: '4.3', price: '$' },
          { name: '米線 / 車仔麵專門店', distance: '約 0.5 km', rating: '4.4', price: '$' },
          { name: '日式便當 / 健康飯盒店', distance: '約 0.8 km', rating: '4.5', price: '$$' }
        ]
      : [],
    ingredients: isDelivery ? [] : [
      { name: want, amount: '1份' },
      { name: '蒜頭', amount: '2瓣' },
      { name: '洋蔥', amount: '半個' },
      { name: '時蔬', amount: '1碗' },
      { name: '黑椒 / 鹽', amount: '少量' }
    ],
    steps: isDelivery ? [] : [
      '將主要食材切好，以少量鹽及黑椒調味。',
      '熱鑊落少量油，先煎香主食材至表面金黃。',
      '加入蒜頭、洋蔥及時蔬拌炒。',
      '最後調味，上碟後靜置一分鐘，口感更好。'
    ],
    time: isDelivery ? '約 25–40 分鐘' : '約 20 分鐘',
    difficulty: isDelivery ? '輕鬆' : '⭐⭐',
    nutrition: {
      calories: isDelivery ? 680 : 520,
      protein: isDelivery ? 36 : 32,
      fat: isDelivery ? 22 : 15,
      carbs: isDelivery ? 76 : 55,
      fiber: isDelivery ? 6 : 9,
      healthScore: isDelivery ? 78 : 88
    },
    tips: isDelivery ? '建議少汁、走凍飲，配一份蔬菜或湯，會更均衡。' : '可加入即將到期食材，減少浪費。'
  }
}

function Card({ children, className = '' }) {
  return <div className={cx('lux-card', className)}>{children}</div>
}

function Button({ children, onClick, className = '', variant = 'gold', disabled = false, type = 'button' }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cx('lux-btn', variant === 'outline' && 'lux-btn-outline', variant === 'dark' && 'lux-btn-dark', className)}
    >
      {children}
    </button>
  )
}

function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={cx('pill', active && 'pill-active')}>{children}</button>
  )
}

function LoadingOverlay({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="loading-orb"
            animate={{ rotate: 360, scale: [1, 1.08, 1] }}
            transition={{ rotate: { repeat: Infinity, duration: 2.8, ease: 'linear' }, scale: { repeat: Infinity, duration: 1.5 } }}
          >
            <ChefHat size={42} />
          </motion.div>
          <motion.h2 initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="loading-title">
            😺 AI貓主廚正在諗香港味
          </motion.h2>
          <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .2 }} className="loading-subtitle">
            正在分析港式口味、食材、營養與附近餐廳…
          </motion.p>
          <div className="gold-dots"><span></span><span></span><span></span></div>
        </motion.div>
      )}
    </AnimatePresence>
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
      if (settings.useDemo) {
        result = mockFoodResult(form, settings)
      } else {
        result = await postJson('/api/food', { form, settings, pantry }, 30000)
      }
      setLastResult(result)
      setHistory([{ id: crypto.randomUUID(), date: new Date().toLocaleString(), ...result }, ...history].slice(0, 20))
      setTab('result')
    } catch (e) {
      setNotice(`AI 生成失敗：${e.message}。請檢查 Vercel 是否已設定 OPENAI_API_KEY，或先到設定開啟 Demo 模式測試。`)
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
    <div className="app-shell">
      <LoadingOverlay show={loading} />
      <div className="app-container">
        <header className="topbar">
          <button className="icon-btn">☰</button>
          <div className="brand">
            <Crown size={20} />
            <div>
              <h1>FoodMind Cat Chef AI</h1>
              <p>😺 AI貓主廚・香港口味餐單</p>
            </div>
          </div>
          <button className="icon-btn">♢</button>
        </header>

        <AnimatePresence mode="wait">
          {tab === 'home' && (
            <motion.main key="home" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="page">
              <section className="hero-menu">
                <div className="hero-glow"></div>
                <p className="eyebrow"><ChefHat size={16} /> Chef’s Choice</p>
                <h2>😺 今日食咩好呀？<br /><span>AI 幫你諗好！</span></h2>
                <p className="hero-text">根據香港人口味、營養需要、現有食材及附近餐廳，為你推薦最啱今日的一餐。</p>
                <Button onClick={handleGenerate} disabled={loading} className="hero-btn">
                  <ChefHat /> AI 幫我諗食咩 <span>›</span>
                </Button>
              </section>

              <Card className="form-card">
                <h3>選擇用餐時段</h3>
                <div className="option-grid">
                  {mealOptions.map(({ id, icon: Icon }) => (
                    <button key={id} onClick={() => setForm({ ...form, meal: id })} className={cx('menu-option', form.meal === id && 'menu-option-active')}>
                      <Icon size={22} />
                      <span>{id}</span>
                    </button>
                  ))}
                </div>

                <h3>飲食方式</h3>
                <div className="mode-grid">
                  {[
                    { id: '自己煮', icon: Home, desc: '食譜與材料' },
                    { id: '外賣', icon: ShoppingBag, desc: '附近餐廳' }
                  ].map(({ id, icon: Icon, desc }) => (
                    <button key={id} onClick={() => setForm({ ...form, mode: id })} className={cx('mode-card', form.mode === id && 'mode-card-active')}>
                      <Icon size={24} />
                      <b>{id}</b>
                      <small>{desc}</small>
                    </button>
                  ))}
                </div>

                <h3>今日心情</h3>
                <div className="pill-row">
                  {moodOptions.map(m => <Pill key={m} active={form.mood === m} onClick={() => setForm({ ...form, mood: m })}>{m}</Pill>)}
                </div>

                <h3>今日想食</h3>
                <input
                  value={form.craving}
                  onChange={e => setForm({ ...form, craving: e.target.value })}
                  placeholder="例如：牛肉、拉麵、飯、辣嘢、日式..."
                  className="lux-input"
                />

                {notice && <p className="notice">{notice}</p>}

                <Button onClick={handleGenerate} disabled={loading} className="wide-cta">
                  {loading ? <Loader2 className="spin" /> : <Wand2 />} 生成我的香港餐單
                </Button>
              </Card>

              <section className="section-title">
                <h3>🐟 今日精選</h3>
                <button>查看全部 ›</button>
              </section>
              <div className="recommend-list">
                {['番茄濃湯焗豬扒飯','麻辣雞翼米線','叉燒煎蛋飯'].map((x, i) => (
                  <Card className="mini-dish" key={x}>
                    <div className="dish-icon">{i + 1}</div>
                    <div>
                      <h4>{x}</h4>
                      <p>{i === 0 ? '港式comfort food・飽肚' : i === 1 ? '惹味・暖胃・可走辣' : '快靚正・返工午餐'}</p>
                      <strong>{4.8 - i * .1} ★★★★★</strong>
                    </div>
                    <button className="heart">♡</button>
                  </Card>
                ))}
              </div>

              <section className="section-title">
                <h3>🍱 貓主廚精選</h3>
                <button>查看地圖 ›</button>
              </section>
              <div className="restaurant-row">
                {['港式茶餐廳','燒味飯店','泰越小店'].map((x, i) => (
                  <Card className="restaurant-card" key={x}>
                    <div className="restaurant-symbol"><Utensils size={20} /></div>
                    <h4>{x}</h4>
                    <p>{i === 0 ? '早餐・碟頭飯・常餐' : i === 1 ? '叉燒・燒鵝・雙拼飯' : '香茅・湯粉・咖喱'}</p>
                    <small>⌖ {0.5 + i * .2} km</small>
                    <strong>⭐ {4.8 + i * .05}</strong>
                  </Card>
                ))}
              </div>

              <Card className="pantry-banner">
                <div>
                  <h3>你的智能食材庫</h3>
                  <p>{pantry.length} 種食材・{expiring.length} 種即將過期</p>
                </div>
                <Button variant="outline" onClick={() => setTab('pantry')}>去看看</Button>
              </Card>
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

      <nav className="bottom-nav">
        {[
          ['home', Home, '首頁'],
          ['pantry', Refrigerator, '食材庫'],
          ['result', ChefHat, 'AI 諮詢'],
          ['settings', CalendarDays, '餐單'],
          ['settings', Settings, '我的']
        ].map(([id, Icon, label], index) => (
          <button key={index} onClick={() => setTab(id)} className={cx(tab === id && 'active-nav', index === 2 && 'main-nav')}>
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

function ResultPage({ result, onBack, onAgain, loading }) {
  if (!result) {
    return (
      <motion.main key="emptyResult" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page">
        <Card className="empty-card">
          <ChefHat size={48} />
          <h2>未有 AI 餐單</h2>
          <p>返首頁輸入想食咩，😺 AI貓主廚就會幫你配餐。</p>
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
    <motion.main key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="page">
      <section className="result-header">
        <button className="back-btn" onClick={onBack}>‹</button>
        <div>
          <ChefHat size={34} />
          <h2>AI 幫我諗食咩</h2>
          <p>為你精心挑選的餐單</p>
        </div>
      </section>

      <Card className="preference-card">
        <h3>你的偏好</h3>
        <p>🍽️ 用餐：{result.meal}　｜　方式：{result.type}</p>
        <p>📍 地區：{result.location || '香港'}</p>
      </Card>

      <div className="tabs">
        <button className="tab-active">推薦結果</button>
        <button>營養分析</button>
      </div>

      <Card className="main-result-card">
        <p className="gold-label">🍜 推薦菜式</p>
        <h1>{result.title}</h1>
        <div className="tag-row">
          <span>{result.difficulty}</span>
          <span>{result.time}</span>
          <span>{result.nutrition?.calories || '-'} kcal</span>
        </div>

        <div className="result-section">
          <h3>📝 推薦原因</h3>
          {(result.reason || []).map((r, i) => <p key={i} className="reason-line">✔ {r}</p>)}
        </div>

        {result.type === '自己煮' && (
          <>
            <div className="result-section">
              <h3>🥬 材料清單</h3>
              <div className="ingredient-grid">
                {(result.ingredients || []).map((x, i) => <span key={i}>{x.name} <small>{x.amount}</small></span>)}
              </div>
            </div>
            <div className="result-section">
              <h3>👨‍🍳 製作步驟</h3>
              {(result.steps || []).map((s, i) => <p key={i} className="step-line"><b>Step {i + 1}</b> {s}</p>)}
            </div>
          </>
        )}

        <div className="result-section">
          <h3>🥗 營養分析</h3>
          <div className="nutrition-grid">
            <div><b>{result.nutrition?.calories || '-'}</b><span>熱量 kcal</span></div>
            <div><b>{result.nutrition?.protein || '-'}</b><span>蛋白質 g</span></div>
            <div><b>{result.nutrition?.fat || '-'}</b><span>脂肪 g</span></div>
            <div><b>{result.nutrition?.carbs || '-'}</b><span>碳水 g</span></div>
            <div><b>{result.nutrition?.fiber || '-'}</b><span>纖維 g</span></div>
          </div>
        </div>

        {result.type === '外賣' && (
          <div className="result-section">
            <h3>📍 附近餐廳</h3>
            <div className="place-list">
              {(result.places || []).map((p, i) => (
                <div key={i} className="place-card">
                  <div>
                    <b>{p.name}</b>
                    <p>{p.distance}・⭐ {p.rating}・{p.price}</p>
                  </div>
                  <MapPin size={20} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="result-section">
          <h3>✨ AI 小貼士</h3>
          <p className="tips">{result.tips}</p>
        </div>
      </Card>

      <Card className="chart-card">
        <h3><HeartPulse size={18} /> 營養圖表</h3>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: '#d8bd7a', fontSize: 11 }} />
              <YAxis tick={{ fill: '#d8bd7a', fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="score">健康評分：{result.nutrition?.healthScore || 75}/100</div>
      </Card>

      <div className="action-row">
        <Button onClick={onAgain} disabled={loading}><RotateCcw /> 重新生成</Button>
        <Button variant="outline"><Bookmark /> 儲存至餐單</Button>
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
        let items = []
        if (settings.useDemo) {
          items = ['雞蛋', '蕃茄', '洋蔥', '牛肉'].map(name => ({ name, quantity: '1份', category: 'Demo辨識' }))
        } else {
          const data = await postJson('/api/vision', { imageBase64: reader.result }, 30000)
          items = data.items || []
        }
        const pantryItems = items.map(x => ({
          id: crypto.randomUUID(),
          name: x.name,
          quantity: x.quantity || '1份',
          category: x.category || '其他',
          expiry: '',
          createdAt: todayISO()
        }))
        setPantry([...pantryItems, ...pantry])
      } catch (err) {
        setNotice(`圖片辨識失敗：${err.message}。如未設定 OPENAI_API_KEY，可先到設定開啟 Demo 模式。`)
      }
    }
    reader.readAsDataURL(file)
  }

  function generateFromPantry() {
    const fake = mockFoodResult({ meal: '晚餐', mode: '自己煮', mood: '🏃 健康模式', craving: pantry.slice(0, 3).map(x => x.name).join('、') || '家常菜' }, settings)
    setLastResult(fake)
    setHistory([{ id: crypto.randomUUID(), date: new Date().toLocaleString(), ...fake }, ...history].slice(0, 20))
    setTab('result')
  }

  return (
    <motion.main key="pantry" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="page">
      <section className="page-title">
        <Refrigerator />
        <div>
          <h2>🐾 我的雪櫃</h2>
          <p>管理現有食材，讓 AI 更懂你今日食咩。</p>
        </div>
      </section>

      <Card className="form-card">
        <h3>{editingId ? '修改食材' : '新增食材'}</h3>
        <input className="lux-input" placeholder="食材名稱，例如雞蛋" value={item.name} onChange={e => setItem({ ...item, name: e.target.value })} />
        <input className="lux-input" placeholder="數量，例如6隻 / 1包" value={item.quantity} onChange={e => setItem({ ...item, quantity: e.target.value })} />
        <input className="lux-input" placeholder="分類，例如肉類 / 蔬菜" value={item.category} onChange={e => setItem({ ...item, category: e.target.value })} />
        <label className="gold-small">到期日</label>
        <input type="date" className="lux-input" value={item.expiry} onChange={e => setItem({ ...item, expiry: e.target.value })} />
        <Button onClick={saveItem}><Plus />{editingId ? '儲存修改' : '新增食材'}</Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <Button variant="outline" onClick={() => fileRef.current?.click()}><Camera />拍照 / 上載圖片由 AI 紀錄</Button>
        <Button onClick={generateFromPantry}><Sparkles />我現有材料可以整咩？</Button>
      </Card>

      <div className="search-box">
        <Search />
        <input placeholder="搜尋食材 / 分類" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <div className="pantry-grid">
        {filtered.map(x => {
          const left = daysLeft(x.expiry)
          return (
            <Card className="pantry-card" key={x.id}>
              <div className="pantry-top">
                <div className="food-emoji">{x.name?.includes('蛋') ? '🥚' : x.name?.includes('洋蔥') ? '🧅' : x.name?.includes('牛') ? '🥩' : x.name?.includes('菜') ? '🥬' : '🍽️'}</div>
                <div>
                  <h3>{x.name}</h3>
                  <p>{x.quantity || '未填數量'}・{x.category || '其他'}</p>
                </div>
              </div>
              <small>建立：{x.createdAt}</small>
              {x.expiry && <div className={cx('expiry', left !== null && left <= 3 && 'expiry-hot')}>{left !== null && left >= 0 ? `還有 ${left} 日到期` : '已過期 / 請檢查'}</div>}
              <div className="card-actions">
                <button onClick={() => edit(x)}>修改</button>
                <button onClick={() => setPantry(pantry.filter(p => p.id !== x.id))}>刪除</button>
              </div>
            </Card>
          )
        })}
      </div>
    </motion.main>
  )
}

function SettingsPage({ settings, setSettings, history, weekly, generateWeeklyPlan, loading }) {
  function toggle(group, value) {
    const arr = settings[group] || []
    setSettings({ ...settings, [group]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] })
  }

  return (
    <motion.main key="settings" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="page">
      <section className="page-title">
        <Settings />
        <div>
          <h2>我的偏好</h2>
          <p>保留所有現有設定與餐單功能。</p>
        </div>
      </section>

      <Card className="form-card">
        <div className="api-note">
          <ShieldCheck />
          <div>
            <h3>後端 API 模式</h3>
            <p>API Key 只放 Vercel Environment Variables：OPENAI_API_KEY。前端不會顯示 Key。</p>
          </div>
        </div>

        <label className="demo-toggle">
          <input type="checkbox" checked={settings.useDemo} onChange={e => setSettings({ ...settings, useDemo: e.target.checked })} />
          Demo 模式（不用後端 API，適合測試畫面）
        </label>

        <h3>地區 / 位置</h3>
        <input className="lux-input" value={settings.location} onChange={e => setSettings({ ...settings, location: e.target.value })} />
      </Card>

      <SettingGroup title="飲食偏好" icon={<Leaf />} options={dietPrefs} selected={settings.dietPrefs} onToggle={v => toggle('dietPrefs', v)} />
      <SettingGroup title="過敏設定" icon={<AlertTriangle />} options={allergies} selected={settings.allergies} onToggle={v => toggle('allergies', v)} />
      <SettingGroup title="健康目標" icon={<HeartPulse />} options={healthGoals} selected={settings.healthGoals} onToggle={v => toggle('healthGoals', v)} />
      <SettingGroup title="個人口味" icon={<Apple />} options={tastes} selected={settings.tastes} onToggle={v => toggle('tastes', v)} />

      <Card className="form-card">
        <h3><CalendarDays size={18} /> Weekly Meal Plan</h3>
        <Button onClick={generateWeeklyPlan} disabled={loading}><Salad /> 生成一星期餐單</Button>
        {weekly && <div className="weekly-list">
          {weekly.map(d => (
            <div key={d.day} className="weekly-card">
              <b>{d.day}</b>
              <span>早餐：{d.breakfast}</span>
              <span>午餐：{d.lunch}</span>
              <span>晚餐：{d.dinner}</span>
            </div>
          ))}
        </div>}
      </Card>

      <Card className="form-card">
        <h3><History size={18} /> Food History</h3>
        <div className="history-list">
          {history.length ? history.map(h => (
            <div key={h.id} className="history-card">
              <b>{h.title}</b>
              <span>{h.date}・{h.meal}・{h.type}</span>
            </div>
          )) : <p className="muted">暫時未有紀錄。</p>}
        </div>
      </Card>
    </motion.main>
  )
}

function SettingGroup({ title, icon, options, selected, onToggle }) {
  return (
    <Card className="setting-card">
      <h3>{React.cloneElement(icon, { size: 18 })}{title}</h3>
      <div className="pill-row">
        {options.map(x => <Pill key={x} active={selected.includes(x)} onClick={() => onToggle(x)}>{x}</Pill>)}
      </div>
    </Card>
  )
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || '網站出現錯誤' }
  }
  componentDidCatch(error) {
    console.error('FoodMind UI error:', error)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell">
          <div className="app-container">
            <Card className="empty-card">
              <h1>FoodMind Cat Chef AI 載入出錯</h1>
              <p>{this.state.message}</p>
              <Button onClick={() => {
                localStorage.removeItem(STORAGE_KEYS.lastResult)
                window.location.reload()
              }}>清除暫存並重新載入</Button>
            </Card>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function SafeApp() {
  return <ErrorBoundary><App /></ErrorBoundary>
}

export default SafeApp
