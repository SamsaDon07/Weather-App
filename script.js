// Elements
const searchForm = document.getElementById('searchForm');
const input = document.getElementById('cityInput');
const resultDiv = document.getElementById('weatherResult');
const forecastDiv = document.getElementById('forecastTempChart').getContext('2d');
const animationContainer = document.getElementById('weatherAnimation');
const geoBtn = document.getElementById('geoBtn');
const unitC = document.getElementById('unitC');
const unitF = document.getElementById('unitF');
const toggleHourly = document.getElementById('toggleHourly');
const toggleDaily = document.getElementById('toggleDaily');

let unit = localStorage.getItem('unit') || 'metric';
let lastCity = '';
let chartType = 'daily';
let currentChart = null;

// Unit toggle
function setUnit(u){
  unit=u;
  localStorage.setItem('unit',unit);
  unitC.classList.toggle('active', unit==='metric');
  unitF.classList.toggle('active', unit==='imperial');
}
setUnit(unit);
unitC.addEventListener('click',()=>{setUnit('metric'); if(lastCity) fetchAndRender(lastCity);});
unitF.addEventListener('click',()=>{setUnit('imperial'); if(lastCity) fetchAndRender(lastCity);});

// Forecast toggle
toggleHourly.addEventListener('click',()=>{chartType='hourly'; toggleHourly.classList.add('bg-blue-500'); toggleDaily.classList.remove('bg-blue-500'); if(lastCity) fetchAndRender(lastCity);});
toggleDaily.addEventListener('click',()=>{chartType='daily'; toggleDaily.classList.add('bg-blue-500'); toggleHourly.classList.remove('bg-blue-500'); if(lastCity) fetchAndRender(lastCity);});

// Search & geolocation
searchForm.addEventListener('submit', e=>{ e.preventDefault(); doSearch(); });
geoBtn.addEventListener('click', ()=>{
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(async pos=>{
      lastCity=`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`;
      input.value='';
      await fetchAndRender(lastCity);
    });
  } else alert('Geolocation not supported');
});
function doSearch(){ const v=input.value.trim(); if(!v) return; lastCity=v; fetchAndRender(v); }
input.addEventListener('keydown', e=>{if(e.key==='Enter'){e.preventDefault();doSearch();}});

// Loading skeleton
function showLoading(){
  resultDiv.innerHTML = `<div class="weather-card skeleton" style="height:200px"></div>`;
}

// Background
function setBackgroundFor(main){
  const gradients={
    cloud:'linear-gradient(180deg,#0b2540,#0f3b5b)',
    rain:'linear-gradient(180deg,#0b2b3a,#08304a)',
    clear:'linear-gradient(180deg,#0b3a63,#07305d)',
    snow:'linear-gradient(180deg,#14344a,#05202a)',
    thunder:'linear-gradient(180deg,#1b263b,#00101a)',
    default:'linear-gradient(180deg,#0f172a,#0b3a63)'
  };
  const m=String(main||'').toLowerCase();
  document.body.style.background=gradients[Object.keys(gradients).find(k=>m.includes(k))||'default'];
}

// Weather animations
function setWeatherAnimation(weather){
  animationContainer.innerHTML='';
  const w=String(weather).toLowerCase();
  if(w.includes('cloud')){
    for(let i=0;i<3;i++){
      const cloud=document.createElement('div');
      cloud.className='cloud';
      cloud.style.top=`${10+i*15}%`;
      cloud.style.animationDuration=`${50+i*10}s`;
      cloud.style.left=`${Math.random()*100}%`;
      animationContainer.appendChild(cloud);
    }
  } else if(w.includes('rain')||w.includes('drizzle')){
    for(let i=0;i<30;i++){
      const drop=document.createElement('div');
      drop.className='rain-drop';
      drop.style.left=`${Math.random()*100}%`;
      drop.style.animationDuration=`${0.8+Math.random()*0.5}s`;
      drop.style.animationDelay=`${Math.random()}s`;
      animationContainer.appendChild(drop);
    }
  } else if(w.includes('snow')){
    for(let i=0;i<20;i++){
      const flake=document.createElement('div');
      flake.className='snowflake';
      flake.style.left=`${Math.random()*100}%`;
      flake.style.animationDuration=`${3+Math.random()*2}s`;
      flake.style.animationDelay=`${Math.random()*2}s`;
      animationContainer.appendChild(flake);
    }
  } else if(w.includes('clear')){
    const sun=document.createElement('div');
    sun.className='sun-glow';
    animationContainer.appendChild(sun);
  }
}

// Fetch & render
async function fetchAndRender(inputValue){
  showLoading();
  const cities=String(inputValue).split(',').map(s=>s.trim()).filter(Boolean).slice(0,6);
  lastCity=cities.join(',');
  const apiKey='d44511a5abb5a2af32b17d14f9369353'; // <-- Replace
  const results = await Promise.all(cities.map(async city=>{
    try{
      const curUrl=city.startsWith('lat=')?`https://api.openweathermap.org/data/2.5/weather?${city}&appid=${apiKey}&units=${unit}`:`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${unit}`;
      const forUrl=city.startsWith('lat=')?`https://api.openweathermap.org/data/2.5/forecast?${city}&appid=${apiKey}&units=${unit}`:`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${unit}`;
      const cur=await (await fetch(curUrl)).json();
      const forJ=await (await fetch(forUrl)).json();
      return {city,current:cur,forecast:forJ};
    }catch(e){return {city,error:true};}
  }));

  // Cards
  resultDiv.innerHTML=results.map(res=>{
    if(res.error) return `<div class="weather-card">Error fetching ${res.city}</div>`;
    const d=res.current;
    if(!d||d.cod!==200) return `<div class="weather-card">${res.city}: ${d.message||'Not found'}</div>`;
    const w=d.weather[0];
    const icon=`https://openweathermap.org/img/wn/${w.icon}@4x.png`;
    const temp=Math.round(d.main.temp);
    const humidity=d.main.humidity;
    const wind=d.wind.speed;
    const list=(res.forecast?.list||[]).filter(it=>it.dt_txt.includes('12:00:00')).slice(0,4);
    const mini=list.map(f=>`<div class="mini-forecast-item"><div class="date">${new Date(f.dt_txt).toLocaleDateString(undefined,{weekday:'short'})}</div><img src="https://openweathermap.org/img/wn/${f.weather[0].icon}@2x.png" style="width:48px;height:48px"><div class="tempval">${Math.round(f.main.temp)}°</div></div>`).join('');
    return `<div class="weather-card"><div class="weather-main"><img class="weather-icon" src="${icon}"><div class="weather-info"><h2>${d.name}, ${d.sys.country}</h2><div class="temp">${temp}°${unit==='metric'?'C':'F'}</div><div class="desc">${w.description}</div><div class="details"><div class="detail">Humidity: ${humidity}%</div><div class="detail">Wind: ${wind} ${unit==='metric'?'m/s':'mph'}</div></div><div class="mini-forecast-row">${mini}</div></div></div></div>`;
  }).join('');

  const firstValid=results.find(r=>r.current&&r.current.cod===200);
  if(firstValid){
    setBackgroundFor(firstValid.current.weather[0].main);
    setWeatherAnimation(firstValid.current.weather[0].main);
    renderChart(firstValid);
  }
}

// Chart.js
function renderChart(cityData){
  if(!cityData?.forecast?.list) return;
  if(currentChart) currentChart.destroy();
  const list=cityData.forecast.list;
  let data=[], labels=[];
  if(chartType==='daily'){
    const daily=list.filter(f=>f.dt_txt.includes('12:00:00')).slice(0,5);
    data=daily.map(f=>Math.round(f.main.temp));
    labels=daily.map(f=>new Date(f.dt_txt).toLocaleDateString(undefined,{weekday:'short'}));
  } else {
    const next12=list.slice(0,12);
    data=next12.map(f=>Math.round(f.main.temp));
    labels=next12.map(f=>new Date(f.dt_txt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}));
  }
  currentChart=new Chart(forecastDiv,{
    type:'line',
    data:{labels,datasets:[{data,borderColor:'#60a5fa',backgroundColor:'rgba(96,165,250,0.12)',tension:0.35,fill:true,pointRadius:3}]},
    options:{plugins:{legend:{display:false}},scales:{x:{display:true},y:{display:true}},responsive:true,maintainAspectRatio:false}
  });
}

// Load last search
const lastCities=localStorage.getItem('lastCities');
if(lastCities){ input.value=lastCities; fetchAndRender(lastCities); }
