/* Lumora — inline SVG icon sprite (Lucide-style, stroke 1.8) */
(function(){
  const P=[
    ['home','M3 10.5 12 3l9 7.5','M5 9.5V21h14V9.5'],
    ['library','M4 5h4v14H4zM10 5h4v14h-4z','M16.5 5.6l3.4.9-3.6 13.5-3.4-.9'],
    ['plus','M12 5v14','M5 12h14'],
    ['chart','M4 20V4','M4 20h16','M8 16v-5','M13 16V8','M18 16v-8'],
    ['grad','M22 9 12 4 2 9l10 5 10-5z','M6 11v5c0 1 3 2.5 6 2.5s6-1.5 6-2.5v-5','M22 9v5'],
    ['game','M7 12h4M9 10v4','M15.5 12h.01M18 10.5h.01','M7 7h10a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4l-1.5-2h-7L11 17H7a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4z'],
    ['spark','M12 3v4M12 17v4M3 12h4M17 12h4','M12 8l1.4 2.6L16 12l-2.6 1.4L12 16l-1.4-2.6L8 12l2.6-1.4z'],
    ['brain','M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8A3 3 0 0 0 8 18a3 3 0 0 0 4 1 3 3 0 0 0 4-1 3 3 0 0 0 3-5.2A3 3 0 0 0 18 7a3 3 0 0 0-3-3','M12 5v14'],
    ['crystal','M6 3h12l3 6-9 12L3 9z','M3 9h18M9 3 6 9l6 12 6-12-3-6'],
    ['cap','M22 10 12 5 2 10l10 5 10-5z','M6 12v4c0 1 3 2.5 6 2.5s6-1.5 6-2.5v-4'],
    ['map','M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z','M9 4v14M15 6v14'],
    ['target','M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0','M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0','M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0'],
    ['flame','M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.6.8-2.6 1.5-3.4C10.2 8 11.5 6 12 3z'],
    ['star','M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.8 6.7 19.5l1.1-6L3.4 9.3l6-.8z'],
    ['coin','M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0','M9.5 9.5h3.2a1.8 1.8 0 0 1 0 3.6H9.5h3.2a1.8 1.8 0 0 1 0 3.6H9.5M12 7.5v9'],
    ['sun','M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0','M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19'],
    ['moon','M21 12.8A8 8 0 1 1 11.2 3 6 6 0 0 0 21 12.8z'],
    ['arrow','M5 12h14','M13 6l6 6-6 6'],
    ['check','M5 12.5 10 17.5 19 7'],
    ['file','M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z','M14 3v5h5'],
    ['cam','M5 8h3l1.5-2h5L16 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z','M12 11m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0'],
    ['play','M5 4a1 1 0 0 1 1.5-.9l12 7a1 1 0 0 1 0 1.8l-12 7A1 1 0 0 1 5 19z'],
    ['link','M9 15l6-6','M10 6l1-1a4 4 0 0 1 6 6l-1 1','M14 18l-1 1a4 4 0 0 1-6-6l1-1'],
    ['mic','M12 4a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3z','M6 11a6 6 0 0 0 12 0M12 17v3'],
    ['text','M5 6h14M5 12h14M5 18h9'],
    ['send','M4 12 20 4l-6 16-3-7z','M4 12l7 1'],
    ['close','M6 6l12 12M18 6 6 18'],
    ['note','M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z','M14 3v5h5','M9 13h6M9 17h4'],
    ['search','M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0','M21 21l-4.3-4.3'],
    ['trash','M4 7h16','M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2','M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13','M10 11v6M14 11v6'],
    ['tag','M3 12V4a1 1 0 0 1 1-1h8l8 8-9 9z','M7.5 7.5h.01'],
    ['save','M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z','M8 4v5h7','M8 14h8v6H8z'],
    ['expand','M8 3H5a2 2 0 0 0-2 2v3','M16 3h3a2 2 0 0 1 2 2v3','M21 16v3a2 2 0 0 1-2 2h-3','M8 21H5a2 2 0 0 1-2-2v-3'],
    ['shrink','M3 8h3a2 2 0 0 0 2-2V3','M21 8h-3a2 2 0 0 1-2-2V3','M16 21v-3a2 2 0 0 1 2-2h3','M3 16h3a2 2 0 0 1 2 2v3'],
  ];
  const sym=P.map(p=>`<symbol id="ic-${p[0]}" viewBox="0 0 24 24">${p.slice(1).map(d=>`<path d="${d}"/>`).join('')}</symbol>`).join('');
  const svg=document.createElement('div');
  svg.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
  svg.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg"><defs>${sym}</defs></svg>`;
  document.addEventListener('DOMContentLoaded',()=>document.body.prepend(svg));
  window.icon=(name,cls)=>`<svg class="ic ${cls||''}" aria-hidden="true"><use href="#ic-${name}"/></svg>`;
})();
