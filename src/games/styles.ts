// Calm palette: soft colours, no red, no flashing, motion only when the user allows it.
export const PARENTING_CSS = `
.sq-wrap{max-width:420px;margin:0 auto;padding:1rem var(--px) 3rem}
.sq-tabs,.sq-types{display:flex;gap:.4rem}
/* Only the chosen tab spells out its name; the others fold down to just an icon. */
.sq-tab,.sq-type{flex:0 0 auto;min-width:48px;min-height:48px;display:flex;align-items:center;justify-content:center;gap:.5rem;
  padding:.4rem .6rem;border:1px solid var(--line);background:transparent;cursor:pointer;color:var(--ink-60);transition:flex-grow .25s ease}
.sq-tab.on,.sq-type.on{flex:1 1 auto;justify-content:flex-start;border:2px solid var(--accent);background:color-mix(in srgb,var(--accent) 8%,#fff);color:var(--ink)}
.sq-ico{font-size:1.4rem;line-height:1;flex:none}
.sq-ico.txt{font-family:var(--f-display);font-weight:700;font-size:1.15rem;color:var(--accent)}
.sq-tabtext{display:flex;flex-direction:column;text-align:left;min-width:0}
.sq-tabtext strong{font-family:var(--f-display);font-size:.92rem;line-height:1.2;font-weight:600;color:var(--ink)}
.sq-tabtext small{font-family:var(--f-ui);font-size:.62rem;line-height:1.35;color:var(--ink-60)}
.sq-typetext{font-family:var(--f-ui);font-size:.74rem;line-height:1.25;font-weight:700;text-align:left}
.sq-tab:focus-visible,.sq-type:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
/* The options inside a game are a different kind of control from the game tabs above them:
   rounded chips in ochre, behind a small caption, so the two levels never read as equals. */
.sq-types{align-items:center}
.sq-types.wrap{flex-wrap:wrap}
.sq-subcap{flex:none;font-family:var(--f-ui);font-size:.56rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-50);padding:0 .2rem}
.sq-type{min-height:40px;min-width:40px;padding:.25rem .65rem;border-radius:999px;background:#fff}
.sq-type .sq-ico{font-size:1.2rem}
.sq-type.on{border:1.5px solid var(--accent-3);background:color-mix(in srgb,var(--accent-3) 14%,#fff)}
@media (prefers-reduced-motion:reduce){.sq-tab,.sq-type{transition:none}}
.sq-nav{margin-bottom:.75rem}
.sq-nav .sq-tabs{margin-bottom:.5rem}

.sq-card{position:relative;overflow:hidden;border:1px solid var(--line);background:rgba(245,243,239,0.6);padding:1rem}
.sq-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:.4rem}
.sq-tools{display:flex;gap:.5rem}
/* The "i": how to play, spoken and shown. */
.sq-info.on{color:var(--accent);border-color:var(--accent)}
.sq-bubble{position:absolute;right:.75rem;top:3.6rem;z-index:3;max-width:min(80%,320px);background:var(--ink);color:var(--bg);
  padding:.7rem .9rem;font-family:var(--f-ui);font-size:.82rem;line-height:1.5;box-shadow:0 8px 24px rgba(15,13,10,.25)}
.sq-nav .sq-rotate-nav,.sq-nav .sq-gear-nav,.sq-nav .sq-album-nav,.sq-nav .sq-play-nav{display:none}
.sq-dialog{border:1px solid var(--line);background:var(--surface);color:var(--ink);padding:1.1rem 1.25rem 1.25rem;width:min(92vw,460px);
  max-height:calc(100svh - 24px);overflow:auto;margin:auto;font-family:var(--f-ui);font-size:.8rem;color:var(--ink-60);box-shadow:0 20px 50px rgba(15,13,10,.3)}
.sq-dialog::backdrop{background:rgba(22,19,15,.5)}
.sq-len{flex-wrap:wrap;gap:.35rem .75rem}
.sq-len > span{flex:1 0 100%;font-size:.78rem;color:var(--ink)}
.sq-len input[type=range]{flex:1 0 100%}
.sq-len small{flex:1 0 100%;font-size:.7rem;color:var(--ink-50)}
.sq-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(1rem + env(safe-area-inset-bottom));z-index:95;background:var(--ink);color:var(--bg);
  padding:.7rem 1rem;font-family:var(--f-ui);font-size:.78rem;line-height:1.4;max-width:90vw;text-align:center;box-shadow:0 8px 24px rgba(15,13,10,.25)}
/* Play mode: just the game, and a lock that only a long press opens. */
.sq-icon.sq-play{background:var(--accent);border-color:var(--accent);color:#fff}
.sq-icon.sq-play.faded{opacity:.45}
.sq-icon.sq-play:focus-visible{outline-color:var(--accent-3)}
/* No pull-down-to-refresh while a game is open: see Games.tsx. */
html.sq-nopull, html.sq-nopull body{overscroll-behavior-y:none}
.sq-lock{position:relative;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.sq-lock-ring{position:absolute;inset:-1px;width:calc(100% + 2px);height:calc(100% + 2px);transform:rotate(-90deg);pointer-events:none}
.sq-lock-ring circle{stroke:var(--accent);stroke-dasharray:125.7;stroke-dashoffset:125.7;stroke-linecap:round}
.sq-lock.holding{color:var(--accent);border-color:var(--accent)}
.sq-lock.holding .sq-lock-ring circle{stroke-dashoffset:0;transition:stroke-dashoffset 2.5s linear}
body:has(.sq-wrap.playmode) .pr-install{display:none}
body:has(.sq-wrap.playmode){padding-top:.5rem}
.sq-playbox{margin-bottom:.2rem}
.sq-home-groups{display:grid;gap:.8rem}
/* A group of games as a panel: a header that opens and closes it, and the tiles inside. */
.sq-panel-h{margin:0;font:inherit}
.sq-panel-btn{display:flex;align-items:center;gap:.8rem;width:100%;min-height:64px;padding:.6rem .9rem;border:1px solid var(--line);background:#fff;cursor:pointer;
  text-align:left;color:var(--ink);-webkit-tap-highlight-color:transparent;transition:border-color .2s,background .2s}
.sq-panel-btn:hover{border-color:var(--accent)}
.sq-panel-btn:active{background:color-mix(in srgb,var(--accent) 8%,#fff)}
.sq-panel-btn:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.sq-panel:not(.closed) .sq-panel-btn{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 6%,#fff)}
.sq-panel-ico{flex:none;font-size:1.9rem;line-height:1}
.sq-panel-text{display:flex;flex-direction:column;gap:.1rem;min-width:0;flex:1}
.sq-panel-title{font-family:var(--f-display);font-weight:600;font-size:1.15rem;line-height:1.2}
.sq-panel-text small{font-family:var(--f-ui);font-weight:400;font-size:.66rem;letter-spacing:.04em;color:var(--ink-50)}
.sq-panel-count{flex:none;min-width:1.7rem;padding:.15rem .5rem;border-radius:999px;background:color-mix(in srgb,var(--accent) 12%,#fff);font-family:var(--f-ui);font-size:.72rem;font-weight:600;text-align:center;color:var(--ink)}
.sq-panel-chev{flex:none;display:grid;place-items:center;color:var(--ink-60);transform:rotate(90deg)}
.sq-panel.closed .sq-panel-chev{transform:rotate(0deg)}
/* The body is as tall as its tiles when open and nothing when closed; a closed body is also hidden, so its links
   cannot be reached with the keyboard or read out. */
.sq-panel-body{display:grid;grid-template-rows:1fr;padding-top:.6rem}
.sq-panel-inner{min-height:0;overflow:hidden;padding:4px;margin:-4px}
.sq-panel.closed .sq-panel-body{grid-template-rows:0fr;padding-top:0}
.sq-panel.closed .sq-panel-inner{visibility:hidden}
.sq-home-groups.slide .sq-panel-body{transition:grid-template-rows .28s ease,padding-top .28s ease}
.sq-home-groups.slide .sq-panel-inner{transition:visibility 0s}
.sq-home-groups.slide .sq-panel.closed .sq-panel-inner{transition:visibility 0s .28s}
.sq-home-groups.slide .sq-panel-chev{transition:transform .28s ease}
@media (prefers-reduced-motion:reduce){.sq-home-groups.slide .sq-panel-body,.sq-home-groups.slide .sq-panel-chev,.sq-home-groups.slide .sq-panel-inner{transition:none!important}}
.sq-tiles{display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem}
.sq-tile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.35rem;min-height:132px;padding:1rem .75rem;
  border:1px solid var(--line);background:#fff;cursor:pointer;text-align:center;color:var(--ink);-webkit-tap-highlight-color:transparent;transition:border-color .2s,background .2s}
.sq-tile:hover{border-color:var(--accent)}
.sq-tile:active{background:color-mix(in srgb,var(--accent) 8%,#fff)}
.sq-tile:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.sq-tile-ico{font-size:2.6rem;line-height:1}
.sq-tile strong{font-family:var(--f-display);font-size:1rem;font-weight:600;line-height:1.2}
.sq-tile small{font-family:var(--f-ui);font-size:.66rem;line-height:1.35;color:var(--ink-60)}
.sq-nav.home{margin-bottom:0}
.sq-gamehead{display:flex;align-items:center;gap:.6rem;margin-bottom:.5rem}
.sq-homebtn{flex:none;min-height:48px;display:flex;align-items:center;gap:.35rem;padding:.3rem .9rem .3rem .6rem;border:1px solid var(--line);background:#fff;
  cursor:pointer;font-family:var(--f-ui);font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-60)}
.sq-homebtn span:first-child{font-size:1.6rem;line-height:1;margin-top:-.15rem}
.sq-homebtn:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.sq-here{display:flex;align-items:center;gap:.5rem;min-width:0}
.sq-here strong{font-family:var(--f-display);font-size:1rem;font-weight:600;color:var(--ink)}
@media (prefers-reduced-motion:reduce){.sq-tile{transition:none}}
/* Matching Objects: two columns of pictures, lines drawn between them. */
.mt-card{position:relative;overflow:hidden;border:1px solid var(--line);background:rgba(245,243,239,0.6);padding:.75rem}
.mt-board{position:relative;display:grid;grid-template-columns:1fr minmax(56px,.9fr) 1fr;margin:.5rem 0;touch-action:none;user-select:none;-webkit-user-select:none}
.mt-col{display:flex;flex-direction:column;gap:.6rem}
.mt-item{height:clamp(62px,11vh,86px);display:grid;place-items:center;padding:.3rem;border:2px solid var(--line);background:#fff;cursor:pointer;
  touch-action:none;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}
.mt-item:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.mt-art{height:100%;width:auto;max-width:100%;pointer-events:none}
.mt-word{font-family:var(--f-display);font-weight:600;font-size:clamp(.95rem,4.6vw,1.4rem);line-height:1.1;color:var(--ink);text-align:center;overflow-wrap:anywhere;pointer-events:none}
.mt-item.sel{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,#fff)}
.mt-item.matched{border-color:var(--mc);background:color-mix(in srgb,var(--mc) 12%,#fff);cursor:default}
.mt-item.hint{border-color:var(--accent);animation:sq-hint 1.8s ease-in-out infinite}
.mt-item.shake{animation:sq-shake .4s ease-in-out,sq-flash .9s ease-out}
/* The thinking games: How many?, What comes next?, Sort it, Odd one out, Jigsaw, Connect the dots. */
.th-card{position:relative;overflow:hidden;border:1px solid var(--line);background:rgba(245,243,239,0.6);padding:.75rem}
.th-pic{display:block;width:100%;height:100%;pointer-events:none}
.th-tray{position:relative;aspect-ratio:4 / 2.7;background:#fff;border:1px solid var(--line);margin:.4rem 0 .7rem}
.cnt-item{position:absolute;width:clamp(46px,18%,86px);aspect-ratio:1;transform:translate(-50%,-50%);padding:0;border:0;background:transparent;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.cnt-item:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.cnt-item.counted .th-pic{opacity:.5}
.cnt-badge{position:absolute;right:-3px;top:-3px;min-width:26px;height:26px;padding:0 .2rem;border-radius:13px;background:var(--accent);color:#fff;font-family:var(--f-ui);font-weight:700;font-size:.8rem;display:grid;place-items:center}
.th-nums{display:flex;gap:.7rem;justify-content:center;margin:.2rem 0 .4rem}
.th-num{width:clamp(64px,22vw,92px);height:clamp(64px,22vw,92px);font-family:var(--f-display);font-weight:600;font-size:2.4rem;background:#fff;border:2px solid var(--accent);color:var(--ink);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.th-num:focus-visible,.th-choice:focus-visible,.so-bin:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.th-num:disabled,.th-choice:disabled{opacity:.4;cursor:default}
.th-num.hint,.th-choice.hint{border-color:var(--accent);animation:sq-hint 1.8s ease-in-out infinite}
.th-num.shake,.th-choice.shake{animation:sq-shake .4s ease-in-out,sq-flash .9s ease-out}
.pt-row{display:flex;gap:.3rem;justify-content:center;margin:.6rem 0 .9rem}
.pt-cell{flex:1 1 0;max-width:60px;aspect-ratio:1;background:#fff;border:1px solid var(--line);padding:3px}
.pt-gap{border:2px dashed var(--accent);display:grid;place-items:center;font-family:var(--f-display);font-weight:700;font-size:1.7rem;color:var(--accent)}
.pt-gap.filled{border-style:solid;background:color-mix(in srgb,var(--accent) 8%,#fff)}
.th-choices{display:flex;gap:.7rem;justify-content:center;margin:0 0 .4rem}
.th-choice{width:clamp(70px,24vw,100px);height:clamp(70px,24vw,100px);padding:.35rem;background:#fff;border:2px solid var(--line);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.th-choice.right{border-color:#3F9F68;background:color-mix(in srgb,#3F9F68 10%,#fff)}
.od-grid{display:grid;gap:.7rem;justify-content:center;margin:.6rem 0}
.od-grid.n3{grid-template-columns:repeat(3,auto)}
.od-grid.n4{grid-template-columns:repeat(2,auto)}
.od-item{width:clamp(84px,34vw,120px);height:clamp(84px,34vw,120px)}
.so-card{width:min(58%,190px);aspect-ratio:1;padding:.7rem;background:#fff;border:2px solid var(--accent);box-shadow:0 6px 18px rgba(15,13,10,.12);cursor:grab;
  touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;transition:transform .22s ease,opacity .3s ease}
.so-card.dragging{transition:none;cursor:grabbing;z-index:5;box-shadow:0 12px 28px rgba(15,13,10,.22)}
.so-card.gone{opacity:0;transform:scale(.92)}
.so-card.shake{animation:sq-shake .4s ease-in-out,sq-flash .9s ease-out}
.so-bins{display:grid;gap:.6rem}
.so-bins.n2{grid-template-columns:1fr 1fr}
.so-bins.n3{grid-template-columns:repeat(3,1fr)}
.so-bin{display:flex;flex-direction:column;align-items:center;gap:.25rem;min-height:124px;padding:.55rem .3rem;cursor:pointer;background:#fff;border:2px solid var(--line);border-top:6px solid var(--accent);
  font-family:var(--f-ui);color:var(--ink);-webkit-tap-highlight-color:transparent;transition:background .15s,border-color .15s}
.so-bin.over{background:color-mix(in srgb,var(--accent) 16%,#fff);border-color:var(--accent)}
.so-bin.hint{animation:sq-hint 1.8s ease-in-out infinite;border-color:var(--accent)}
.so-bin strong{font-family:var(--f-display);font-size:.95rem;font-weight:600;line-height:1.2;text-align:center}
.so-swatch{width:34px;height:34px;border-radius:50%;border:2px solid #3B3B4F}
.so-shape{width:38px;height:38px}
.so-icon{font-size:1.8rem;line-height:1}
.so-in{display:flex;flex-wrap:wrap;gap:.1rem;justify-content:center}
.so-mini{width:26px;height:26px}
.pz-board{display:grid;gap:2px;background:var(--line);border:2px solid var(--line);margin:.5rem auto .7rem;max-width:480px}
.pz-slot{position:relative;background:#fff;overflow:hidden}
.pz-slot.over{outline:3px solid var(--accent);outline-offset:-3px}
.pz-slot.hint{animation:sq-hint 1.8s ease-in-out infinite}
.pz-svg{display:block;width:100%;height:100%}
.pz-tray{display:grid;gap:.5rem;margin:0 auto .5rem;max-width:480px}
.pz-piece{cursor:grab;border:2px solid var(--accent);background:#fff;touch-action:none;user-select:none;-webkit-user-select:none;box-shadow:0 3px 10px rgba(15,13,10,.14);transition:transform .22s ease}
.pz-piece.dragging{transition:none;cursor:grabbing;z-index:5;box-shadow:0 10px 24px rgba(15,13,10,.24)}
.pz-piece.sel{outline:3px solid var(--accent-3);outline-offset:1px}
.pz-piece.shake{animation:sq-shake .4s ease-in-out,sq-flash .9s ease-out}
.cs-prompt{margin:.5rem 0 .7rem;text-align:center;font-family:var(--f-display);font-weight:600;font-size:1.5rem;line-height:1.25;color:var(--ink)}
.th-choices.wrap{flex-wrap:wrap;max-width:360px;margin-left:auto;margin-right:auto}
.mz-board{background:#fff;border:1px solid var(--line);margin:.5rem 0}
.mz-board svg{display:block;width:100%;height:auto;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
.mz-path{stroke:var(--accent);stroke-opacity:.7;stroke-linecap:round;stroke-linejoin:round;pointer-events:none;transition:stroke .4s}
.mz-path.won{stroke:#3F9F68;stroke-opacity:.85}
.mz-head{fill:var(--accent);fill-opacity:.9;pointer-events:none;animation:sp-pulse 1.8s ease-in-out infinite}
.mz-emoji{pointer-events:none;user-select:none}
.mz-guide{stroke:var(--accent-3,#C0832B);stroke-width:5;stroke-linecap:round;stroke-dasharray:2 11;pointer-events:none;animation:sp-pulse 1.4s ease-in-out infinite}
.mz-bump{stroke:var(--accent-3,#C0832B);stroke-width:7;stroke-linecap:round;pointer-events:none;animation:mz-bump .7s ease-out forwards}
@keyframes mz-bump{from{stroke-opacity:1}to{stroke-opacity:0}}
@media (prefers-reduced-motion:reduce){.mz-head,.mz-guide{animation:none}.mz-bump{animation:none;stroke-opacity:.6}}
.cl-board{background:#fff;border:1px solid var(--line);margin:.5rem 0}
.cl-board svg{display:block;width:100%;height:auto;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;cursor:crosshair}
.cl-palette{display:grid;grid-template-columns:repeat(6,1fr);gap:.45rem;max-width:380px;margin:.4rem auto}
.cl-swatch{aspect-ratio:1;min-height:44px;border-radius:50%;border:3px solid #fff;outline:1px solid var(--line);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.cl-swatch.on{border-color:var(--ink);outline:3px solid var(--accent)}
.cl-swatch:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.cl-swatch:disabled{opacity:.5;cursor:default}
.sq-actions .sq-btn:disabled{opacity:.45;cursor:default}
/* Family faces */
.fm-photo{width:min(62vw,230px);aspect-ratio:1;margin:.6rem auto .8rem;border:3px solid var(--accent);background:#fff;overflow:hidden}
.fm-photo img,.fm-pic img,.fm-slot img,.fm-card img{display:block;width:100%;height:100%;object-fit:cover;pointer-events:none}
.fm-names{display:flex;flex-wrap:wrap;gap:.7rem;justify-content:center;margin:0 0 .4rem}
.fm-name{min-width:120px;min-height:64px;padding:.4rem 1.1rem;font-family:var(--f-display);font-weight:600;font-size:1.35rem;background:#fff;border:2px solid var(--accent);color:var(--ink);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.fm-name:focus-visible,.fm-pic:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.fm-name:disabled,.fm-pic:disabled{opacity:.45;cursor:default}
.fm-name.right,.fm-pic.right{opacity:1;border-color:#3F9F68;background:color-mix(in srgb,#3F9F68 10%,#fff)}
.fm-name.hint,.fm-pic.hint,.fm-slot.hint,.fm-card.hint{animation:sq-hint 1.8s ease-in-out infinite}
.fm-name.shake,.fm-pic.shake,.fm-slot.shake{animation:sq-shake .4s ease-in-out,sq-flash .9s ease-out}
.fm-pics{display:grid;grid-template-columns:repeat(2,1fr);gap:.7rem;max-width:380px;margin:0 auto .4rem}
.fm-pic{aspect-ratio:1;padding:0;border:3px solid var(--line);background:#fff;overflow:hidden;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.fm-map{display:grid;gap:.4rem;margin:.4rem 0 .6rem}
.fm-rowname{font-family:var(--f-ui);font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-50);text-align:center;margin-bottom:.2rem}
.fm-row{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center}
.fm-slot{width:92px;display:grid;gap:.2rem;padding:.3rem;background:#fff;border:2px dashed var(--accent);cursor:pointer;text-align:center}
.fm-slot-hole{display:grid;place-items:center;aspect-ratio:1;background:color-mix(in srgb,var(--accent) 8%,#fff);font-family:var(--f-display);font-size:1.6rem;color:var(--accent)}
.fm-slot img{aspect-ratio:1}
.fm-slot-label{font-family:var(--f-ui);font-size:.68rem;line-height:1.2;color:var(--ink)}
.fm-slot.filled{border:2px solid #3F9F68;background:color-mix(in srgb,#3F9F68 8%,#fff)}
.fm-slot.over{border-style:solid;background:color-mix(in srgb,var(--accent) 14%,#fff)}
.fm-tray{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center;min-height:84px;padding:.5rem;background:#fff;border:1px solid var(--line)}
.fm-card{width:76px;height:76px;border:2px solid var(--accent);background:#fff;overflow:hidden;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;box-shadow:0 3px 10px rgba(15,13,10,.14);transition:transform .22s ease}
.fm-card.sel{outline:3px solid var(--accent-3);outline-offset:1px}
.fm-card.dragging{transition:none;cursor:grabbing;z-index:5;box-shadow:0 10px 24px rgba(15,13,10,.24)}
.fm-empty{display:grid;gap:.4rem;justify-items:center;padding:1.2rem .6rem;text-align:center}
.fm-empty p{margin:0;font-size:.95rem;line-height:1.5;color:var(--ink)}
.fm-empty-ico{font-size:3rem;line-height:1}
@media (prefers-reduced-motion:reduce){.fm-name.hint,.fm-pic.hint,.fm-slot.hint,.fm-card.hint{animation:none;box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 30%,transparent)}.fm-name.shake,.fm-pic.shake,.fm-slot.shake{animation:sq-flash .9s ease-out}.fm-card{transition:none}}
/* Memory pairs: cards that turn over */
.mm-grid{display:grid;gap:.6rem;width:100%;max-width:440px;margin:.5rem auto .6rem}
.mm-card{position:relative;aspect-ratio:1 / 1;padding:0;border:0;background:none;cursor:pointer;perspective:700px;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.mm-card:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.mm-card:disabled{cursor:default}
.mm-inner{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .4s ease}
.mm-card.up .mm-inner{transform:rotateY(180deg)}
.mm-face{position:absolute;inset:0;display:grid;place-items:center;border:2px solid var(--accent);-webkit-backface-visibility:hidden;backface-visibility:hidden}
.mm-back{background:color-mix(in srgb,var(--accent) 14%,#fff);font-family:var(--f-display);font-weight:600;font-size:2rem;color:var(--accent)}
.mm-front{background:#fff;transform:rotateY(180deg);padding:.3rem}
.mm-card.matched .mm-front{border-color:#3F9F68;background:color-mix(in srgb,#3F9F68 10%,#fff)}
.mm-card.hint .mm-inner{animation:mm-pulse 1.6s ease-in-out infinite}
@keyframes mm-pulse{0%,100%{filter:none}50%{filter:drop-shadow(0 0 7px var(--accent))}}
@media (prefers-reduced-motion:reduce){.mm-inner{transition:none}.mm-card.hint .mm-inner{animation:none}.mm-card.hint .mm-back{box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 35%,transparent)}}
/* Jigsaw with a photo: board and loose pieces in one drawing */
.pj-stage{width:100%;max-width:520px;margin:.4rem auto .5rem}
.pj-svg{display:block;width:100%;height:auto;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.pj-table{fill:color-mix(in srgb,var(--accent) 6%,#fff)}
.pj-shelf{fill:color-mix(in srgb,var(--accent) 9%,#fff);stroke:var(--line);stroke-width:1.5;stroke-dasharray:6 6}
.pj-board{fill:#fff;stroke:var(--line);stroke-width:2}
.pj-cut{fill:none;stroke:var(--line);stroke-width:1.2;transition:stroke-opacity .8s}
.pj-done .pj-cut{stroke-opacity:0}
.pj-cell{fill:transparent}
.pj-near{fill:color-mix(in srgb,var(--accent) 22%,transparent);stroke:var(--accent);stroke-width:2.5}
.pj-hint{fill:color-mix(in srgb,var(--accent) 18%,transparent);stroke:var(--accent);stroke-width:2.5;animation:sp-pulse 1.4s ease-in-out infinite}
.pj-piece{cursor:grab;touch-action:none}
.pj-piece.lifted{cursor:grabbing}
.pj-piece.placed{pointer-events:none}
.pj-shadow{fill:rgba(15,13,10,.22);pointer-events:none}
.pj-edge{fill:transparent;stroke:rgba(15,13,10,.4);stroke-width:1.2;transition:stroke-opacity .8s}
.pj-piece.sel .pj-edge{stroke:var(--accent-3);stroke-width:3.5;stroke-opacity:1}
.pj-done .pj-edge{stroke-opacity:0}
.dt-board{background:#fff;border:1px solid var(--line);margin:.5rem 0}
.dt-board svg{display:block;width:100%;height:auto;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
.dt-pen{stroke:#2E3A6B;stroke-opacity:.6;stroke-width:5;stroke-linecap:round;pointer-events:none}
.dt-guide{stroke:#2E3A6B;stroke-width:4;stroke-linecap:round;stroke-dasharray:2 11;pointer-events:none;animation:sp-pulse 1.4s ease-in-out infinite}
.dt-dot{cursor:pointer}
.dt-dot.hint circle:nth-of-type(2){animation:sp-pulse 1.4s ease-in-out infinite}
.dt-dot.shake{animation:sq-shake .4s ease-in-out}
.dt-fill{animation:dt-in .6s ease-out}
@keyframes dt-in{from{fill-opacity:0}to{fill-opacity:.6}}
@media (prefers-reduced-motion:reduce){
  .pj-hint{animation:none}
  .th-num.hint,.th-choice.hint,.so-bin.hint,.pz-slot.hint{animation:none;box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 25%,transparent)}
  .th-num.shake,.th-choice.shake,.so-card.shake,.pz-piece.shake{animation:sq-flash .9s ease-out}
  .dt-dot.hint circle:nth-of-type(2){animation:none}.dt-dot.shake{animation:none}.dt-fill{animation:none}.dt-guide{animation:none}
  .so-card,.pz-piece{transition:none}
}
.hb-card{position:relative;overflow:hidden;border:1px solid var(--line);background:rgba(245,243,239,0.6);padding:.75rem}
.hb-stage{min-height:150px;display:grid;place-items:center;margin:.4rem 0 .6rem;touch-action:none}
.hb-habit{position:relative;display:flex;flex-direction:column;align-items:center;gap:.5rem;width:min(88%,300px);padding:1rem 1rem 1.1rem;
  background:#fff;border:2px solid var(--accent);box-shadow:0 6px 18px rgba(15,13,10,.12);cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;
  -webkit-touch-callout:none;transition:transform .22s ease,opacity .3s ease}
.hb-habit.dragging{transition:none;cursor:grabbing;z-index:5;box-shadow:0 12px 28px rgba(15,13,10,.22)}
.hb-habit.gone{opacity:0;transform:scale(.92)}
.hb-habit.shake{animation:sq-shake .4s ease-in-out,sq-flash .9s ease-out}
.hb-emoji{font-size:3.2rem;line-height:1}
.hb-star{font-size:4rem;line-height:1}
.hb-text{font-family:var(--f-display);font-weight:600;font-size:1.25rem;line-height:1.25;text-align:center;color:var(--ink)}
.hb-hear{position:absolute;top:.4rem;right:.4rem;width:38px;height:38px}
.hb-buckets{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}
.hb-bucket{display:flex;flex-direction:column;align-items:center;gap:.25rem;min-height:130px;padding:.7rem .5rem;cursor:pointer;
  background:#fff;border:2px solid var(--line);border-top-width:6px;font-family:var(--f-ui);color:var(--ink);-webkit-tap-highlight-color:transparent;
  transition:background .15s,border-color .15s}
.hb-bucket.yes{border-color:#3F9F68;background:color-mix(in srgb,#3F9F68 8%,#fff)}
.hb-bucket.no{border-color:var(--accent-3);background:color-mix(in srgb,var(--accent-3) 9%,#fff)}
.hb-bucket.over{background:color-mix(in srgb,var(--accent) 16%,#fff);border-color:var(--accent)}
.hb-bucket:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.hb-bucket strong{font-family:var(--f-display);font-size:1rem;font-weight:600;line-height:1.2;text-align:center}
.hb-bicon{font-size:1.6rem;line-height:1}
.hb-in{display:flex;flex-wrap:wrap;gap:.15rem;justify-content:center;font-size:1.25rem;line-height:1.2}
.hb-bucket.hint{animation:sq-hint 1.8s ease-in-out infinite;border-color:var(--accent)}
@media (prefers-reduced-motion:reduce){
  .hb-habit{transition:none}
  .hb-habit.shake{animation:sq-flash .9s ease-out}
  .hb-bucket.hint{animation:none;box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 25%,transparent)}
}
.mt-lines{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
@media (prefers-reduced-motion:reduce){
  .mt-item.hint{animation:none;background:color-mix(in srgb,var(--accent) 16%,#fff);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 25%,transparent)}
  .mt-item.shake{animation:sq-flash .9s ease-out}
}
.vc-list{list-style:none;margin:.4rem 0 .6rem;padding:0;display:grid;gap:.5rem}
.vc-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.4rem .6rem;padding:.55rem .65rem;border:1px solid var(--line);background:#fff}
.vc-name{font-family:var(--f-ui);font-size:.78rem;color:var(--ink)}
.vc-name small{font-size:.7rem;color:var(--ink-50)}
.vc-actions{display:flex;flex-wrap:wrap;gap:.35rem}
.vc-actions .sq-btn{padding:.5rem .7rem;font-size:.6rem}
.vc-error{color:#9A4A12}
.pc-add{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem .8rem;margin:.4rem 0 .6rem}
.pc-count{margin:0}
.pc-grid{list-style:none;margin:.4rem 0 .8rem;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:.6rem}
.pc-item{display:grid;gap:.4rem;padding:.4rem;border:1px solid var(--line);background:#fff}
.pc-item img,.pc-blank{display:block;width:100%;aspect-ratio:4 / 3;object-fit:cover;background:var(--line)}
.pc-item .sq-btn{padding:.5rem .7rem;font-size:.6rem}
.sh-message{margin:.4rem 0 .8rem;padding:.6rem .8rem;border-left:3px solid var(--accent);background:#fff;font-size:.9rem;line-height:1.5;color:var(--ink)}
.sh-label{display:block;margin:.2rem 0 .2rem}
.sh-link{width:100%;box-sizing:border-box;padding:.6rem .7rem;border:1px solid var(--line);background:#fff;font:inherit;font-size:.85rem;color:var(--ink)}
.sh-qr{display:block;width:min(100%,240px);height:auto;margin:.4rem 0 .8rem;border:1px solid var(--line)}
.sq-note.vc-error{color:#9A4A12;font-weight:600}
.fb-kinds{border:0;margin:.4rem 0 .6rem;padding:0}
.fb-kinds legend{padding:0;margin-bottom:.2rem}
.fb-label{display:block;margin:.8rem 0 .2rem}
.fb-text,.fb-line{display:block;width:100%;box-sizing:border-box;padding:.6rem .7rem;border:1px solid var(--line);background:#fff;font:inherit;font-size:.95rem;line-height:1.5;color:var(--ink)}
.fb-text{resize:vertical;min-height:7rem}
.fb-count{margin:.2rem 0 0;text-align:right}
.fb-count.over{color:#9A4A12}
.fb-trap{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.fa-add{display:grid;gap:.1rem;margin:.4rem 0 1rem}
.fa-photo{width:min(60%,200px);aspect-ratio:1;margin:.4rem 0;border:2px dashed var(--line);background:#fff;display:grid;place-items:center;overflow:hidden}
.fa-photo img{display:block;width:100%;height:100%;object-fit:cover}
.fa-photo-ph{font-size:2.6rem}
.fa-label{display:block;margin:.7rem 0 .2rem}
.fa-list{list-style:none;margin:.4rem 0 .8rem;padding:0;display:grid;gap:.7rem}
.fa-person{display:grid;grid-template-columns:96px 1fr;gap:.7rem;padding:.6rem;border:1px solid var(--line);background:#fff;align-items:start}
.fa-person>img,.fa-person>.pc-blank{width:96px;height:96px;object-fit:cover}
.fa-fields{display:grid;gap:.1rem}
.fa-fields .sq-btn{justify-self:start;margin-top:.6rem;padding:.5rem .7rem;font-size:.6rem}
.pc-choices{display:grid;gap:.1rem;margin:.2rem 0 .5rem}
.sq-subhead{font-family:var(--f-display);font-size:1.05rem;font-weight:600;margin:.2rem 0 .1rem;color:var(--ink)}
.sq-bars{display:flex;gap:.4rem;align-items:flex-end;height:112px;margin:.5rem 0 .3rem;padding:1rem .2rem 0}
.sq-bar{flex:1;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:.15rem;min-width:0}
.sq-barn{font-size:.65rem;color:var(--ink-60);min-height:.9rem}
.sq-barfill{width:100%;max-width:26px;background:var(--accent);opacity:.75;min-height:2px;flex:none}
.sq-bard{font-size:.6rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-50)}
.sq-confirm-row{display:flex;gap:.5rem;flex-wrap:wrap;margin:.4rem 0}
.sq-stickers{list-style:none;margin:.4rem 0 0;padding:0;display:grid;grid-template-columns:repeat(5,1fr);gap:.5rem}
.sq-stickers li{aspect-ratio:1;display:grid;place-items:center;font-size:1.9rem;line-height:1;border-radius:50%;
  border:1px solid var(--line);background:#fff}
.sq-stickers li.empty{background:transparent;border-style:dashed;opacity:.6}
.sq-sticker-pop{position:fixed;left:50%;transform:translate(-50%,-50%);top:64%;z-index:94;
  display:flex;align-items:center;gap:.7rem;padding:.5rem 1.1rem .5rem .7rem;background:#fff;color:var(--ink);cursor:pointer;
  border:1px solid var(--accent);border-radius:999px;font-family:var(--f-ui);font-size:.8rem;box-shadow:0 8px 24px rgba(15,13,10,.2);
  animation:sq-pop .5s ease-out both}
.sq-sticker-pop:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.sq-sticker-emoji{font-size:2rem;line-height:1}
@keyframes sq-pop{0%{opacity:0;transform:translate(-50%,-44%)}100%{opacity:1;transform:translate(-50%,-50%)}}
@media (prefers-reduced-motion:reduce){.sq-sticker-pop{animation:none}}
.sq-confirm{width:min(86vw,340px);text-align:center}
.sq-confirm h2{font-family:var(--f-display);font-size:1.3rem;font-weight:600;margin:0 0 1rem;color:var(--ink)}
.sq-confirm-actions{display:flex;flex-direction:column;gap:.6rem}
.sq-confirm-actions .sq-btn{width:100%;min-height:48px}
.sq-label{font-family:var(--f-ui);font-size:.6rem;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-50)}
.sq-line{display:flex;align-items:center;gap:.5rem;margin-bottom:1rem}
.sq-row{display:flex;gap:.4rem;justify-content:center;flex:1;min-width:0}
.sq-slot{width:44px;flex-shrink:0}
.sq-icon{width:44px;height:44px;flex-shrink:0;display:grid;place-items:center;border:1px solid var(--line);
  background:#fff;color:var(--ink-50);cursor:pointer;border-radius:50%;touch-action:manipulation}
.sq-icon.on{color:var(--accent);border-color:var(--accent)}
.sq-icon:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.sq-pic{text-align:center;font-size:3rem;line-height:1.1;margin:.2rem 0 .6rem}
.sq-box{flex:1 1 0;min-width:0;max-width:3.4rem;height:3.8rem;display:flex;align-items:center;justify-content:center;
  font-family:var(--f-display);font-size:1.9rem;border:2px solid var(--line);background:#fff;color:var(--ink)}
.sq-box.target{border-color:var(--accent)}
.sq-box.got{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,#fff)}
.sq-box.next{border-style:dashed;border-color:var(--accent)}
.sq-box.shake{animation:sq-shake .4s ease-in-out,sq-flash .9s ease-out}
.sq-pad{display:grid;gap:.5rem;grid-template-columns:repeat(var(--cols),1fr)}
.sq-key{height:3.9rem;font-family:var(--f-display);font-size:1.8rem;color:var(--ink);background:#fff;
  border:1px solid var(--line);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.sq-key.pressed,.sq-key:active{background:color-mix(in srgb,var(--accent) 15%,#fff)}
.sq-key:focus-visible,.sq-btn:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.sq-key:disabled{opacity:.5;cursor:default}
/* The clue: the next key breathes gently, and the matching box up top is tinted. */
.sq-key.hint{border-color:var(--accent);animation:sq-hint 1.8s ease-in-out infinite}
.sq-box.target.hint{background:color-mix(in srgb,var(--accent) 14%,#fff)}
.sq-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.sq-inline select{min-height:40px;padding:.4rem .5rem;border:1px solid var(--line);background:#fff;font-size:.8rem;color:var(--ink)}
.sq-blank{visibility:hidden}
/* A phone keyboard: three staggered rows, keys a tenth of the row wide. */
.sq-kbhint{margin:.6rem 0 0;text-align:center;font-family:var(--f-ui);font-size:.7rem;color:var(--ink-50)}
.sq-kb{display:flex;flex-direction:column;gap:6px}
.sq-kbrow{display:flex;justify-content:center;gap:4px}
.sq-kbrow .sq-key{flex:0 0 calc((100% - 36px)/10);min-width:0;height:3.2rem;padding:0;font-size:1.15rem}
.sq-wrap.spelling{padding-inline:.5rem}
.sq-wrap.spelling .sq-card{padding:.75rem .5rem}
.sq-msg{min-height:2.4rem;text-align:center;font-family:var(--f-body);font-size:1.05rem;color:var(--ink-60);line-height:1.5;margin:0 0 .5rem}
.sq-msg.done{color:var(--accent);font-family:var(--f-display);font-style:italic;font-size:1.3rem}
.sq-actions{display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap}
.sq-btn{font-family:var(--f-ui);font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;padding:.8rem 1.1rem;
  border:1px solid var(--accent);background:transparent;color:var(--accent);cursor:pointer;min-height:44px}
.sq-btn.primary{background:var(--accent);color:var(--bg)}
.sq-btn:disabled{opacity:.4;cursor:default}
.sq-inline:has(input:disabled){opacity:.5}
.sq-parent{margin:0 0 1rem;border:1px solid var(--line);background:rgba(245,243,239,0.6);padding:.75rem 1rem;font-family:var(--f-ui);font-size:.75rem;color:var(--ink-60)}
.sq-parent[hidden]{display:none}
.sq-inline{display:flex;align-items:center;gap:.75rem;margin-top:.9rem}
.sq-inline input[type=checkbox]{flex:none;width:22px;height:22px;margin:0;accent-color:var(--accent)}
.sq-note{margin:.5rem 0;line-height:1.55;font-size:.72rem;color:var(--ink-60)}
.sq-field{margin-top:.8rem}
.sq-field label,.sq-flabel{display:block;font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-50);margin-bottom:.3rem}
.sq-fieldrow{display:flex;gap:.5rem;align-items:center}
.sq-field input[type=text],.sq-field select{width:100%;min-height:44px;padding:.55rem .7rem;font-size:1rem;font-family:var(--f-body);
  border:1px solid var(--line);background:#fff;color:var(--ink)}
.sq-field input:focus-visible,.sq-field select:focus-visible{outline:3px solid var(--accent);outline-offset:1px}
.sq-swatches{display:flex;gap:.5rem;flex-wrap:wrap}
.sq-swatch{width:44px;height:44px;border-radius:50%;border:2px solid transparent;cursor:pointer;font-family:var(--f-ui);font-size:.6rem;color:var(--ink-60);
  background:conic-gradient(#8DA2D6,#E0B64A,#7FBF9E,#E8A7B8,#B7A6E0,#8DA2D6)}
.sq-swatch.on{border-color:var(--ink);box-shadow:0 0 0 2px #fff inset}
.sq-swatch:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.sq-rule{border:0;border-top:1px solid var(--line);margin:1rem 0 .2rem}
.sq-icon:disabled{opacity:.4;cursor:default}
.sq-parent input[type=range]{flex:1}
.sq-tip{margin-top:.9rem;line-height:1.6}
.sq-tip a{color:var(--accent);text-decoration:underline}

.pr-install{position:fixed;z-index:90;left:max(1rem,env(safe-area-inset-left));right:max(1rem,env(safe-area-inset-right));
  bottom:calc(1rem + env(safe-area-inset-bottom));margin-inline:auto;max-width:30rem;display:flex;align-items:center;gap:.85rem;
  padding:.85rem .9rem;background:var(--surface);border:1px solid var(--line);box-shadow:0 10px 30px rgba(15,13,10,0.16);font-family:var(--f-ui)}
.pr-install img{border-radius:8px;flex-shrink:0}
.pr-install-text{display:flex;flex-direction:column;gap:.1rem;min-width:0;flex:1}
.pr-install-text strong{font-size:.85rem;font-weight:700;color:var(--ink);line-height:1.3}
.pr-install-text span{font-size:.76rem;color:var(--ink-50);line-height:1.4}
.pr-install-go{flex-shrink:0;font-family:var(--f-ui);font-weight:700;font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;
  color:#fff;background:var(--accent);border:1px solid var(--accent);padding:0 1rem;min-height:40px;cursor:pointer}
.pr-install-x{flex-shrink:0;background:none;border:none;cursor:pointer;color:var(--ink-50);font-size:1.4rem;line-height:1;width:40px;min-height:40px;display:grid;place-items:center}
@media (max-width:420px){.pr-install{gap:.6rem;padding:.75rem}.pr-install-text strong{font-size:.8rem}.pr-install-text span{font-size:.72rem}}



/* Trace the Lines: the picture to follow, and the board to draw on. */
.tr-canvas{display:block;width:100%;height:auto;aspect-ratio:4/3;touch-action:none;cursor:crosshair;background:#FBF9F5}
.tr-ref, .tr-board{background:#FBF9F5}
.tr-ref svg{display:block;width:100%;height:auto}
@media (max-width:699px){.tr-ref{width:56%;justify-self:center}}

/* Spot the Differences */
.sq-wrap.spot, .sq-wrap.trace{max-width:520px}
.sp-card{position:relative;overflow:hidden;border:1px solid var(--line);background:rgba(245,243,239,0.6);padding:.75rem}
.sp-pair{display:grid;gap:.6rem;margin-bottom:.5rem}
.sp-pic{border:2px solid var(--line);overflow:hidden;line-height:0}
.sp-pic svg{display:block;width:100%;height:auto;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.sp-pic.shake{animation:sq-shake .4s ease-in-out,sp-flash .9s ease-out}
.sp-dots{display:flex;gap:.4rem;margin-top:.35rem}
.sp-dots span{width:18px;height:18px;border-radius:50%;border:2px solid var(--accent);background:#fff}
.sp-dots span.on{background:var(--accent)}
/* many pieces: smaller dots that wrap, so the row never runs off the card */
.sp-dots.many{flex-wrap:wrap;gap:.25rem;max-width:calc(100% - 3.5rem)}
.sp-dots.many span{width:11px;height:11px;border-width:1.5px}
.sp-hint{animation:sp-pulse 1.8s ease-in-out infinite}
@keyframes sp-pulse{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes sp-flash{0%{border-color:var(--accent-3)}100%{border-color:var(--line)}}
@media (prefers-reduced-motion:reduce){
  .sp-pic.shake{animation:sp-flash .9s ease-out}
  .sp-hint{animation:none;opacity:1}
}
/* Laptops and tablets: the games use the room instead of staying phone-sized. */
@media (min-width:700px) and (min-height:521px){
  .sq-wrap{max-width:560px}
  .sq-wrap.spelling{max-width:860px;padding-inline:var(--px)}
  .sq-wrap.spot, .sq-wrap.trace{max-width:980px}
  .sq-wrap.home{max-width:760px}
  .sq-tiles{grid-template-columns:repeat(3,1fr)}
  .sq-home-groups{gap:1.8rem}
  .sq-wrap.match{max-width:640px}
  .sq-wrap.habits{max-width:640px}
  .sq-wrap.th{max-width:640px}
  .th-card{padding:1.25rem}
  .hb-card{padding:1.25rem}
  .mt-card{padding:1.25rem}
  .sp-pair{grid-template-columns:1fr 1fr}
  .sp-card{padding:1.25rem}
  .sq-wrap .sq-card{padding:1.5rem}
  .sq-wrap .sq-box{max-width:5rem;height:5rem;font-size:2.4rem}
  .sq-wrap .sq-key{height:5rem;font-size:2.1rem}
  .sq-wrap .sq-pic{font-size:4rem}
  .sq-wrap.spelling .sq-kb{gap:10px}
  .sq-wrap.spelling .sq-kbrow{gap:8px}
  .sq-wrap.spelling .sq-kbrow .sq-key{flex-basis:calc((100% - 72px)/10);height:4.6rem;font-size:1.7rem}
}
/* Spelling Bees on a phone held sideways: the word and answer on the left, a wide
   keyboard on the right, and the page furniture out of the way. */
@media (orientation:landscape) and (max-height:520px){
  /* A phone held sideways: the page furniture steps aside for every game, and the
     portrait icon (top left) is the way back. */
  body:has(.sq-wrap) .pr-install{display:none}
  body:has(.sq-wrap){padding-top:0}
  .sq-wrap, .sq-wrap.spot, .sq-wrap.trace, .sq-wrap.spelling, .sq-wrap.numbers{max-width:none;padding:.25rem max(1rem,env(safe-area-inset-left)) .25rem max(1rem,env(safe-area-inset-right))}
  .sq-nav{display:flex;gap:.4rem;margin-bottom:.25rem;align-items:stretch}
  /* A slimmer header: every game gets the room back for itself. */
  .sq-nav .sq-icon{width:36px;height:36px}
  .sq-nav .sq-icon svg{width:19px;height:19px}
  .sq-homebtn{min-height:36px;padding:.1rem .7rem .1rem .45rem}
  .sq-homebtn span:first-child{font-size:1.3rem}
  .sq-here strong{font-size:.9rem}
  .sq-here .sq-ico{font-size:1.15rem}
  .sq-nav .sq-types .sq-type{min-height:34px;min-width:34px;padding:.1rem .45rem}
  .sq-nav .sq-types .sq-type .sq-ico{font-size:1.05rem}
  .sq-nav .sq-rotate-nav, .sq-nav .sq-gear-nav, .sq-nav .sq-album-nav, .sq-nav .sq-play-nav{display:grid;flex:none;align-self:center}
  .sq-nav .sq-gamehead{flex:none;margin:0}
  .sq-tiles{grid-template-columns:repeat(4,1fr);gap:.4rem}
  .sq-home-groups{gap:.4rem}
  .sq-panel-btn{min-height:44px;padding:.25rem .7rem;gap:.6rem}
  .sq-panel-ico{font-size:1.3rem}
  .sq-panel-title{font-size:.95rem}
  .sq-panel-text{flex-direction:row;align-items:baseline;gap:.6rem}
  .sq-panel-body{padding-top:.4rem}
  .sq-tile{min-height:64px;padding:.35rem .3rem;gap:.1rem}
  .sq-tile-ico{font-size:1.5rem}
  .sq-tile small{display:none}
  .sq-tile strong{font-size:.78rem}
  /* The thinking games on a sideways phone: the same things, smaller, so the whole round is on screen. */
  .th-card{padding:.4rem .6rem}
  .sq-wrap.th .sq-top{margin:0}
  .sq-wrap.th .sq-top .sq-label{display:none}
  .sq-wrap.th .sq-msg{min-height:0;margin:0;font-size:.9rem}
  .sq-wrap.th .sq-actions{margin:0 !important;justify-content:center}
  .sq-wrap.count .th-card, .sq-wrap.dots .th-card{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:.2rem 1rem;align-items:center}
  .sq-wrap.count .th-tray{grid-column:1;grid-row:1 / span 4;aspect-ratio:auto;height:calc(100svh - 76px);margin:0}
  .sq-wrap.count .sq-top, .sq-wrap.dots .sq-top{grid-column:2;grid-row:1}
  .sq-wrap.count .th-nums{grid-column:2;grid-row:2;margin:0}
  .sq-wrap.count .sq-msg, .sq-wrap.dots .sq-msg{grid-column:2;grid-row:3}
  .sq-wrap.count .sq-actions, .sq-wrap.dots .sq-actions{grid-column:2;grid-row:4}
  .sq-wrap.count .th-num{width:58px;height:50px;font-size:1.5rem}
  .sq-wrap.pattern .pt-row{margin:.3rem 0}
  .sq-wrap.pattern .pt-cell{max-width:46px}
  .sq-wrap.pattern .th-choice{width:58px;height:58px}
  .sq-wrap.odd .od-grid{margin:.3rem 0;grid-template-columns:repeat(4,auto)}
  .sq-wrap.odd .od-item{width:clamp(58px,19vh,84px);height:clamp(58px,19vh,84px)}
  .sq-wrap.sort .hb-stage{min-height:0;margin:.2rem 0}
  .sq-wrap.sort .so-card{width:min(24%,96px);padding:.35rem}
  .sq-wrap.sort .so-bin{min-height:0;padding:.3rem .2rem}
  .sq-wrap.sort .so-mini{width:20px;height:20px}
  .sq-wrap.puzzle .th-card{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:.2rem .8rem;align-items:center}
  .sq-wrap.puzzle .sq-top{grid-column:2;grid-row:1}
  .sq-wrap.puzzle .pz-board{grid-column:1;grid-row:1 / span 4;margin:0 auto;max-width:none;width:min(100%, calc((100svh - 76px) * 1.333))}
  .sq-wrap.puzzle .pz-tray{grid-column:2;grid-row:2;margin:0 auto;max-width:none;width:78%;gap:.3rem}
  .sq-wrap.puzzle .pj-stage{grid-column:1;grid-row:1 / span 4;margin:0 auto;max-width:none;width:min(100%, calc((100svh - 76px) * var(--pj-ratio, 1)))}
  .sq-wrap.shapes .th-card{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:.2rem 1rem;align-items:center}
  .sq-wrap.shapes .sq-top{grid-column:1;grid-row:1}
  .sq-wrap.shapes .cs-prompt{grid-column:1;grid-row:2;margin:.2rem 0;font-size:1.15rem}
  .sq-wrap.shapes .th-choices{grid-column:2;grid-row:1 / span 4;margin:0 auto;gap:.5rem}
  .sq-wrap.shapes .th-choice{width:68px;height:68px}
  .sq-wrap.shapes .sq-msg{grid-column:1;grid-row:3}
  .sq-wrap.shapes .sq-actions{grid-column:1;grid-row:4}
  .sq-wrap.maze .th-card{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:.2rem 1rem;align-items:center}
  .sq-wrap.maze .mz-board{grid-column:1;grid-row:1 / span 4;margin:0 auto;width:min(100%, calc((100svh - 76px) * 1.333))}
  .sq-wrap.maze .sq-top{grid-column:2;grid-row:1}
  .sq-wrap.maze .sq-msg{grid-column:2;grid-row:3}
  .sq-wrap.maze .sq-actions{grid-column:2;grid-row:4}
  .sq-wrap.colouring .th-card{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:.2rem 1rem;align-items:center}
  .sq-wrap.colouring .cl-board{grid-column:1;grid-row:1 / span 4;margin:0 auto;width:min(100%, calc((100svh - 76px) * 1.333))}
  .sq-wrap.colouring .sq-top{grid-column:2;grid-row:1}
  .sq-wrap.colouring .cl-palette{grid-column:2;grid-row:2;grid-template-columns:repeat(6,1fr);gap:.3rem;margin:0}
  .sq-wrap.colouring .cl-swatch{min-height:30px}
  .sq-wrap.colouring .sq-msg{grid-column:2;grid-row:3}
  .sq-wrap.colouring .sq-actions{grid-column:2;grid-row:4}
  .sq-wrap.family .fm-photo{width:min(34vh,150px);margin:.2rem auto}
  .sq-wrap.family .fm-name{min-height:48px;font-size:1.1rem}
  .sq-wrap.family .fm-pics{grid-template-columns:repeat(4,1fr);max-width:none}
  .sq-wrap.family .fm-slot{width:72px}
  .sq-wrap.family .fm-card{width:56px;height:56px}
  .sq-wrap.memory .th-card{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:.2rem 1rem;align-items:center}
  .sq-wrap.memory .mm-grid{grid-column:1;grid-row:1 / span 4;margin:0 auto;gap:.35rem;max-width:none;width:min(100%, calc((100svh - 76px) * var(--mm-ratio-n, 1.2)))}
  .sq-wrap.memory .sq-top{grid-column:2;grid-row:1}
  .sq-wrap.memory .sq-msg{grid-column:2;grid-row:3}
  .sq-wrap.memory .sq-actions{grid-column:2;grid-row:4}
  .sq-wrap.memory .mm-back{font-size:1.4rem}
  .sq-wrap.puzzle .sp-dots{display:none}
  .sq-wrap.puzzle .sq-top{justify-content:flex-end}
  .sq-wrap.puzzle .sq-msg{grid-column:2;grid-row:3}
  .sq-wrap.puzzle .sq-actions{grid-column:2;grid-row:4}
  .sq-wrap.dots .dt-board{grid-column:1;grid-row:1 / span 4;margin:0 auto;width:min(100%, calc((100svh - 76px) * 1.333))}
  .sq-wrap.habits .hb-card{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:.3rem 1rem;padding:.5rem .75rem;align-items:center}
  .sq-wrap.habits .sq-top{grid-column:1;grid-row:1;margin:0}
  .sq-wrap.habits .sq-top .sq-label{display:none}
  .sq-wrap.habits .hb-stage{grid-column:1;grid-row:2;min-height:0;margin:0}
  .sq-wrap.habits .hb-habit{padding:.5rem .7rem .6rem;gap:.2rem;width:100%}
  .sq-wrap.habits .hb-emoji{font-size:2rem}
  .sq-wrap.habits .hb-text{font-size:1rem}
  .sq-wrap.habits .hb-buckets{grid-column:2;grid-row:1 / span 3}
  .sq-wrap.habits .hb-bucket{min-height:0;height:100%}
  .sq-wrap.habits .sq-msg{grid-column:1;grid-row:3;min-height:0;margin:0;font-size:.9rem}
  .sq-wrap.habits .sq-actions{grid-column:1;grid-row:4;margin:0 !important;justify-content:flex-start}
  .sq-wrap.match .mt-card{display:grid;grid-template-columns:minmax(0,1fr) 210px;gap:.3rem 1rem;padding:.4rem .75rem;align-items:center}
  .sq-wrap.match .mt-board{grid-column:1;grid-row:1 / span 3;margin:0;grid-template-columns:96px minmax(80px,1fr) 96px;max-width:360px;justify-self:center;width:100%}
  .sq-wrap.match .mt-col{gap:.3rem}
  /* The pictures share the height that is left, whatever the number of pairs (--n), so the whole board is on
     screen: the board does not scroll while a finger is drawing, so anything below the screen is out of reach. */
  .sq-wrap.match .mt-item{height:clamp(30px,calc((100svh - 84px) / var(--n, 6) - 5px),64px);padding:.15rem}
  /* The choices for what to match are one row that slides sideways, not rows that wrap and push the board down. */
  .sq-nav .sq-types.wrap{flex-wrap:nowrap;overflow-x:auto;min-width:0;scrollbar-width:none}
  .sq-nav .sq-types.wrap::-webkit-scrollbar{display:none}
  .sq-nav .sq-types.wrap .sq-type, .sq-nav .sq-types.wrap .sq-type.on{flex:0 0 auto}
  .sq-nav .sq-types.wrap .sq-subcap{display:none}
  .sq-wrap.match .sq-top{grid-column:2;grid-row:1;margin:0}
  .sq-wrap.match .sq-top .sq-label{display:none}
  .sq-wrap.match .sq-msg{grid-column:2;grid-row:2;min-height:0;margin:0;font-size:1rem}
  .sq-wrap.match .sq-actions{grid-column:2;grid-row:3;margin:0 !important}
  .sq-nav .sq-types{flex:1 1 0;margin:0;padding-left:.6rem;border-left:1px solid var(--line-soft, var(--line))}
  .sq-tab{min-height:44px;min-width:44px;padding:.2rem .5rem}
  .sq-type{min-height:38px;min-width:38px;padding:.15rem .5rem}
  .sq-tabtext small{display:none}
  .sq-typetext{font-size:.68rem}

  /* Number Steps and Spelling Bees: the word on the left, the keys on the right. */
  .sq-wrap.spelling .sq-label, .sq-wrap.spelling .sq-alabel,
  .sq-wrap.numbers .sq-label, .sq-wrap.numbers .sq-alabel, .sq-wrap.spelling .sq-kbhint, .sq-wrap.numbers .sq-kbhint{display:none}
  .sq-wrap.spelling .sq-top, .sq-wrap.numbers .sq-top{justify-content:flex-end;margin-bottom:.2rem}
  .sq-wrap.spelling .sq-card, .sq-wrap.numbers .sq-card{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);column-gap:1rem;align-items:start;padding:.5rem .75rem}
  .sq-wrap.spelling .sq-card > *, .sq-wrap.numbers .sq-card > *{grid-column:1}
  .sq-wrap.spelling .sq-card > .sq-kb, .sq-wrap.numbers .sq-card > .sq-pad{grid-column:2;grid-row:1 / span 8;align-self:center;gap:8px}
  .sq-wrap.spelling .sq-kbrow{gap:6px}
  .sq-wrap.spelling .sq-kbrow .sq-key{flex-basis:calc((100% - 54px)/10);height:3.4rem;font-size:1.3rem}
  .sq-wrap.numbers .sq-pad .sq-key{height:3.5rem;font-size:1.6rem}
  .sq-wrap.spelling .sq-pic{font-size:1.6rem;margin:0 0 .2rem;text-align:left;line-height:1}
  .sq-wrap.spelling .sq-box, .sq-wrap.numbers .sq-box{height:2.7rem;font-size:1.45rem}
  .sq-wrap.spelling .sq-line, .sq-wrap.numbers .sq-line{margin-bottom:.4rem}
  .sq-wrap.spelling .sq-msg, .sq-wrap.numbers .sq-msg{min-height:1.3rem;font-size:1rem;margin-bottom:.25rem}
  .sq-wrap.spelling .sq-msg.done, .sq-wrap.numbers .sq-msg.done{font-size:1.1rem}
  .sq-wrap.spelling .sq-actions, .sq-wrap.numbers .sq-actions{margin-top:.25rem !important;justify-content:flex-start}

  /* Spot the Differences: the two pictures side by side, a slim bar underneath. */
  .sq-wrap.spot .sp-card, .sq-wrap.trace .sp-card{display:grid;grid-template-columns:auto 1fr auto;grid-template-areas:"pair pair pair" "top msg act";gap:.4rem .75rem;padding:.5rem .75rem;align-items:center}
  .sq-wrap.spot .sp-pair, .sq-wrap.trace .sp-pair{grid-area:pair;grid-template-columns:1fr 1fr;margin:0;gap:.5rem}
  .sq-wrap.spot .sp-pic svg, .sq-wrap.trace .sp-pic svg, .sq-wrap.trace .tr-canvas{max-height:calc(100svh - 144px)}
  .sq-wrap.spot .sq-top, .sq-wrap.trace .sq-top{grid-area:top;margin:0}
  .sq-wrap.spot .sq-top .sq-label, .sq-wrap.trace .sq-top .sq-label{display:none}
  .sq-wrap.spot .sq-msg, .sq-wrap.trace .sq-msg{grid-area:msg;min-height:0;margin:0;text-align:center;font-size:1rem}
  .sq-wrap.spot .sq-actions, .sq-wrap.trace .sq-actions{grid-area:act;margin:0 !important}
}
/* Sprinkles: a slow, soft fall inside the card. Never over the keys' touch targets. */
.sq-sprinkles{position:absolute;inset:0;pointer-events:none;z-index:2}
.sq-sprinkles i{position:absolute;top:-5%;opacity:0;animation-name:sq-fall;animation-timing-function:ease-in;animation-fill-mode:forwards}
@keyframes sq-fall{0%{opacity:0;transform:translate(0,0) rotate(0)}12%{opacity:.95}80%{opacity:.9}100%{opacity:0;transform:translate(var(--drift),520px) rotate(var(--spin))}}
/* Reduced motion (Android's "Remove animations"): nothing moves. The sprinkles are
   scattered across the card and simply fade in and out, so the celebration still shows. */
@keyframes sq-twinkle{0%{opacity:0}25%,70%{opacity:.9}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){
  .sq-sprinkles i{top:var(--y);animation-name:sq-twinkle;animation-timing-function:ease-in-out}
}
@keyframes sq-hint{0%,100%{transform:scale(1);background:#fff;box-shadow:0 0 0 0 transparent}
  50%{transform:scale(1.07);background:color-mix(in srgb,var(--accent) 16%,#fff);box-shadow:0 0 0 5px color-mix(in srgb,var(--accent) 22%,transparent)}}
@keyframes sq-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
/* A colour flash that fades: the cue for anyone whose phone asks for reduced motion
   (Android's \"Remove animations\" sets this), where the shake is switched off. */
@keyframes sq-flash{0%{background:color-mix(in srgb,var(--accent-3) 55%,#fff);border-color:var(--accent-3)}100%{background:#fff}}
@media (prefers-reduced-motion:reduce){
  .sq-box.shake{animation:sq-flash .9s ease-out}
  /* No movement: the clue is a steady tinted key with a ring. */
  .sq-key.hint{animation:none;background:color-mix(in srgb,var(--accent) 16%,#fff);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 25%,transparent)}
}
`
