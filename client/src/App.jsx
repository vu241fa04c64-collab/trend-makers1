import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownUp, ArrowLeft, ArrowRight, Bell, CalendarDays, Check, ChevronDown, ChevronLeft,
  ChevronRight, CircleHelp, CloudRain, CloudSun, Heart, Home, LayoutGrid, List, LogOut,
  Menu, Plus, Search, Settings, Shirt, Sparkles, Sun, Thermometer, Trash2, Umbrella,
  UserRound, X, Wind, WandSparkles, Cloud, Pencil, RefreshCw, Camera, LoaderCircle
} from 'lucide-react'
import { api, json } from './api.js'
import './outfit-selection.css'

const categories = ['Tops', 'Bottoms', 'Dresses', 'Traditional wear', 'Outerwear', 'Footwear', 'Accessories']
const occasions = ['College', 'Casual Outing', 'Office', 'Party', 'Wedding', 'Travel']
const styles = ['Casual', 'Elegant', 'Streetwear', 'Traditional', 'Minimalist', 'Trendy', 'Formal']
const seasons = ['Summer', 'Winter', 'Monsoon', 'All-season']
const colors = ['Black', 'White', 'Beige', 'Brown', 'Blue', 'Navy', 'Green', 'Red', 'Pink', 'Grey', 'Other']
const matchesCollection = (item, gender) => gender === 'All' || (item.gender || 'Unisex') === gender || (item.gender || 'Unisex') === 'Unisex'
const hasPicture = (item) => {
  if (typeof item?.imageUrl !== 'string') return false
  if (/^data:image\/[^;]+;base64,/i.test(item.imageUrl)) return true
  try {
    const url = new URL(item.imageUrl)
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) return false
    if (url.hostname === 'images.unsplash.com') return /^\/(?:photo-|premium_photo-)[a-z0-9-]{10,}$/i.test(url.pathname)
    return url.pathname.length > 6
  } catch {
    return false
  }
}
const navItems = [
  { id: 'home', title: 'Overview', icon: Home },
  { id: 'wardrobe', title: 'My wardrobe', icon: Shirt },
  { id: 'planner', title: 'Outfit planner', icon: Sparkles },
  { id: 'outfits', title: 'Saved outfits', icon: LayoutGrid },
  { id: 'calendar', title: 'Outfit calendar', icon: CalendarDays }
]

function App() {
  const [token, setToken] = useState(localStorage.getItem('wearwise-token') || '')
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('home')
  const [selectedIds, setSelectedIds] = useState([])
  const [mobileNav, setMobileNav] = useState(false)
  const [items, setItems] = useState([])
  const [outfits, setOutfits] = useState([])
  const [calendar, setCalendar] = useState([])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')

  const notify = useCallback((message, type = 'success') => {
    setNotice({ message, type })
    window.setTimeout(() => setNotice(null), 3600)
  }, [])

  const loadData = useCallback(async () => {
    if (!token) return
    setBusy(true)
    try {
      const [wardrobe, savedOutfits, plans, profile] = await Promise.all([
        api('/wardrobe', { token }), api('/outfits', { token }), api('/calendar', { token }), api('/auth/me', { token })
      ])
      const picturedItems = wardrobe.filter(hasPicture)
      setItems(picturedItems)
      setSelectedIds((selected) => selected.filter((id) => picturedItems.some((item) => item._id === id)))
      setOutfits(savedOutfits)
      setCalendar(plans)
      setUser(profile)
    } catch (error) {
      notify(error.message, 'error')
      if (error.message.includes('session has expired')) signOut()
    } finally { setBusy(false) }
  }, [token, notify])

  useEffect(() => { loadData() }, [loadData])

  async function signIn(form) {
    setAuthError('')
    try {
      const result = await api(`/auth/${authMode === 'login' ? 'login' : 'register'}`, json('POST', form))
      localStorage.setItem('wearwise-token', result.token)
      setToken(result.token)
      setUser(result.user)
    } catch (error) { setAuthError(error.message) }
  }

  function signOut() {
    localStorage.removeItem('wearwise-token')
    setToken('')
    setUser(null)
    setItems([])
    setOutfits([])
    setCalendar([])
    setSelectedIds([])
  }

  async function mutate(path, method, data, message) {
    try {
      const result = await api(path, { token, ...json(method, data) })
      await loadData()
      if (message) notify(message)
      return result
    } catch (error) { notify(error.message, 'error'); throw error }
  }

  if (!token) return <AuthPage mode={authMode} setMode={setAuthMode} onSubmit={signIn} error={authError} />

  const context = { token, user, items, outfits, calendar, busy, notify, mutate, loadData, setPage, selectedIds, setSelectedIds }
  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} user={user} signOut={signOut} open={mobileNav} close={() => setMobileNav(false)} />
      <main className="main-area">
        <header className="topbar">
          <button className="icon-btn mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={21} /></button>
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><b>{navItems.find((n) => n.id === page)?.title || 'Account'}</b></div>
          <div className="top-actions">
            <span className="today-label">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <button className="icon-btn" aria-label="Notifications" onClick={() => notify('You’re all caught up!')}><Bell size={18} /></button>
            <button className="avatar" onClick={() => setPage('profile')} aria-label="Open profile">{user?.name?.slice(0, 1)?.toUpperCase() || 'W'}</button>
          </div>
        </header>
        <div className="page-content">
          {page === 'home' && <Dashboard {...context} />}
          {page === 'wardrobe' && <Wardrobe {...context} />}
          {page === 'planner' && <Planner {...context} />}
          {page === 'outfits' && <SavedOutfits {...context} />}
          {page === 'calendar' && <CalendarPage {...context} />}
          {page === 'profile' && <Profile {...context} />}
          <footer className="footer-note">Made for getting dressed with a little more joy <span>✦</span></footer>
        </div>
      </main>
      {notice && <div className={`toast ${notice.type}`}><span className="toast-check">{notice.type === 'error' ? '!' : <Check size={15} />}</span>{notice.message}<button onClick={() => setNotice(null)} aria-label="Dismiss"><X size={15} /></button></div>}
    </div>
  )
}

function Sidebar({ page, setPage, user, signOut, open, close }) {
  return <>
    {open && <button className="scrim" onClick={close} aria-label="Close navigation" />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Shirt size={19} /></div><div>Trend Makers<span>YOUR STYLE, SIMPLIFIED</span></div><button className="icon-btn close-nav" onClick={close}><X size={18} /></button></div>
      <div className="nav-caption">MENU</div>
      <nav>{navItems.map(({ id, title, icon: Icon }) => <button key={id} className={`nav-link ${page === id ? 'active' : ''}`} onClick={() => { setPage(id); close() }}><Icon size={18} /><span>{title}</span>{id === 'wardrobe' && <span className="nav-count">{/* populated by the wardrobe page */}</span>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="plan-card"><div className="plan-icon"><WandSparkles size={17} /></div><b>A wardrobe that works for you.</b><p>Choose your clothes and let Trend Makers style the look.</p><button onClick={() => { setPage('planner'); close() }}>Plan an outfit <ArrowRight size={15} /></button></div>
        <button className={`nav-link ${page === 'profile' ? 'active' : ''}`} onClick={() => { setPage('profile'); close() }}><Settings size={18} /><span>Settings</span></button>
        <div className="user-row"><div className="avatar">{user?.name?.slice(0, 1)?.toUpperCase() || 'T'}</div><div className="user-info"><b>{user?.name || 'Trend Makers member'}</b><span>{user?.email}</span></div><button className="icon-btn logout-btn" onClick={signOut} title="Sign out"><LogOut size={17} /></button></div>
      </div>
    </aside>
  </>
}

function AuthPage({ mode, setMode, onSubmit, error }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const submit = async (e) => { e.preventDefault(); setLoading(true); await onSubmit(form); setLoading(false) }
  return <div className="auth-page">
    <div className="auth-photo"><div className="auth-brand"><div className="brand-mark"><Shirt size={19} /></div>TREND MAKERS</div><div className="auth-quote"><span>YOUR PERSONAL STYLE, REIMAGINED</span><h1>Your Wardrobe,<br />Reimagined.</h1><p>Discover new ways to style the clothes you already own.</p><div className="auth-intro">Find the pieces that feel like you, build fresh combinations, and make getting dressed the best part of your day.</div><button className="auth-cta" onClick={() => setMode('register')}>Style My Outfit <ArrowRight size={17} /></button><div className="auth-tagline">YOUR WARDROBE. YOUR STYLE. YOUR TREND.</div></div><div className="photo-caption">A MORE THOUGHTFUL WAY TO GET DRESSED</div></div>
    <div className="auth-panel"><div className="auth-content"><span className="eyebrow">WELCOME TO YOUR WARDROBE</span><h2>{mode === 'login' ? 'Good to have you back.' : 'Make room for better mornings.'}</h2><p className="auth-subtitle">{mode === 'login' ? 'Sign in to pick up right where you left off.' : 'Create your account and start curating your closet.'}</p>
      <form onSubmit={submit} className="auth-form">
        {mode === 'register' && <label>Your name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="What should we call you?" /></label>}
        <label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label>
        <label>Password<input required type="password" minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} /></label>
        {error && <div className="form-error">{error}</div>}
        <button className="primary-btn auth-submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : null}{mode === 'login' ? 'Sign in' : 'Create account'}<ArrowRight size={16} /></button>
      </form><p className="auth-switch">{mode === 'login' ? 'New to Trend Makers?' : 'Already have an account?'} <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p><div className="auth-privacy"><span>✦</span> Your style is yours. Your data stays yours.</div>
    </div></div>
  </div>
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>
}
function Button({ children, onClick, secondary = false, className = '', disabled = false, type = 'button' }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={`${secondary ? 'secondary-btn' : 'primary-btn'} ${className}`}>{children}</button>
}
function EmptyState({ icon: Icon = Shirt, title, text, action }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={23} /></div><h3>{title}</h3><p>{text}</p>{action}</div>
}
function StatCard({ label, value, note, icon: Icon, tone = 'sand' }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19} /></div><span className="stat-label">{label}</span><b className="stat-value">{value}</b><span className="stat-note">{note}</span></div>
}
function imageFor(item, large) {
  if (!item?.imageUrl) return ''
  try {
    const url = new URL(item.imageUrl)
    if (url.hostname === 'images.unsplash.com') {
      url.searchParams.set('w', large ? '480' : '320')
      url.searchParams.set('q', '65')
      return url.toString()
    }
  } catch {
    return item.imageUrl
  }
  return item.imageUrl
}
function ItemThumb({ item, large = false }) {
  const [imageFailed, setImageFailed] = useState(false)
  useEffect(() => setImageFailed(false), [item?._id, item?.imageUrl])
  const image = imageFor(item, large)
  return <div className={`item-thumb ${large ? 'large' : ''}`}>{image && !imageFailed ? <img src={image} alt={item?.name || 'Wardrobe item'} loading="lazy" decoding="async" onError={() => setImageFailed(true)} /> : <div className={`placeholder-art color-${(item?.color || 'beige').toLowerCase().replace(/\s/g, '')}`}><Shirt size={large ? 34 : 24} strokeWidth={1.3} /></div>}</div>
}
function Dashboard({ user, items, outfits, calendar, setPage }) {
  const today = new Date().toISOString().slice(0, 10)
  const todaysPlan = calendar.find((entry) => new Date(entry.date).toISOString().slice(0, 10) === today)
  const upcoming = calendar.filter((entry) => !entry.worn && new Date(entry.date) >= new Date(new Date().toDateString())).slice(0, 3)
  const topItems = [...items].sort((a, b) => b.wearCount - a.wearCount).slice(0, 4)
  const recentlyAdded = items.slice(0, 4)
  const totalWears = items.reduce((sum, item) => sum + (item.wearCount || 0), 0)
  return <>
    <section className="editorial-hero">
      <div className="editorial-copy">
        <div className="eyebrow">YOUR PERSONAL STYLE SPACE <span>✦</span> GOOD {new Date().getHours() < 12 ? 'MORNING' : new Date().getHours() < 18 ? 'AFTERNOON' : 'EVENING'}, {user?.name?.split(' ')[0]?.toUpperCase() || 'THERE'}</div>
        <h1>Your Wardrobe,<br /><em>Reimagined.</em></h1>
        <p>Discover new ways to style the clothes you already own. Thoughtful combinations, made just for you.</p>
        <Button onClick={() => setPage('planner')}><Sparkles size={16} /> Style My Outfit <ArrowRight size={15} /></Button>
        <div className="editorial-tagline">YOUR WARDROBE. YOUR STYLE. YOUR TREND.</div>
      </div>
      <div className="editorial-collage" aria-label="A curated collection of fashion looks">
        <img className="editorial-image-main" src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85" alt="Friends exploring personal style together" fetchpriority="high" />
        <img className="editorial-image-side" src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=420&q=80" alt="Soft neutral outfit inspiration" loading="lazy" />
        <img className="editorial-image-bottom" src="https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=420&q=80" alt="Everyday denim wardrobe inspiration" loading="lazy" />
        <span className="editorial-stamp"><Sparkles size={15} /> STYLE, REPEATED</span>
      </div>
    </section>
    <p className="editorial-intro">A personal stylist for the pieces already in your closet. Choose a few favorites and find a whole new way to wear them.</p>
    <div className="stats-grid">
      <StatCard label="WARDROBE PIECES" value={items.length.toString().padStart(2, '0')} note="Pieces in your collection" icon={Shirt} />
      <StatCard label="SAVED OUTFITS" value={outfits.length.toString().padStart(2, '0')} note="Looks ready to wear" icon={Sparkles} tone="sage" />
      <StatCard label="PIECES WORN" value={totalWears.toString().padStart(2, '0')} note="From your planned outfits" icon={Heart} tone="rose" />
      <StatCard label="PLANNED LOOKS" value={calendar.filter((x) => !x.worn).length.toString().padStart(2, '0')} note="Coming up in your calendar" icon={CalendarDays} tone="blue" />
    </div>
    <div className="dashboard-grid">
      <section className="panel today-panel"><div className="panel-top"><div><div className="eyebrow">A LITTLE INSPIRATION</div><h2>Your look for today</h2></div><div className="weather-chip"><Sun size={16} /> Your kind of day</div></div>
        {todaysPlan?.outfit ? <><div className="today-outfit-meta"><span>{todaysPlan.outfit.occasion}</span><span>·</span><span>{todaysPlan.outfit.style}</span></div><h3>{todaysPlan.outfit.name}</h3><div className="outfit-strip">{todaysPlan.outfit.items?.slice(0, 4).map((item) => <ItemThumb key={item._id} item={item} />)}</div><button className="text-link" onClick={() => setPage('calendar')}>View your plan <ArrowRight size={15} /></button></>
        : <div className="today-empty"><div className="today-illustration"><div className="sun-disc"><Sun size={26} /></div><div className="mini-clothes"><Shirt size={56} strokeWidth={1.1} /></div></div><div><h3>Make today a good outfit day.</h3><p>Plan a look from pieces you already love.</p><Button onClick={() => setPage('planner')}>Plan an outfit <ArrowRight size={15} /></Button></div></div>}
      </section>
      <section className="panel upcoming-panel"><div className="panel-top"><div><div className="eyebrow">COMING UP</div><h2>On your calendar</h2></div><button className="circle-arrow" onClick={() => setPage('calendar')}><ArrowRight size={17} /></button></div>
        {upcoming.length ? <div className="upcoming-list">{upcoming.map((entry) => <div className="upcoming-row" key={entry._id}><div className="date-block"><b>{new Date(entry.date).getDate()}</b><span>{new Date(entry.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span></div><div className="upcoming-info"><b>{entry.outfit?.name}</b><span>{entry.outfit?.occasion} · {entry.outfit?.items?.length || 0} pieces</span></div><ArrowRight size={15} className="muted-arrow" /></div>)}</div> : <div className="mini-empty"><CalendarDays size={21} /><p>No looks planned just yet.</p><button className="text-link" onClick={() => setPage('calendar')}>Open calendar <ArrowRight size={14} /></button></div>}
      </section>
      <section className="panel closet-panel"><div className="panel-top"><div><div className="eyebrow">NEW TO THE CLOSET</div><h2>Recently added</h2></div><button className="text-link" onClick={() => setPage('wardrobe')}>See all <ArrowRight size={14} /></button></div>
        {recentlyAdded.length ? <div className="recent-grid">{recentlyAdded.map((item) => <button className="recent-item" key={item._id} onClick={() => setPage('wardrobe')}><ItemThumb item={item} /><b>{item.name}</b><span>{item.category} · {item.color}</span></button>)}</div> : <div className="mini-empty"><Shirt size={21} /><p>Your wardrobe is waiting to be discovered.</p><button className="text-link" onClick={() => setPage('wardrobe')}>Add your first piece <ArrowRight size={14} /></button></div>}
      </section>
      <section className="panel most-worn-panel"><div className="panel-top"><div><div className="eyebrow">YOUR GO-TO PIECES</div><h2>Most worn</h2></div><span className="subtle-count">{items.length} pieces</span></div>
        {topItems.length ? <div className="worn-list">{topItems.map((item, index) => <div className="worn-row" key={item._id}><span className="rank">0{index + 1}</span><ItemThumb item={item} /><div className="worn-info"><b>{item.name}</b><span>{item.category}</span></div><span className="wear-count">{item.wearCount || 0} wears</span></div>)}</div> : <div className="mini-empty"><Heart size={20} /><p>Your favorites will find their place here.</p><button className="text-link" onClick={() => setPage('wardrobe')}>Explore wardrobe <ArrowRight size={14} /></button></div>}
      </section>
    </div>
  </>
}

function Wardrobe({ items, selectedIds, setSelectedIds, setPage, notify, token, loadData }) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ gender: 'All', category: 'All', season: 'All', occasion: 'All' })
  const [view, setView] = useState('grid')
  const [browsing, setBrowsing] = useState(false)
  const [catalog, setCatalog] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogSelection, setCatalogSelection] = useState([])
  const [catalogFilters, setCatalogFilters] = useState({ gender: 'All', category: 'All', search: '' })
  const [adding, setAdding] = useState(false)
  const shown = useMemo(() => items.filter((item) => {
    const textMatch = `${item.name} ${item.color}`.toLowerCase().includes(search.toLowerCase())
    return textMatch && matchesCollection(item, filters.gender) && (filters.category === 'All' || item.category === filters.category) && (filters.season === 'All' || item.season === filters.season) && (filters.occasion === 'All' || item.occasion === filters.occasion)
  }), [items, search, filters])
  const ownedCatalogIds = new Set(items.map((item) => item.catalogId).filter(Boolean))
  const catalogMatches = (catalogItem) => items.some((item) =>
    item.catalogId === catalogItem.catalogId ||
    (item.name === catalogItem.name && item.category === catalogItem.category && item.gender === catalogItem.gender && item.imageUrl === catalogItem.imageUrl)
  )
  const visibleCatalog = catalog.filter((item) =>
    matchesCollection(item, catalogFilters.gender) &&
    (catalogFilters.category === 'All' || item.category === catalogFilters.category) &&
    item.name.toLowerCase().includes(catalogFilters.search.toLowerCase())
  )
  const openCatalog = async () => {
    setBrowsing(true)
    if (catalog.length) return
    setCatalogLoading(true)
    try {
      setCatalog(await api('/wardrobe/catalog', { token }))
    } catch (error) {
      notify(error.message, 'error')
    } finally {
      setCatalogLoading(false)
    }
  }
  const addSelectedClothes = async () => {
    const newSelection = catalogSelection.filter((catalogId) => !ownedCatalogIds.has(catalogId))
    if (!newSelection.length) return notify('Choose clothes you own to add them to your wardrobe.', 'error')
    setAdding(true)
    try {
      const results = await Promise.allSettled(newSelection.map((catalogId) =>
        api('/wardrobe', { token, ...json('POST', { catalogId }) })
      ))
      const succeeded = results.filter((result) => result.status === 'fulfilled').length
      const failedIds = newSelection.filter((_id, index) => results[index].status === 'rejected')
      if (succeeded) {
        await loadData()
        setCatalogSelection(failedIds)
        notify(`${succeeded} ${succeeded === 1 ? 'piece' : 'pieces'} added to your wardrobe.${failedIds.length ? ` ${failedIds.length} could not be added.` : ''}`, failedIds.length ? 'error' : 'success')
      } else {
        notify(results[0]?.reason?.message || 'Could not add the selected clothes.', 'error')
      }
    } finally {
      setAdding(false)
    }
  }
  return <>
    <PageHeading eyebrow={browsing ? 'BROWSE EXAMPLE CLOTHES' : 'YOUR PERSONAL CLOSET'} title={browsing ? 'Which clothes do you own?' : 'My wardrobe'} description={browsing ? 'Tap the pictures that match clothes you already have. Examples are just a guide.' : `${items.length} ${items.length === 1 ? 'piece' : 'pieces'} in your wardrobe. Add only clothes you own.`} action={browsing ? <Button secondary onClick={() => { setBrowsing(false); setCatalogSelection([]) }}><ArrowLeft size={15} /> My wardrobe</Button> : <div className="wardrobe-add-actions"><Button onClick={openCatalog}><Search size={16} /> Browse clothes</Button>{selectedIds.length > 0 && <Button secondary onClick={() => setPage('planner')}><Sparkles size={16} /> Style selected ({selectedIds.length})</Button>}</div>} />
    {browsing ? <>
      <div className="catalog-note"><Sparkles size={16} /><span><b>These are examples, not your saved clothes.</b> Select only items you actually own. You can choose many, then add them all at once.</span></div>
      <div className="wardrobe-toolbar catalog-toolbar"><div className="searchbox"><Search size={17} /><input placeholder="Find a clothing type..." value={catalogFilters.search} onChange={(e) => setCatalogFilters({ ...catalogFilters, search: e.target.value })} /></div><select aria-label="Filter by collection" value={catalogFilters.gender} onChange={(e) => setCatalogFilters({ ...catalogFilters, gender: e.target.value })}><option value="All">All collections</option><option>Men</option><option>Women</option><option>Unisex</option></select><select aria-label="Filter by clothing type" value={catalogFilters.category} onChange={(e) => setCatalogFilters({ ...catalogFilters, category: e.target.value })}><option value="All">All types</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></div>
      {catalogLoading ? <div className="catalog-loading"><LoaderCircle className="spin" size={22} /> Loading clothing examples…</div> : visibleCatalog.length ? <div className="wardrobe-grid catalog-grid">{visibleCatalog.map((item) => {
        const owned = catalogMatches(item) || ownedCatalogIds.has(item.catalogId)
        const selected = catalogSelection.includes(item.catalogId)
        return <button type="button" className={`wardrobe-card catalog-card ${selected ? 'catalog-selected' : ''} ${owned ? 'catalog-owned' : ''}`} key={item.catalogId} aria-pressed={selected || owned} disabled={owned} onClick={() => setCatalogSelection((current) => selected ? current.filter((id) => id !== item.catalogId) : [...current, item.catalogId])}>
          <span className="catalog-photo"><ItemThumb item={item} large /><span className={`manual-clothing-check ${owned ? 'already-owned' : ''}`}>{owned ? <Check size={15} /> : selected ? <Check size={15} /> : <Plus size={15} />}</span></span>
          <span className="catalog-card-copy"><span className="catalog-item-name">{item.name}</span><span className="catalog-item-category">{item.category} · {item.gender}</span><span className={`catalog-item-action ${owned ? 'owned-label' : ''}`}>{owned ? 'Already in my wardrobe' : selected ? 'Selected' : 'I have this'}</span></span>
        </button>
      })}</div> : <EmptyState icon={Search} title="No clothes found." text="Try another search or clothing type." />}
      {catalogSelection.length > 0 && <div className="catalog-selection-bar"><span><b>{catalogSelection.length}</b> {catalogSelection.length === 1 ? 'piece selected' : 'pieces selected'}</span><Button onClick={addSelectedClothes} disabled={adding}>{adding ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}{adding ? 'Adding to your wardrobe…' : `I have these — add ${catalogSelection.length}`}</Button></div>}
    </> : <>
      <div className="wardrobe-statline"><div className="category-pills"><button className={filters.category === 'All' ? 'active-pill' : ''} onClick={() => setFilters({ ...filters, category: 'All' })}>{items.length} total</button>{categories.map((category) => <button className={filters.category === category ? 'active-pill' : ''} key={category} onClick={() => setFilters({ ...filters, category })}>{items.filter((x) => x.category === category).length} {category}</button>)}</div><div className="storage-note"><Sparkles size={14} /> Select pieces to build your look</div></div>
      <div className="wardrobe-toolbar"><div className="searchbox"><Search size={17} /><input placeholder="Search your clothes..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><select aria-label="Filter by collection" value={filters.gender} onChange={(e) => setFilters({ ...filters, gender: e.target.value })}><option>All</option><option>Men</option><option>Women</option><option>Unisex</option></select><select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option>All</option>{categories.map((c) => <option key={c}>{c}</option>)}</select><select value={filters.season} onChange={(e) => setFilters({ ...filters, season: e.target.value })}><option>All</option>{seasons.map((c) => <option key={c}>{c}</option>)}</select><select value={filters.occasion} onChange={(e) => setFilters({ ...filters, occasion: e.target.value })}><option>All</option>{occasions.map((c) => <option key={c}>{c}</option>)}</select><div className="view-switch"><button className={view === 'grid' ? 'selected' : ''} onClick={() => setView('grid')} aria-label="Grid view"><LayoutGrid size={17} /></button><button className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')} aria-label="List view"><List size={18} /></button></div></div>
      {shown.length ? <div className={view === 'grid' ? 'wardrobe-grid' : 'wardrobe-list'}>{shown.map((item) => <button type="button" className={`wardrobe-card wardrobe-selectable ${view === 'list' ? 'list-card' : ''} ${selectedIds.includes(item._id) ? 'wardrobe-selected' : ''}`} key={item._id} aria-pressed={selectedIds.includes(item._id)} onClick={() => setSelectedIds((current) => {
        if (current.includes(item._id)) return current.filter((id) => id !== item._id)
        if (current.length >= 8) { notify('Select up to 8 pieces for one outfit.', 'error'); return current }
        return [...current, item._id]
      })}><span className="item-image-button"><ItemThumb item={item} large /><span className="manual-clothing-check">{selectedIds.includes(item._id) ? <Check size={15} /> : <Plus size={15} />}</span></span><span className="item-card-copy"><span className="item-card-title"><span><span className="item-category">{item.gender || 'Unisex'} · {item.category}</span><span className="wardrobe-item-name">{item.name}</span></span></span><span className="item-meta"><span className={`color-dot dot-${item.color?.toLowerCase()}`} />{item.color}</span></span></button>)}</div> : <EmptyState icon={search || filters.gender !== 'All' || filters.category !== 'All' ? Search : Shirt} title={items.length ? 'No clothes match those filters.' : 'Your wardrobe is ready for its first piece.'} text={items.length ? 'Try adjusting your filters or search.' : 'Browse the clothing examples and tap only the items you actually own.'} action={!items.length ? <Button onClick={openCatalog}><Search size={16} /> Browse clothes</Button> : null} />}
    </>}
  </>
}

function BulkAddModal({ token, notify, loadData, onClose }) {
  const [photos, setPhotos] = useState([])
  const [category, setCategory] = useState('Tops')
  const [season, setSeason] = useState('All-season')
  const [occasion, setOccasion] = useState('Casual')
  const [style, setStyle] = useState('Casual')
  const [color, setColor] = useState('Other')
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)

  const addPhotos = async (files) => {
    const remaining = 12 - photos.length
    const selected = Array.from(files || [])
    if (!selected.length) return
    if (selected.length > remaining) {
      setError(`You can add ${remaining} more ${remaining === 1 ? 'photo' : 'photos'} in this batch (12 max).`)
      return
    }
    setError('')
    try {
      const prepared = await Promise.all(selected.map(async (file) => {
        if (!file.type.startsWith('image/')) throw new Error('Choose image files to add clothing photos.')
        if (file.size > 12 * 1024 * 1024) throw new Error(`${file.name} is too large. Choose photos under 12MB each.`)
        const bitmap = await createImageBitmap(file)
        const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(bitmap.width * scale))
        canvas.height = Math.max(1, Math.round(bitmap.height * scale))
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        bitmap.close()
        const imageUrl = canvas.toDataURL('image/jpeg', 0.78)
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Clothing item'
        return { id: crypto.randomUUID(), name, imageUrl }
      }))
      setPhotos((current) => [...current, ...prepared])
    } catch (e) {
      setError(e.message || 'Could not load those photos. Please try again.')
    }
  }

  const save = async () => {
    if (!photos.length) return setError('Choose at least one clothing photo first.')
    setWorking(true)
    const results = await Promise.allSettled(photos.map((photo) => api('/wardrobe', {
      token,
      ...json('POST', { name: photo.name.trim() || 'Clothing item', imageUrl: photo.imageUrl, category, season, occasion, style, color })
    })))
    const completed = results.filter((result) => result.status === 'fulfilled').length
    const failed = results.length - completed
    if (completed) {
      await loadData()
      setPhotos((current) => current.filter((photo, index) => results[index].status === 'rejected'))
      notify(failed ? `Added ${completed} pieces. ${failed} could not be saved; you can retry them.` : `Added ${completed} pieces to your wardrobe.` , failed ? 'error' : 'success')
      if (!failed) onClose()
    } else {
      notify(results[0]?.reason?.message || 'Could not add these photos.', 'error')
    }
    setWorking(false)
  }

  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !working && onClose()}>
    <div className="modal bulk-modal">
      <div className="modal-heading"><div><div className="eyebrow">A FASTER WAY TO FILL YOUR CLOSET</div><h2>Add several pieces at once</h2></div><button className="icon-btn" onClick={onClose} disabled={working}><X size={19} /></button></div>
      <p className="bulk-intro">Choose up to 12 photos from your phone. We’ll use each photo’s file name for its item. For the quickest setup, choose one clothing category at a time—the details below apply to every photo in this batch.</p>
      <div className="bulk-settings">
        <label>Category for these photos<select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>Season<select value={season} onChange={(e) => setSeason(e.target.value)}>{seasons.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>Best for<select value={occasion} onChange={(e) => setOccasion(e.target.value)}>{occasions.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>Color<select value={color} onChange={(e) => setColor(e.target.value)}>{colors.map((x) => <option key={x}>{x}</option>)}</select></label>
      </div>
      <label className="bulk-drop">
        <input type="file" accept="image/*" capture="environment" multiple onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }} />
        <span className="bulk-drop-icon"><Camera size={21} /></span><b>Tap to choose clothing photos</b><span>Select several at once · {photos.length}/12 selected</span>
      </label>
      {error && <div className="form-error">{error}</div>}
      {photos.length > 0 && <div className="bulk-photo-list">{photos.map((photo) => <div className="bulk-photo" key={photo.id}><img src={photo.imageUrl} alt="" /><input aria-label="Clothing item name" value={photo.name} maxLength={100} onChange={(e) => setPhotos((current) => current.map((x) => x.id === photo.id ? { ...x, name: e.target.value } : x))} /><button className="icon-btn" disabled={working} onClick={() => setPhotos((current) => current.filter((x) => x.id !== photo.id))} aria-label={`Remove ${photo.name}`}><X size={16} /></button></div>)}</div>}
      <div className="modal-actions"><Button onClick={save} disabled={working || !photos.length}>{working ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />}{working ? 'Adding your pieces…' : `Add ${photos.length || ''} ${photos.length === 1 ? 'piece' : 'pieces'}`}</Button><Button secondary onClick={onClose} disabled={working}>Cancel</Button></div>
    </div>
  </div>
}

function ItemModal({ item, onClose, onSave, working }) {
  const [form, setForm] = useState({ name: item?.name || '', category: item?.category || 'Tops', gender: item?.gender || 'Unisex', color: item?.color || 'Beige', brand: item?.brand || '', season: item?.season || 'All-season', occasion: item?.occasion || 'Casual', style: item?.style || 'Casual', notes: item?.notes || '', imageUrl: item?.imageUrl || '', favorite: item?.favorite || false })
  const [imageError, setImageError] = useState('')
  const pickImage = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setImageError('Please choose an image file.')
    if (file.size > 7 * 1024 * 1024) return setImageError('Image must be smaller than 7MB.')
    const reader = new FileReader()
    reader.onload = () => { setForm((prev) => ({ ...prev, imageUrl: reader.result })); setImageError('') }
    reader.onerror = () => setImageError('We couldn’t read that image. Please try again.')
    reader.readAsDataURL(file)
  }
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><form className="modal item-modal" onSubmit={(e) => { e.preventDefault(); onSave(form) }}>
    <div className="modal-heading"><div><div className="eyebrow">{item ? 'REFINE YOUR EDIT' : 'A NEW FAVORITE'}</div><h2>{item ? 'Edit wardrobe piece' : 'Add to your wardrobe'}</h2></div><button type="button" className="icon-btn" onClick={onClose}><X size={19} /></button></div>
    <div className="modal-form">
      <label className="upload-area">{form.imageUrl ? <img src={form.imageUrl} alt="Clothing preview" /> : <><div className="upload-icon"><Camera size={20} /></div><b>Add a photo</b><span>Choose an image or take a photo · Up to 7MB</span></>}<input type="file" accept="image/*" capture="environment" onChange={(e) => pickImage(e.target.files?.[0])} /></label>
      {imageError && <div className="form-error">{imageError}</div>}
      <div className="form-grid"><label>Piece name<input required maxLength={100} placeholder="e.g. Linen button-down" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((x) => <option key={x}>{x}</option>)}</select></label><label>Collection<select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option>Men</option><option>Women</option><option>Unisex</option></select></label><label>Color<select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>{colors.map((x) => <option key={x}>{x}</option>)}</select></label><label>Brand <span className="optional">(optional)</span><input placeholder="Brand name" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></label><label>Season<select value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>{seasons.map((x) => <option key={x}>{x}</option>)}</select></label><label>Best for<select value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })}>{occasions.map((x) => <option key={x}>{x}</option>)}</select></label><label>Style<select value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })}>{styles.map((x) => <option key={x}>{x}</option>)}</select></label><label className="full-field">Notes <span className="optional">(optional)</span><textarea rows="2" placeholder="Anything you’d like to remember..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label></div>
      <label className="favorite-check"><input type="checkbox" checked={form.favorite} onChange={(e) => setForm({ ...form, favorite: e.target.checked })} /><span><Heart size={15} /> Save as a favorite</span></label>
    </div><div className="modal-actions"><Button type="submit" disabled={working}>{working ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{item ? 'Save changes' : 'Add to wardrobe'}</Button><Button secondary onClick={onClose}>Cancel</Button></div>
  </form></div>
}

function Planner({ items, outfits, token, notify, loadData, selectedIds, setSelectedIds }) {
  const [form, setForm] = useState({ occasion: 'College', style: 'Casual', gender: 'All', season: '' })
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [results, setResults] = useState([])
  const [resultsForSelection, setResultsForSelection] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState('')
  const [offset, setOffset] = useState(0)
  const visibleItems = items.filter((item) =>
    matchesCollection(item, form.gender) && (categoryFilter === 'All' || item.category === categoryFilter)
  )
  const clearRecommendations = () => {
    setResults([])
    setResultsForSelection([])
    setOffset(0)
  }
  const updatePreference = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    clearRecommendations()
  }
  const toggleSelectedItem = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id))
    } else {
      if (selectedIds.length >= 8) return notify('Select up to 8 pieces for one outfit.', 'error')
      setSelectedIds([...selectedIds, id])
    }
    clearRecommendations()
  }

  const generate = async () => {
    if (!selectedIds.length) return notify('Choose at least one piece from your wardrobe first.', 'error')
    setLoading(true)
    try {
      const suggestions = await api('/outfits/style', { token, ...json('POST', { ...form, selectedIds, offset }) })
      if (suggestions.some((outfit) =>
        !selectedIds.some((id) => outfit.items.some((item) => item._id === id))
      )) {
        throw new Error('We couldn’t include a selected piece in every look. Please try again.')
      }
      setResults(suggestions)
      setResultsForSelection(items.filter((item) => selectedIds.includes(item._id)))
      setOffset((current) => (current + 1) % 1001)
    } catch (error) {
      notify(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const saveOutfit = async (outfit, favorite = false) => {
    const ids = outfit.items.map((item) => item._id)
    const signature = ids.slice().sort().join('|')
    const existing = outfits.find((saved) =>
      (saved.items || []).map((item) => typeof item === 'string' ? item : item?._id).sort().join('|') === signature
    )
    setSaving(`${signature}:${favorite}`)
    try {
      if (existing) {
        await api(`/outfits/${existing._id}`, { token, ...json('PUT', { favorite: favorite || existing.favorite }) })
      } else {
        await api('/outfits', { token, ...json('POST', {
          name: outfit.name,
          items: ids,
          occasion: outfit.occasion,
          style: outfit.style,
          notes: `${outfit.explanation} ${outfit.stylingTip}`,
          favorite
        }) })
      }
      await loadData()
      notify(favorite ? 'Added to your favorites.' : existing ? 'This outfit is already saved.' : 'Outfit saved.')
    } catch (error) {
      notify(error.message, 'error')
    } finally {
      setSaving('')
    }
  }

  return <>
    <PageHeading eyebrow="YOUR PERSONAL FASHION STYLIST" title="Style My Outfit" description="Choose your clothes, set the occasion and discover looks styled from your wardrobe." />
    <div className="planner-layout trend-planner-layout">
      <section className="panel planner-controls">
        <div className="planner-panel-header"><div className="planner-icon"><Sparkles size={20} /></div><div><h2>Set the scene</h2><p>We’ll match your pieces to your plans.</p></div></div>
        <label className="field-label">OCCASION<select value={form.occasion} onChange={(event) => updatePreference('occasion', event.target.value)}>{occasions.map((occasion) => <option key={occasion}>{occasion}</option>)}</select></label>
        <label className="field-label">PREFERRED STYLE<select value={form.style} onChange={(event) => updatePreference('style', event.target.value)}>{styles.map((style) => <option key={style}>{style}</option>)}</select></label>
        <label className="field-label">SEASON<select value={form.season} onChange={(event) => updatePreference('season', event.target.value)}><option value="">Any season</option>{seasons.filter((season) => season !== 'All-season').map((season) => <option key={season}>{season}</option>)}</select></label>
        <label className="field-label">COLLECTION<select value={form.gender} onChange={(event) => {
          const gender = event.target.value
          setForm({ ...form, gender })
          setSelectedIds((current) => current.filter((id) => {
            const item = items.find((entry) => entry._id === id)
            return item && matchesCollection(item, gender)
          }))
          clearRecommendations()
        }}><option>All</option><option>Men</option><option>Women</option><option>Unisex</option></select></label>
        <div className="planner-selection-summary"><b>{selectedIds.length} selected · Up to 8</b><button type="button" onClick={() => { setSelectedIds([]); clearRecommendations() }} disabled={!selectedIds.length}>Clear selection</button></div>
        <Button className="generate-btn" onClick={generate} disabled={loading || !selectedIds.length}>{loading ? <LoaderCircle className="spin" size={17} /> : <WandSparkles size={17} />}{loading ? 'Generating your looks…' : 'Generate My Outfit'}</Button>
      </section>
      <section className="panel recommendation-panel manual-selection-panel trend-selection-panel">
        <div className="panel-top"><div><div className="eyebrow">PRELOADED DIGITAL WARDROBE</div><h2>Choose your pieces</h2></div></div>
        <p className="manual-selection-intro">Select the clothes you want to wear. We’ll add matching pieces from this wardrobe.</p>
        <div className="manual-selection-filters">
          <label>Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option>All</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        </div>
        <div className="manual-clothing-grid">{visibleItems.map((item) => <button type="button" className={`manual-clothing-card ${selectedIds.includes(item._id) ? 'selected' : ''}`} key={item._id} aria-pressed={selectedIds.includes(item._id)} onClick={() => toggleSelectedItem(item._id)}><span className="manual-clothing-photo"><ItemThumb item={item} large /><span className="manual-clothing-check">{selectedIds.includes(item._id) ? <Check size={15} /> : <Plus size={15} />}</span></span><span className="manual-clothing-name">{item.name}</span><span className="manual-clothing-category">{item.category} · {item.color}</span></button>)}</div>
      </section>
    </div>
    {results.length > 0 && <section className="style-results">
      <div className="style-results-heading"><div><div className="eyebrow">CURATED FOR YOUR {form.occasion.toUpperCase()}</div><h2>Three ways to wear it</h2></div><Button secondary onClick={generate} disabled={loading}>{loading ? <LoaderCircle className="spin" size={15} /> : <RefreshCw size={15} />} Try Another Outfit</Button></div>
      <div className="selected-pieces-confirmation">
        <div><div className="eyebrow">YOUR STYLE INSPIRATION</div><h3>At least one of your picks anchors every look</h3></div>
        <div className="selected-pieces-strip">{resultsForSelection.map((item) => <div className="selected-piece" key={item._id}><ItemThumb item={item} /><span>{item.name}</span></div>)}</div>
      </div>
      <div className="style-outfit-grid">{results.map((outfit) => {
        const ids = outfit.items.map((item) => item._id)
        const signature = ids.slice().sort().join('|')
        const saved = outfits.find((entry) => (entry.items || []).map((item) => typeof item === 'string' ? item : item?._id).sort().join('|') === signature)
        return <article className="style-outfit-card" key={signature}>
          <div className="style-outfit-photos" style={{ gridTemplateColumns: `repeat(${Math.min(outfit.items.length, 3)}, minmax(0, 1fr))`, height: outfit.items.length > 3 ? '280px' : '180px' }}>{outfit.items.map((item) => <ItemThumb key={item._id} item={item} large />)}</div>
          <div className="style-outfit-body"><div className="eyebrow">{outfit.occasion} · {outfit.style}</div><h3>{outfit.name}</h3>
            <div className="style-color-line">{outfit.colorCombination.split(' + ').map((color) => <span key={color} className={`color-dot dot-${color.toLowerCase()}`} title={color} />)}<span>{outfit.colorCombination}</span></div>
            <p><b>Why it works</b>{outfit.explanation}</p><p><b>Styling tip</b>{outfit.stylingTip}</p>
            <div className="style-outfit-actions">
              <Button secondary onClick={generate} disabled={loading}><RefreshCw size={14} /> Try Another Outfit</Button>
              <Button secondary onClick={() => saveOutfit(outfit)} disabled={saving.startsWith(`${signature}:`)}>{saved ? <Check size={14} /> : <Heart size={14} />} {saved ? 'Saved' : 'Save Outfit'}</Button>
              <Button onClick={() => saveOutfit(outfit, true)} disabled={saving.startsWith(`${signature}:true`) || saved?.favorite}><Heart size={14} fill={saved?.favorite ? 'currentColor' : 'none'} />{saved?.favorite ? 'Favorited' : 'Add to Favorites'}</Button>
            </div>
          </div>
        </article>
      })}</div>
    </section>}
  </>
}

function LegacyPlanner({ items, outfits, token, notify, loadData, setPage, plannerMode, setPlannerMode }) {
  const [form, setForm] = useState({ occasion: 'Casual', style: 'Minimal', gender: 'All', weather: 'Mild', temperature: '', city: '', colors: [] })
  const [selectionMode, setSelectionMode] = useState(plannerMode)
  const [selectedIds, setSelectedIds] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherInfo, setWeatherInfo] = useState(null)
  const visibleItems = items.filter((item) => matchesCollection(item, form.gender) && (categoryFilter === 'All' || item.category === categoryFilter))
  const selectedCount = selectedIds.filter((id) => items.some((item) => item._id === id && matchesCollection(item, form.gender))).length
  const selectedAccessoryCount = selectedIds.filter((id) => items.some((item) => item._id === id && item.category === 'Accessories' && matchesCollection(item, form.gender))).length
  const request = async () => {
    setLoading(true); setSaved(false)
    try { setResult(await api('/outfits/recommend', { token, ...json('POST', form) })) } catch (e) { notify(e.message, 'error') } finally { setLoading(false) }
  }
  const createSelectedOutfit = () => {
    const selected = items.filter((item) => selectedIds.includes(item._id) && matchesCollection(item, form.gender))
    if (!selected.length) return notify('Choose at least one wardrobe piece for your outfit.', 'error')
    setResult({
      name: `${form.style} ${form.occasion} outfit`,
      items: selected,
      occasion: form.occasion,
      style: form.style,
      notes: 'An outfit you put together from your wardrobe.'
    })
    setSaved(false)
  }
  const getWeather = async () => {
    if (!form.city.trim()) return notify('Enter a city to check the weather.', 'error')
    setWeatherLoading(true)
    try {
      const weather = await api(`/weather?city=${encodeURIComponent(form.city)}`, { token })
      setWeatherInfo(weather)
      const condition = /rain|drizzle|thunder/i.test(weather.condition) ? 'Rainy' : weather.temperature < 14 ? 'Cold' : weather.temperature > 27 ? 'Hot' : 'Mild'
      setForm((prev) => ({ ...prev, weather: condition, temperature: weather.temperature }))
      notify(`Weather updated for ${weather.city}.`)
    } catch (e) { notify(e.message, 'error') } finally { setWeatherLoading(false) }
  }
  const save = async () => {
    if (!result) return
    try {
      await api('/outfits', { token, ...json('POST', { name: result.name, items: result.items.map((x) => x._id), occasion: result.occasion, style: result.style, notes: result.notes }) })
      await loadData(); setSaved(true); notify('Your outfit is saved.')
    } catch (e) { notify(e.message, 'error') }
  }
  return <>
    <PageHeading eyebrow="THE NEXT GOOD OUTFIT IS ALREADY HERE" title="Outfit planner" description="Tell us what your day looks like. We’ll shop your closet." />
    <div className="outfit-mode-switch" role="group" aria-label="Choose outfit planning mode">
      <button type="button" className={selectionMode === 'recommend' ? 'active' : ''} aria-pressed={selectionMode === 'recommend'} onClick={() => { setSelectionMode('recommend'); setPlannerMode('recommend'); setResult(null) }}><WandSparkles size={16} /> Suggest an outfit</button>
      <button type="button" className={selectionMode === 'manual' ? 'active' : ''} aria-pressed={selectionMode === 'manual'} onClick={() => { setSelectionMode('manual'); setPlannerMode('manual'); setResult(null) }}><Shirt size={16} /> Choose from my photos</button>
    </div>
    <div className="planner-layout">
      <section className="panel planner-controls"><div className="planner-panel-header"><div className="planner-icon"><Sparkles size={20} /></div><div><h2>Set the scene</h2><p>A few details make all the difference.</p></div></div>
        <label className="field-label">WHAT’S THE OCCASION?<select value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })}>{occasions.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="field-label">YOUR STYLE TODAY<select value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })}>{styles.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="field-label">CLOTHING COLLECTION<select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option>All</option><option>Men</option><option>Women</option><option>Unisex</option></select></label>
        <div className="field-label">THE WEATHER</div><div className="weather-options">{[['Mild', CloudSun], ['Hot', Sun], ['Cold', Wind], ['Rainy', CloudRain]].map(([label, Icon]) => <button key={label} className={`weather-option ${form.weather === label ? 'weather-active' : ''}`} onClick={() => setForm({ ...form, weather: label })}><Icon size={17} />{label}</button>)}</div>
        <div className="weather-extra"><label className="field-label">CITY FOR LIVE WEATHER<div className="city-input"><input placeholder="e.g. Portland" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /><button type="button" onClick={getWeather} disabled={weatherLoading}>{weatherLoading ? <LoaderCircle size={16} className="spin" /> : <ArrowRight size={16} />}</button></div></label>
          <span className="or-label">OR ADD TEMPERATURE</span><div className="temperature-input"><Thermometer size={16} /><input type="number" placeholder="°C" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} /><span>°C</span></div></div>
        {weatherInfo && <div className="live-weather"><CloudSun size={18} /><span><b>{weatherInfo.temperature}°C · {weatherInfo.condition}</b><small>{weatherInfo.city} · {weatherInfo.description}</small></span></div>}
        <div className="field-label color-label">COLORS YOU’RE FEELING <span>(optional)</span></div><div className="color-options">{colors.slice(0, 9).map((color) => <button key={color} title={color} className={`color-choice ${form.colors.includes(color) ? 'color-chosen' : ''}`} onClick={() => setForm({ ...form, colors: form.colors.includes(color) ? form.colors.filter((x) => x !== color) : [...form.colors, color] })}><span className={`color-dot dot-${color.toLowerCase()}`} /></button>)}</div>
        <div className="planner-footnote"><Sparkles size={14} /> Every suggestion is made from your own wardrobe.</div>
        <Button className="generate-btn" onClick={request} disabled={loading || !items.length}>{loading ? <LoaderCircle className="spin" size={17} /> : <WandSparkles size={17} />}{loading ? 'Finding your look…' : 'Find my outfit'}</Button>
      </section>
      <section className={`panel recommendation-panel ${selectionMode === 'manual' && !result ? 'manual-selection-panel' : ''}`}>
        <div className="panel-top"><div><div className="eyebrow">{result ? 'YOUR OUTFIT' : selectionMode === 'manual' ? 'YOUR WARDROBE PHOTOS' : 'CURATED FOR YOU'}</div><h2>{result ? 'Your outfit, ready to go.' : selectionMode === 'manual' ? 'Choose your pieces' : 'A look that feels like you.'}</h2></div>{result && <button className="icon-btn" onClick={() => { setResult(null); setSaved(false) }} title={selectionMode === 'manual' ? 'Edit piece selection' : 'Find another outfit'} aria-label={selectionMode === 'manual' ? 'Edit piece selection' : 'Find another outfit'}>{selectionMode === 'manual' ? <Pencil size={17} /> : <RefreshCw size={17} />}</button>}</div>
        {result ? <><div className="recommendation-title"><div><span>{result.occasion} · {result.style}</span><h3>{result.name}</h3></div><div className="weather-mini"><CloudSun size={18} /><span>{form.temperature ? `${form.temperature}°C` : form.weather}</span></div></div><div className="recommendation-items">{result.items.map((item) => <div className="recommend-item" key={item._id}><ItemThumb item={item} large /><div><b>{item.name}</b><span>{item.category} · {item.color}</span></div><span className="piece-tag">{item.category}</span></div>)}</div><div className="recommendation-note"><Sparkles size={16} /> {result.notes}</div><div className="recommend-actions"><Button onClick={save} disabled={saved || !result.items.length}>{saved ? <Check size={16} /> : <Heart size={16} />}{saved ? 'Saved to outfits' : 'Save this outfit'}</Button><Button secondary onClick={selectionMode === 'manual' ? () => { setResult(null); setSaved(false) } : request}>{selectionMode === 'manual' ? <Pencil size={15} /> : <RefreshCw size={15} />}{selectionMode === 'manual' ? 'Change pieces' : 'Try another'}</Button></div></>
          : selectionMode === 'manual' ? <><p className="manual-selection-intro">Tap the photos of the clothes and accessories you want to wear.</p><div className="manual-selection-filters"><label>Collection<select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option>All</option><option>Men</option><option>Women</option><option>Unisex</option></select></label><label>Category<select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option>All</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><button type="button" className={`accessories-quick-filter ${categoryFilter === 'Accessories' ? 'active' : ''}`} aria-pressed={categoryFilter === 'Accessories'} onClick={() => setCategoryFilter(categoryFilter === 'Accessories' ? 'All' : 'Accessories')}><Sparkles size={14} /> Accessories</button></div><div className="manual-clothing-grid">{visibleItems.map((item) => <button type="button" className={`manual-clothing-card ${selectedIds.includes(item._id) ? 'selected' : ''}`} key={item._id} aria-pressed={selectedIds.includes(item._id)} onClick={() => setSelectedIds((current) => current.includes(item._id) ? current.filter((id) => id !== item._id) : [...current, item._id])}><span className="manual-clothing-photo"><ItemThumb item={item} large /><span className="manual-clothing-check">{selectedIds.includes(item._id) ? <Check size={15} /> : <Plus size={15} />}</span></span><span className="manual-clothing-name">{item.name}</span><span className="manual-clothing-category">{item.gender || 'Unisex'} · {item.category}</span></button>)}</div><div className="manual-selection-footer"><span>{selectedCount} selected{selectedAccessoryCount ? ` · ${selectedAccessoryCount} accessories` : ''}</span><Button onClick={createSelectedOutfit} disabled={!selectedCount}><Check size={16} /> Create outfit</Button></div></>
          : <div className="recommend-empty"><div className="closet-art"><div className="closet-glow" /><div className="hanger"><Shirt size={91} strokeWidth={.9} /></div><div className="sparkle s-one">✦</div><div className="sparkle s-two">✧</div><div className="sparkle s-three">✧</div></div><h3>Good style starts with what you own.</h3><p>Pick your plans and we’ll put together a complete look from the pieces already in your wardrobe.</p>{items.length ? <span className="wardrobe-ready"><Check size={14} /> {items.length} pieces ready to style</span> : <Button secondary onClick={() => setPage('wardrobe')}><Plus size={15} /> View wardrobe</Button>}</div>}
      </section>
    </div>
  </>
}

function SavedOutfits({ outfits, token, loadData, notify, setPage }) {
  const [showFavorites, setShowFavorites] = useState(false)
  const filtered = outfits.filter((outfit) => !showFavorites || outfit.favorite)
  const [calendarModal, setCalendarModal] = useState(null)
  const toggle = async (outfit) => {
    try { await api(`/outfits/${outfit._id}`, { token, ...json('PUT', { favorite: !outfit.favorite }) }); await loadData() } catch (e) { notify(e.message, 'error') }
  }
  const remove = async (outfit) => {
    if (!window.confirm(`Delete "${outfit.name}"?`)) return
    try { await api(`/outfits/${outfit._id}`, { token, method: 'DELETE' }); await loadData(); notify('Outfit deleted.') } catch (e) { notify(e.message, 'error') }
  }
  return <>
    <PageHeading eyebrow="THE LOOKS YOU LOVE, ON REPEAT" title="Saved outfits" description="Your own little lookbook, ready whenever you are." action={<Button onClick={() => setPage('planner')}><Sparkles size={16} /> Create an outfit</Button>} />
    <div className="saved-toolbar"><span>{outfits.length} {outfits.length === 1 ? 'outfit' : 'outfits'} saved</span><button className={`filter-chip ${showFavorites ? 'chip-active' : ''}`} onClick={() => setShowFavorites(!showFavorites)}><Heart size={15} fill={showFavorites ? 'currentColor' : 'none'} /> Favorites</button></div>
    {filtered.length ? <div className="saved-grid">{filtered.map((outfit) => <article className="saved-card" key={outfit._id}><div className="saved-card-images">{outfit.items?.slice(0, 3).map((item) => <ItemThumb key={item._id} item={item} large />)}{!outfit.items?.length && <div className="saved-placeholder"><Shirt size={32} /></div>}<button className={`saved-heart ${outfit.favorite ? 'hearted' : ''}`} onClick={() => toggle(outfit)}><Heart size={17} fill={outfit.favorite ? 'currentColor' : 'none'} /></button></div><div className="saved-card-body"><div className="eyebrow">{outfit.occasion} · {outfit.style}</div><h3>{outfit.name}</h3><p>{outfit.items?.length || 0} pieces <span>·</span> {outfit.wornCount || 0} wears</p><div className="saved-card-actions"><button onClick={() => setCalendarModal(outfit)}><CalendarDays size={15} /> Plan this look</button><button className="delete-outfit" onClick={() => remove(outfit)} title="Delete outfit"><Trash2 size={15} /></button></div></div></article>)}</div> : <EmptyState icon={Sparkles} title={showFavorites ? 'No favorite looks yet.' : 'Your lookbook is a blank canvas.'} text={showFavorites ? 'Tap the heart on an outfit to keep it close.' : 'Use the outfit planner to create looks from the clothes you own.'} action={!showFavorites ? <Button onClick={() => setPage('planner')}><Sparkles size={16} /> Start planning</Button> : null} />}
    {calendarModal && <ScheduleModal outfit={calendarModal} token={token} onClose={() => setCalendarModal(null)} onSaved={async () => { setCalendarModal(null); await loadData(); notify('Outfit added to your calendar.') }} notify={notify} />}
  </>
}
function ScheduleModal({ outfit, token, onClose, onSaved, notify }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [allowMultiple, setAllowMultiple] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    try { await api('/calendar', { token, ...json('POST', { outfit: outfit._id, date, allowMultiple }) }); onSaved() } catch (error) {
      if (error.message.includes('already an outfit')) {
        const multiple = window.confirm('There is already an outfit planned for this date. Add another one anyway?')
        if (multiple) { try { await api('/calendar', { token, ...json('POST', { outfit: outfit._id, date, allowMultiple: true }) }); onSaved() } catch (e2) { notify(e2.message, 'error') } }
      } else notify(error.message, 'error')
    }
  }
  return <div className="modal-backdrop"><form className="modal schedule-modal" onSubmit={submit}><div className="modal-heading"><div><div className="eyebrow">MAKE A PLAN</div><h2>Add to your calendar</h2></div><button type="button" className="icon-btn" onClick={onClose}><X size={18} /></button></div><p>{outfit.name}</p><label>Date<input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></label><label className="favorite-check"><input type="checkbox" checked={allowMultiple} onChange={(e) => setAllowMultiple(e.target.checked)} /><span>Allow more than one outfit on this date</span></label><div className="modal-actions"><Button type="submit"><CalendarDays size={16} /> Add to calendar</Button><Button secondary onClick={onClose}>Cancel</Button></div></form></div>
}

function CalendarPage({ calendar, outfits, token, notify, loadData }) {
  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [viewMode, setViewMode] = useState('month')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [schedule, setSchedule] = useState(false)
  const [selectedOutfit, setSelectedOutfit] = useState('')
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const calendarStart = new Date(month.getFullYear(), month.getMonth(), 1 - firstDay)
  const visibleDays = Array.from({ length: viewMode === 'month' ? 42 : 7 }, (_, i) => { const date = new Date(calendarStart); date.setDate(calendarStart.getDate() + i); return date })
  const entriesOn = (date) => calendar.filter((entry) => new Date(entry.date).toDateString() === date.toDateString())
  const selectedEntries = calendar.filter((entry) => new Date(entry.date).toISOString().slice(0, 10) === selectedDate)
  const move = (offset) => setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1))
  const remove = async (entry) => {
    try { await api(`/calendar/${entry._id}`, { token, method: 'DELETE' }); await loadData(); notify('Outfit removed from your calendar.') } catch (e) { notify(e.message, 'error') }
  }
  const worn = async (entry) => {
    try { await api(`/calendar/${entry._id}`, { token, ...json('PUT', { worn: !entry.worn }) }); await loadData(); notify(entry.worn ? 'Marked as planned again.' : 'Looking good. Marked as worn!') } catch (e) { notify(e.message, 'error') }
  }
  const createPlan = async (e) => {
    e.preventDefault()
    if (!selectedOutfit) return
    try {
      await api('/calendar', { token, ...json('POST', { outfit: selectedOutfit, date: selectedDate }) })
      await loadData(); setSchedule(false); setSelectedOutfit(''); notify('Outfit added to your calendar.')
    } catch (error) {
      if (error.message.includes('already an outfit')) {
        const multiple = window.confirm('There is already an outfit planned for this date. Add another one anyway?')
        if (multiple) {
          try { await api('/calendar', { token, ...json('POST', { outfit: selectedOutfit, date: selectedDate, allowMultiple: true }) }); await loadData(); setSchedule(false); notify('Another outfit added to your calendar.') } catch (e2) { notify(e2.message, 'error') }
        }
      } else notify(error.message, 'error')
    }
  }
  return <>
    <PageHeading eyebrow="A LITTLE LOOK AHEAD" title="Outfit calendar" description="A good outfit is one less thing to think about." action={<Button onClick={() => setSchedule(true)} disabled={!outfits.length}><Plus size={16} /> Plan a look</Button>} />
    <div className="calendar-layout"><section className="panel calendar-panel"><div className="calendar-toolbar"><div className="month-nav"><button onClick={() => move(-1)}><ChevronLeft size={18} /></button><h2>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2><button onClick={() => move(1)}><ChevronRight size={18} /></button><button className="today-button" onClick={() => { setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); setSelectedDate(new Date().toISOString().slice(0, 10)) }}>Today</button></div><div className="view-switch"><button className={viewMode === 'month' ? 'selected' : ''} onClick={() => setViewMode('month')}>Month</button><button className={viewMode === 'week' ? 'selected' : ''} onClick={() => setViewMode('week')}>Week</button></div></div>
      <div className="calendar-grid"><div className="weekday-row">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-days">{visibleDays.map((date, index) => {
        const dayEntries = entriesOn(date)
        const key = date.toISOString().slice(0, 10)
        const currentMonth = date.getMonth() === month.getMonth()
        return <button key={`${key}-${index}`} className={`calendar-day ${!currentMonth && viewMode === 'month' ? 'other-month' : ''} ${selectedDate === key ? 'selected-day' : ''} ${key === new Date().toISOString().slice(0, 10) ? 'today-day' : ''}`} onClick={() => setSelectedDate(key)}><span className="day-number">{date.getDate()}</span>{dayEntries.slice(0, 2).map((entry) => <span className={`calendar-tag ${entry.worn ? 'tag-worn' : ''}`} key={entry._id}>{entry.outfit?.name}</span>)}{dayEntries.length > 2 && <span className="more-plans">+{dayEntries.length - 2} more</span>}</button>
      })}</div></div><div className="calendar-legend"><span><i className="legend-dot planned" /> Planned</span><span><i className="legend-dot worn" /> Worn</span></div>
    </section>
    <aside className="panel day-panel"><div className="day-panel-heading"><div className="eyebrow">YOUR DAY, YOUR WAY</div><h2>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2><p>{selectedEntries.length ? `${selectedEntries.length} ${selectedEntries.length === 1 ? 'look' : 'looks'} planned` : 'Nothing planned just yet'}</p></div>
      {selectedEntries.length ? <div className="day-outfits">{selectedEntries.map((entry) => <div className={`day-outfit-card ${entry.worn ? 'done' : ''}`} key={entry._id}><div className="day-outfit-images">{entry.outfit?.items?.slice(0, 3).map((item) => <ItemThumb item={item} key={item._id} />)}</div><div className="day-outfit-copy"><span>{entry.outfit?.occasion} · {entry.outfit?.style}</span><b>{entry.outfit?.name}</b><small>{entry.outfit?.items?.length || 0} pieces</small></div><div className="day-card-actions"><button title={entry.worn ? 'Mark planned' : 'Mark worn'} onClick={() => worn(entry)}>{entry.worn ? <Check size={16} /> : <Heart size={16} />}</button><button title="Remove from calendar" onClick={() => remove(entry)}><Trash2 size={15} /></button></div><span className="worn-status">{entry.worn ? 'WORN' : 'PLANNED'}</span></div>)}</div> : <div className="day-empty"><div className="day-empty-icon"><CalendarDays size={26} /></div><h3>Make a little plan.</h3><p>Set aside an outfit for a day that matters.</p>{outfits.length ? <Button secondary onClick={() => setSchedule(true)}><Plus size={15} /> Add an outfit</Button> : <p className="small-hint">Save an outfit first, then plan it here.</p>}</div>}
      <div className="worn-history"><div><h3>Worn so far</h3><span>{calendar.filter((x) => x.worn).length} looks</span></div>{calendar.filter((x) => x.worn).slice(0, 2).map((entry) => <div className="history-row" key={entry._id}><Check size={14} /><span>{entry.outfit?.name}</span><small>{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small></div>)}</div>
    </aside></div>
    {schedule && <div className="modal-backdrop"><form className="modal schedule-modal" onSubmit={createPlan}><div className="modal-heading"><div><div className="eyebrow">MAKE A PLAN</div><h2>Schedule an outfit</h2></div><button type="button" className="icon-btn" onClick={() => setSchedule(false)}><X size={18} /></button></div><label>Saved outfit<select required value={selectedOutfit} onChange={(e) => setSelectedOutfit(e.target.value)}><option value="">Choose a look</option>{outfits.map((x) => <option key={x._id} value={x._id}>{x.name}</option>)}</select></label><label>Date<input type="date" required value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} /></label><div className="modal-actions"><Button type="submit"><CalendarDays size={16} /> Add to calendar</Button><Button secondary onClick={() => setSchedule(false)}>Cancel</Button></div></form></div>}
  </>
}

function Profile({ user, token, notify, loadData }) {
  const [form, setForm] = useState({ name: user?.name || '', city: user?.preferences?.city || '', style: user?.preferences?.style || 'Minimal' })
  useEffect(() => setForm({ name: user?.name || '', city: user?.preferences?.city || '', style: user?.preferences?.style || 'Minimal' }), [user])
  const submit = async (e) => {
    e.preventDefault()
    try { await api('/auth/me', { token, ...json('PUT', form) }); await loadData(); notify('Your preferences are saved.') } catch (error) { notify(error.message, 'error') }
  }
  return <>  <PageHeading eyebrow="A LITTLE MORE ABOUT YOU" title="Your profile" description="Make Trend Makers feel a little more like your own." /><div className="profile-layout"><section className="panel profile-panel"><div className="profile-avatar">{user?.name?.slice(0, 1)?.toUpperCase() || 'W'}</div><div className="eyebrow">YOUR ACCOUNT</div><h2>Personal details</h2><p>Just the essentials, kept in one place.</p><form className="profile-form" onSubmit={submit}><label>Your name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Email address<input disabled value={user?.email || ''} /></label><label>Your city <span className="optional">(for local weather)</span><input placeholder="e.g. New York" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label><label>Go-to style<select value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })}>{styles.map((x) => <option key={x}>{x}</option>)}</select></label><Button type="submit"><Check size={16} /> Save preferences</Button></form></section><section className="panel privacy-panel"><div className="privacy-icon"><CircleHelp size={20} /></div><h3>Your style is personal.</h3><p>Your wardrobe and outfit plans are private to your account. We never share your personal closet data.</p><div className="privacy-detail"><Check size={16} /><span>Your data is tied to your account</span></div><div className="privacy-detail"><Check size={16} /><span>Your password is securely hashed</span></div><div className="privacy-detail"><Check size={16} /><span>Your preloaded wardrobe is ready to style</span></div></section></div></>
}

export default App
