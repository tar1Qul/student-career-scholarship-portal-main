/* Student Career & Scholarship Portal - live backend integration */
(() => {
  const API = '../backend/api.php';
  const root = document.documentElement;
  const path = location.pathname.toLowerCase();

  async function api(action, options = {}) {
    const opts = { credentials: 'same-origin', ...options };
    opts.headers = { ...(opts.headers || {}) };
    if (opts.body && typeof opts.body !== 'string') {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(`${API}?action=${encodeURIComponent(action)}`, opts);
    let json;
    try { json = await res.json(); } catch { throw new Error('Invalid server response. Check Apache/PHP.'); }
    if (!json.ok) throw new Error(json.message || 'Request failed.');
    return json.data;
  }

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const toast = msg => { alert(msg); };
  const fmtDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString() : '—';

  async function guard(expectedRole) {
    try {
      const me = await api('me');
      if (!me) { location.href = '../login.html'; return null; }
      if (expectedRole && me.role !== expectedRole) {
        const targets = {student:'../student/dashboard.html', recruiter:'../recruit/recruiter_dashboard.html', admin:'../Admin/admin_dashboard.html'};
        location.href = targets[me.role] || '../login.html'; return null;
      }
      document.querySelectorAll('[data-user-name], .user-name, .profile-name').forEach(el => el.textContent = me.name);
      document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = me.email);
      return me;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  function wireLogout() {
    document.querySelectorAll('a[href="#"], .logout, [data-logout]').forEach(a => {
      const text = (a.textContent || '').toLowerCase();
      if (text.includes('logout') || a.querySelector('.fa-arrow-right-from-bracket')) {
        a.addEventListener('click', async e => {
          e.preventDefault();
          if (confirm('Do you want to logout?')) location.href = '../backend/logout.php';
        });
      }
    });
  }

  async function student() {
    const me = await guard('student'); if (!me) return;
    wireLogout();
    if (path.endsWith('/dashboard.html')) {
      const d = await api('student_dashboard');
      const vals = [d.stats.applications_count, d.stats.saved_count, d.stats.unread_notifications, d.stats.opportunities_count];
      document.querySelectorAll('.stat-card h2').forEach((el,i)=>{ if(vals[i]!==undefined) el.textContent=vals[i]; });
    }
    if (path.includes('student_profile')) {
      const p = await api('profile');
      if (p) {
        const inputs = document.querySelectorAll('input');
        const vals = [p.full_name,p.email,p.phone,'',p.university,'',p.department,'',p.cgpa,p.graduation_year];
        inputs.forEach((el,i)=>{ if(vals[i] !== undefined && vals[i] !== null && el.type !== 'file' && el.type !== 'search') el.value=vals[i]; });
        const bio=document.querySelector('textarea'); if(bio) bio.value=p.bio||'';
      }
      const buttons=[...document.querySelectorAll('button')];
      const save=buttons.find(b=>(b.textContent||'').toLowerCase().includes('save'));
      if(save) save.addEventListener('click', async e=>{
        e.preventDefault();
        const ins=[...document.querySelectorAll('input')];
        try {
          await api('profile',{method:'POST',body:{
            full_name:ins[1]?.value, email:ins[2]?.value, phone:ins[3]?.value,
            university:ins[5]?.value||'', department:ins[7]?.value||'', cgpa:ins[9]?.value||'',
            graduation_year:ins[10]?.value||'', bio:document.querySelector('textarea')?.value||''
          }});
          toast('Profile updated successfully.');
        } catch(err){toast(err.message);}
      });
    }
    if (path.includes('student_opportunities')) await renderStudentOpportunities();
    if (path.includes('student_scholarships')) await renderScholarships();
    if (path.includes('student_applications')) await renderApplications();
    if (path.includes('student_saved')) await renderSaved();
    if (path.includes('student_notifications')) await renderNotifications();
    if (path.includes('student_settings')) await renderSettings();
  }

  async function renderStudentOpportunities() {
    const items=await api('opportunities');
    const cards=[...document.querySelectorAll('.opportunity-card')];
    const parent=cards[0]?.parentElement;
    if(!parent) return;
    parent.innerHTML=items.length?items.map(o=>`
      <div class="opportunity-card" data-id="${o.id}">
        <div class="opportunity-icon"><i class="fa-solid fa-briefcase"></i></div>
        <div class="opportunity-content">
          <h3>${esc(o.title)}</h3><p>${esc(o.organization)}</p>
          <div class="opportunity-meta"><span>${esc(o.location||'Remote')}</span><span>${esc(o.category||o.opportunity_type)}</span><span>Deadline: ${fmtDate(o.deadline)}</span></div>
          <p>${esc(o.description||'')}</p>
          <div class="opportunity-actions">
            <button class="filter-btn" data-apply="${o.id}">Apply</button>
            <button class="table-btn" data-save="${o.id}">Save</button>
          </div>
        </div>
      </div>`).join(''):`<p>No approved opportunities are available yet.</p>`;
    parent.querySelectorAll('[data-apply]').forEach(b=>b.onclick=async()=>{try{await api('apply',{method:'POST',body:{opportunity_id:b.dataset.apply}});toast('Application submitted.');}catch(e){toast(e.message);}});
    parent.querySelectorAll('[data-save]').forEach(b=>b.onclick=async()=>{try{await api('save',{method:'POST',body:{opportunity_id:b.dataset.save}});toast('Saved item updated.');}catch(e){toast(e.message);}});
  }

  async function renderScholarships() {
    const items=await api('scholarships');
    const cards=[...document.querySelectorAll('.opportunity-card.scholarship-card')];
    const parent=cards[0]?.parentElement;
    if(!parent) return;
    parent.innerHTML=items.length?items.map(s=>`
      <div class="opportunity-card scholarship-card" data-id="${s.id}">
        <div class="opportunity-icon"><i class="fa-solid fa-graduation-cap"></i></div>
        <div class="opportunity-content">
          <h3>${esc(s.title)}</h3><p>${esc(s.provider)}</p>
          <div class="opportunity-meta"><span>${esc(s.category||'Scholarship')}</span><span>${esc(s.amount||'Amount not specified')}</span><span>Deadline: ${fmtDate(s.deadline)}</span></div>
          <p>${esc(s.description||'')}</p>
          <div class="opportunity-actions">
            <button class="filter-btn" data-apply-scholarship="${s.id}">Apply</button>
            <button class="table-btn" data-save-scholarship="${s.id}">Save</button>
          </div>
        </div>
      </div>`).join(''):`<p>No approved scholarships are available yet.</p>`;
    parent.querySelectorAll('[data-apply-scholarship]').forEach(b=>b.onclick=async()=>{try{await api('apply',{method:'POST',body:{scholarship_id:b.dataset.applyScholarship}});toast('Application submitted.');}catch(e){toast(e.message);}});
    parent.querySelectorAll('[data-save-scholarship]').forEach(b=>b.onclick=async()=>{try{await api('save',{method:'POST',body:{scholarship_id:b.dataset.saveScholarship}});toast('Saved item updated.');}catch(e){toast(e.message);}});
  }

  async function renderApplications() {
    const items=await api('applications'); const tbody=document.querySelector('.application-table tbody');
    if(!tbody)return;
    tbody.innerHTML=items.length?items.map(a=>`<tr>
      <td>${esc(a.opportunity_title||a.scholarship_title)}</td><td>${esc(a.organization||a.scholarship_provider||'—')}</td>
      <td>${new Date(a.applied_at).toLocaleDateString()}</td><td><span class="status ${esc(a.status)}">${esc(a.status.replace('_',' '))}</span></td>
    </tr>`).join(''):`<tr><td colspan="4">No applications yet.</td></tr>`;
  }

  async function renderSaved() {
    const items=await api('saved'); const cards=[...document.querySelectorAll('.opportunity-card')]; const parent=cards[0]?.parentElement;
    if(!parent)return;
    parent.innerHTML=items.length?items.map(x=>{const title=x.opportunity_title||x.scholarship_title, org=x.organization||x.scholarship_provider, dl=x.opportunity_deadline||x.scholarship_deadline;
      return `<div class="opportunity-card"><div class="opportunity-icon"><i class="fa-solid fa-bookmark"></i></div><div class="opportunity-content"><h3>${esc(title)}</h3><p>${esc(org)}</p><div class="opportunity-meta"><span>Deadline: ${fmtDate(dl)}</span></div><div class="opportunity-actions"><button class="filter-btn" data-remove="${x.opportunity_id?'opportunity_id':'scholarship_id'}" data-id="${x.opportunity_id||x.scholarship_id}">Remove</button></div></div></div>`;}).join(''):`<p>You have no saved items.</p>`;
    parent.querySelectorAll('[data-remove]').forEach(b=>b.onclick=async()=>{const body={};body[b.dataset.remove]=b.dataset.id;try{await api('save',{method:'POST',body});await renderSaved();}catch(e){toast(e.message);}});
  }

  async function renderNotifications() {
    const items=await api('notifications'); const main=document.querySelector('main')||document.body;
    const existing=main.querySelector('.live-notifications'); if(existing)existing.remove();
    const box=document.createElement('div'); box.className='live-notifications card'; box.innerHTML='<div class="card-header"><h3>Notifications</h3><button class="filter-btn">Mark all read</button></div><div class="notification-list"></div>';
    const list=box.querySelector('.notification-list'); list.innerHTML=items.length?items.map(n=>`<div style="padding:14px;border-bottom:1px solid #eee"><strong>${esc(n.title)}</strong><p>${esc(n.message)}</p><small>${new Date(n.created_at).toLocaleString()}</small></div>`).join(''):'<p>No notifications.</p>';
    const anchor=main.querySelector('.cards'); anchor?anchor.before(box):main.prepend(box);
    box.querySelector('button').onclick=async()=>{await api('notifications',{method:'POST',body:{mode:'read_all'}});await renderNotifications();};
  }

  async function renderSettings() {
    const p=await api('profile'); if(!p)return;
    const inputs=[...document.querySelectorAll('input')].filter(i=>i.type!=='checkbox'&&i.type!=='password');
    if(inputs[0])inputs[0].value=p.email||''; if(inputs[1])inputs[1].value=p.phone||'';
  }

  async function recruiter() {
    const me=await guard('recruiter'); if(!me)return; wireLogout();
    if(path.includes('recruiter_profile')) {
      const p=await api('profile'); const form=document.getElementById('profileForm');
      if(p&&form){const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v||''};set('fullName',p.full_name);set('email',p.email);set('phone',p.phone);set('organization',p.company_name);set('designation',p.designation);set('aboutOrganization',p.company_description);}
      if(form) form.addEventListener('submit',async e=>{e.preventDefault();try{await api('profile',{method:'POST',body:{full_name:document.getElementById('fullName')?.value,phone:document.getElementById('phone')?.value,organization:document.getElementById('organization')?.value,designation:document.getElementById('designation')?.value,company_description:document.getElementById('aboutOrganization')?.value}});toast('Profile updated successfully.');}catch(err){toast(err.message);}});
    }
    if(path.includes('recruiter_dashboard')) {
      const d=await api('recruiter_dashboard');
      document.querySelectorAll('.stat-card h2').forEach((el,i)=>{const v=[d.stats.total,d.stats.approved,d.stats.pending,d.stats.applications][i];if(v!==undefined)el.textContent=v;});
      const tbody=document.querySelector('table tbody');
      if(tbody) tbody.innerHTML=d.opportunities.map(o=>`<tr><td>${esc(o.title)}</td><td>${esc(o.organization)}</td><td>${esc(o.category||o.opportunity_type)}</td><td>${fmtDate(o.deadline)}</td><td><span class="badge">${esc(o.status)}</span></td><td><button class="delete" data-delete="${o.id}">Delete</button></td></tr>`).join('')||'<tr><td colspan="6">No opportunities posted yet.</td></tr>';
      document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(confirm('Delete this opportunity?')){await api('opportunity_delete',{method:'POST',body:{id:b.dataset.delete}});location.reload();}});
      const form=document.getElementById('opportunityForm');
      if(form)form.addEventListener('submit',async e=>{e.preventDefault();const g=id=>document.getElementById(id)?.value||'';try{await api('opportunity_create',{method:'POST',body:{title:g('title'),category:g('category'),organization:g('organization'),location:g('location'),deadline:g('deadline'),description:g('description'),requirements:[...form.querySelectorAll('textarea')].map(x=>x.value).slice(1).join('\n'),opportunity_type:g('category')}});toast('Opportunity submitted for admin verification.');form.reset();}catch(err){toast(err.message);}});
    }
  }

  async function admin() {
    const me=await guard('admin'); if(!me)return; wireLogout();
    if(path.endsWith('admin_dashboard.html')) { const d=await api('admin_dashboard'); document.querySelectorAll('.stat-card h2').forEach((el,i)=>{const v=[d.users_count,d.students_count,d.recruiters_count,d.pending_opportunities][i];if(v!==undefined)el.textContent=v;}); }
    if(path.includes('user-management')) { const data=await api('admin_users'); renderAdminTable(data,'users'); }
    if(path.includes('career-opportunities')||path.includes('verification')) { const data=await api('admin_opportunities'); renderAdminTable(data,'opportunities'); }
    if(path.includes('scholarship-management')) { const data=await api('admin_scholarships'); renderAdminTable(data,'scholarships'); }
  }

  function renderAdminTable(data,type) {
    const tbody=document.querySelector('table tbody'); if(!tbody)return;
    if(type==='users') tbody.innerHTML=data.map(x=>`<tr><td>${x.id}</td><td>${esc(x.full_name)}</td><td>${esc(x.email)}</td><td>${esc(x.role)}</td><td>${esc(x.status)}</td><td><select data-user-status="${x.id}"><option ${x.status==='active'?'selected':''}>active</option><option ${x.status==='inactive'?'selected':''}>inactive</option><option ${x.status==='suspended'?'selected':''}>suspended</option></select></td></tr>`).join('');
    if(type==='opportunities') tbody.innerHTML=data.map(x=>`<tr><td>${esc(x.title)}</td><td>${esc(x.organization)}</td><td>${esc(x.recruiter_name)}</td><td>${fmtDate(x.deadline)}</td><td>${esc(x.status)}</td><td><button data-op-status="${x.id}" data-status="approved">Approve</button> <button data-op-status="${x.id}" data-status="rejected">Reject</button></td></tr>`).join('');
    if(type==='scholarships') tbody.innerHTML=data.map(x=>`<tr><td>${x.id}</td><td>${esc(x.title)}</td><td>${esc(x.provider)}</td><td>${fmtDate(x.deadline)}</td><td>${esc(x.status)}</td><td><button data-sch-status="${x.id}" data-status="approved">Approve</button> <button data-sch-status="${x.id}" data-status="rejected">Reject</button></td></tr>`).join('');
    document.querySelectorAll('[data-user-status]').forEach(s=>s.onchange=async()=>{await api('admin_user_status',{method:'POST',body:{id:s.dataset.userStatus,status:s.value}});toast('User status updated.');});
    document.querySelectorAll('[data-op-status]').forEach(b=>b.onclick=async()=>{await api('admin_opportunity_status',{method:'POST',body:{id:b.dataset.opStatus,status:b.dataset.status}});location.reload();});
    document.querySelectorAll('[data-sch-status]').forEach(b=>b.onclick=async()=>{await api('admin_scholarship_status',{method:'POST',body:{id:b.dataset.schStatus,status:b.dataset.status}});location.reload();});
  }

  document.addEventListener('DOMContentLoaded', async()=>{
    try {
      if(path.includes('/student/')) await student();
      else if(path.includes('/recruit/')) await recruiter();
      else if(path.includes('/admin/')) await admin();
    } catch(e) { console.error('Portal integration:',e); }
  });
})();