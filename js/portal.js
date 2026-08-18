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

  // The actual application always happens on the recruiter's/provider's
  // external site. This just records the click, then opens that site in
  // a new tab so the student doesn't lose their place on the portal.
  async function applyAndRedirect(button, body) {
    const original = button.textContent;
    button.disabled = true;
    try {
      const data = await api('apply', {method:'POST', body});
      if (data && data.redirect_url) {
        toast('Opening the external application page in a new tab...');
        window.open(data.redirect_url, '_blank', 'noopener');
      } else {
        toast('Application submitted.');
      }
      button.textContent = 'Applied';
    } catch (e) {
      toast(e.message);
      button.disabled = false;
      button.textContent = original;
    }
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
    parent.querySelectorAll('[data-apply]').forEach(b=>b.onclick=()=>applyAndRedirect(b, {opportunity_id:b.dataset.apply}));
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
    parent.querySelectorAll('[data-apply-scholarship]').forEach(b=>b.onclick=()=>applyAndRedirect(b, {scholarship_id:b.dataset.applyScholarship}));
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
      if(p&&form){const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v||''};set('fullName',p.full_name);set('email',p.email);set('phone',p.phone);set('organization',p.company_name);set('designation',p.designation);set('companyWebsite',p.company_website);set('companyEmail',p.company_email);set('companyPhone',p.company_phone);set('aboutOrganization',p.company_description);}
      if(form) form.addEventListener('submit',async e=>{e.preventDefault();try{await api('profile',{method:'POST',body:{full_name:document.getElementById('fullName')?.value,email:document.getElementById('email')?.value,phone:document.getElementById('phone')?.value,organization:document.getElementById('organization')?.value,designation:document.getElementById('designation')?.value,company_website:document.getElementById('companyWebsite')?.value,company_email:document.getElementById('companyEmail')?.value,company_phone:document.getElementById('companyPhone')?.value,company_description:document.getElementById('aboutOrganization')?.value}});toast('Profile updated successfully.');}catch(err){toast(err.message);}});
    }
    if(path.includes('recruiter_dashboard')) {
      const d=await api('recruiter_dashboard');
      document.querySelectorAll('.stat-card h2').forEach((el,i)=>{const v=[d.stats.total,d.stats.approved,d.stats.pending,d.stats.applications][i];if(v!==undefined)el.textContent=v;});
      const tbody=document.querySelector('table tbody');
      if(tbody) tbody.innerHTML=d.opportunities.map(o=>{
        const canToggle = o.status==='approved' || o.status==='closed';
        const toggleBtn = canToggle
          ? `<button type="button" data-toggle-status="${o.id}" data-next="${o.status==='approved'?'closed':'approved'}" title="${o.status==='approved'?'Close':'Reopen'}"><i class="fa-solid ${o.status==='approved'?'fa-lock':'fa-lock-open'}"></i></button>`
          : '';
        return `<tr>
          <td><strong>${esc(o.title)}</strong></td>
          <td>${esc(o.organization)}</td>
          <td>${esc(o.category||o.opportunity_type)}</td>
          <td>${fmtDate(o.deadline)}</td>
          <td><span class="badge">${esc(o.status)}</span></td>
          <td><i class="fa-solid fa-users"></i> ${o.applicant_count||0}</td>
          <td>${o.updated_at?new Date(o.updated_at).toLocaleDateString():'—'}</td>
          <td class="actions">
            <button type="button" data-view="${o.id}" title="View"><i class="fa-regular fa-eye"></i></button>
            <button type="button" data-edit="${o.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button type="button" data-applicants="${o.id}" title="Applicants"><i class="fa-solid fa-users"></i></button>
            ${toggleBtn}
            <button type="button" class="delete" data-delete="${o.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>`;
      }).join('')||'<tr><td colspan="8">No opportunities posted yet.</td></tr>';

      // These controls filter the database-backed rows already loaded for
      // this recruiter; they never expose another recruiter's records.
      const filters=document.querySelector('.filters');
      if(filters){const search=filters.querySelector('input'), selects=[...filters.querySelectorAll('select')]; const applyFilters=()=>{const query=(search?.value||'').toLowerCase(), category=(selects[0]?.value||'').toLowerCase(), status=(selects[1]?.value||'').toLowerCase(); [...tbody.querySelectorAll('tr')].forEach(row=>{const text=row.textContent.toLowerCase(), cells=row.querySelectorAll('td'); const rowCategory=(cells[2]?.textContent||'').toLowerCase(), rowStatus=(cells[4]?.textContent||'').toLowerCase(); const categoryMatch=!category||category.startsWith('all ')||rowCategory.includes(category.replace('internship','internship').replace('job','job')); const statusMatch=!status||status.startsWith('all ')||rowStatus.includes(status.replace('verified','approved').replace('pending verification','pending').replace('expired','closed')); row.hidden=!(text.includes(query)&&categoryMatch&&statusMatch);});}; search?.addEventListener('input',applyFilters); selects.slice(0,2).forEach(s=>s.addEventListener('change',applyFilters));}

      document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(confirm('Delete this opportunity?')){try{await api('opportunity_delete',{method:'POST',body:{id:b.dataset.delete}});location.reload();}catch(e){toast(e.message);}}});
      document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{location.href=`recruit_post.html?id=${b.dataset.edit}`;});
      document.querySelectorAll('[data-view]').forEach(b=>b.onclick=async()=>{try{const o=await api('opportunity_get',{method:'POST',body:{id:b.dataset.view}});toast(`${o.title}\n\n${o.description||''}\n\nApply link: ${o.application_url||'—'}`);}catch(e){toast(e.message);}});
      document.querySelectorAll('[data-toggle-status]').forEach(b=>b.onclick=async()=>{try{await api('opportunity_status',{method:'POST',body:{id:b.dataset.toggleStatus,status:b.dataset.next}});location.reload();}catch(e){toast(e.message);}});
      document.querySelectorAll('[data-applicants]').forEach(b=>b.onclick=async()=>{
        try{
          const rows=await api('opportunity_applicants',{method:'POST',body:{opportunity_id:b.dataset.applicants}});
          if(!rows.length){showApplicantPanel([]);return;}
          showApplicantPanel(rows);
          toast(rows.map(r=>`${r.full_name} (${r.email}) — ${r.status}`).join('\n'));
        }catch(e){toast(e.message);}
      });

      await wireOpportunityForm();
    }

    if(path.includes('recruit_post')) {
      await wireOpportunityForm();
    }
  }

  function showApplicantPanel(rows) {
    document.getElementById('applicantPanel')?.remove();
    const panel=document.createElement('div'); panel.id='applicantPanel'; panel.className='applicant-panel';
    panel.innerHTML=`<div class="applicant-dialog"><div class="applicant-heading"><div><h2>Applicants</h2><p>Review candidates and update their application status.</p></div><button type="button" class="applicant-close" aria-label="Close">×</button></div><div class="applicant-tools"><input type="search" placeholder="Search student, email, university…"><select><option value="">All statuses</option><option value="pending">Pending</option><option value="under_review">Under review</option><option value="shortlisted">Shortlisted</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></select></div><div class="applicant-table-wrap"><table><thead><tr><th>Student</th><th>Academic info</th><th>Applied</th><th>Status</th><th>Update</th></tr></thead><tbody></tbody></table></div></div>`;
    document.body.appendChild(panel);
    const body=panel.querySelector('tbody'), search=panel.querySelector('input'), filter=panel.querySelector('select');
    const render=()=>{const query=search.value.toLowerCase(), status=filter.value; const list=rows.filter(r=>(!status||r.status===status)&&`${r.full_name} ${r.email} ${r.university||''} ${r.department||''}`.toLowerCase().includes(query)); body.innerHTML=list.length?list.map(r=>`<tr><td><strong>${esc(r.full_name)}</strong><br><small>${esc(r.email)}</small></td><td>${esc(r.university||'—')}<br><small>${esc(r.department||'')}</small></td><td>${r.applied_at?new Date(r.applied_at).toLocaleDateString():'—'}</td><td><span class="badge">${esc(String(r.status).replace('_',' '))}</span></td><td><select data-application-status="${r.id}">${['pending','under_review','shortlisted','accepted','rejected'].map(s=>`<option value="${s}" ${r.status===s?'selected':''}>${s.replace('_',' ')}</option>`).join('')}</select></td></tr>`).join(''):'<tr><td colspan="5">No applicants match the selected filters.</td></tr>'; body.querySelectorAll('[data-application-status]').forEach(select=>select.onchange=async()=>{try{await api('application_status',{method:'POST',body:{application_id:select.dataset.applicationStatus,status:select.value}});const row=rows.find(r=>String(r.id)===select.dataset.applicationStatus);if(row)row.status=select.value;render();toast('Application status updated.');}catch(e){toast(e.message);render();}});};
    panel.querySelector('.applicant-close').onclick=()=>panel.remove(); panel.onclick=e=>{if(e.target===panel)panel.remove();}; search.oninput=render; filter.onchange=render; render();
  }

  // Shared by the standalone recruit_post.html page AND the embedded
  // "Post Opportunity" tab inside recruiter_dashboard.html - both use the
  // same #opportunityForm markup.
  async function wireOpportunityForm() {
    const form=document.getElementById('opportunityForm');
    if(!form || form.dataset.wired) return;
    form.dataset.wired='1';
    const g=id=>document.getElementById(id)?.value||'';
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v||'';};
    const params=new URLSearchParams(location.search);
    const editId=params.get('id');
    const heading=document.getElementById('postHeading');
    const subheading=document.getElementById('postSubheading');
    const submitBtn=document.getElementById('postSubmitBtn');
    const draftBtn=document.getElementById('draftBtn');
    let saveAsDraft=false;
    if (draftBtn) draftBtn.onclick=()=>{saveAsDraft=true; form.requestSubmit();};

    if (editId) {
      try {
        const o=await api('opportunity_get',{method:'POST',body:{id:editId}});
        set('title',o.title); set('organization',o.organization); set('location',o.location);
        set('deadline',o.deadline); set('description',o.description); set('eligibility',o.requirements);
        set('applicationUrl',o.application_url);
        const categorySelect=document.getElementById('category');
        if (categorySelect && o.opportunity_type) {
          const match=[...categorySelect.options].find(opt=>opt.value.toLowerCase()===o.opportunity_type || opt.textContent.toLowerCase()===o.opportunity_type);
          if (match) categorySelect.value=match.value;
        }
        if (heading) heading.textContent='Edit opportunity';
        if (subheading) subheading.textContent='Changes are re-reviewed by our admin team before going live again.';
        if (submitBtn) submitBtn.innerHTML='Save changes';
      } catch (e) { toast(e.message); }
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const payload={
        title:g('title'), category:g('category'), organization:g('organization'),
        location:g('location'), deadline:g('deadline'), description:g('description'),
        requirements:g('eligibility'), application_url:g('applicationUrl'), opportunity_type:g('category'), status:saveAsDraft?'draft':'pending'
      };
      try {
        if (editId) {
          await api('opportunity_update',{method:'POST',body:{...payload,id:editId}});
          toast('Opportunity updated and resubmitted for admin verification.');
        } else {
          await api('opportunity_create',{method:'POST',body:payload});
          toast(saveAsDraft?'Opportunity saved as draft.':'Opportunity submitted for admin verification.');
          form.reset();
        }
        location.href='recruiter_dashboard.html';
      } catch (err) { toast(err.message); }
    });
  }

  async function admin() {
    const me=await guard('admin'); if(!me)return; wireLogout();
    if(path.endsWith('admin_dashboard.html')) {
      const d=await api('admin_dashboard');
      document.querySelectorAll('.stat-card h2').forEach((el,i)=>{const v=[d.users_count,d.students_count,d.recruiters_count,d.pending_opportunities][i];if(v!==undefined)el.textContent=v;});
    }
    if(path.includes('user-management')) { const data=await api('admin_users'); renderAdminTable(data,'users'); }
    if(path.includes('career-opportunities')) { const data=await api('admin_opportunities'); renderAdminTable(data,'opportunities'); }
    if(path.includes('verification')) { const data=await api('admin_opportunities'); renderAdminTable(data,'verification'); }
    if(path.includes('scholarship-management')) {
      const data=await api('admin_scholarships'); renderAdminTable(data,'scholarships');
      const addBtn=document.querySelector('.add-btn');
      if(addBtn) addBtn.addEventListener('click', async () => {
        const title=prompt('Scholarship title:'); if(!title) return;
        const provider=prompt('Provider / organization:'); if(!provider) return;
        const category=prompt('Category (optional):','') || '';
        const amount=prompt('Amount (optional, e.g. $2,000):','') || '';
        const deadline=prompt('Deadline (YYYY-MM-DD, optional):','') || '';
        const application_url=prompt('External application URL (optional):','') || '';
        const description=prompt('Description (optional):','') || '';
        try {
          await api('admin_scholarship_create',{method:'POST',body:{title,provider,category,amount,deadline,application_url,description}});
          toast('Scholarship created.');
          location.reload();
        } catch(e) { toast(e.message); }
      });
    }
  }

  function renderAdminTable(data,type) {
    const tbody=document.querySelector('table tbody'); if(!tbody)return;

    if(type==='users') {
      tbody.innerHTML=data.length?data.map(x=>`<tr>
        <td>${x.id}</td><td>${esc(x.full_name)}</td><td>${esc(x.email)}</td><td>${esc(x.role)}</td>
        <td>${esc(x.status)}</td>
        <td><select data-user-status="${x.id}">
          <option value="active" ${x.status==='active'?'selected':''}>active</option>
          <option value="inactive" ${x.status==='inactive'?'selected':''}>inactive</option>
          <option value="suspended" ${x.status==='suspended'?'selected':''}>suspended</option>
        </select></td>
      </tr>`).join(''):'<tr><td colspan="6">No users found.</td></tr>';
    }

    // career-opportunities.html: ID | Opportunity | Company | Category | Location | Deadline | Status | Action
    if(type==='opportunities') {
      tbody.innerHTML=data.length?data.map(x=>`<tr>
        <td>${x.id}</td><td>${esc(x.title)}</td><td>${esc(x.organization)}</td><td>${esc(x.category||x.opportunity_type)}</td>
        <td>${esc(x.location||'—')}</td><td>${fmtDate(x.deadline)}</td><td>${esc(x.status)}</td>
        <td class="actions">
          <button data-op-status="${x.id}" data-status="approved">Approve</button>
          <button data-op-status="${x.id}" data-status="rejected">Reject</button>
          <button data-op-status="${x.id}" data-status="closed">Close</button>
          <button class="delete" data-op-delete="${x.id}">Delete</button>
        </td>
      </tr>`).join(''):'<tr><td colspan="8">No opportunities found.</td></tr>';
    }

    // Admin_verification.html: # | Opportunity | Category | Submitted By | Date | Status | Action
    if(type==='verification') {
      const pending=data.filter(x=>x.status==='pending');
      const list=pending.length?pending:data;
      tbody.innerHTML=list.length?list.map(x=>`<tr>
        <td>${x.id}</td><td>${esc(x.title)}</td><td>${esc(x.category||x.opportunity_type)}</td>
        <td>${esc(x.recruiter_name)}</td><td>${new Date(x.created_at).toLocaleDateString()}</td><td>${esc(x.status)}</td>
        <td class="actions">
          <button data-op-status="${x.id}" data-status="approved">Approve</button>
          <button data-op-status="${x.id}" data-status="rejected">Reject</button>
        </td>
      </tr>`).join(''):'<tr><td colspan="7">No opportunities awaiting verification.</td></tr>';
    }

    // scholarship-management.html: ID | Scholarship Name | Provider | Category | Deadline | Status | Action
    if(type==='scholarships') {
      tbody.innerHTML=data.length?data.map(x=>`<tr>
        <td>${x.id}</td><td>${esc(x.title)}</td><td>${esc(x.provider)}</td><td>${esc(x.category||'—')}</td>
        <td>${fmtDate(x.deadline)}</td><td>${esc(x.status)}</td>
        <td class="actions">
          <button data-sch-status="${x.id}" data-status="approved">Approve</button>
          <button data-sch-status="${x.id}" data-status="rejected">Reject</button>
          <button data-sch-status="${x.id}" data-status="closed">Close</button>
          <button class="delete" data-sch-delete="${x.id}">Delete</button>
        </td>
      </tr>`).join(''):'<tr><td colspan="7">No scholarships found.</td></tr>';
    }

    document.querySelectorAll('[data-user-status]').forEach(s=>s.onchange=async()=>{try{await api('admin_user_status',{method:'POST',body:{id:s.dataset.userStatus,status:s.value}});toast('User status updated.');}catch(e){toast(e.message);}});
    document.querySelectorAll('[data-op-status]').forEach(b=>b.onclick=async()=>{try{await api('admin_opportunity_status',{method:'POST',body:{id:b.dataset.opStatus,status:b.dataset.status}});location.reload();}catch(e){toast(e.message);}});
    document.querySelectorAll('[data-op-delete]').forEach(b=>b.onclick=async()=>{if(confirm('Delete this opportunity?')){try{await api('admin_delete',{method:'POST',body:{type:'opportunity',id:b.dataset.opDelete}});location.reload();}catch(e){toast(e.message);}}});
    document.querySelectorAll('[data-sch-status]').forEach(b=>b.onclick=async()=>{try{await api('admin_scholarship_status',{method:'POST',body:{id:b.dataset.schStatus,status:b.dataset.status}});location.reload();}catch(e){toast(e.message);}});
    document.querySelectorAll('[data-sch-delete]').forEach(b=>b.onclick=async()=>{if(confirm('Delete this scholarship?')){try{await api('admin_delete',{method:'POST',body:{type:'scholarship',id:b.dataset.schDelete}});location.reload();}catch(e){toast(e.message);}}});
  }

  document.addEventListener('DOMContentLoaded', async()=>{
    try {
      if(path.includes('/student/')) await student();
      else if(path.includes('/recruit/')) await recruiter();
      else if(path.includes('/admin/')) await admin();
    } catch(e) { console.error('Portal integration:',e); }
  });
})();
