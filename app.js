const STORAGE_KEY = 'personal_workbench_v1';

const navigation = {
  media: {
    label: '自媒体', icon: '🎀',
    children: [
      { id: 'shoot', label: '待拍', icon: '📸' },
      { id: 'food', label: '美食', icon: '🧁' },
      { id: 'parcel', label: '快递', icon: '🎁' },
      { id: 'copy', label: '文案', icon: '📝' },
    ]
  },
  schedule: {
    label: '日程', icon: '🌷',
    children: [
      { id: 'year', label: '年日程', icon: '🗓️' },
      { id: 'month', label: '月日程', icon: '🌙' },
      { id: 'week', label: '周日程', icon: '📅' },
      { id: 'today', label: '今日日程', icon: '☀️' },
    ]
  },
  health: {
    label: '健康', icon: '🫧',
    children: [
      { id: 'exerciseLog', label: '运动记录', icon: '👟' },
      { id: 'exerciseTime', label: '运动时间', icon: '⏳' },
    ]
  },
  reading: {
    label: '阅读', icon: '🕊️',
    children: [
      { id: 'booklist', label: '书单', icon: '📖' },
      { id: 'readingCalendar', label: '阅读年历', icon: '🌼' },
    ]
  }
};

const defaultData = {
  todos: { shoot: [], food: [], parcel: [] },
  folders: [{ id: crypto.randomUUID(), name: '默认文件夹', notes: [] }],
  schedule: [],
  scheduleTodos: { month: [], week: [] },
  exercises: [],
  books: [],
  readingDays: {}
};

let state = loadState();
let currentMain = 'media';
let currentSub = 'shoot';
let currentFolderId = null;
let readingCalendarDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

const appContent = document.getElementById('appContent');
const mainNav = document.getElementById('mainNav');
const subNav = document.getElementById('subNav');
const pageTitle = document.getElementById('pageTitle');
const quickAddBtn = document.getElementById('quickAddBtn');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');

document.getElementById('closeModalBtn').onclick = closeModal;
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
quickAddBtn.onclick = handleQuickAdd;

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultData);
  try { return { ...structuredClone(defaultData), ...JSON.parse(raw) }; }
  catch { return structuredClone(defaultData); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function renderNav() {
  const mains = Object.entries(navigation);
  mainNav.style.gridTemplateColumns = `repeat(${mains.length},1fr)`;
  mainNav.innerHTML = mains.map(([id, item]) => `
    <button class="nav-btn ${id === currentMain ? 'active' : ''}" data-main="${id}">
      <span class="nav-icon">${item.icon}</span><span class="nav-label">${item.label}</span>
    </button>`).join('');
  mainNav.querySelectorAll('[data-main]').forEach(btn => btn.onclick = () => {
    currentMain = btn.dataset.main;
    currentSub = navigation[currentMain].children[0].id;
    currentFolderId = null;
    render();
  });

  const children = navigation[currentMain].children;
  subNav.innerHTML = children.map(item => `
    <button class="nav-btn ${item.id === currentSub ? 'active' : ''}" data-sub="${item.id}">
      <span class="nav-icon">${item.icon}</span><span class="nav-label">${item.label}</span>
    </button>`).join('');
  subNav.querySelectorAll('[data-sub]').forEach(btn => btn.onclick = () => {
    currentSub = btn.dataset.sub;
    currentFolderId = null;
    render();
  });
}

function render() {
  renderNav();
  const main = navigation[currentMain];
  const sub = main.children.find(x => x.id === currentSub);
  pageTitle.textContent = `${main.label} · ${sub.label}`;
  quickAddBtn.style.display = 'block';

  if (currentMain === 'media') renderMedia();
  if (currentMain === 'schedule') renderSchedule();
  if (currentMain === 'health') renderHealth();
  if (currentMain === 'reading') renderReading();
}

function renderMedia() {
  if (['shoot','food','parcel'].includes(currentSub)) return renderTodoList(currentSub);
  if (currentSub === 'copy') return renderCopywriting();
}

function renderTodoList(type) {
  const labels = { shoot: ['待拍清单','记录接下来准备拍摄的内容'], food: ['美食清单','记录想吃、想探店或想制作的美食'], parcel: ['快递清单','记录待取、待寄或等待中的快递'] };
  const list = state.todos[type] || [];
  appContent.innerHTML = `
    <section class="hero-card"><h2>${labels[type][0]}</h2><p>${labels[type][1]}，完成后直接勾选。</p></section>
    <div class="section-title"><h2>全部事项</h2><span>${list.filter(x=>x.done).length}/${list.length} 已完成</span></div>
    <div class="card-list">${list.length ? list.map(todo => `
      <div class="card ${todo.done ? 'done' : ''}">
        <div class="card-row">
          <input class="todo-check" type="checkbox" ${todo.done ? 'checked' : ''} data-toggle-todo="${todo.id}">
          <div class="grow"><h3>${escapeHtml(todo.title)}</h3>${todo.note ? `<p>${escapeHtml(todo.note)}</p>` : ''}</div>
          <button class="icon-btn danger" data-delete-todo="${todo.id}">×</button>
        </div>
      </div>`).join('') : emptyHtml('✓','这里还没有事项，点右上角＋新建。')}</div>`;

  appContent.querySelectorAll('[data-toggle-todo]').forEach(el => el.onchange = () => {
    const item = state.todos[type].find(x => x.id === el.dataset.toggleTodo);
    item.done = el.checked; saveState(); render();
  });
  appContent.querySelectorAll('[data-delete-todo]').forEach(el => el.onclick = () => {
    state.todos[type] = state.todos[type].filter(x => x.id !== el.dataset.deleteTodo);
    saveState(); render();
  });
}

function renderCopywriting() {
  if (currentFolderId) return renderFolderNotes();
  appContent.innerHTML = `
    <section class="hero-card"><h2>文案资料库</h2><p>先创建文件夹，再在文件夹里建立不同备忘录。内容会自动保存在本机。</p></section>
    <div class="section-title"><h2>文件夹</h2><span>${state.folders.length} 个</span></div>
    <div class="folder-grid">${state.folders.map(folder => `
      <button class="folder" data-folder="${folder.id}">
        <span class="folder-icon">📁</span>
        <div><h3>${escapeHtml(folder.name)}</h3><p>${folder.notes.length} 条备忘录</p></div>
      </button>`).join('')}</div>`;
  appContent.querySelectorAll('[data-folder]').forEach(btn => btn.onclick = () => { currentFolderId = btn.dataset.folder; render(); });
}

function renderFolderNotes() {
  const folder = state.folders.find(f => f.id === currentFolderId);
  if (!folder) { currentFolderId = null; return render(); }
  pageTitle.textContent = `文案 · ${folder.name}`;
  appContent.innerHTML = `
    <button class="text-btn" id="backFoldersBtn">‹ 返回文件夹</button>
    <div class="section-title"><h2>${escapeHtml(folder.name)}</h2><span>${folder.notes.length} 条</span></div>
    <div class="card-list">${folder.notes.length ? folder.notes.map(note => `
      <button class="card" data-note="${note.id}" style="text-align:left;border:0;width:100%">
        <h3>${escapeHtml(note.title)}</h3>
        <p class="note-preview">${escapeHtml(note.content || '暂无内容')}</p>
      </button>`).join('') : emptyHtml('✎','这个文件夹还没有备忘录。')}</div>`;
  document.getElementById('backFoldersBtn').onclick = () => { currentFolderId = null; render(); };
  appContent.querySelectorAll('[data-note]').forEach(btn => btn.onclick = () => openNoteEditor(folder.id, btn.dataset.note));
}

function renderSchedule() {
  const now = new Date();
  const filtered = state.schedule.filter(item => {
    const d = new Date(item.date + 'T00:00:00');
    if (currentSub === 'today') return item.date === formatDate(now);
    if (currentSub === 'week') return sameWeek(d, now);
    if (currentSub === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    return d.getFullYear() === now.getFullYear();
  }).sort((a,b) => (a.date+(a.time||'')).localeCompare(b.date+(b.time||'')));

  const titles = { year:'本年度安排', month:'本月安排', week:'本周安排', today:'今天安排' };
  const todoType = ['month','week'].includes(currentSub) ? currentSub : null;
  const periodKey = todoType === 'month' ? formatDate(now).slice(0,7) : todoType === 'week' ? getWeekKey(now) : '';
  const periodTodos = todoType ? (state.scheduleTodos?.[todoType] || []).filter(x => x.period === periodKey) : [];
  const todoTitle = todoType === 'month' ? '本月 Todo' : '本周 Todo';

  appContent.innerHTML = `
    <section class="hero-card"><h2>${titles[currentSub]}</h2><p>${todoType ? '没有明确日期的事情放在 Todo，有具体日期和时间的安排放在日程。' : '按日期和时间记录安排，时间会显示在内容上方。'}</p></section>
    ${todoType ? `
      <div class="section-title"><h2>${todoTitle}</h2><span>${periodTodos.filter(x=>x.done).length}/${periodTodos.length} 已完成</span></div>
      <div class="card-list schedule-todo-list">${periodTodos.length ? periodTodos.map(todo => `
        <div class="card ${todo.done ? 'done' : ''}"><div class="card-row">
          <input class="todo-check" type="checkbox" ${todo.done ? 'checked' : ''} data-toggle-schedule-todo="${todo.id}">
          <div class="grow"><h3>${escapeHtml(todo.title)}</h3>${todo.note ? `<p>${escapeHtml(todo.note)}</p>` : ''}</div>
          <button class="icon-btn danger" data-delete-schedule-todo="${todo.id}">×</button>
        </div></div>`).join('') : emptyHtml('✓',`还没有${todoTitle}，点右上角＋添加。`)}</div>
      <div class="section-title schedule-section-title"><h2>具体日程</h2><span>${filtered.length} 项</span></div>` : '<div class="section-title"><h2>具体日程</h2><span>'+filtered.length+' 项</span></div>'}
    <div class="card-list">${filtered.length ? filtered.map(item => `
      <div class="card schedule-card"><div class="card-row">
        <div class="grow">
          <div class="schedule-time">${formatScheduleDate(item.date, currentSub)}${item.time ? `<strong>${item.time}</strong>` : '<strong>全天</strong>'}</div>
          <h3>${escapeHtml(item.title)}</h3>
          ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ''}
        </div>
        <button class="icon-btn danger" data-delete-schedule="${item.id}">×</button>
      </div></div>`).join('') : emptyHtml('◫','当前视图还没有具体日程。')}</div>`;

  appContent.querySelectorAll('[data-delete-schedule]').forEach(btn => btn.onclick = () => {
    state.schedule = state.schedule.filter(x=>x.id!==btn.dataset.deleteSchedule); saveState(); render();
  });
  appContent.querySelectorAll('[data-toggle-schedule-todo]').forEach(el => el.onchange = () => {
    const list = state.scheduleTodos[todoType];
    const item = list.find(x => x.id === el.dataset.toggleScheduleTodo);
    if (item) item.done = el.checked;
    saveState(); render();
  });
  appContent.querySelectorAll('[data-delete-schedule-todo]').forEach(btn => btn.onclick = () => {
    state.scheduleTodos[todoType] = state.scheduleTodos[todoType].filter(x => x.id !== btn.dataset.deleteScheduleTodo);
    saveState(); render();
  });
}

function renderHealth() {
  if (currentSub === 'exerciseLog') {
    appContent.innerHTML = `
      <section class="hero-card"><h2>运动记录</h2><p>记录运动类型、日期、时长和感受。</p></section>
      <div class="card-list">${state.exercises.length ? [...state.exercises].reverse().map(item => `
        <div class="card"><div class="card-row"><div class="grow"><h3>${escapeHtml(item.type)}</h3><p>${item.date} · ${item.minutes} 分钟${item.note ? '<br>'+escapeHtml(item.note) : ''}</p></div><button class="icon-btn danger" data-delete-exercise="${item.id}">×</button></div></div>`).join('') : emptyHtml('🏃','还没有运动记录。')}</div>`;
    appContent.querySelectorAll('[data-delete-exercise]').forEach(btn => btn.onclick = () => { state.exercises = state.exercises.filter(x=>x.id!==btn.dataset.deleteExercise); saveState(); render(); });
  } else {
    const total = state.exercises.reduce((s,x)=>s+Number(x.minutes||0),0);
    const thisMonth = state.exercises.filter(x => x.date.startsWith(formatDate(new Date()).slice(0,7))).reduce((s,x)=>s+Number(x.minutes||0),0);
    const days = new Set(state.exercises.map(x=>x.date)).size;
    appContent.innerHTML = `
      <section class="hero-card"><h2>运动时间统计</h2><p>自动汇总所有运动记录中的时长。</p></section>
      <div class="stat-grid">
        <div class="stat-card"><span>累计运动</span><strong>${total}</strong><span>分钟</span></div>
        <div class="stat-card"><span>本月运动</span><strong>${thisMonth}</strong><span>分钟</span></div>
        <div class="stat-card"><span>运动天数</span><strong>${days}</strong><span>天</span></div>
        <div class="stat-card"><span>平均每次</span><strong>${state.exercises.length ? Math.round(total/state.exercises.length) : 0}</strong><span>分钟</span></div>
      </div>`;
    quickAddBtn.style.display = 'none';
  }
}

function renderReading() {
  if (currentSub === 'booklist') {
    appContent.innerHTML = `
      <section class="hero-card"><h2>我的书单</h2><p>记录想读、在读和已读书籍，并标记阅读进度。</p></section>
      <div class="card-list">${state.books.length ? state.books.map(book => `
        <div class="card"><div class="card-row"><div class="grow"><h3>${escapeHtml(book.title)}</h3><p>${escapeHtml(book.author || '作者未填写')} · ${book.status}</p><div class="progress"><div style="width:${Number(book.progress)||0}%"></div></div></div><button class="icon-btn danger" data-delete-book="${book.id}">×</button></div></div>`).join('') : emptyHtml('📚','还没有添加书籍。')}</div>`;
    appContent.querySelectorAll('[data-delete-book]').forEach(btn => btn.onclick = () => { state.books = state.books.filter(x=>x.id!==btn.dataset.deleteBook); saveState(); render(); });
  } else {
    const year = readingCalendarDate.getFullYear();
    const month = readingCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = firstDay.getDay();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthReadCount = Object.entries(state.readingDays).filter(([date, read]) => read && date.startsWith(monthPrefix)).length;
    const cells = [];
    for (let i = 0; i < leadingBlanks; i++) cells.push('<span class="day-cell blank"></span>');
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${monthPrefix}-${String(day).padStart(2, '0')}`;
      cells.push(`<button class="day-cell ${state.readingDays[date] ? 'read' : ''}" data-reading-day="${date}" title="${date}">${day}</button>`);
    }
    appContent.innerHTML = `
      <section class="hero-card"><h2>${year} 阅读年历</h2><p>按月份查看，点击日期即可标记当天完成阅读。</p></section>
      <div class="calendar-toolbar">
        <button class="calendar-arrow" id="prevReadingMonth" aria-label="上个月">‹</button>
        <h2>${year} 年 ${month + 1} 月</h2>
        <button class="calendar-arrow" id="nextReadingMonth" aria-label="下个月">›</button>
      </div>
      <div class="section-title"><h2>本月记录</h2><span>${monthReadCount} 天</span></div>
      <div class="weekday-row"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
      <div class="calendar-grid">${cells.join('')}</div>`;
    document.getElementById('prevReadingMonth').onclick = () => { readingCalendarDate = new Date(year, month - 1, 1); render(); };
    document.getElementById('nextReadingMonth').onclick = () => { readingCalendarDate = new Date(year, month + 1, 1); render(); };
    appContent.querySelectorAll('[data-reading-day]').forEach(btn => btn.onclick = () => {
      const d = btn.dataset.readingDay;
      state.readingDays[d] = !state.readingDays[d];
      saveState();
      render();
    });
    quickAddBtn.style.display = 'none';
  }
}

function handleQuickAdd() {
  if (currentMain === 'media' && ['shoot','food','parcel'].includes(currentSub)) return openTodoModal(currentSub);
  if (currentMain === 'media' && currentSub === 'copy') return currentFolderId ? openNoteEditor(currentFolderId) : openFolderModal();
  if (currentMain === 'schedule') return ['month','week'].includes(currentSub) ? openScheduleChoiceModal() : openScheduleModal();
  if (currentMain === 'health' && currentSub === 'exerciseLog') return openExerciseModal();
  if (currentMain === 'reading' && currentSub === 'booklist') return openBookModal();
}

function openTodoModal(type) {
  openModal('新建事项', `
    <form id="todoForm"><div class="form-group"><label>事项名称</label><input class="input" name="title" required placeholder="例如：拍摄夏日穿搭视频"></div><div class="form-group"><label>备注（可选）</label><textarea class="textarea" name="note" placeholder="补充地点、要求或准备物品"></textarea></div><button class="primary-btn">保存</button></form>`);
  document.getElementById('todoForm').onsubmit = e => { e.preventDefault(); const fd=new FormData(e.target); state.todos[type].push({id:crypto.randomUUID(),title:fd.get('title').trim(),note:fd.get('note').trim(),done:false}); saveState(); closeModal(); render(); };
}
function openFolderModal() {
  openModal('新建文件夹', `<form id="folderForm"><div class="form-group"><label>文件夹名称</label><input class="input" name="name" required placeholder="例如：小红书文案"></div><button class="primary-btn">创建文件夹</button></form>`);
  document.getElementById('folderForm').onsubmit = e => { e.preventDefault(); const name=new FormData(e.target).get('name').trim(); state.folders.push({id:crypto.randomUUID(),name,notes:[]}); saveState(); closeModal(); render(); };
}
function openNoteEditor(folderId, noteId=null) {
  const folder=state.folders.find(f=>f.id===folderId); const note=noteId ? folder.notes.find(n=>n.id===noteId) : null;
  openModal(note ? '编辑备忘录' : '新建备忘录', `<form id="noteForm"><div class="form-group"><label>标题</label><input class="input" name="title" required value="${note ? escapeAttr(note.title) : ''}" placeholder="备忘录标题"></div><div class="form-group"><label>内容</label><textarea class="textarea" name="content" placeholder="开始记录……">${note ? escapeHtml(note.content) : ''}</textarea></div><button class="primary-btn">保存备忘录</button>${note ? '<button type="button" id="deleteNoteBtn" class="secondary-btn">删除这条备忘录</button>' : ''}</form>`);
  document.getElementById('noteForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);if(note){note.title=fd.get('title').trim();note.content=fd.get('content');}else{folder.notes.push({id:crypto.randomUUID(),title:fd.get('title').trim(),content:fd.get('content'),updatedAt:Date.now()});}saveState();closeModal();render();};
  if(note) document.getElementById('deleteNoteBtn').onclick=()=>{folder.notes=folder.notes.filter(n=>n.id!==note.id);saveState();closeModal();render();};
}
function openScheduleChoiceModal() {
  const label = currentSub === 'month' ? '月 Todo' : '周 Todo';
  openModal('添加安排', `<div class="choice-grid"><button class="choice-card" id="addTodoChoice"><span>✓</span><strong>添加${label}</strong><small>适合还没有确定具体日期的事情</small></button><button class="choice-card" id="addScheduleChoice"><span>◫</span><strong>添加具体日程</strong><small>适合已经确定日期或时间的安排</small></button></div>`);
  document.getElementById('addTodoChoice').onclick = () => openScheduleTodoModal(currentSub);
  document.getElementById('addScheduleChoice').onclick = () => openScheduleModal();
}
function openScheduleTodoModal(type) {
  const now = new Date();
  const period = type === 'month' ? formatDate(now).slice(0,7) : getWeekKey(now);
  const label = type === 'month' ? '月 Todo' : '周 Todo';
  openModal(`新建${label}`, `<form id="scheduleTodoForm"><div class="form-group"><label>事项名称</label><input class="input" name="title" required placeholder="例如：整理本月选题"></div><div class="form-group"><label>备注（可选）</label><textarea class="textarea" name="note" placeholder="可以补充目标、准备事项等"></textarea></div><button class="primary-btn">保存${label}</button></form>`);
  document.getElementById('scheduleTodoForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);state.scheduleTodos=state.scheduleTodos||{month:[],week:[]};state.scheduleTodos[type]=state.scheduleTodos[type]||[];state.scheduleTodos[type].push({id:crypto.randomUUID(),title:fd.get('title').trim(),note:fd.get('note').trim(),done:false,period});saveState();closeModal();render();};
}
function openScheduleModal() {
  openModal('新建日程', `<form id="scheduleForm"><div class="form-group"><label>日程名称</label><input class="input" name="title" required></div><div class="form-group"><label>日期</label><input class="input" type="date" name="date" required value="${formatDate(new Date())}"></div><div class="form-group"><label>时间（可选）</label><input class="input" type="time" name="time"></div><div class="form-group"><label>备注</label><textarea class="textarea" name="note"></textarea></div><button class="primary-btn">保存日程</button></form>`);
  document.getElementById('scheduleForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);state.schedule.push({id:crypto.randomUUID(),title:fd.get('title').trim(),date:fd.get('date'),time:fd.get('time'),note:fd.get('note').trim()});saveState();closeModal();render();};
}
function openExerciseModal() {
  openModal('记录运动', `<form id="exerciseForm"><div class="form-group"><label>运动类型</label><input class="input" name="type" required placeholder="例如：散步、瑜伽、跑步"></div><div class="form-group"><label>日期</label><input class="input" type="date" name="date" required value="${formatDate(new Date())}"></div><div class="form-group"><label>时长（分钟）</label><input class="input" type="number" name="minutes" min="1" required></div><div class="form-group"><label>备注</label><textarea class="textarea" name="note"></textarea></div><button class="primary-btn">保存记录</button></form>`);
  document.getElementById('exerciseForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);state.exercises.push({id:crypto.randomUUID(),type:fd.get('type').trim(),date:fd.get('date'),minutes:Number(fd.get('minutes')),note:fd.get('note').trim()});saveState();closeModal();render();};
}
function openBookModal() {
  openModal('添加书籍', `<form id="bookForm"><div class="form-group"><label>书名</label><input class="input" name="title" required></div><div class="form-group"><label>作者</label><input class="input" name="author"></div><div class="form-group"><label>状态</label><select class="select" name="status"><option>想读</option><option>在读</option><option>已读</option></select></div><div class="form-group"><label>阅读进度（0-100）</label><input class="input" type="number" name="progress" min="0" max="100" value="0"></div><button class="primary-btn">加入书单</button></form>`);
  document.getElementById('bookForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);state.books.push({id:crypto.randomUUID(),title:fd.get('title').trim(),author:fd.get('author').trim(),status:fd.get('status'),progress:Number(fd.get('progress'))});saveState();closeModal();render();};
}

function openModal(title, html) { modalTitle.textContent=title; modalBody.innerHTML=html; modal.classList.remove('hidden'); }
function closeModal() { modal.classList.add('hidden'); modalBody.innerHTML=''; }
function emptyHtml(icon,text){return `<div class="empty"><div class="empty-icon">${icon}</div><div>${text}</div></div>`;}
function formatDate(d){const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,'0');const day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;}
function sameWeek(a,b){const copy=d=>{const x=new Date(d);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);x.setHours(0,0,0,0);return x;};return copy(a).getTime()===copy(b).getTime();}
function getWeekKey(date){const d=new Date(date);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return formatDate(d);}
function formatScheduleDate(date, view){const d=new Date(date+'T00:00:00');const week=['周日','周一','周二','周三','周四','周五','周六'];if(view==='today') return '今天 · ';if(view==='week') return `${d.getMonth()+1}月${d.getDate()}日 ${week[d.getDay()]} · `;return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 · `;}
function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function escapeAttr(v=''){return escapeHtml(v);}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
render();
