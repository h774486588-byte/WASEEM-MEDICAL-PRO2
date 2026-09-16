const KEY='waseem_medical_pro_v1';
const defaultDB={
  settings:{centerName:'مركز العلاج الطبيعي والتأهيل',phone:'',logo:''},
  patients:[],
  packages:[],
  appointments:[],
  notifications:[],
  notificationRules:{
    patientCreated:{wa:true,sms:true}, packageCreated:{wa:true,sms:true},
    packageLow:{wa:true,sms:true}, packageExpired:{wa:true,sms:true},
    appointmentCreated:{wa:true,sms:true}, appointmentReminder:{wa:true,sms:true},
    appointmentChanged:{wa:true,sms:true}, appointmentCancelled:{wa:true,sms:true},
    invoiceCreated:{wa:true,sms:true}, dueReminder:{wa:true,sms:true}
  }
};
let db=JSON.parse(localStorage.getItem(KEY)||'null')||structuredClone(defaultDB);
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function id(prefix){return prefix+'-'+Math.random().toString(36).slice(2,7).toUpperCase()}
function money(n){return Number(n||0).toLocaleString('ar-YE')+' ريال'}
function patientName(pid){return db.patients.find(p=>p.id===pid)?.name||'—'}
function render(){
 const app=document.getElementById('app');
 app.innerHTML=`<div class="app"><aside class="sidebar"><div class="brand">WASEEM MEDICAL PRO<small>نظام إدارة المركز</small></div>
 <div class="nav">
 ${[['dashboard','⌂ لوحة التحكم'],['patients','♙ المرضى'],['packages','▣ الباقات'],['appointments','◷ المواعيد'],['notifications','♢ الإشعارات'],['settings','⚙ الإعدادات']].map((x,i)=>`<button onclick="page('${x[0]}')">${x[1]}</button>`).join('')}
 </div></aside><main class="main" id="main"></main></div>`;
 page('dashboard');
}
function page(p){
 const m=document.getElementById('main');
 if(p==='dashboard')return dashboard(m);
 if(p==='patients')return patients(m);
 if(p==='packages')return packages(m);
 if(p==='appointments')return appointments(m);
 if(p==='notifications')return notifications(m);
 if(p==='settings')return settings(m);
}
function head(title,sub=''){return `<div class="top"><div><h1>${title}</h1><div class="muted">${sub}</div></div><span class="badge">${esc(db.settings.centerName)}</span></div>`}
function dashboard(m){
 const active=db.packages.filter(x=>x.remaining>0).length, low=db.packages.filter(x=>x.remaining>0&&x.remaining<=2).length;
 m.innerHTML=head('لوحة التحكم','نظرة سريعة على حالة المركز')+`<div class="grid">
 <div class="card stat">إجمالي المرضى<b>${db.patients.length}</b><span class="muted">ملفات المرضى</span></div>
 <div class="card stat">الباقات النشطة<b>${active}</b><span class="muted">باقات قيد الاستخدام</span></div>
 <div class="card stat">جلسات منخفضة<b>${low}</b><span class="muted">تحتاج متابعة</span></div>
 <div class="card stat">المواعيد<b>${db.appointments.length}</b><span class="muted">إجمالي المواعيد</span></div></div>
 <div class="section"><div class="section-head"><h3>آخر المرضى</h3><button class="primary" onclick="openPatient()">+ تسجيل مريض</button></div>
 <table class="table"><tr><th>رقم الملف</th><th>المريض</th><th>الهاتف</th><th>تاريخ التسجيل</th></tr>
 ${db.patients.slice(-6).reverse().map(p=>`<tr><td>${p.fileNo}</td><td>${esc(p.name)}</td><td>${esc(p.phone)}</td><td>${p.createdAt}</td></tr>`).join('')||'<tr><td colspan="4">لا توجد بيانات بعد.</td></tr>'}</table></div>`;
}
function patients(m){
 m.innerHTML=head('ملف المرضى','إدارة ملفات المرضى وبيانات التواصل')+`<div class="section-head"><h3>المرضى (${db.patients.length})</h3><button class="primary" onclick="openPatient()">+ مريض جديد</button></div>
 <table class="table"><tr><th>الملف</th><th>الاسم</th><th>الهاتف</th><th>الجنس</th><th>الإجراءات</th></tr>${db.patients.map(p=>`<tr><td>${p.fileNo}</td><td>${esc(p.name)}</td><td>${esc(p.phone)}</td><td>${esc(p.gender)}</td><td><button class="secondary" onclick="viewPatient('${p.id}')">عرض</button></td></tr>`).join('')||'<tr><td colspan="5">لا يوجد مرضى.</td></tr>'}</table>`;
}
function openPatient(){
 const no='P-'+String(db.patients.length+1001);
 modal('تسجيل مريض جديد',`<div class="form">
 <div class="field"><label>اسم المريض</label><input id="pn"></div>
 <div class="field"><label>رقم الهاتف</label><input id="pp" inputmode="tel"></div>
 <div class="field"><label>الجنس</label><select id="pg"><option>ذكر</option><option>أنثى</option></select></div>
 <div class="field"><label>رقم الملف</label><input id="pf" value="${no}"></div>
 <div class="field full"><label>ملاحظات</label><textarea id="px"></textarea></div>
 <div class="field full"><label>إشعار التسجيل</label><div class="checks"><label><input type="radio" name="send" value="wa" checked> واتساب</label><label><input type="radio" name="send" value="sms"> SMS</label><label><input type="radio" name="send" value="none"> بدون إرسال</label></div></div></div>
 <div class="actions"><button class="primary" onclick="savePatient()">حفظ وإرسال الإشعار</button><button class="secondary" onclick="closeModal()">إلغاء</button></div>`);
}
function savePatient(){
 const p={id:id('PAT'),fileNo:document.getElementById('pf').value,name:document.getElementById('pn').value.trim(),phone:document.getElementById('pp').value.trim(),gender:document.getElementById('pg').value,notes:document.getElementById('px').value,createdAt:new Date().toLocaleDateString('ar-YE')};
 if(!p.name)return alert('يرجى إدخال اسم المريض.');
 db.patients.push(p);save();closeModal();
 const ch=document.querySelector('input[name="send"]:checked')?.value;
 if(ch&&ch!=='none') sendMessage(p.phone,patientMsg(p),ch,'تسجيل مريض جديد');
 page('patients');
}
function patientMsg(p){return `مرحباً بك في ${db.settings.centerName} 🌷\nتم تسجيل ملفك بنجاح.\nرقم الملف: ${p.fileNo}\nنتمنى لك دوام الصحة والعافية.\n${db.settings.centerName}\n${db.settings.phone}`}

function packages(m){
 m.innerHTML=head('الباقات','إدارة الباقات والجلسات والمتبقي')+`<div class="section-head"><h3>الباقات (${db.packages.length})</h3><button class="primary" onclick="openPackage()">+ إضافة باقة</button></div>
 <table class="table"><tr><th>المريض</th><th>الباقة</th><th>الجلسات</th><th>المستخدم</th><th>المتبقي</th><th>القيمة</th><th>الحالة</th><th>إجراء</th></tr>
 ${db.packages.map(x=>`<tr><td>${esc(patientName(x.patientId))}</td><td>${esc(x.name)}</td><td>${x.total}</td><td>${x.used}</td><td><b>${x.remaining}</b></td><td>${money(x.price)}</td><td><span class="pill ${x.remaining===0?'red':x.remaining<=2?'orange':'green'}">${x.remaining===0?'منتهية':x.remaining<=2?'قرب الانتهاء':'نشطة'}</span></td><td>${x.remaining>0?`<button class="primary" onclick="useSession('${x.id}')">تسجيل جلسة</button>`:''}</td></tr>`).join('')||'<tr><td colspan="8">لا توجد باقات.</td></tr>'}</table>`;
}
function openPackage(){
 if(!db.patients.length)return alert('يجب تسجيل مريض أولاً.');
 modal('إضافة باقة للمريض',`<div class="form">
 <div class="field"><label>المريض</label><select id="bp">${db.patients.map(p=>`<option value="${p.id}">${esc(p.name)} — ${p.fileNo}</option>`).join('')}</select></div>
 <div class="field"><label>اسم الباقة</label><input id="bn" value="10 جلسات علاج طبيعي"></div>
 <div class="field"><label>عدد الجلسات</label><input id="bt" type="number" min="1" value="10"></div>
 <div class="field"><label>قيمة الباقة</label><input id="bprice" type="number" min="0"></div>
 <div class="field"><label>المدفوع</label><input id="bpaid" type="number" min="0"></div>
 <div class="field full"><label>إشعار الباقة</label><div class="checks"><label><input id="bwa" type="checkbox" checked> واتساب</label><label><input id="bsms" type="checkbox" checked> SMS</label></div></div></div>
 <div class="actions"><button class="primary" onclick="savePackage()">حفظ الباقة</button><button class="secondary" onclick="closeModal()">إلغاء</button></div>`);
}
function savePackage(){
 const x={id:id('PKG'),patientId:document.getElementById('bp').value,name:document.getElementById('bn').value,total:+document.getElementById('bt').value,used:0,remaining:+document.getElementById('bt').value,price:+document.getElementById('bprice').value,paid:+document.getElementById('bpaid').value,createdAt:new Date().toISOString()};
 db.packages.push(x);save();closeModal();page('packages');
 const p=db.patients.find(a=>a.id===x.patientId), wa=document.getElementById('bwa')?.checked, sms=document.getElementById('bsms')?.checked;
 if(wa)sendMessage(p.phone,packageMsg(p,x),'wa','إنشاء باقة');
 if(sms)sendMessage(p.phone,packageMsg(p,x),'sms','إنشاء باقة');
}
function packageMsg(p,x){return `مرحباً ${p.name} 🌷\nتم تفعيل ${x.name} في ${db.settings.centerName}.\nعدد الجلسات: ${x.total}\nالمستخدم: ${x.used}\nالمتبقي: ${x.remaining} جلسات\nقيمة الباقة: ${money(x.price)}\nشكراً لاختياركم ${db.settings.centerName}.`}
function useSession(pid){
 const x=db.packages.find(a=>a.id===pid); if(!x||x.remaining<=0)return;
 x.used++;x.remaining--;save();page('packages');
 const p=db.patients.find(a=>a.id===x.patientId);
 if(x.remaining>0&&x.remaining<=2){sendMessage(p.phone,`تنبيه: تبقى لديك ${x.remaining} جلسات فقط من باقتك الحالية.\nيرجى التواصل مع ${db.settings.centerName} لتجديد الباقة.`,'wa','قرب انتهاء الباقة')}
 if(x.remaining===0){sendMessage(p.phone,`مرحباً ${p.name}،\nانتهت جلسات باقتك الحالية في ${db.settings.centerName}.\nيسعدنا استقبالكم لتجديد الباقة.`,'wa','انتهاء الباقة')}
}
function appointments(m){
 m.innerHTML=head('المواعيد','حجز ومتابعة مواعيد المرضى')+`<div class="section-head"><h3>المواعيد</h3><button class="primary" onclick="openAppointment()">+ حجز موعد</button></div>
 <table class="table"><tr><th>المريض</th><th>التاريخ</th><th>الوقت</th><th>الخدمة</th><th>الحالة</th></tr>
 ${db.appointments.map(a=>`<tr><td>${esc(patientName(a.patientId))}</td><td>${a.date}</td><td>${a.time}</td><td>${esc(a.service)}</td><td><span class="pill">${a.status}</span></td></tr>`).join('')||'<tr><td colspan="5">لا توجد مواعيد.</td></tr>'}</table>`;
}
function openAppointment(){
 if(!db.patients.length)return alert('يجب تسجيل مريض أولاً.');
 modal('حجز موعد',`<div class="form"><div class="field"><label>المريض</label><select id="ap">${db.patients.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div><div class="field"><label>الخدمة</label><input id="as" value="جلسة علاج طبيعي"></div><div class="field"><label>التاريخ</label><input id="ad" type="date"></div><div class="field"><label>الوقت</label><input id="at" type="time"></div></div><div class="actions"><button class="primary" onclick="saveAppointment()">حفظ وإرسال</button><button class="secondary" onclick="closeModal()">إلغاء</button></div>`);
}
function saveAppointment(){
 const a={id:id('APT'),patientId:document.getElementById('ap').value,service:document.getElementById('as').value,date:document.getElementById('ad').value,time:document.getElementById('at').value,status:'مؤكد'};
 db.appointments.push(a);save();closeModal();page('appointments');
 const p=db.patients.find(x=>x.id===a.patientId);sendMessage(p.phone,`تم حجز موعدك في ${db.settings.centerName}.\nالتاريخ: ${a.date}\nالوقت: ${a.time}\nالخدمة: ${a.service}.`,'wa','حجز موعد');
}
function notifications(m){
 const r=db.notificationRules;
 const rows=[['patientCreated','تسجيل مريض جديد'],['packageCreated','إنشاء باقة'],['packageLow','قرب انتهاء الباقة'],['packageExpired','انتهاء الباقة'],['appointmentCreated','حجز موعد'],['appointmentReminder','تذكير بالموعد'],['appointmentChanged','تغيير الموعد'],['appointmentCancelled','إلغاء الموعد'],['invoiceCreated','فاتورة جديدة'],['dueReminder','تذكير بمبلغ مستحق']];
 m.innerHTML=head('الرسائل والإشعارات','تحكم مستقل بقنوات الإرسال وقوالب النظام')+`<div class="card"><table class="table"><tr><th>الحدث</th><th>واتساب</th><th>SMS</th></tr>${rows.map(([k,n])=>`<tr><td>${n}</td><td><input type="checkbox" ${r[k].wa?'checked':''} onchange="toggleRule('${k}','wa',this.checked)"></td><td><input type="checkbox" ${r[k].sms?'checked':''} onchange="toggleRule('${k}','sms',this.checked)"></td></tr>`).join('')}</table></div><div class="section"><div class="card"><b>سجل الإرسال</b>${db.notifications.slice(-10).reverse().map(n=>`<div class="notice">${n.date} — ${esc(n.event)} — ${esc(n.channel)} — ${esc(n.status)}</div>`).join('')||'<div class="notice">لا توجد رسائل.</div>'}</div></div>`;
}
function toggleRule(k,c,v){db.notificationRules[k][c]=v;save()}
function sendMessage(phone,text,channel,event){
 db.notifications.push({id:id('MSG'),date:new Date().toLocaleString('ar-YE'),phone,event,channel,status:'مجهز للإرسال'});
 save();
 if(!phone)return;
 if(channel==='wa'){
   const url='https://wa.me/'+phone.replace(/\D/g,'')+'?text='+encodeURIComponent(text);
   window.open(url,'_blank');
 }else if(channel==='sms'){
   window.location.href='sms:'+phone+'?body='+encodeURIComponent(text);
 }
}
function settings(m){
 m.innerHTML=head('الإعدادات','تخصيص بيانات المركز وقنوات الرسائل')+`<div class="card"><div class="form">
 <div class="field"><label>اسم المركز</label><input id="sn" value="${esc(db.settings.centerName)}"></div>
 <div class="field"><label>رقم التواصل</label><input id="sp" value="${esc(db.settings.phone)}"></div>
 <div class="field full"><label>الشعار (اختياري — رابط صورة)</label><input id="sl" value="${esc(db.settings.logo)}"></div></div><div class="actions"><button class="primary" onclick="saveSettings()">حفظ الإعدادات</button></div></div>
 <div class="section card"><b>قنوات الإرسال</b><div class="notice">واتساب وSMS في هذه النسخة يفتحان الرسالة للمراجعة والإرسال. الإرسال الآلي الحقيقي يحتاج WhatsApp Business API وSMS Gateway.</div></div>`;
}
function saveSettings(){db.settings.centerName=document.getElementById('sn').value.trim()||'مركز العلاج الطبيعي والتأهيل';db.settings.phone=document.getElementById('sp').value.trim();db.settings.logo=document.getElementById('sl').value.trim();save();page('settings')}
function modal(title,body){const d=document.createElement('div');d.id='modal';d.className='modal';d.innerHTML=`<div class="modalbox"><div class="section-head"><h2>${title}</h2><button class="secondary" onclick="closeModal()">×</button></div>${body}</div>`;document.body.appendChild(d)}
function closeModal(){document.getElementById('modal')?.remove()}
function viewPatient(pid){const p=db.patients.find(x=>x.id===pid);alert(`المريض: ${p.name}\nرقم الملف: ${p.fileNo}\nالهاتف: ${p.phone}`)}
render();
