// Replace these two placeholders with your Supabase Project URL and Publishable key.
// Never put your Supabase Secret/service_role key in this file.
const SUPABASE_URL = "https://jbjfbczsxezptvhswfmm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_QhEWhEnwiVutvWyR983O0w_itQJZaWQ";

(() => {
 const gate=document.getElementById('authGate');
 const authForm=document.getElementById('authForm');
 const authMessage=document.getElementById('authMessage');
 const authToggle=document.getElementById('authToggle');
 const authSubmit=document.getElementById('authSubmit');
 const signupNameWrap=document.getElementById('signupNameWrap');
 const profilePanel=document.getElementById('profilePanel');
 const profileMessage=document.getElementById('profileMessage');
 let isSignup=false, client=null, currentUser=null;
 const say=(el,msg)=>{el.textContent=msg||''};
 const configured=()=>SUPABASE_URL.startsWith('https://') && SUPABASE_PUBLISHABLE_KEY.length>20 && !SUPABASE_URL.includes('PASTE_') && !SUPABASE_PUBLISHABLE_KEY.includes('PASTE_');
 function showApp(){gate.hidden=true;document.getElementById('profileOpen').hidden=false;document.getElementById('signOutBtn').hidden=false;}
 function showAuth(){gate.hidden=false;document.getElementById('profileOpen').hidden=true;document.getElementById('signOutBtn').hidden=true;}
 async function loadProfile(){
  const {data,error}=await client.from('students').select('*').eq('user_id',currentUser.id).maybeSingle();
  if(error){console.error(error);toast('Could not load profile. Check students table policies.');return;}
  document.getElementById('pfName').value=data?.full_name||currentUser.user_metadata?.full_name||'';
  document.getElementById('pfEmail').value=currentUser.email||'';
  document.getElementById('pfCollege').value=data?.college||'';
  document.getElementById('pfDepartment').value=data?.department||'CSE';
  document.getElementById('pfYear').value=data?.graduation_year||new Date().getFullYear()+3;
  if(data?.full_name) S.student.name=data.full_name;
  if(data?.full_name) S.resume=S.resume.replace(/^.*$/m,data.full_name);
  if(!data?.college || !data?.department || !data?.graduation_year){profilePanel.classList.add('open');profilePanel.setAttribute('aria-hidden','false');}
 }
 async function handleSession(session){
  if(!session?.user){currentUser=null;showAuth();return;}
  currentUser=session.user;showApp();await loadProfile();
 }
 authToggle.addEventListener('click',()=>{
  isSignup=!isSignup;signupNameWrap.hidden=!isSignup;
  document.getElementById('authTitle').textContent=isSignup?'Create your student account':'Welcome to Smart Internship Portal';
  document.getElementById('authIntro').textContent=isSignup?'Use your college email if available. You may need to confirm your email before logging in.':'Log in to access your student dashboard.';
  authSubmit.textContent=isSignup?'Create account':'Log in';authToggle.textContent=isSignup?'Back to login':'Create account';
  document.getElementById('authPassword').autocomplete=isSignup?'new-password':'current-password';say(authMessage,'');
 });
 authForm.addEventListener('submit',async e=>{
  e.preventDefault();say(authMessage,'');
  if(!client){say(authMessage,'Supabase is not configured. Add your Project URL and Publishable key in the code first.');return;}
  const email=document.getElementById('authEmail').value.trim();
  const password=document.getElementById('authPassword').value;
  authSubmit.disabled=true;
  try{
   if(isSignup){
    const full_name=document.getElementById('authName').value.trim();
    if(!full_name){say(authMessage,'Enter your full name.');return;}
    const {data,error}=await client.auth.signUp({email,password,options:{data:{full_name}}});
    if(error) throw error;
    if(data.session){await handleSession(data.session);toast('Account created. Complete your profile.');}
    else say(authMessage,'Account created. Check your email to confirm it, then log in.');
   }else{
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error) throw error;
    await handleSession(data.session);toast('Logged in successfully.');
   }
  }catch(err){say(authMessage,err.message||'Authentication failed.');}
  finally{authSubmit.disabled=false;}
 });
 document.getElementById('profileOpen').addEventListener('click',()=>{profilePanel.classList.add('open');profilePanel.setAttribute('aria-hidden','false');});
 document.getElementById('profileClose').addEventListener('click',()=>{profilePanel.classList.remove('open');profilePanel.setAttribute('aria-hidden','true');});
 profilePanel.addEventListener('click',e=>{if(e.target===profilePanel){profilePanel.classList.remove('open');profilePanel.setAttribute('aria-hidden','true');}});
 document.getElementById('profileForm').addEventListener('submit',async e=>{
  e.preventDefault();say(profileMessage,'');if(!currentUser)return;
  const row={user_id:currentUser.id,full_name:document.getElementById('pfName').value.trim(),email:currentUser.email,college:document.getElementById('pfCollege').value.trim(),department:document.getElementById('pfDepartment').value.trim(),graduation_year:Number(document.getElementById('pfYear').value)};
  const {error}=await client.from('students').upsert(row,{onConflict:'user_id'});
  if(error){say(profileMessage,error.message);return;}
  S.student.name=row.full_name;toast('Student profile saved.');profilePanel.classList.remove('open');profilePanel.setAttribute('aria-hidden','true');
 });
 document.getElementById('signOutBtn').addEventListener('click',async()=>{const {error}=await client.auth.signOut();if(error){toast(error.message);return;}showAuth();toast('Signed out.');});
 async function init(){
  if(!configured() || !window.supabase){say(authMessage,'Website setup needed: add your Supabase Project URL and Publishable key to index.html.');return;}
  client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
  const {data:{session}}=await client.auth.getSession();await handleSession(session);
  client.auth.onAuthStateChange((_event,session)=>{handleSession(session);});
 }
 init();
})();
