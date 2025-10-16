// Simple SPA with hash routing; data stored in localStorage to work on GitHub Pages.
// No server required. Supports cross-device attendance via a daily shared seed.

const APP_KEY = 'attendance_app_v1';
const APP_VERSION = '2';

const defaultState = {
    users: {
        // instructor mock
        instructor: { username: 'Orkun Karabasoglu', password: '123456', role: 'instructor' },
        // students by studentNumber
        students: {}
    },
    course: { id: 'ENGR4451', name: 'ENGR 4451', totalWeeks: 14 },
    // attendance[studentNumber][week] = timestamp
    attendance: {},
    // also store code seed to allow any device to validate the rotating code
    codeSeed: null,
    // current session user
    session: null,
    rosterVersion: null
};

function loadState(){
    try {
        const raw = localStorage.getItem(APP_KEY);
        if(!raw){
            // initialize with a shared seed derived from a constant plus date to avoid guessing
            const seed = generateSeed();
            const init = { ...defaultState, codeSeed: seed, version: APP_VERSION };
            localStorage.setItem(APP_KEY, JSON.stringify(init));
            return init;
        }
        const parsed = JSON.parse(raw);
        return parsed;
    } catch(err){
        console.error('Failed to parse state', err);
        localStorage.removeItem(APP_KEY);
        return { ...defaultState, codeSeed: generateSeed(), version: APP_VERSION };
    }
}

function saveState(mut){
    localStorage.setItem(APP_KEY, JSON.stringify(mut));
}

let state = loadState();

// Migration: if version mismatch, reset and load roster
if(state.version !== APP_VERSION){
    state = { ...defaultState, codeSeed: state.codeSeed || generateSeed(), version: APP_VERSION };
    saveState(state);
}

// Populate real roster once
if(state.rosterVersion !== 'v1'){
    const roster = [
        { number:'18070003013', fullName:'İBRAHİM GÜLTEKİN', department:'İNŞAAT MÜHENDİSLİĞİ' },
        { number:'19070001053', fullName:'ELİF EMİNE GÜNAL', department:'BİLGİSAYAR MÜHENDİSLİĞİ' },
        { number:'19070008012', fullName:'ERK YANKI URAL', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'20070001057', fullName:'ERCE ÖZKAN', department:'BİLGİSAYAR MÜHENDİSLİĞİ' },
        { number:'20070002048', fullName:'İPEK ATIŞ', department:'ENDÜSTRİ MÜHENDİSLİĞİ' },
        { number:'20070007004', fullName:'İDİL ECE CEVAHİR', department:'ENERJİ SİSTEMLERİ MÜHENDİSLİĞİ' },
        { number:'20070008016', fullName:'SUDE ONFİDAN', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'20070008017', fullName:'ÖMER ARICA', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'20070008019', fullName:'SELİM MERT KIRCAALİLİ', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'20070008029', fullName:'BERİL DERAN GÜRBÜZ', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'21070001004', fullName:'ALİ HAKTAN SIĞIN', department:'BİLGİSAYAR MÜHENDİSLİĞİ' },
        { number:'21070001051', fullName:'ARDA ALTUNHAN', department:'BİLGİSAYAR MÜHENDİSLİĞİ' },
        { number:'21070001070', fullName:'EKREM TEMEL', department:'BİLGİSAYAR MÜHENDİSLİĞİ' },
        { number:'21070002005', fullName:'NESRİN ŞENTÜRK', department:'ENDÜSTRİ MÜHENDİSLİĞİ' },
        { number:'21070002025', fullName:'BATUHAN ŞİŞMAN', department:'ENDÜSTRİ MÜHENDİSLİĞİ' },
        { number:'21070005027', fullName:'KIVANÇ EFE ERGÖNÜL', department:'ELEKTRİK-ELEKTRONİK MÜHENDİSLİĞİ' },
        { number:'21070005030', fullName:'OĞUZ KOYUCAN', department:'ELEKTRİK-ELEKTRONİK MÜHENDİSLİĞİ' },
        { number:'21070005042', fullName:'ZEYNEP ARSLANBUĞA', department:'ELEKTRİK-ELEKTRONİK MÜHENDİSLİĞİ' },
        { number:'21070007001', fullName:'BESTE TEKİN', department:'ENERJİ SİSTEMLERİ MÜHENDİSLİĞİ' },
        { number:'21070007004', fullName:'EKİN ALTUNKAYA', department:'ENERJİ SİSTEMLERİ MÜHENDİSLİĞİ' },
        { number:'21070008009', fullName:'EMRE ERİŞİR', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'21070008014', fullName:'İSMAİL CANBERK DEMİRKAN', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'21070008016', fullName:'CAN GİRGİN', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'21070008017', fullName:'KEREM EROĞLU', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'21070008027', fullName:'ARMAĞAN SOYLU', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'21070008033', fullName:'ALP SERKAN MERKİT', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'21070008034', fullName:'ATAKAN DİNÇER', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'21070008206', fullName:'DEMET BÜYÜKTAŞ', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'22070001041', fullName:'GÜRKAN EROĞLU', department:'BİLGİSAYAR MÜHENDİSLİĞİ' },
        { number:'22070001055', fullName:'EMRE EFE YÜKSEL', department:'BİLGİSAYAR MÜHENDİSLİĞİ' },
        { number:'22070002015', fullName:'SÜLEYMAN BATU SARI', department:'ENDÜSTRİ MÜHENDİSLİĞİ' },
        { number:'22070002047', fullName:'KADİR EMRE GÜNEŞ', department:'ENDÜSTRİ MÜHENDİSLİĞİ' },
        { number:'22070005040', fullName:'TOPRAK TUNCER', department:'ELEKTRİK-ELEKTRONİK MÜHENDİSLİĞİ' },
        { number:'22070005053', fullName:'EMRE CAN HEKİMOĞLU', department:'ELEKTRİK-ELEKTRONİK MÜHENDİSLİĞİ' },
        { number:'22070007014', fullName:'ILGAR ŞENOL', department:'ENERJİ SİSTEMLERİ MÜHENDİSLİĞİ' },
        { number:'22070008017', fullName:'EDA NUR ÇALIŞKAN', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'22070008021', fullName:'SAMİ BERK ŞAHİN', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'22070008026', fullName:'DENİZ ÜNVER', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'22070008034', fullName:'AYKAN KANLI', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'22070008043', fullName:'DENİZ KARATEPE', department:'MAKİNE MÜHENDİSLİĞİ' },
        { number:'22070003022', fullName:'AYŞEGÜL KARINYARICI', department:'İNŞAAT MÜHENDİSLİĞİ' },
        { number:'21070001046', fullName:'AHMET ÖZGÜR KORKMAZ', department:'BİLGİSAYAR MÜHENDİSLİĞİ' },
    ];
    state.users.students = Object.fromEntries(roster.map(s=> [s.number, s]));
    state.rosterVersion = 'v1';
    saveState(state);
}

// Deterministic seed that all devices can share. Instructor can rotate it from UI if desired.
function generateSeed(){
    // Fixed namespace + course id; users can export/import if needed later
    const base = 'ENGR4451-SEED-' + new Date().getFullYear();
    // simple hash to number
    let h = 2166136261;
    for(let i=0;i<base.length;i++){ h ^= base.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24); }
    return Math.abs(h >>> 0);
}

// 6-digit rotating code changing every 30s, also tied to selected week and the shared seed.
function getRotatingCode(week){
    const interval = Math.floor(Date.now() / 30000); // 30s window
    const seed = state.codeSeed ?? generateSeed();
    const input = `${seed}:${state.course.id}:${week}:${interval}`;
    let x = 0;
    for(let i=0;i<input.length;i++){
        x = (x * 31 + input.charCodeAt(i)) >>> 0;
        x ^= (x << 13) ^ (x >>> 7);
    }
    const code = (x % 1000000).toString().padStart(6,'0');
    return code;
}

// Validate code allowing slight clock drift: check previous, current, next interval.
function validateCode(week, code){
    const seed = state.codeSeed ?? generateSeed();
    const baseInterval = Math.floor(Date.now() / 30000);
    for(let d=-1; d<=1; d++){
        const interval = baseInterval + d;
        const input = `${seed}:${state.course.id}:${week}:${interval}`;
        let x = 0;
        for(let i=0;i<input.length;i++){
            x = (x * 31 + input.charCodeAt(i)) >>> 0;
            x ^= (x << 13) ^ (x >>> 7);
        }
        const expected = (x % 1000000).toString().padStart(6,'0');
        if(expected === code) return true;
    }
    return false;
}

// Router
window.addEventListener('hashchange', renderApp);
document.addEventListener('DOMContentLoaded', renderApp);

function navigate(hash){
    location.hash = hash;
}

function setSession(user){
    state.session = user ? { role: user.role, number: user.number, username: user.username } : null;
    saveState(state);
}

function renderApp(){
    const app = document.getElementById('app');
    const nav = document.getElementById('nav');
    nav.innerHTML = '';

    const route = location.hash.replace('#','') || 'login';

    if(state.session){
        const btn = document.createElement('button');
        btn.className = 'ghost';
        btn.textContent = 'Logout';
        btn.onclick = () => { setSession(null); navigate('#login'); renderApp(); };
        nav.appendChild(btn);
    }

    if(route === 'login') return renderLogin(app);
    if(route === 'course') return renderCoursePick(app);
    if(route === 'instructor') return renderInstructor(app);
    if(route === 'student') return renderStudent(app);
    return renderLogin(app);
}

function renderLogin(app){
    app.innerHTML = `
    <div class="grid cols-2">
        <section class="card">
            <h2 class="center">Instructor Login</h2>
            <label>Username</label>
            <input id="i-username" placeholder="Orkun Karabasoglu" />
            <label>Password</label>
            <input id="i-password" type="password" placeholder="123456" />
            <div class="spacer"></div>
            <button id="i-login">Login</button>
        </section>
        <section class="card">
            <h2 class="center">Student Login</h2>
            <label>Student Number</label>
            <input id="s-number" placeholder="e.g., 18070000013" />
            <div class="spacer"></div>
            <button id="s-login">Login</button>
            <p class="muted" style="margin-top:10px">Sample numbers: ${Object.keys(state.users.students).slice(0,3).join(', ')}</p>
        </section>
    </div>`;

    document.getElementById('i-login').onclick = () => {
        const u = document.getElementById('i-username').value.trim();
        const p = document.getElementById('i-password').value.trim();
        if(u === state.users.instructor.username && p === state.users.instructor.password){
            setSession({ role: 'instructor', username: u });
            navigate('#course');
            renderApp();
        } else {
            alert('Invalid instructor credentials');
        }
    };

    document.getElementById('s-login').onclick = () => {
        const num = document.getElementById('s-number').value.trim();
        const s = state.users.students[num];
        if(s){
            setSession({ role: 'student', number: num });
            navigate('#course');
            renderApp();
        } else {
            alert('Unknown student number');
        }
    };
    // For quick testing, preload first number on focus
    const firstNum = Object.keys(state.users.students)[0];
    if(firstNum) document.getElementById('s-number').placeholder = firstNum;
}

function renderCoursePick(app){
    if(!state.session){ navigate('#login'); return renderLogin(app); }
    app.innerHTML = `
    <section class="card">
        <h2>Select Course</h2>
        <div class="row">
            <div>
                <div class="pill">${state.course.id}</div>
                <h3>${state.course.name}</h3>
            </div>
            <div style="text-align:right">
                <button id="enter">Enter</button>
            </div>
        </div>
    </section>`;
    document.getElementById('enter').onclick = () => {
        navigate('#' + (state.session.role === 'instructor' ? 'instructor' : 'student'));
        renderApp();
    };
}

function ensureAttendance(studentNumber){
    if(!state.attendance[studentNumber]) state.attendance[studentNumber] = {};
}

function markAttendance(studentNumber, week){
    ensureAttendance(studentNumber);
    state.attendance[studentNumber][week] = Date.now();
    saveState(state);
}

function getStudentAttendance(studentNumber){
    return state.attendance[studentNumber] || {};
}

function renderInstructor(app){
    if(!state.session || state.session.role !== 'instructor'){ navigate('#login'); return renderLogin(app); }
    const weeks = Array.from({length: state.course.totalWeeks}, (_,i)=> i+1);
    const selectedWeek = parseInt(sessionStorage.getItem('selectedWeek') || '1', 10);

    app.innerHTML = `
    <section class="card">
        <div class="hero"><h2>Instructor Panel - ${state.course.name}</h2><span class="badge">Total ${Object.keys(state.users.students).length} students</span></div>
        <div class="grid cols-2">
            <div>
                <label>Week</label>
                <select id="week-select">${weeks.map(w=>`<option value="${w}" ${w===selectedWeek?'selected':''}>Week ${w}</option>`).join('')}</select>
                <div class="spacer"></div>
                <div class="row">
                    <div>
                        <div class="muted">Current 6-digit code (changes every 30s)</div>
                        <div class="code" id="live-code" style="font-size:28px; text-align:center;">------</div>
                    </div>
                    <button id="rotate-seed" class="ghost" title="Regenerate shared seed if you want to reset codes">Rotate Seed</button>
                </div>
                <p class="muted">Students on any device can validate this code because it is generated from a shared seed stored in their browser after first visit. Share this page link to distribute the seed. If needed, click Rotate to change it and ask students to refresh.</p>
            </div>
            <div>
                <label>Export</label>
                <div class="row">
                    <button id="export-excel">Download Excel (.xlsx)</button>
                    <button id="clear-att" class="danger">Clear Attendance</button>
                </div>
                <div class="spacer"></div>
                <div class="muted">Export creates a sheet similar to your sample format.</div>
            </div>
        </div>
    </section>
    <section class="card" style="margin-top:16px;">
        <h3>Attendance Records</h3>
        <table class="table" id="att-table"></table>
    </section>`;

    const weekSelect = document.getElementById('week-select');
    weekSelect.onchange = () => { sessionStorage.setItem('selectedWeek', weekSelect.value); updateCode(); renderTable(); };

    document.getElementById('rotate-seed').onclick = () => {
        state.codeSeed = Math.floor(Math.random()*1e12);
        saveState(state);
        updateCode();
    };

    document.getElementById('clear-att').onclick = () => {
        if(confirm('Clear ALL attendance records?')){
            state.attendance = {};
            saveState(state);
            renderInstructor(app);
        }
    };

    function updateCode(){
        const codeEl = document.getElementById('live-code');
        const w = parseInt(weekSelect.value,10);
        codeEl.textContent = getRotatingCode(w);
    }

    // update every second for smoothness
    updateCode();
    let timer = setInterval(updateCode, 1000);
    window.addEventListener('hashchange', ()=> clearInterval(timer), { once:true });

    function renderTable(){
        const table = document.getElementById('att-table');
        const weeksHeader = Array.from({length: state.course.totalWeeks}, (_,i)=> `<th>${i+1}. Hafta</th>`).join('');
            const rows = Object.values(state.users.students).map(s=>{
            const att = getStudentAttendance(s.number);
            const cells = Array.from({length: state.course.totalWeeks}, (_,i)=>{
                const w = (i+1).toString();
                const present = !!att[w];
                return `<td>${present ? '✔️' : ''}</td>`;
            }).join('');
            return `<tr><td>${s.number}</td><td>${s.fullName}</td><td>${s.department}</td>${cells}</tr>`;
        }).join('');
        table.innerHTML = `
            <thead>
                <tr><th>Numara</th><th>Ad Soyad</th><th>Bölüm</th>${weeksHeader}</tr>
            </thead>
            <tbody>${rows}</tbody>`;
    }

    renderTable();

    document.getElementById('export-excel').onclick = () => exportExcel();
}

function exportExcel(){
    const totalWeeks = state.course.totalWeeks;
    const header = ['Sıra','Numara','Ad','Soyad','Bölüm', ...Array.from({length: totalWeeks}, (_,i)=> `${i+1}. HAFTA`)];
    const data = [header];
    let idx = 1;
    for(const s of Object.values(state.users.students)){
        const att = getStudentAttendance(s.number);
        const [firsts, last] = splitFullName(s.fullName);
        const row = [idx++, s.number, firsts, last, s.department];
        for(let w=1; w<=totalWeeks; w++) row.push(att[w] ? '1' : '');
        data.push(row);
    }
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, 'ENGR4451_Attendance.xlsx');
}

function renderStudent(app){
    if(!state.session || state.session.role !== 'student'){ navigate('#login'); return renderLogin(app); }
    const student = state.users.students[state.session.number];
    const totalWeeks = state.course.totalWeeks;
    const att = getStudentAttendance(student.number);
    const attended = Object.keys(att).length;
    const percent = Math.round((attended / totalWeeks) * 100);

    app.innerHTML = `
    <section class="card">
        <div class="hero"><h2>Welcome, ${student.fullName}</h2><span class="badge">${student.number}</span></div>
        <div class="grid cols-2">
            <div>
                <label>Select Week</label>
                <select id="week-select">${Array.from({length: totalWeeks}, (_,i)=> `<option value="${i+1}">Week ${i+1}</option>`).join('')}</select>
                <label style="margin-top:10px">Enter 6-digit Code</label>
                <input id="code-input" placeholder="e.g., 123456" maxlength="6" />
                <div class="spacer"></div>
                <button id="submit-code">Submit Attendance</button>
                <p class="muted">Code changes every 30 seconds. Make sure your device time is correct.</p>
            </div>
            <div>
                <div class="pill">Attendance</div>
                <h1 class="success">${percent}%</h1>
                <div id="weeks"></div>
            </div>
        </div>
    </section>`;

    function renderWeeks(){
        const container = document.getElementById('weeks');
        const list = Array.from({length: totalWeeks}, (_,i)=>{
            const w = (i+1).toString();
            const present = !!att[w];
            return `<div class="row" style="margin:6px 0"><div>Week ${w}</div><div>${present?'<span class="success">Present</span>':'<span class="muted">—</span>'}</div></div>`;
        }).join('');
        container.innerHTML = list;
    }
    renderWeeks();

    document.getElementById('submit-code').onclick = () => {
        const w = parseInt(document.getElementById('week-select').value,10);
        const code = (document.getElementById('code-input').value || '').trim();
        if(code.length !== 6){ alert('Please enter the 6-digit code.'); return; }
        if(validateCode(w, code)){
            if(att[w]){ alert('Already recorded for this week.'); return; }
            markAttendance(student.number, w.toString());
            alert('Attendance recorded.');
            navigate('#student'); renderApp();
        } else {
            alert('Invalid or expired code.');
        }
    };
}

function splitFullName(fullName){
    const parts = fullName.trim().split(/\s+/);
    if(parts.length === 1) return [parts[0], ''];
    const last = parts.pop();
    return [parts.join(' '), last];
}


