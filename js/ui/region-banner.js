// js/ui/region-banner.js — barras cinematográficas + nome da região
let el = null;
function build() {
  const st = document.createElement('style');
  st.textContent = `
    #rb-top,#rb-bot{position:fixed;left:0;right:0;height:9vh;background:#000;z-index:60;
      pointer-events:none;transition:transform .7s cubic-bezier(.22,.9,.3,1);}
    #rb-top{top:0;transform:translateY(-100%);}
    #rb-bot{bottom:0;transform:translateY(100%);}
    #rb-name{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:61;
      font-family:'Oswald',sans-serif;font-size:34px;letter-spacing:14px;color:#e8f4f8;
      text-shadow:0 0 24px rgba(111,228,255,.35);opacity:0;transition:opacity .9s ease;
      pointer-events:none;white-space:nowrap;}
    #rb-name small{display:block;text-align:center;font-size:10px;letter-spacing:6px;
      color:rgba(232,244,248,.5);margin-top:6px;}
    .rb-show #rb-top{transform:translateY(0);} .rb-show #rb-bot{transform:translateY(0);}
    .rb-show #rb-name{opacity:1;}`;
  document.head.appendChild(st);
  el = document.createElement('div');
  el.innerHTML = `<div id="rb-top"></div><div id="rb-bot"></div>
    <div id="rb-name"><span id="rb-txt"></span><small>MARÉ DE PERUÍBE</small></div>`;
  document.body.appendChild(el);
}
let hideT = 0;
export function showRegionBanner(name) {
  if (!el) build();
  document.getElementById('rb-txt').textContent = name.toUpperCase();
  document.body.classList.add('rb-show');
  clearTimeout(hideT);
  hideT = setTimeout(() => document.body.classList.remove('rb-show'), 4200);
}