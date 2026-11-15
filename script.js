const API = "https://power.larc.nasa.gov/api/temporal/hourly/point";
const REFRESH_MS = 30 * 60 * 1000;
let rows = [], chart = null, audio = null, timer = null, index = 0, playing = false;
const $ = id => document.getElementById(id);
const stamp = d => d.getUTCFullYear()+String(d.getUTCMonth()+1).padStart(2,"0")+String(d.getUTCDate()).padStart(2,"0");
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),3200)}
function status(msg,kind="wait"){ $("feedStatus").textContent=msg;const dot=document.querySelector(".status i");dot.style.background=kind==="ok"?"#8ce2c2":kind==="error"?"#f08b83":"#e9b86c";dot.style.boxShadow=`0 0 10px ${dot.style.background}` }
function param(data,key){return data?.properties?.parameter?.[key]||{}}
function parse(data){
 const t=param(data,"T2M"),h=param(data,"RH2M"),w=param(data,"WS10M");
 return Object.keys(t).sort().map(k=>({key:k,date:new Date(Date.UTC(+k.slice(0,4),+k.slice(4,6)-1,+k.slice(6,8),+k.slice(8,10))),temp:+t[k],humidity:+h[k],wind:+w[k]}))
 .filter(r=>Number.isFinite(r.temp)&&r.temp!==-999&&r.temp>-100&&r.temp<70);
}
async function loadNASA(){
 const lat=Number($("latitude").value),lon=Number($("longitude").value);
 if(!Number.isFinite(lat)||lat < -90||lat>90||!Number.isFinite(lon)||lon < -180||lon>180){toast("Enter valid latitude and longitude.");return}
 status("Fetching latest available NASA observations…");
 const now=new Date(),from=new Date(now.getTime()-6*86400000);
 const q=new URLSearchParams({parameters:"T2M,RH2M,WS10M",community:"RE",longitude:lon.toFixed(2),latitude:lat.toFixed(2),start:stamp(from),end:stamp(now),format:"JSON","time-standard":"UTC"});
 try{
  const response=await fetch(`${API}?${q}`);
  if(!response.ok)throw Error(`NASA POWER HTTP ${response.status}`);
  const data=await response.json();const result=parse(data);
  if(!result.length)throw Error("No valid hourly temperature values returned.");
  rows=result;render();status("NASA POWER connected · latest available data","ok");
 }catch(err){console.error(err);status("NASA data unavailable","error");$("temperatureTime").textContent="Could not retrieve latest observation";toast("NASA data could not load. Check internet and retry.")}
}
function render(){
 const latest=rows.at(-1);
 $("temperatureValue").textContent=latest.temp.toFixed(1);
 $("humidityValue").textContent=Number.isFinite(latest.humidity)&&latest.humidity!==-999?latest.humidity.toFixed(0):"—";
 $("windValue").textContent=Number.isFinite(latest.wind)&&latest.wind!==-999?latest.wind.toFixed(1):"—";
 $("temperatureTime").textContent="Latest available: "+latest.date.toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})+" IST";
 const recent=rows.slice(-24);$("chartRange").textContent=`${recent.length} hourly values · latest returned`;
 if(chart)chart.destroy();
 chart=new Chart($("temperatureChart"),{type:"line",data:{labels:recent.map(r=>r.date.toLocaleTimeString("en-IN",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit"})),datasets:[{data:recent.map(r=>r.temp),borderColor:"#69d9e8",backgroundColor:"rgba(105,217,232,.10)",borderWidth:2,pointRadius:2,pointHoverRadius:5,pointBackgroundColor:"#8ce2c2",fill:true,tension:.35}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:"#102a40",titleColor:"#9ab6c7",bodyColor:"#effbff",callbacks:{label:c=>c.parsed.y.toFixed(1)+" °C"}}},scales:{x:{grid:{display:false},ticks:{color:"#7893a7",maxTicksLimit:6,font:{size:9}},border:{display:false}},y:{grid:{color:"rgba(159,196,218,.09)"},ticks:{color:"#7893a7",font:{size:9},callback:v=>v+"°"},border:{display:false}}}}});
}
function makeBars(){const box=$("bars");for(let i=0;i<40;i++){const b=document.createElement("i");b.style.setProperty("--h",(12+Math.abs(Math.sin(i*.67))*58)+"px");b.style.setProperty("--delay",(i%9)*.07+"s");box.appendChild(b)}}
function stop(){
 playing=false;if(timer)clearTimeout(timer);timer=null;
 if(audio&&audio.state!=="closed")audio.close();audio=null;
 $("soundVisual").classList.remove("playing");$("playButton").disabled=false;$("stopButton").disabled=true;$("soundStatus").textContent="Playback stopped";
}
async function play(){
 if(!rows.length){toast("Load NASA data before playing.");return}
 stop();audio=new(window.AudioContext||window.webkitAudioContext)();await audio.resume();playing=true;index=0;
 $("soundVisual").classList.add("playing");$("playButton").disabled=true;$("stopButton").disabled=false;$("soundStatus").textContent="Playing hourly NASA temperature values…";nextTone();
}
function nextTone(){
 if(!playing)return;const recent=rows.slice(-24);
 if(index>=recent.length){stop();$("soundStatus").textContent="Sonification complete · replay to listen again";return}
 const r=recent[index],hz=180+Math.max(0,Math.min(40,r.temp))*11;
 const osc=audio.createOscillator(),gain=audio.createGain();osc.type="sine";osc.frequency.setValueAtTime(hz,audio.currentTime);
 gain.gain.setValueAtTime(.0001,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.12,audio.currentTime+.04);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.42);
 osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+.45);
 $("soundStatus").textContent=`${r.date.toLocaleTimeString("en-IN",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit"})} · ${r.temp.toFixed(1)}°C · ${Math.round(hz)} Hz`;
 index++;timer=setTimeout(nextTone,520);
}
$("updateLocation").addEventListener("click",loadNASA);
$("useLocation").addEventListener("click",()=>{if(!navigator.geolocation){toast("Location is not supported by this browser.");return}navigator.geolocation.getCurrentPosition(p=>{$("latitude").value=p.coords.latitude.toFixed(2);$("longitude").value=p.coords.longitude.toFixed(2);loadNASA()},()=>toast("Location permission denied. Enter coordinates manually."))});
$("playButton").addEventListener("click",play);$("stopButton").addEventListener("click",stop);
makeBars();loadNASA();setInterval(loadNASA,REFRESH_MS);
