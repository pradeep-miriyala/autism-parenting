// The frame: header, menu, play bar, and the plain pages (stickers, about, the parents' area). Same calm palette as the
// games (see styles.ts); every control is at least 44px.
export const SHELL_CSS = `
.ls-skip{position:absolute;left:-9999px;top:0;z-index:200;background:var(--ink);color:var(--bg);padding:.6rem 1rem;font-size:.8rem}
.ls-skip:focus{left:.5rem;top:.5rem}
.ls-main{min-height:calc(100svh - var(--nav-h));outline:none}

/* ── Header ── */
.ls-header{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:.5rem;min-height:var(--nav-h);
  padding:.3rem max(.75rem,env(safe-area-inset-right)) .3rem max(.75rem,env(safe-area-inset-left));background:var(--bg);border-bottom:1px solid var(--line)}
.ls-left{display:flex;align-items:center;gap:.5rem;min-width:0;flex:1}
.ls-right{display:flex;align-items:center;gap:.4rem;flex:none}
.ls-brand{font-family:var(--f-display);font-weight:600;font-size:1.2rem;color:var(--ink);padding:.4rem .2rem;white-space:nowrap}
.ls-brand:focus-visible,.ls-crumbs a:focus-visible,.ls-stickers:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.ls-back{color:var(--ink)}
.ls-crumbs{min-width:0}
.ls-crumbs ol{display:flex;align-items:center;list-style:none;min-width:0;font-size:.82rem}
.ls-crumbs li{display:flex;align-items:center;min-width:0}
.ls-crumbs a{display:flex;align-items:center;min-height:44px;padding:0 .35rem;color:var(--ink-60);font-weight:700}
.ls-crumbs a:hover{color:var(--accent)}
.ls-crumbs .here span{display:flex;align-items:center;gap:.4rem;padding:0 .2rem;font-family:var(--f-display);font-weight:600;font-size:1.02rem;color:var(--ink);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ls-gico{font-size:1.25rem;line-height:1}
.ls-sep{display:grid;place-items:center;color:var(--ink-30)}
.ls-sep svg{width:14px;height:14px}
@media (max-width:560px){.ls-crumbs li:not(.here){display:none}.ls-crumbs .ls-sep{display:none}}
.ls-stickers{display:flex;align-items:center;gap:.35rem;height:44px;padding:0 .85rem 0 .7rem;border:1px solid var(--line);border-radius:999px;background:#fff;
  font-family:var(--f-ui);font-weight:700;font-size:.85rem;color:var(--ink)}
.ls-stickers svg{width:18px;height:18px;color:var(--accent-3)}
.ls-rotate{display:none}
@media (pointer:coarse) and (max-width:900px){.ls-rotate{display:grid}}

/* ── Menu: a panel from the right ── */
.ls-menu{position:fixed;inset:0 0 0 auto;margin:0;height:100dvh;max-height:100dvh;width:min(20rem,88vw);padding:0;border:0;border-left:1px solid var(--line);
  background:var(--surface);color:var(--ink);box-shadow:-12px 0 40px rgba(15,13,10,.25);overflow-y:auto;font-family:var(--f-ui)}
.ls-menu::backdrop{background:rgba(22,19,15,.45)}
.ls-menu[open]{animation:ls-slide .2s ease-out}
@keyframes ls-slide{from{transform:translateX(28px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.ls-menu[open]{animation:none}}
.ls-menu-head{display:flex;align-items:center;justify-content:space-between;padding:.5rem .75rem .5rem 1.1rem;border-bottom:1px solid var(--line);min-height:var(--nav-h)}
.ls-menu-head h2{font-family:var(--f-display);font-size:1.2rem;font-weight:600;margin:0}
.ls-menu nav{padding:.5rem .5rem 1.5rem}
.ls-menu-list{list-style:none}
.ls-menu-list a,.ls-menu-list button{display:flex;align-items:center;gap:.85rem;width:100%;min-height:52px;padding:.5rem .8rem;border:0;background:none;cursor:pointer;text-align:left;
  font-family:var(--f-ui);font-size:.95rem;font-weight:700;color:var(--ink)}
.ls-menu-list a:hover,.ls-menu-list button:hover{background:color-mix(in srgb,var(--accent) 6%,#fff)}
.ls-menu-list a:focus-visible,.ls-menu-list button:focus-visible{outline:3px solid var(--accent);outline-offset:-3px}
.ls-menu-list [aria-current=page]{background:color-mix(in srgb,var(--accent) 10%,#fff);color:var(--accent)}
.ls-menu-list svg{flex:none;color:var(--accent)}
.ls-menu-list small{margin-left:auto;font-size:.72rem;font-weight:400;color:var(--ink-50)}
.ls-menu-list small.on{color:var(--ok);font-weight:700}
.ls-menu-cap{margin:1.1rem .8rem .2rem;padding-top:.8rem;border-top:1px solid var(--line);font-size:.6rem;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-50)}
.ls-touch-only{display:none}
@media (pointer:coarse){.ls-touch-only{display:block}}

/* ── Play mode ── */
.ls-playbar{display:flex;gap:.5rem;justify-content:flex-end;align-items:center;max-width:420px;margin:0 auto;padding:.6rem max(var(--px),env(safe-area-inset-right)) 0}
@media (min-width:700px){.ls-playbar{max-width:560px}}

/* ── Plain pages ── */
.ls-page{max-width:640px;margin:0 auto;padding:1.25rem var(--px) 6rem}
.ls-page.home{max-width:420px}
@media (min-width:700px){.ls-page.home{max-width:760px}}
.ls-h1{font-family:var(--f-display);font-weight:600;font-size:1.7rem;line-height:1.15;letter-spacing:-.01em;color:var(--ink);margin:.2rem 0 .6rem}
.ls-card{margin-bottom:1rem}
.ls-list{margin:.4rem 0 1rem 1.2rem;font-family:var(--f-body);font-size:.92rem;line-height:1.7;color:var(--ink-60)}
.ls-about .sq-subhead{margin-top:1.3rem}
.ls-about .eyebrow{display:block;margin-bottom:.4rem}
.ls-links{display:flex;flex-wrap:wrap;gap:.5rem;margin:1rem 0}
.ls-links .sq-btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none}
.sq-btn{cursor:pointer}
.ls-welcome{display:flex;gap:.5rem;align-items:flex-start;justify-content:space-between;margin:0 0 1.2rem;padding:.9rem 1rem;border:1px solid var(--line);background:rgba(245,243,239,.6)}
.ls-welcome strong{font-family:var(--f-display);font-size:1.05rem;font-weight:600}
.ls-welcome p{margin:.25rem 0 0;font-family:var(--f-body);font-size:.85rem;line-height:1.55;color:var(--ink-60)}
.ls-welcome-links{display:flex;flex-wrap:wrap;gap:.4rem 1.2rem}
.ls-welcome-links a{font-family:var(--f-ui);font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:var(--accent);padding:.5rem 0}
.ls-welcome-x{flex:none;width:44px;height:44px;margin:-.4rem -.5rem 0 0;border:0;background:none;color:var(--ink-50);font-size:1.5rem;line-height:1;cursor:pointer}
.ls-callout{margin:.6rem 0 1rem;padding:.9rem 1rem;border:1px solid var(--accent);background:color-mix(in srgb,var(--accent) 6%,#fff)}
.ls-callout strong{font-family:var(--f-display);font-size:1rem;font-weight:600}
.ls-callout p{margin:.3rem 0 .7rem;font-size:.8rem;line-height:1.5;color:var(--ink-60)}
.ls-callout .sq-btn{display:inline-flex;text-decoration:none}
.ls-rows{list-style:none;margin:.4rem 0 1.4rem;border:1px solid var(--line);background:#fff}
.ls-rows li+li{border-top:1px solid var(--line)}
.ls-rows a{display:flex;align-items:center;gap:.9rem;min-height:64px;padding:.6rem .9rem;color:var(--ink)}
.ls-rows a:hover{background:color-mix(in srgb,var(--accent) 5%,#fff)}
.ls-rows a:focus-visible{outline:3px solid var(--accent);outline-offset:-3px}
.ls-row-ico{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:color-mix(in srgb,var(--accent) 10%,#fff);color:var(--accent)}
.ls-row-text{display:flex;flex-direction:column;min-width:0;flex:1}
.ls-row-text strong{font-family:var(--f-display);font-size:1rem;font-weight:600}
.ls-row-text small{font-size:.74rem;color:var(--ink-50);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ls-rows svg:last-child{color:var(--ink-30);flex:none}
.ls-gate{max-width:420px;margin:0 auto;padding:3rem var(--px);text-align:center}
.ls-gate h1{font-family:var(--f-display);font-weight:600;font-size:1.7rem;margin-bottom:.6rem}
.ls-gate p{font-family:var(--f-body);font-size:.9rem;line-height:1.6;color:var(--ink-60)}
.ls-gate .ls-gate-lock{width:84px;height:84px;margin:1.6rem auto 1rem;border-color:var(--accent);color:var(--accent)}
.ls-gate .ls-gate-lock svg:not(.sq-lock-ring){width:34px;height:34px}
.ls-gate .ls-gate-hint{font-family:var(--f-ui);font-size:.72rem;letter-spacing:.06em;color:var(--ink-50)}

/* The slim bar inside a game: only a phone held sideways shows its icons and the way back (the header is out of the way). */
.sq-nav .sq-gamehead{display:none}
.sq-nav .sq-album-nav{text-decoration:none}
@media (orientation:landscape) and (max-height:520px){
  body:has(.sq-wrap) .ls-header{display:none}
  .ls-main{min-height:0}
  .sq-nav .sq-gamehead{display:flex}
  .ls-playbar{max-width:none;padding:.25rem max(1rem,env(safe-area-inset-right)) 0}
  .ls-playbar .sq-icon{width:36px;height:36px}
  .ls-playbar .sq-icon svg{width:19px;height:19px}
  .ls-header{min-height:44px}
  .ls-page{padding-top:.6rem;padding-bottom:3rem}
  .ls-page.home{max-width:none}
  .ls-menu{width:min(20rem,60vw)}
}
`
