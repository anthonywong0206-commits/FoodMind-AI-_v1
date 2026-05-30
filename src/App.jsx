
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Apple, AlertTriangle, CalendarDays, Camera, ChefHat, Coffee, HeartPulse,
  Home, Loader2, Moon, Plus, Refrigerator, RotateCcw, Search, Settings,
  ShoppingBag, Sparkles, SunMedium, Trash2, Utensils, Wand2, History,
  Salad, ClipboardList, ShieldCheck, BookOpen, Soup, Star, Clock, Flame
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts'

const STORAGE = {
  pantry: 'foodmind_catchef_pantry_v6',
  settings: 'foodmind_catchef_settings_v6',
  history: 'foodmind_catchef_history_v6',
  result: 'foodmind_catchef_result_v6',
  weekly: 'foodmind_catchef_weekly_v6'
}

const defaultSettings = {
  dietPrefs: [],
  allergies: [],
  healthGoals: [],
  tastes: [],
  location: '香港',
  useDemo: false
}

const meals = [
  { id: '早餐', icon: Coffee, emoji: '🥐' },
  { id: '午餐', icon: SunMedium, emoji: '🍱' },
  { id: '晚餐', icon: Utensils, emoji: '🍜' },
  { id: '宵夜', icon: Moon, emoji: '🍲' }
]

const moods = ['😄 開心', '😌 放鬆', '😴 好攰', '🤒 唔舒服', '😋 想食好嘢', '💪 健康模式']
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

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function daysLeft(expiry) {
  if (!expiry) return null
  return Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24))
}

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
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
    if (err.name === 'AbortError') throw new Error('AI 貓主廚諗太耐，請稍後再試')
    throw err
  } finally {
    clearTimeout(timer)
  }
}

function mockFoodResult(form, settings) {
  const want = form.craving || '雞肉飯'
  const cook = form.mode === '自己煮'
  return {
    title: cook ? `貓主廚家常${want}` : `${want} 今日精選餐`,
    type: form.mode,
    meal: form.meal,
    reason: [
      `配合你今日「${form.mood}」嘅狀態。`,
      `貼近香港人口味，簡單、飽肚、容易入口。`,
      settings.healthGoals.length ? `已考慮：${settings.healthGoals.join('、')}。` : '營養以均衡、唔太油膩為方向。'
    ],
    ingredients: cook ? [
      { name: want, amount: '1份' },
      { name: '雞蛋', amount: '1隻' },
      { name: '洋蔥', amount: '半個' },
      { name: '菜心 / 生菜', amount: '1碗' }
    ] : [],
    steps: cook ? [
      '先將食材洗淨切好，主食材用少量鹽、黑椒調味。',
      '熱鑊落少量油，先煎香主食材。',
      '加入洋蔥及蔬菜炒熟，最後調味即可。',
      '想健康啲可以半飯、加菜、少汁。'
    ] : [],
    time: cook ? '約 20–25 分鐘' : '約 15–30 分鐘',
    difficulty: cook ? '⭐⭐' : '輕鬆',
    nutrition: { calories: cook ? 520 : 680, protein: 32, fat: cook ? 15 : 22, carbs: cook ? 55 : 78, fiber: cook ? 8 : 5, healthScore: cook ? 88 : 78 },
    tips: cook ? '喵～可以用屋企現有食材變奏，唔使特登買太多。' : '喵～外賣記得少汁、走甜飲，加菜會健康好多。',
    catMessage: '喵！我幫你諗好啦，呢個選擇今日幾啱你～'
  }
}

function CatMascot({ mood = 'happy', small = false }) {
  return (
    <motion.div
      className={cx('cat-mascot', small && 'cat-small')}
      animate={{ y: [0, -8, 0], rotate: [0, 1.5, 0, -1.5, 0] }}
      transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
    >
      <div className="cat-ear left"></div>
      <div className="cat-ear right"></div>
      <div className="chef-hat">☁</div>
      <div className="cat-face">
        <span className="eye">●</span>
        <span className="nose">ᴥ</span>
        <span className="eye">●</span>
      </div>
      <div className="cat-cheeks">⌒  ω  ⌒</div>
      <div className="cat-bow">🍳</div>
    </motion.div>
  )
}

function Button({ children, onClick, className = '', variant = 'primary', disabled = false }) {
  return (
    <button disabled={disabled} onClick={onClick} className={cx('cat-button', variant === 'soft' && 'cat-button-soft', variant === 'ghost' && 'cat-button-ghost', className)}>
      {children}
    </button>
  )
}

function Card({ children, className = '' }) {
  return <div className={cx('cat-card', className)}>{children}</div>
}

function Chip({ active, onClick, children }) {
  return <button onClick={onClick} className={cx('chip', active && 'chip-active')}>{children}</button>
}

function LoadingCat({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="loading-cat-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <CatMascot />
          <motion.h2 animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}>
            AI 貓主廚諗緊食咩…
          </motion.h2>
          <p>正在配搭香港口味、食材、營養同今日心情</p>
          <div className="paw-loading"><span>🐾</span><span>🐾</span><span>🐾</span></div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  const [tab, setTab] = useState('home')
  const [settings, setSettings] = useLocalStorage(STORAGE.settings, defaultSettings)
  const [pantry, setPantry] = useLocalStorage(STORAGE.pantry, [
    { id: crypto.randomUUID(), name: '雞蛋', quantity: '6隻', category: '蛋類', expiry: '', createdAt: todayISO() },
    { id: crypto.randomUUID(), name: '洋蔥', quantity: '2個', category: '蔬菜', expiry: '', createdAt: todayISO() }
  ])
  const [history, setHistory] = useLocalStorage(STORAGE.history, [])
  const [result, setResult] = useLocalStorage(STORAGE.result, null)
  const [weekly, setWeekly] = useLocalStorage(STORAGE.weekly, null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ meal: '午餐', mode: '外賣', mood: '😋 想食好嘢', craving: '' })

  const expiring = pantry.filter(x => {
    const d = daysLeft(x.expiry)
    return d !== null && d >= 0 && d <= 3
  })

  async function generate() {
    setLoading(true)
    setNotice('')
    try {
      let data
      if (settings.useDemo) {
        data = mockFoodResult(form, settings)
      } else {
        data = await postJson('/api/food', { form, settings, pantry }, 30000)
      }
      if (!data.catMessage) data.catMessage = '喵～我幫你諗好啦！'
      setResult(data)
      setHistory([{ id: crypto.randomUUID(), date: new Date().toLocaleString(), ...data }, ...history].slice(0, 30))
      setTab('result')
    } catch (err) {
      setNotice(`AI 生成失敗：${err.message}。請檢查 Vercel 的 OPENAI_API_KEY，或到設定開啟 Demo 模式。`)
    } finally {
      setLoading(false)
    }
  }

  function generateWeeklyPlan() {
    const days = ['星期一','星期二','星期三','星期四','星期五','星期六','星期日']
    const plan = days.map((day, i) => ({
      day,
      breakfast: ['餐蛋治＋熱奶茶少甜','粟米蛋花粥','吞拿魚多士','麥皮＋香蕉'][i % 4],
      lunch: ['兩餸飯：蒸水蛋＋菜心＋半飯','叉燒煎蛋飯走汁','番茄牛肉意粉','日式雞扒便當'][i % 4],
      dinner: ['牛腩米線加菜','蒸魚＋菜＋半碗飯','韓式豆腐鍋','泰式香茅雞飯'][i % 4]
    }))
    setWeekly(plan)
    setTab('settings')
  }

  return (
    <div className="app">
      <LoadingCat show={loading} />
      <main className="phone-shell">
        <header className="topbar">
          <div>
            <p className="kicker">FoodMind Cat Chef AI</p>
            <h1>😺 今日食咩好呀？</h1>
          </div>
          <CatMascot small />
        </header>

        <AnimatePresence mode="wait">
          {tab === 'home' && (
            <motion.section key="home" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="page">
              <Card className="hero-card">
                <div className="speech">
                  <span>喵～你話想食咩，我幫你諗！</span>
                </div>
                <div className="hero-layout">
                  <CatMascot />
                  <div>
                    <h2>AI 貓主廚</h2>
                    <p>用香港人口味、健康偏好同你屋企食材，幫你諗一餐啱心水嘅餐單。</p>
                  </div>
                </div>
                <Button onClick={generate} disabled={loading} className="big-cta">
                  {loading ? <Loader2 className="spin" /> : <Wand2 />} AI 幫我諗食咩
                </Button>
              </Card>

              <Card>
                <h3 className="section-heading">🍽️ 想食邊餐？</h3>
                <div className="meal-grid">
                  {meals.map(({ id, icon: Icon, emoji }) => (
                    <button key={id} onClick={() => setForm({ ...form, meal: id })} className={cx('meal-card', form.meal === id && 'selected')}>
                      <span>{emoji}</span>
                      <Icon size={22} />
                      <b>{id}</b>
                    </button>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="section-heading">🥢 食法</h3>
                <div className="mode-grid">
                  <button onClick={() => setForm({ ...form, mode: '自己煮' })} className={cx('mode-card', form.mode === '自己煮' && 'selected')}>
                    <Home /> <b>自己煮</b><small>貓主廚教你煮</small>
                  </button>
                  <button onClick={() => setForm({ ...form, mode: '外賣' })} className={cx('mode-card', form.mode === '外賣' && 'selected')}>
                    <ShoppingBag /> <b>外賣</b><small>只推薦食咩，不顯示餐廳</small>
                  </button>
                </div>
              </Card>

              <Card>
                <h3 className="section-heading">💛 今日心情</h3>
                <div className="chip-row">
                  {moods.map(m => <Chip key={m} active={form.mood === m} onClick={() => setForm({ ...form, mood: m })}>{m}</Chip>)}
                </div>
              </Card>

              <Card>
                <h3 className="section-heading">🍜 今日想食咩？</h3>
                <input className="cat-input" value={form.craving} onChange={e => setForm({ ...form, craving: e.target.value })} placeholder="例如：牛肉、米線、兩餸飯、雞翼、辣嘢..." />
                <div className="quick-tags">
                  {['港式','米線','兩餸飯','燒味','日式','韓式','健康啲'].map(x => (
                    <button key={x} onClick={() => setForm({ ...form, craving: x })}>{x}</button>
                  ))}
                </div>
                {notice && <p className="notice">{notice}</p>}
                <Button onClick={generate} disabled={loading} className="big-cta">
                  {loading ? <Loader2 className="spin" /> : <Sparkles />} 生成貓主廚餐單
                </Button>
              </Card>

              <Card className="fridge-preview">
                <div>
                  <h3>🐾 我的雪櫃</h3>
                  <p>{pantry.length} 種食材・{expiring.length} 種快到期</p>
                </div>
                <Button variant="soft" onClick={() => setTab('pantry')}>打開雪櫃</Button>
              </Card>
            </motion.section>
          )}

          {tab === 'result' && <ResultPage result={result} setTab={setTab} generate={generate} loading={loading} />}
          {tab === 'pantry' && <PantryPage pantry={pantry} setPantry={setPantry} settings={settings} setNotice={setNotice} setTab={setTab} setResult={setResult} history={history} setHistory={setHistory} />}
          {tab === 'settings' && <SettingsPage settings={settings} setSettings={setSettings} history={history} weekly={weekly} generateWeeklyPlan={generateWeeklyPlan} loading={loading} />}
        </AnimatePresence>
      </main>

      <nav className="bottom-nav">
        {[
          ['home', Home, '首頁'],
          ['pantry', Refrigerator, '雪櫃'],
          ['result', ChefHat, '主廚'],
          ['settings', CalendarDays, '餐單'],
          ['settings', Settings, '我的']
        ].map(([id, Icon, label], idx) => (
          <button key={idx} onClick={() => setTab(id)} className={cx(tab === id && 'active', idx === 2 && 'chef-tab')}>
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

function ResultPage({ result, setTab, generate, loading }) {
  if (!result) {
    return (
      <motion.section key="empty" className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="empty">
          <CatMascot />
          <h2>未有餐單喵～</h2>
          <p>返首頁搵 AI 貓主廚幫你諗食咩。</p>
          <Button onClick={() => setTab('home')}>返首頁</Button>
        </Card>
      </motion.section>
    )
  }

  const chartData = [
    { name: '蛋白質', value: result.nutrition?.protein || 0 },
    { name: '脂肪', value: result.nutrition?.fat || 0 },
    { name: '碳水', value: result.nutrition?.carbs || 0 },
    { name: '纖維', value: result.nutrition?.fiber || 0 }
  ]

  return (
    <motion.section key="result" className="page" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
      <Card className="result-hero">
        <CatMascot />
        <div className="bubble">{result.catMessage || '喵～我幫你諗好啦！'}</div>
        <p className="badge">{result.meal}・{result.type}</p>
        <h2>🍜 {result.title}</h2>
        <div className="info-row">
          <span><Clock size={15} /> {result.time}</span>
          <span><Star size={15} /> {result.difficulty}</span>
          <span><Flame size={15} /> {result.nutrition?.calories || '-'} kcal</span>
        </div>
      </Card>

      <Card>
        <h3 className="section-heading">📝 推薦原因</h3>
        <div className="reason-list">
          {(result.reason || []).map((r, i) => <p key={i}>🐾 {r}</p>)}
        </div>
      </Card>

      {result.type === '自己煮' && (
        <>
          <Card>
            <h3 className="section-heading">🥬 食材卡</h3>
            <div className="ingredient-grid">
              {(result.ingredients || []).map((x, i) => <div key={i} className="ingredient"><span>{foodEmoji(x.name)}</span><b>{x.name}</b><small>{x.amount}</small></div>)}
            </div>
          </Card>
          <Card>
            <h3 className="section-heading">👨‍🍳 貓主廚教你煮</h3>
            <div className="steps">
              {(result.steps || []).map((s, i) => <p key={i}><b>Step {i + 1}</b>{s}</p>)}
            </div>
          </Card>
        </>
      )}

      <Card>
        <h3 className="section-heading">🥗 營養分析</h3>
        <div className="health-score">
          <div className="score-ring">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ value: result.nutrition?.healthScore || 75 }]} startAngle={180} endAngle={-180}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={20} />
              </RadialBarChart>
            </ResponsiveContainer>
            <b>{result.nutrition?.healthScore || 75}</b>
          </div>
          <p>健康值 / 100</p>
        </div>
        <div className="nutrition-grid">
          <div><b>{result.nutrition?.protein || '-'}</b><span>蛋白質</span></div>
          <div><b>{result.nutrition?.fat || '-'}</b><span>脂肪</span></div>
          <div><b>{result.nutrition?.carbs || '-'}</b><span>碳水</span></div>
          <div><b>{result.nutrition?.fiber || '-'}</b><span>纖維</span></div>
        </div>
        <div className="chart-mini">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h3 className="section-heading">✨ 貓主廚小貼士</h3>
        <p className="tips">{result.tips}</p>
      </Card>

      <div className="double-actions">
        <Button onClick={generate} disabled={loading}><RotateCcw /> 重新生成</Button>
        <Button variant="soft" onClick={() => setTab('home')}>返首頁</Button>
      </div>
    </motion.section>
  )
}

function PantryPage({ pantry, setPantry, settings, setNotice, setTab, setResult, history, setHistory }) {
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
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        let items
        if (settings.useDemo) {
          items = ['雞蛋', '蕃茄', '洋蔥', '牛肉'].map(name => ({ name, quantity: '1份', category: 'Demo辨識' }))
        } else {
          const data = await postJson('/api/vision', { imageBase64: reader.result }, 30000)
          items = data.items || []
        }
        setPantry([...items.map(x => ({ id: crypto.randomUUID(), name: x.name, quantity: x.quantity || '1份', category: x.category || '其他', expiry: '', createdAt: todayISO() })), ...pantry])
      } catch (err) {
        setNotice(`圖片辨識失敗：${err.message}`)
      }
    }
    reader.readAsDataURL(file)
  }

  function cookFromPantry() {
    const fake = mockFoodResult({ meal: '晚餐', mode: '自己煮', mood: '💪 健康模式', craving: pantry.slice(0, 3).map(x => x.name).join('、') || '家常菜' }, settings)
    setResult(fake)
    setHistory([{ id: crypto.randomUUID(), date: new Date().toLocaleString(), ...fake }, ...history].slice(0, 30))
    setTab('result')
  }

  return (
    <motion.section key="pantry" className="page" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
      <Card className="fridge-hero">
        <CatMascot small />
        <div>
          <h2>🐾 我的雪櫃</h2>
          <p>你放咗咩食材，我就幫你諗可以煮咩喵～</p>
        </div>
      </Card>

      <Card>
        <h3 className="section-heading">{editingId ? '✏️ 修改食材' : '➕ 新增食材'}</h3>
        <input className="cat-input" placeholder="食材名稱，例如雞蛋" value={item.name} onChange={e => setItem({ ...item, name: e.target.value })} />
        <input className="cat-input" placeholder="數量，例如6隻 / 1包" value={item.quantity} onChange={e => setItem({ ...item, quantity: e.target.value })} />
        <input className="cat-input" placeholder="分類，例如肉類 / 蔬菜" value={item.category} onChange={e => setItem({ ...item, category: e.target.value })} />
        <input className="cat-input" type="date" value={item.expiry} onChange={e => setItem({ ...item, expiry: e.target.value })} />
        <Button onClick={saveItem}><Plus /> {editingId ? '儲存修改' : '新增食材'}</Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <Button variant="soft" onClick={() => fileRef.current?.click()}><Camera /> 拍照 / 上載圖片辨識</Button>
        <Button onClick={cookFromPantry}><Sparkles /> 用現有食材諗菜式</Button>
      </Card>

      <div className="search">
        <Search size={20} />
        <input placeholder="搜尋食材" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <div className="pantry-grid">
        {filtered.map(x => {
          const left = daysLeft(x.expiry)
          return (
            <Card className="food-card" key={x.id}>
              <div className="emoji">{foodEmoji(x.name)}</div>
              <h3>{x.name}</h3>
              <p>{x.quantity || '未填數量'}・{x.category || '其他'}</p>
              {x.expiry && <span className={cx('expiry', left !== null && left <= 3 && 'hot')}>{left !== null && left >= 0 ? `還有 ${left} 日到期` : '已過期'}</span>}
              <div className="card-actions">
                <button onClick={() => edit(x)}>修改</button>
                <button onClick={() => setPantry(pantry.filter(p => p.id !== x.id))}>刪除</button>
              </div>
            </Card>
          )
        })}
      </div>
    </motion.section>
  )
}

function SettingsPage({ settings, setSettings, history, weekly, generateWeeklyPlan, loading }) {
  function toggle(group, value) {
    const arr = settings[group] || []
    setSettings({ ...settings, [group]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] })
  }

  return (
    <motion.section key="settings" className="page" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
      <Card className="settings-hero">
        <CatMascot small />
        <div>
          <h2>我的口味設定</h2>
          <p>設定得越清楚，貓主廚越識諗啱你。</p>
        </div>
      </Card>

      <Card>
        <div className="api-box">
          <ShieldCheck />
          <div>
            <h3>後端 API 模式</h3>
            <p>OPENAI_API_KEY 只放 Vercel 後台，前端不會顯示。</p>
          </div>
        </div>
        <label className="toggle-line">
          <input type="checkbox" checked={settings.useDemo} onChange={e => setSettings({ ...settings, useDemo: e.target.checked })} />
          Demo 模式
        </label>
        <h3 className="section-heading">📍 地區</h3>
        <input className="cat-input" value={settings.location} onChange={e => setSettings({ ...settings, location: e.target.value })} />
      </Card>

      <SettingGroup title="🥗 飲食偏好" icon={<Leaf />} options={dietPrefs} selected={settings.dietPrefs} onToggle={v => toggle('dietPrefs', v)} />
      <SettingGroup title="⚠️ 過敏設定" icon={<AlertTriangle />} options={allergies} selected={settings.allergies} onToggle={v => toggle('allergies', v)} />
      <SettingGroup title="❤️ 健康目標" icon={<HeartPulse />} options={healthGoals} selected={settings.healthGoals} onToggle={v => toggle('healthGoals', v)} />
      <SettingGroup title="🍎 個人口味" icon={<Apple />} options={tastes} selected={settings.tastes} onToggle={v => toggle('tastes', v)} />

      <Card>
        <h3 className="section-heading">📅 一週餐單</h3>
        <Button onClick={generateWeeklyPlan} disabled={loading}><Salad /> 生成一星期餐單</Button>
        {weekly && <div className="weekly">
          {weekly.map(d => (
            <div className="weekly-card" key={d.day}>
              <b>{d.day}</b>
              <span>早餐：{d.breakfast}</span>
              <span>午餐：{d.lunch}</span>
              <span>晚餐：{d.dinner}</span>
            </div>
          ))}
        </div>}
      </Card>

      <Card>
        <h3 className="section-heading">📖 Food History</h3>
        <div className="history">
          {history.length ? history.map(h => (
            <div className="history-card" key={h.id}>
              <b>{h.title}</b>
              <span>{h.date}・{h.meal}・{h.type}</span>
            </div>
          )) : <p className="muted">暫時未有紀錄。</p>}
        </div>
      </Card>
    </motion.section>
  )
}

function SettingGroup({ title, options, selected, onToggle }) {
  return (
    <Card>
      <h3 className="section-heading">{title}</h3>
      <div className="chip-row">
        {options.map(x => <Chip key={x} active={selected.includes(x)} onClick={() => onToggle(x)}>{x}</Chip>)}
      </div>
    </Card>
  )
}

function foodEmoji(name = '') {
  if (name.includes('蛋')) return '🥚'
  if (name.includes('牛')) return '🥩'
  if (name.includes('雞')) return '🍗'
  if (name.includes('飯')) return '🍚'
  if (name.includes('麵') || name.includes('米線')) return '🍜'
  if (name.includes('菜') || name.includes('生菜')) return '🥬'
  if (name.includes('蕃') || name.includes('番')) return '🍅'
  if (name.includes('奶')) return '🥛'
  return '🍽️'
}
