/* ============================================================================
   LÍRIO DAS ÁGUAS FLORICULTURA — aplicativo oficial  ·  App do Cliente + App do Dono
   Um só sistema, dois apps. Estado compartilhado (localStorage).
   v3 — responsivo (desktop/mobile), sem emojis (ícones SVG), sem combos (promoções no admin)
   ============================================================================ */
'use strict';
var LSKEY = 'lirio_delivery_v1';           // estado compartilhado (loja, catálogo, pedidos, clientes)
var MEKEY = 'lirio_delivery_me';           // perfil do cliente (local, não sincroniza entre cliente/dono)
var APP_MODE = (typeof window!=='undefined' && window.LIRIO_APP==='admin') ? 'admin' : 'cliente';
var REVKEY = 'lirio_delivery_rev';          // token de versão: muda a cada gravação, pra detectar mudança de outra aba/PWA
var CARTKEY = 'lirio_delivery_cart';        // carrinho do cliente (local, sobrevive ao recarregar)
var lastRev = null;
var bc = null; try{ if(typeof BroadcastChannel!=='undefined') bc = new BroadcastChannel('lirio_delivery'); }catch(e){ bc=null; }
/* ===== Sincronização na nuvem (Supabase) — cross-device (celular <-> computador) ===== */
var SUPA_URL = ''; // modo local por enquanto (preencher pra ligar o Supabase)
var SUPA_KEY = '';
var CLOUD = !!(SUPA_URL && SUPA_KEY && typeof window!=='undefined' && window.supabase);
var sb = CLOUD ? window.supabase.createClient(SUPA_URL, SUPA_KEY) : null;
var PERMITIR_PEDIDO_SEMPRE = true; // FASE DE TESTE: cliente faz pedido em qualquer horário. Por false ao lançar pra valer.
var $  = function(id){ return document.getElementById(id); };
var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
var money = function(v){ return 'R$ ' + (Number(v)||0).toFixed(2).replace('.', ','); };
var uid = function(p){ return (p||'id') + Math.random().toString(36).slice(2,8); };
function nowHM(){ var d=new Date(); return (''+d.getHours()).padStart(2,'0')+':'+(''+d.getMinutes()).padStart(2,'0'); }
function hoje(){ var d=new Date(); return d.toLocaleDateString('pt-BR'); }
function maskTel(t){ t=String(t||''); if(t.length<8) return t; return t.slice(0,-4).replace(/\d/g,'•')+t.slice(-4); }

/* ============================ ÍCONES (SVG, sem emoji) ============================ */
var IC={
  cardapio:'<path d="M3 2v7c0 1.1.9 2 2 2a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  cart:'<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 7H5"/>',
  receipt:'<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  plus:'<path d="M12 5v14"/><path d="M5 12h14"/>',
  minus:'<path d="M5 12h14"/>',
  trash:'<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  back:'<path d="m15 18-6-6 6-6"/>',
  chev:'<path d="m9 18 6-6-6-6"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  checkc:'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  printer:'<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>',
  chart:'<path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="8"/><rect x="12" y="6" width="3" height="12"/><rect x="17" y="13" width="3" height="5"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2 21v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M22 21v-1a5 5 0 0 0-4-4.9"/>',
  tag:'<path d="M20 12.5 12.5 20a1.7 1.7 0 0 1-2.4 0L3 12.9V4a1 1 0 0 1 1-1h8.9l7.1 7.1a1.7 1.7 0 0 1 0 2.4Z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  pix:'<path d="M12 3 3 12l9 9 9-9-9-9Z"/><path d="M8 12h8M12 8v8" opacity=".5"/>',
  cash:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  card:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  delivery:'<circle cx="5.5" cy="17" r="2.8"/><circle cx="18.5" cy="17" r="2.8"/><path d="M8.3 17h4.9l3.4-6.4"/><path d="M13.1 10.6 11.8 7.9H9.3"/><path d="M5.5 17 7.7 10.6H11.4"/><path d="M15.4 10.6H19"/>',
  store:'<path d="M3 9 4.5 4h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9h18"/><path d="M9 20v-5h6v5"/>',
  pin:'<path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  chat:'<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5Z"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  camera:'<path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4l-1.5-2Z"/><circle cx="12" cy="13" r="3.5"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  warn:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  box:'<path d="m21 8-9-5-9 5v8l9 5 9-5Z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
  star:'<path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 18.6 6.2 21.8l1.1-6.4L2.6 9.8l6.5-.9Z"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9 2 2 0 1 1-2.3 3.2 1.7 1.7 0 0 0-2.7 1V21a2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.7-1 2 2 0 1 1-2.3-3.2 1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9 2 2 0 1 1 2.3-3.2 1.7 1.7 0 0 0 2.7-1V3a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.7 1 2 2 0 1 1 2.3 3.2 1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4 1.7 1.7 0 0 0-1.6 1Z"/>',
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  percent:'<path d="M19 5 5 19"/><circle cx="7.5" cy="7.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>',
  gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8"/><path d="M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5"/><path d="M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5"/>',
  paint:'<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c1 0 1.5-.8 1.5-1.5 0-.4-.2-.8-.5-1a1.5 1.5 0 0 1 1-2.5H16a4 4 0 0 0 4-4 8 8 0 0 0-8-9Z"/>',
  home:'<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>',
  attach:'<path d="M21 8 12 17a4 4 0 0 1-6-6l8-8a2.5 2.5 0 0 1 4 4l-8 8a1 1 0 0 1-2-2l7-7"/>',
  copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  refresh:'<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
  monitor:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  phone:'<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  dot:'<circle cx="12" cy="12" r="4"/>'
};
function ic(name,cls){ return '<svg class="ic'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(IC[name]||'')+'</svg>'; }

/* glyphs de categoria (placeholder de foto) */
var GLYPH={
  buques:'<path d="M12 3s2 2.2 2 4.8a2 2 0 0 1-4 0C10 5.2 12 3 12 3Z"/><path d="M8 8.5S9.5 11 12 11s4-2.5 4-2.5"/><path d="M12 11v9"/><path d="M8.5 20h7"/>',
  boxes:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8"/><path d="M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5"/><path d="M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5"/>',
  cestas:'<path d="M4 9h16l-1.4 10.2a2 2 0 0 1-2 1.8H7.4a2 2 0 0 1-2-1.8Z"/><path d="M3 9h18"/><path d="M8.5 9a3.5 3.5 0 0 1 7 0"/>',
  baloes:'<ellipse cx="12" cy="9" rx="6" ry="7"/><path d="M12 16v3"/><path d="m10.6 19.5 1.4-1.2 1.4 1.2"/>',
  flores:'<circle cx="12" cy="9.5" r="2.2"/><path d="M12 7.3C12 4.5 13.6 3.5 13.6 3.5M14.2 9.5C17 9.5 18 11.1 18 11.1M12 11.7c0 2.8-1.6 3.8-1.6 3.8M9.8 9.5C7 9.5 6 7.9 6 7.9"/><path d="M12 11.7V20"/>',
  _def:'<path d="M12 3s2 2.2 2 4.8a2 2 0 0 1-4 0C10 5.2 12 3 12 3Z"/><path d="M8 8.5S9.5 11 12 11s4-2.5 4-2.5"/><path d="M12 11v9"/><path d="M8.5 20h7"/>'
};
function catGlyph(id){ return GLYPH[id]||GLYPH._def; }
function phG(glyph, hue){
  hue = hue==null?28:hue;
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">'+
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'+
    '<stop offset="0" stop-color="hsl('+hue+',46%,26%)"/><stop offset="1" stop-color="hsl('+((hue+22)%360)+',56%,13%)"/></linearGradient></defs>'+
    '<rect width="220" height="220" fill="url(#g)"/>'+
    '<g transform="translate(62,62) scale(4)" fill="none" stroke="rgba(255,248,238,.92)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+glyph+'</g></svg>';
  return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
}
function prodFotos(p){ return (p&&p.fotos&&p.fotos.length)?p.fotos : (p&&p.foto?[p.foto]:[]); }
function prodImg(p){ var f=prodFotos(p); return f.length ? f[0] : phG(catGlyph(p.cat), p.hue==null?28:p.hue); }
function itemImg(it){ return it.foto ? it.foto : phG(catGlyph(it.cat), it.hue==null?28:it.hue); }

/* QR falso (só visual) */
function fakeQR(){
  var n=21, cell=6, s='', seed=7;
  function rnd(){ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; }
  for(var y=0;y<n;y++)for(var x=0;x<n;x++){
    var finder=(x<7&&y<7)||(x>=n-7&&y<7)||(x<7&&y>=n-7);
    var on = finder ? (x===0||x===6||y===0||y===6||(x>=2&&x<=4&&y>=2&&y<=4)) : rnd()>0.5;
    if(on) s+='<rect x="'+(x*cell)+'" y="'+(y*cell)+'" width="'+cell+'" height="'+cell+'"/>';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(n*cell)+' '+(n*cell)+'" fill="#171313">'+s+'</svg>';
}

/* ============================ ESTADO / SEED ============================ */
var S, UI, seedCounter=100;
function seed(){
  var H={buques:330,boxes:285,cestas:35,baloes:210,flores:345};
  var ADIC=[{nome:'Caixa de bombom',preco:15},{nome:'Ursinho de pelúcia',preco:35},{nome:'Flor extra',preco:8},{nome:'Caixa personalizada',preco:20},{nome:'Cartão personalizado',preco:5},{nome:'Ferrero Rocher (caixa)',preco:18},{nome:'Balão metalizado',preco:12}];
  function grpAdic(){ return [{nome:'Adicionais e mimos',max:0,itens:ADIC.slice()}]; }
  var produtos=[], pid=0;
  function novo(o){ pid++; return Object.assign({id:'p'+pid,desc:'',foto:null,fotos:[],disp:'disponivel',ordem:pid-1,variacoes:[],grupos:[]},o); }
  [ ['Buquê de Rosas',60,90,130,'Rosas frescas selecionadas, com embrulho premium.'],
    ['Buquê de Rosas Vermelhas',65,95,140,'O buquê do amor, rosas vermelhas clássicas.'],
    ['Buquê de Lírios',70,105,150,'Lírios perfumados, o clássico da casa.'],
    ['Buquê de Gérberas',55,80,115,'Gérberas coloridas e cheias de alegria.'],
    ['Buquê de Girassóis',60,90,125,'Girassóis radiantes para iluminar o dia.'],
    ['Buquê do Campo',50,75,105,'Mix de flores do campo, delicado e natural.'],
    ['Buquê de Borboletas',85,120,160,'Borboletas azuis em papel, um presente encantador e diferente.']
  ].forEach(function(r){ produtos.push(novo({nome:r[0],preco:r[1],cat:'buques',hue:H.buques,desc:r[4],
      variacoes:[{nome:'Pequeno',preco:r[1]},{nome:'Médio',preco:r[2]},{nome:'Grande',preco:r[3]}], grupos:grpAdic()})); });
  [ ['Box Coração de Rosas com Ferrero',95,'Rosas em formato de coração com Ferrero Rocher.'],
    ['Box Te Amo',80,'Caixa romântica com rosas e mensagem especial.'],
    ['Box Feminino',70,'Flores e bombom numa caixa charmosa.'],
    ['Box Surpresa Personalizada',90,'Monte do seu jeito, com a nossa curadoria.']
  ].forEach(function(r){ produtos.push(novo({nome:r[0],preco:r[1],cat:'boxes',hue:H.boxes,desc:r[2],grupos:grpAdic()})); });
  [ ['Cesta Café da Manhã',130,'Café da manhã completo para surpreender.'],
    ['Cesta Maternidade',120,'Presente carinhoso para o bebê e a mamãe.'],
    ['Cesta Masculina Malbec',140,'Kit masculino com linha Malbec e detalhes.'],
    ['Kit Presente com Pelúcia',85,'Flores, pelúcia e bombom num só presente.']
  ].forEach(function(r){ produtos.push(novo({nome:r[0],preco:r[1],cat:'cestas',hue:H.cestas,desc:r[2],grupos:grpAdic()})); });
  [ ['Balão Bubble Personalizado',55,'Balão transparente com frase personalizada.'],
    ['Buquê de Balões',70,'Arranjo de balões para festas e comemorações.']
  ].forEach(function(r){ produtos.push(novo({nome:r[0],preco:r[1],cat:'baloes',hue:H.baloes,desc:r[2],grupos:grpAdic()})); });
  [ ['Rosa Unitária',12,'Uma rosa com embrulho especial.'],
    ['Arranjo em Vaso',110,'Arranjo de flores em vaso decorativo.'],
    ['Orquídea no Cachepô',130,'Orquídea elegante, um presente que dura.']
  ].forEach(function(r){ produtos.push(novo({nome:r[0],preco:r[1],cat:'flores',hue:H.flores,desc:r[2],grupos:grpAdic()})); });
  // fotos reais (Instagram da Lírio) por nome de produto
  var FOTOS={
    'Box Coração de Rosas com Ferrero':['assets/prod-box-coracao.jpg'],
    'Buquê do Campo':['assets/prod-buque-campo.jpg'],
    'Buquê de Rosas Vermelhas':['assets/prod-buque-vermelhas.jpg'],
    'Box Surpresa Personalizada':['assets/prod-box-personalizada.jpg'],
    'Cesta Maternidade':['assets/prod-cesta-maternidade.jpg'],
    'Box Feminino':['assets/prod-box-feminino.jpg'],
    'Buquê de Borboletas':['assets/prod-buque-borboletas.jpg']
  };
  produtos.forEach(function(p){ if(FOTOS[p.nome]){ p.fotos=FOTOS[p.nome].slice(); p.foto=p.fotos[0]; } });
  var categorias = [
    {id:'buques',nome:'Buquês',ordem:1,oculta:false},{id:'boxes',nome:'Box e Caixas',ordem:2,oculta:false},
    {id:'cestas',nome:'Cestas e Presentes',ordem:3,oculta:false},{id:'baloes',nome:'Balões',ordem:4,oculta:false},
    {id:'flores',nome:'Flores e Arranjos',ordem:5,oculta:false}
  ];
  S = {
    loja:{ nome:'Lírio das Águas', pausado:false, janelas:[['08:00','18:00']], horario:'Seg a Sáb · 08h-18h',
      endereco:'Breu Branco - PA · entregamos em Breu Branco, Goianésia e Tucuruí', whats:'(94) 00000-0000',
      instagram:'@lirio_das_aguas_floricultura',
      pixKey:'', pixNome:'Lírio das Águas Floricultura', banner:'Entregamos em Breu Branco, Goianésia e Tucuruí',
      taxaEntrega:10, prazoEntrega:'no mesmo dia (a combinar)', cupomAtivo:false,
      minPedido:0, retirada:true, aceitaPix:true, aceitaDinheiro:true, aceitaCartao:true },
    categorias:categorias, produtos:produtos, bairros:[],
    promos:[ {id:uid('promo'), titulo:'Box Coração de Rosas com Ferrero', desc:'Rosas em coração + Ferrero Rocher. O presente mais pedido.', preco:95, ativo:true} ],
    pedidos:[], clientes:[], equipe:[{user:'yara',nome:'Yara',papel:'admin'},{user:'atendente',nome:'Atendente',papel:'atendente'}],
    audit:[]
  };
  var demoTel='(94) 99999-1234';
  seedOrder({tel:demoTel,nome:'Ana Beatriz',tipo:'delivery',bairro:'Centro',end:'Rua das Flores, 100',ref:'Portão branco',
    itens:[['p1',1,'','Médio']], pay:'pix', status:'em_validacao', min:20});
  seedOrder({tel:'(94) 98888-7766',nome:'Marcos Vinícius',tipo:'retirada',
    itens:[['p7',1,'']], pay:'dinheiro', troco:'100', status:'aguardando_aceite', min:15});
  seedOrder({tel:'(94) 97777-3322',nome:'Larissa Gomes',tipo:'delivery',bairro:'São José',end:'Av. Central, 210',ref:'Perto da praça',
    itens:[['p11',1,''],['p17',2,'']], pay:'cartao', status:'em_preparo', min:40});
  seedOrder({tel:demoTel,nome:'Ana Beatriz',tipo:'delivery',bairro:'Centro',end:'Rua das Flores, 100',ref:'Portão branco',
    itens:[['p3',1,'','Grande']], pay:'pix', status:'concluido', min:70});
}

function seedOrder(o){
  var itens=o.itens.map(function(it){ var p=prod(it[0]); var varNome=it[3]||'', adics=it[4]||[];
    var base=p.preco, inclui=[];
    if(varNome && p.variacoes){ var v=p.variacoes.filter(function(x){return x.nome===varNome;})[0]; if(v){ base=v.preco; inclui=v.inclui||[]; } }
    var unit=base+adics.reduce(function(a,x){return a+x.preco*(x.qty||1);},0);
    return {prodId:p.id,nome:p.nome,cat:p.cat,hue:p.hue,foto:p.foto,base:base,varNome:varNome,inclui:inclui,adics:adics,qty:it[1],obs:it[2]||'',preco:unit};
  });
  var subtotal=itens.reduce(function(a,i){return a+i.preco*i.qty;},0);
  var taxa=o.tipo==='delivery'?3:0;
  var d=new Date(Date.now()-(o.min||10)*60000);
  var payMap={pix:'Pix com comprovante',dinheiro:'Dinheiro no local',cartao:'Cartão no local'};
  var tt=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  var ped={ id:'#'+(++seedCounter), tel:o.tel, nome:o.nome, tipo:o.tipo,
    bairro:o.bairro||'', end:o.end||'', ref:o.ref||'', comp:'', entregaSobConsulta:false,
    itens:itens, subtotal:subtotal, taxa:taxa, total:subtotal+taxa, obs:'',
    pay:{ metodo:o.pay, label:payMap[o.pay], status:o.pay==='pix'?(o.status==='concluido'?'aprovado':'enviado'):'pendente',
      comprovante:o.pay==='pix'?phG(GLYPH._def,140):null, troco:o.troco||'' },
    status:o.status, criadoEm:tt, dia:d.toLocaleDateString('pt-BR'), ts:d.getTime(),
    historico:[{t:tt,who:'Cliente',act:'Pedido criado'}], reimpressoes:0 };
  S.pedidos.unshift(ped);
  upsertCliente(o.tel,o.nome,o.end?{bairro:o.bairro,end:o.end}:null);
}

/* persistência */
function persistLocal(){ if(APP_MODE==='admin') return; try{ localStorage.setItem(MEKEY, JSON.stringify(UI.me)); localStorage.setItem(CARTKEY, JSON.stringify(UI.cart)); }catch(e){} }
function saveCliente(){ persistLocal(); if(CLOUD) cloudCliUpsert(); }   // salva perfil + carrinho do cliente (local + conta na nuvem)
function save(){ try{ localStorage.setItem(LSKEY, JSON.stringify(S)); persistLocal(); if(CLOUD) cloudPush(); else marcarRev(); }catch(e){} }

/* ---- conta do cliente (login por WhatsApp, tabela 'clientes' no Supabase) ---- */
function normWhats(t){ return String(t||'').replace(/\D/g,''); }
function normNome(s){ return String(s||'').toLowerCase().trim().replace(/\s+/g,' ').normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function estaLogado(){ return !!(typeof UI!=='undefined' && UI.me && telValido(UI.me.tel) && (UI.me.nome||'').trim()); }
function cloudCliGet(whats){ if(!sb) return Promise.resolve(null); return sb.from('clientes').select('*').eq('whats',whats).maybeSingle().then(function(r){ return (r&&r.data)?r.data:null; }).catch(function(){ return null; }); }
function cloudCliUpsert(){ if(!sb) return; var w=normWhats(UI.me&&UI.me.tel); if(!w) return; sb.from('clientes').upsert({whats:w,nome:UI.me.nome||'',foto:UI.me.foto||null,enderecos:UI.me.enderecos||[],updated_at:new Date().toISOString()},{onConflict:'whats'}).then(function(r){ if(r&&r.error) console.warn('Lírio cli upsert:',r.error.message); }); }
function refreshCliente(){
  if(!CLOUD||!estaLogado()) return;
  cloudCliGet(normWhats(UI.me.tel)).then(function(cli){
    if(!cli){ cloudCliUpsert(); return; }   // conta ainda nao existe na tabela -> cria a partir do local
    var ae=(typeof document!=='undefined')&&document.activeElement;
    if(ae&&ae.tagName&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return; // nao atrapalha quem digita
    if(Array.isArray(cli.enderecos)) UI.me.enderecos=cli.enderecos;
    if(cli.foto) UI.me.foto=cli.foto;
    if(cli.nome && !(UI.me.nome||'').trim()) UI.me.nome=cli.nome;
    persistLocal(); render();
  });
}
function marcarRev(){ try{ lastRev=String(Date.now())+'-'+Math.floor(Math.random()*1e6); localStorage.setItem(REVKEY,lastRev); if(bc){ try{ bc.postMessage(lastRev); }catch(e){} } }catch(e){} }
function reloadShared(){ try{ var raw=localStorage.getItem(LSKEY); if(raw){ var s=JSON.parse(raw); if(s&&s.produtos){ S=s; if(!S.promos)S.promos=[]; return true; } } }catch(e){} return false; }
function syncCheck(){
  var ae=(typeof document!=='undefined')&&document.activeElement;
  if(ae && ae.tagName && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return; // não interrompe quem está digitando
  var rev; try{ rev=localStorage.getItem(REVKEY); }catch(e){ return; }
  if(rev && rev!==lastRev){ lastRev=rev; if(reloadShared()) render(); }
}
function load(){
  var had=false;
  try{ var raw=localStorage.getItem(LSKEY); if(raw){ var s=JSON.parse(raw); if(s&&s.produtos){ S=s; if(!S.promos)S.promos=[]; had=true; } } }catch(e){}
  try{ var m=localStorage.getItem(MEKEY); if(m){ var mm=JSON.parse(m); if(mm&&typeof mm==='object') UI.me=mm; } }catch(e){}
  if(APP_MODE!=='admin'){ try{ var ck=localStorage.getItem(CARTKEY); if(ck){ var ct=JSON.parse(ck); if(Array.isArray(ct)) UI.cart=ct; } }catch(e){} }
  return had;
}

/* lookups */
function prod(id){ for(var i=0;i<S.produtos.length;i++) if(S.produtos[i].id===id) return S.produtos[i]; return null; }
function order(id){ for(var i=0;i<S.pedidos.length;i++) if(S.pedidos[i].id===id) return S.pedidos[i]; return null; }
function bairro(n){ for(var i=0;i<S.bairros.length;i++) if(S.bairros[i].nome===n) return S.bairros[i]; return null; }
function cat(id){ return S.categorias.filter(function(x){return x.id===id;})[0]; }
function catNome(id){ var c=cat(id); return c?c.nome:id; }
function catsOrd(){ return S.categorias.slice().sort(function(a,b){return a.ordem-b.ordem;}); }
function audit(act,target){ S.audit.unshift({t:nowHM(),who:UI.adm.user?UI.adm.user.nome:'Sistema',act:act,target:target||''}); if(S.audit.length>60)S.audit.pop(); }
function upsertCliente(tel,nome,addr){
  var c=S.clientes.filter(function(x){return x.tel===tel;})[0];
  if(!c){ c={id:uid('c'),tel:tel,nome:nome,enderecos:[],criadoEm:hoje(),bloq:false,obsInterna:''}; S.clientes.push(c); }
  if(nome) c.nome=nome;
  if(addr&&addr.end){ var ex=c.enderecos.filter(function(e){return e.end===addr.end;})[0]; if(!ex) c.enderecos.push(addr); }
  return c;
}
function clienteStats(tel){
  var ps=S.pedidos.filter(function(p){return p.tel===tel;});
  var concl=ps.filter(function(p){return p.status==='concluido';});
  var gasto=concl.reduce(function(a,p){return a+p.total;},0);
  return {total:ps.length, concl:concl.length, gasto:gasto, ticket:concl.length?gasto/concl.length:0, ultimo:ps[0]};
}
function isAdmin(){ return UI.adm.user && UI.adm.user.papel==='admin'; }
function telValido(t){ return String(t||'').replace(/\D/g,'').length>=10; }

/* ---- horário de funcionamento (aberto/fechado automático, fuso de Breu Branco/PA) ---- */
var DEFAULT_JANELAS=[['08:00','18:00']];
function hm(s){ var p=String(s||'0:0').split(':'); return (parseInt(p[0],10)||0)*60+(parseInt(p[1],10)||0); }
function janelasLoja(){ var j=S.loja&&S.loja.janelas; return (j&&j.length)?j:DEFAULT_JANELAS; }
function agoraMinLoja(){
  try{
    var s=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Belem',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
    var p=s.split(':'); return (parseInt(p[0],10)||0)*60+(parseInt(p[1],10)||0);
  }catch(e){ var d=new Date(); return d.getHours()*60+d.getMinutes(); }
}
function lojaAberta(){
  if(PERMITIR_PEDIDO_SEMPRE && (typeof APP_MODE==='undefined' || APP_MODE!=='admin')) return true; // teste: cliente sempre pode pedir
  var l=S.loja||{};
  if(l.pausado) return false;
  var m=agoraMinLoja(), js=janelasLoja();
  for(var i=0;i<js.length;i++){ var a=hm(js[i][0]), b=hm(js[i][1]);
    if(a<=b){ if(m>=a&&m<b) return true; } else { if(m>=a||m<b) return true; } }
  return false;
}
function fmtHora(s){ var p=String(s).split(':'); var mm=p[1]||'00'; return mm==='00'?(parseInt(p[0],10)+'h'):(parseInt(p[0],10)+'h'+mm); }
function fmtJanelas(js){ js=js||janelasLoja(); return 'Seg a Dom · '+js.map(function(w){return fmtHora(w[0])+'-'+fmtHora(w[1]);}).join(' e '); }
var _lastOpen=null;
function clockWatch(){ try{ var o=lojaAberta(); if(_lastOpen===null){ _lastOpen=o; } else if(o!==_lastOpen){ _lastOpen=o; render(); } }catch(e){} }
function descontoValor(sub){ return UI.cupom&&UI.cupom.pct ? Math.round(sub*UI.cupom.pct*100)/100 : 0; }
function waLink(tel,msg){ return 'https://wa.me/55'+String(tel).replace(/\D/g,'')+(msg?'?text='+encodeURIComponent(msg):''); }

/* ============================ RENDER / DISPATCH ============================ */
function render(){
  var app=$('app');
  if(UI.app==='admin') app.innerHTML=viewAdmin();
  else app.innerHTML=viewCliente();
}
var H={};
function on(a,fn){ H[a]=fn; }
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-action]'); if(!t) return;
  var a=t.getAttribute('data-action'); if(!H[a]) return;
  e.preventDefault(); H[a](t.dataset, t, e);
});
document.addEventListener('input',function(e){
  var t=e.target.closest('[data-oninput]'); if(!t) return;
  var a=t.getAttribute('data-oninput'); if(H[a]) H[a](t.dataset,t,e);
});
function toast(msg,kind){
  var r=$('toast-root'); var d=document.createElement('div');
  d.className='toast '+(kind||''); d.textContent=msg; r.appendChild(d);
  setTimeout(function(){ d.style.opacity='0'; d.style.transition='.3s'; setTimeout(function(){ d.remove(); },300); },2400);
}
function modal(html,center){
  var r=$('modal-root');
  r.innerHTML='<div class="modal-bg" data-action="close-modal"></div><div class="modal'+(center?' center':'')+'">'+
    (center?'':'<div class="modal-grip"></div>')+'<button class="modal-x" data-action="close-modal" aria-label="Fechar">'+ic('x')+'</button>'+html+'</div>';
  r.hidden=false;
}
function closeModal(){ var r=$('modal-root'); r.hidden=true; r.innerHTML=''; }
on('close-modal',closeModal);
function confirmar(titulo,texto,acaoLabel,cb,perigo){
  modal('<h2>'+esc(titulo)+'</h2><p style="color:var(--text2)">'+esc(texto)+'</p>'+
    '<div class="sticky-cta"><button class="btn '+(perigo?'btn-red':'btn-primary')+' btn-block" id="cf-ok">'+esc(acaoLabel)+'</button>'+
    '<button class="btn btn-ghost btn-block" style="margin-top:8px" data-action="close-modal">Voltar</button></div>',true);
  $('cf-ok').onclick=function(){ closeModal(); cb(); };
}

/* ============================================================================
   APP DO CLIENTE
   ============================================================================ */
function cliLogin(){
  var L=UI.login||{};
  return '<div class="stage cli login-stage"><div class="scroll"><div class="login-wrap">'+
    '<img class="login-logo" src="assets/logo-lirio.png" alt="Lírio das Águas">'+
    '<h1 class="login-tt">'+esc(S.loja.nome)+'</h1>'+
    '<p class="login-sub">Entre com seu WhatsApp para pedir e salvar seus endereços. Primeiro acesso? A gente cria sua conta na hora.</p>'+
    '<div class="card">'+
      '<div class="field"><label>Nome completo</label><input data-oninput="cli-login-f" data-k="nome" value="'+esc(L.nome||'')+'" placeholder="Nome e sobrenome"></div>'+
      '<div class="field"><label>WhatsApp</label><input inputmode="tel" data-oninput="cli-login-f" data-k="whats" value="'+esc(L.whats||'')+'" placeholder="(94) 9...."></div>'+
      '<button class="btn btn-primary btn-block btn-lg" data-action="cli-login">Entrar / Cadastrar</button>'+
    '</div>'+
    '<p class="login-fine">Ao entrar, você concorda em receber avisos do seu pedido pelo WhatsApp.</p>'+
    '</div></div></div>';
}
function viewCliente(){
  if(!estaLogado()) return cliLogin();
  var s=UI.cli.screen, body;
  if(s==='home') body=cliHome();
  else if(s==='carrinho') body=cliCarrinho();
  else if(s==='receber') body=cliReceber();
  else if(s==='endereco') body=cliEndereco();
  else if(s==='dados') body=cliDados();
  else if(s==='pagamento') body=cliPagamento();
  else if(s==='confirmado') body=cliConfirmado();
  else if(s==='track') body=cliTrack();
  else if(s==='pedidos') body=cliPedidos();
  else if(s==='perfil') body=cliPerfil();
  else body=cliHome();
  var showTabs = ['home','carrinho','pedidos','perfil'].indexOf(s)>=0;
  var showCartFab = s==='home' && cartCount()>0;
  return '<div class="stage cli">'+cliTop(s)+'<div class="scroll">'+body+'</div>'+
    (showCartFab?cartFab():'')+(showTabs?cliTabs(s):'')+'</div>';
}
var CLI_TABS=[['home','cardapio','Catálogo'],['carrinho','cart','Carrinho'],['pedidos','receipt','Pedidos'],['perfil','user','Perfil']];
function cliTop(cur){
  var l=S.loja, navCur=(['home','carrinho','pedidos','perfil'].indexOf(cur)>=0)?cur:'home';
  var nav=CLI_TABS.map(function(t){ var b=(t[0]==='carrinho'&&cartCount()>0)?'<span class="dn-badge">'+cartCount()+'</span>':'';
    return '<button class="dn-item'+(navCur===t[0]?' on':'')+'" data-action="cli-go" data-s="'+t[0]+'">'+ic(t[1])+'<span>'+t[2]+'</span>'+b+'</button>'; }).join('');
  return '<div class="topbar"><img class="logo" src="assets/logo-lirio.png" alt="Lírio das Águas">'+
    '<div class="tb-id"><div class="tb-tt">'+esc(l.nome)+'</div>'+
    '<div class="tb-sub"><span class="dot '+(lojaAberta()?'on':'off')+'"></span>'+(lojaAberta()?'Aberto agora':'Fechado agora')+'</div></div>'+
    '<nav class="desktop-nav">'+nav+'</nav>'+
    '<div class="tb-right"><button class="iconbtn" data-action="cli-go" data-s="perfil" aria-label="Meu perfil">'+(UI.me.foto?'<img class="ava-mini" src="'+UI.me.foto+'" alt="">':ic('user'))+'</button></div></div>';
}
function cliTabs(cur){
  return '<div class="tabbar">'+CLI_TABS.map(function(t){ var b=(t[0]==='carrinho'&&cartCount()>0)?'<span class="tbadge">'+cartCount()+'</span>':'';
    return '<button class="tab '+(cur===t[0]?'on':'')+'" data-action="cli-go" data-s="'+t[0]+'" aria-label="'+t[2]+'"><span class="ti">'+ic(t[1])+'</span>'+t[2]+b+'</button>'; }).join('')+'</div>';
}
function cartFab(){ return '<button class="cartfab" data-action="cli-go" data-s="carrinho"><span class="cf-count">'+cartCount()+'</span> Ver sacola<span class="cf-total">'+money(cartSubtotal())+'</span></button>'; }

/* Início / catálogo */
function cliHome(){
  var l=S.loja;
  var h='<div class="hero"><div class="hero-tx"><div class="eyebrow">'+ic('pin')+' Breu Branco · Goianésia · Tucuruí</div>'+
     '<h1>'+esc(l.nome)+'</h1><p>Flores, buquês e presentes personalizados. Peça e receba com carinho.</p>'+
     '<div class="storebar"><span class="dot '+(lojaAberta()?'on':'off')+'"></span>'+(lojaAberta()?'Aberto · '+esc(l.horario):'Fechado agora · '+esc(l.horario))+'</div></div>'+
     '<img class="hero-logo" src="assets/logo-lirio.png" alt=""></div>';
  if(!lojaAberta()) h+='<div class="notice warn">'+ic('clock')+'<div>A loja está <strong>fechada agora</strong>. Você pode ver o catálogo e montar o pedido; a finalização abre no horário: '+esc(l.horario)+'.</div></div><div class="sp"></div>';
  if(l.banner) h+='<div class="banner">'+ic('gift')+' '+esc(l.banner)+'</div>';
  var promos=(S.promos||[]).filter(function(p){return p.ativo;});
  if(promos.length){ h+='<div class="catlabel">Promoções</div><div class="promos">'+promos.map(function(p){
    return '<div class="promo"><div class="promo-ic">'+ic('percent')+'</div><div class="promo-b"><div class="promo-t">'+esc(p.titulo)+'</div><div class="promo-d">'+esc(p.desc)+'</div></div><div class="promo-p">'+money(p.preco)+'</div></div>';
  }).join('')+'</div>'; }
  h+='<div class="search">'+ic('search')+'<input placeholder="Buscar no catálogo..." value="'+esc(UI.cli.q||'')+'" data-oninput="cli-search" aria-label="Buscar no catálogo"></div>';
  h+='<div class="cats" id="cli-cats">'+catsChips()+'</div>';
  h+='<div id="menu-list">'+menuInner()+'</div>';
  return h;
}
function catsChips(){
  var q=(UI.cli.q||'').trim();
  var cats=['Todos'].concat(catsOrd().filter(function(c){return !c.oculta;}).map(function(c){return c.nome;}));
  return cats.map(function(c){ return '<button class="chip '+((!q&&UI.cli.cat===c)?'on':'')+'" data-action="cli-cat" data-c="'+esc(c)+'">'+esc(c)+'</button>'; }).join('');
}
function menuInner(){
  var q=(UI.cli.q||'').trim().toLowerCase();
  var vis=S.produtos.filter(function(p){ return p.disp!=='oculto' && !(cat(p.cat)&&cat(p.cat).oculta); });
  if(q){ vis=vis.filter(function(p){return (p.nome+' '+p.desc).toLowerCase().indexOf(q)>=0;});
    return vis.length? '<div class="grid">'+vis.map(prodCard).join('')+'</div>' : '<div class="empty">'+ic('search','big')+'Nada encontrado.</div>'; }
  var out='';
  catsOrd().forEach(function(c){
    if(c.oculta) return;
    if(UI.cli.cat!=='Todos'&&UI.cli.cat!==c.nome) return;
    var items=vis.filter(function(p){return p.cat===c.id;}).sort(function(a,b){return a.ordem-b.ordem;});
    if(!items.length) return;
    out+='<div class="catlabel">'+esc(c.nome)+'</div><div class="grid">'+items.map(prodCard).join('')+'</div>';
  });
  return out||'<div class="empty">Sem produtos nesta categoria.</div>';
}
function prodCard(p){
  var off=p.disp==='esgotado';
  var temVar=p.variacoes&&p.variacoes.length;
  var base=temVar?Math.min.apply(null,p.variacoes.map(function(v){return v.preco;})):p.preco;
  var priceLabel=temVar?'<span class="pfrom">a partir de </span>'+money(base):money(p.preco);
  return '<div class="prod'+(off?' off':'')+'" '+(off?'':'data-action="cli-prod" data-id="'+p.id+'"')+'>'+
    '<div class="pbody"><div class="pname">'+esc(p.nome)+'</div>'+
    (p.desc?'<div class="pdesc">'+esc(p.desc)+'</div>':'')+
    '<div class="pprice">'+priceLabel+'</div></div>'+
    '<div class="pthumb"><img class="pimg" src="'+prodImg(p)+'" alt="">'+
    (off?'<span class="selo">Esgotado</span>':'<button class="padd" data-action="cli-prod" data-id="'+p.id+'" aria-label="Adicionar '+esc(p.nome)+'">'+ic('plus')+'</button>')+'</div></div>';
}

/* detalhe produto (modal) */
var pdSel;
function pdVars(p){ return (p.variacoes&&p.variacoes.length)?p.variacoes:null; }
function abrirProduto(id, editIdx){
  var p=prod(id); if(!p) return;
  var vars=pdVars(p);
  if(editIdx!=null && UI.cart[editIdx]){ var it=UI.cart[editIdx];
    var vi = vars ? Math.max(0, vars.map(function(v){return v.nome;}).indexOf(it.varNome)) : -1;
    pdSel={qty:it.qty, varIdx:vi, g:{}, obs:it.obs||'', edit:editIdx, imgIdx:0};
    (p.grupos||[]).forEach(function(gr,gi){ pdSel.g[gi]={}; gr.itens.forEach(function(gt,ii){ var f=(it.adics||[]).filter(function(a){return a.nome===gt.nome;})[0]; if(f) pdSel.g[gi][ii]=f.qty; }); });
  } else { pdSel={qty:1, varIdx: vars?0:-1, g:{}, obs:'', edit:null, imgIdx:0}; }
  UI._pdId=id; modal(pdHTML(p));
}
function pdBase(p){ var vars=pdVars(p); return vars ? vars[pdSel.varIdx].preco : p.preco; }
function pdAdicTotal(p){ var t=0; (p.grupos||[]).forEach(function(gr,gi){ var sel=pdSel.g[gi]||{}; gr.itens.forEach(function(it,ii){ t+=(sel[ii]||0)*it.preco; }); }); return t; }
function pdTotal(p){ return (pdBase(p)+pdAdicTotal(p))*pdSel.qty; }
function grpSum(gi){ var sel=pdSel.g[gi]||{}, s=0; Object.keys(sel).forEach(function(k){ s+=sel[k]; }); return s; }
function pdHTML(p){
  var vars=pdVars(p), varSel = vars ? vars[pdSel.varIdx] : null;
  var fotos=prodFotos(p), ii=pdSel.imgIdx||0; if(ii>=fotos.length) ii=0;
  var media = fotos.length>1
    ? '<div class="pd-carousel"><img id="pd-carimg" class="pd-img" src="'+fotos[ii]+'" alt="">'+
        '<button class="pd-arrow left" data-action="pd-img-nav" data-d="-1" aria-label="Foto anterior">'+ic('back')+'</button>'+
        '<button class="pd-arrow right" data-action="pd-img-nav" data-d="1" aria-label="Próxima foto">'+ic('chev')+'</button>'+
        '<div class="pd-dots">'+fotos.map(function(_,i){return '<span class="pd-dot'+(i===ii?' on':'')+'"></span>';}).join('')+'</div></div>'
    : '<img class="pd-img" src="'+(fotos[0]||prodImg(p))+'" alt="">';
  var h=media+
    '<div class="pd-name">'+esc(p.nome)+'</div>'+(p.desc?'<div class="pd-desc">'+esc(p.desc)+'</div>':'')+
    '<div class="pd-price">'+money(pdBase(p))+'</div>';
  if(vars){
    h+='<div class="grp"><div class="grp-head"><strong>Escolha uma opção</strong><span class="grp-max">obrigatório</span></div>'+
      vars.map(function(v,i){ var sel=pdSel.varIdx===i;
        return '<div class="opt'+(sel?' sel':'')+'" data-action="pd-var" data-v="'+i+'"><span class="ck">'+(sel?ic('check'):'')+'</span><span class="oname">'+esc(v.nome)+'</span><span class="oprice">'+money(v.preco)+'</span></div>';
      }).join('')+'</div>';
    if(varSel && varSel.inclui && varSel.inclui.length)
      h+='<div class="incl">'+ic('checkc')+'<div><strong>Acompanha:</strong> '+varSel.inclui.map(esc).join(', ')+'.</div></div>';
  }
  (p.grupos||[]).forEach(function(gr,gi){
    if(!gr.itens||!gr.itens.length) return;
    var sel=pdSel.g[gi]||{};
    h+='<div class="grp"><div class="grp-head"><strong>'+esc(gr.nome)+'</strong>'+(gr.max>0?'<span class="grp-max">escolha até '+gr.max+'</span>':'')+'</div>'+
      gr.itens.map(function(it,ii){ var q=sel[ii]||0;
        return '<div class="adrow"><div class="adrow-b"><div class="ad-n">'+esc(it.nome)+'</div><div class="ad-p">+ '+money(it.preco)+'</div></div>'+
          '<div class="pd-qtyctl"><button class="qtybtn sm" data-action="pd-adic" data-g="'+gi+'" data-i="'+ii+'" data-d="-1" aria-label="Menos"'+(q<=0?' disabled':'')+'>'+ic('minus')+'</button><span>'+q+'</span><button class="qtybtn sm" data-action="pd-adic" data-g="'+gi+'" data-i="'+ii+'" data-d="1" aria-label="Mais">'+ic('plus')+'</button></div></div>';
      }).join('')+'</div>';
  });
  h+='<div class="field"><label>Alguma observação?</label><textarea data-oninput="pd-obs" placeholder="Ex.: sem cebola, bem passado, molho à parte">'+esc(pdSel.obs)+'</textarea></div>'+
    '<div class="sticky-cta"><div class="pd-cta"><div class="pd-qtyctl big"><button class="qtybtn sm" data-action="pd-qty" data-d="-1" aria-label="Menos">'+ic('minus')+'</button><span id="pd-qtyval">'+pdSel.qty+'</span><button class="qtybtn sm" data-action="pd-qty" data-d="1" aria-label="Mais">'+ic('plus')+'</button></div>'+
    '<button class="btn btn-primary btn-lg pd-add-btn" data-action="pd-add" data-id="'+p.id+'">'+(pdSel.edit!=null?'Atualizar · ':'Adicionar · ')+'<span id="pd-total">'+money(pdTotal(p))+'</span></button></div></div>';
  return h;
}

/* carrinho */
function cartCount(){ return UI.cart.reduce(function(a,i){return a+i.qty;},0); }
function cartSubtotal(){ return UI.cart.reduce(function(a,i){return a+i.preco*i.qty;},0); }
function itemLines(it){
  var lines=[];
  if(it.varNome) lines.push(it.varNome);
  (it.adics||[]).forEach(function(a){ lines.push((a.qty>1?a.qty+'x ':'+ ')+a.nome); });
  if(it.obs) lines.push('Obs.: '+it.obs);
  return lines;
}
function itemDet(it){ return itemLines(it).join(' · '); }
function cliCarrinho(){
  if(!UI.cart.length) return '<div class="pagehead"><h2>Sua sacola</h2></div>'+
    '<div class="empty">'+ic('cart','big')+'Sua sacola está vazia.<br><button class="btn btn-outline btn-sm" style="margin-top:14px" data-action="cli-go" data-s="home">Ver catálogo</button></div>';
  var sub=cartSubtotal(), desc=descontoValor(sub);
  var h='<div class="pagehead cart-head"><h2>Sua sacola</h2><span class="cart-count">'+cartCount()+' item(ns)</span></div>';
  h+='<div class="cart-card">'+UI.cart.map(function(it,idx){
    var lines=itemLines(it).map(esc);
    return '<div class="citem2">'+
      '<img class="ci-img" src="'+itemImg(it)+'" alt="" data-action="cart-edit" data-i="'+idx+'">'+
      '<div class="ci-main"><div class="ci-name" data-action="cart-edit" data-i="'+idx+'">'+esc(it.nome)+'</div>'+
      (lines.length?'<div class="ci-adds">'+lines.join('<br>')+'</div>':'')+
      '<div class="stepper"><button data-action="cart-dec" data-i="'+idx+'" aria-label="Menos">'+ic('minus')+'</button><span>'+it.qty+'</span><button data-action="cart-inc" data-i="'+idx+'" aria-label="Mais">'+ic('plus')+'</button></div></div>'+
      '<div class="ci-side"><div class="ci-price">'+money(it.preco*it.qty)+'</div><button class="ci-remove" data-action="cart-rm" data-i="'+idx+'">remover</button></div>'+
      '</div>';
  }).join('')+'</div>';
  h+='<div class="totbox"><div class="totrow"><span>Subtotal</span><span>'+money(sub)+'</span></div>'+
     (desc>0?'<div class="totrow"><span>Desconto ('+esc(UI.cupom.code)+')</span><span class="gold">- '+money(desc)+'</span></div>':'')+
     '<div class="totrow"><span>Entrega</span><span>no checkout</span></div>'+
     '<div class="totrow grand"><span>Total</span><strong>'+money(sub-desc)+'</strong></div></div>';
  if(S.loja.minPedido>0 && sub<S.loja.minPedido)
    h+='<div class="notice warn">'+ic('warn')+'<div>Pedido mínimo de '+money(S.loja.minPedido)+'. Faltam '+money(S.loja.minPedido-sub)+'.</div></div>';
  h+='<div class="sticky-cta"><button class="btn btn-primary btn-block btn-lg" data-action="cart-continuar">Continuar pedido</button></div>';
  return h;
}

/* como receber */
function cliReceber(){
  return backCli('carrinho')+'<div class="pagehead"><h2>Como receber?</h2><p>Escolha entrega ou retirada no local.</p></div>'+
    '<div class="bigopt" data-action="chk-modo" data-m="delivery"><div class="bo-ic">'+ic('delivery')+'</div><div><div class="bo-t">Entrega</div><div class="bo-s">Levamos até o seu endereço · taxa de entrega</div></div></div>'+
    (S.loja.retirada?'<div class="bigopt" data-action="chk-modo" data-m="retirada"><div class="bo-ic">'+ic('store')+'</div><div><div class="bo-t">Retirar no local</div><div class="bo-s">'+esc(S.loja.endereco)+' · sem taxa</div></div></div>':'');
}

/* endereço */
function cliEndereco(){
  var c=UI.chk, salvos=(UI.me.enderecos||[]);
  var h=backCli('receber')+'<div class="pagehead"><h2>Endereço de entrega</h2><p>Preencha os campos marcados com *.</p></div>';
  if(salvos.length){
    h+='<div class="field"><label>Endereços salvos</label>'+salvos.map(function(e,i){
      return '<button class="bigopt'+((c.rua===e.rua&&c.numero===e.numero)?' sel':'')+'" data-action="chk-endsalvo" data-i="'+i+'"><div class="bo-ic">'+ic('pin')+'</div><div><div class="bo-t">'+esc(e.rua)+', '+esc(e.numero)+'</div><div class="bo-s">'+esc(e.bairro||'')+'</div></div></button>';
    }).join('')+'</div>';
  }
  h+='<div class="card">'+
    '<div class="field"><label>Bairro *</label><input data-oninput="chk-f" data-k="bairro" value="'+esc(c.bairro)+'" placeholder="Ex.: Centro"></div>'+
    '<div class="field"><label>Rua ou Avenida *</label><input data-oninput="chk-f" data-k="rua" value="'+esc(c.rua)+'" placeholder="Ex.: Av. Principal"></div>'+
    '<div class="row2"><div class="field"><label>Número *</label><input inputmode="numeric" data-oninput="chk-f" data-k="numero" value="'+esc(c.numero)+'" placeholder="123"></div>'+
    '<div class="field"><label>Complemento</label><input data-oninput="chk-f" data-k="comp" value="'+esc(c.comp)+'" placeholder="Casa, apto (opcional)"></div></div>'+
    '<div class="field"><label>Ponto de referência *</label><input data-oninput="chk-f" data-k="ref" value="'+esc(c.ref)+'" placeholder="Ex.: perto da praça, portão azul"></div></div>';
  h+='<div class="totbox"><div class="totrow"><span>Taxa de entrega</span><strong class="gold">'+money(S.loja.taxaEntrega)+'</strong></div>'+
     '<div class="totrow"><span>Prazo estimado</span><span>'+esc(S.loja.prazoEntrega||'')+'</span></div></div>';
  h+='<div class="sticky-cta"><button class="btn btn-primary btn-block btn-lg" data-action="chk-endok">Confirmar endereço</button></div>';
  return h;
}

/* dados */
function cliDados(){
  var c=UI.chk, back=c.modo==='delivery'?'endereco':'receber';
  var h=backCli(back)+'<div class="pagehead"><h2>Dados do pedido</h2></div>';
  h+='<div class="card"><div class="field"><label>Nome completo</label><input data-oninput="chk-f" data-k="nome" value="'+esc(c.nome||UI.me.nome||'')+'" placeholder="Seu nome"></div>'+
     '<div class="field"><label>WhatsApp</label><input inputmode="tel" data-oninput="chk-f" data-k="whats" value="'+esc(c.whats||UI.me.tel||'')+'" placeholder="(94) 9....."></div>'+
     '<div class="field"><label>Observação geral (opcional)</label><textarea data-oninput="chk-f" data-k="obs" placeholder="Ex.: portão preto, ligar ao chegar">'+esc(c.obs)+'</textarea></div></div>';
  h+=resumoValores();
  h+='<div class="sticky-cta"><button class="btn btn-primary btn-block btn-lg" data-action="chk-dadosok">Escolher pagamento</button></div>';
  return h;
}
function chkTaxa(){ return UI.chk.modo==='delivery' ? (S.loja.taxaEntrega||0) : 0; }
function resumoValores(){
  var sub=cartSubtotal(), taxa=chkTaxa(), desc=descontoValor(sub);
  return '<div class="totbox"><div class="totrow"><span>Subtotal</span><span>'+money(sub)+'</span></div>'+
    (desc>0?'<div class="totrow"><span>Desconto ('+esc(UI.cupom.code)+')</span><span class="gold">- '+money(desc)+'</span></div>':'')+
    (UI.chk.modo==='delivery'?'<div class="totrow"><span>Taxa de entrega</span><span>'+money(taxa)+'</span></div>':'<div class="totrow"><span>Retirada no local</span><span>sem taxa</span></div>')+
    '<div class="totrow grand"><span>Total</span><strong>'+money(sub-desc+taxa)+'</strong></div></div>';
}

/* pagamento */
function cliPagamento(){
  var c=UI.chk;
  var h=backCli('dados')+'<div class="pagehead"><h2>Pagamento</h2><p>Escolha como pagar.</p></div>';
  var opts=[];
  if(S.loja.aceitaPix) opts.push(['pix','pix','Pix com comprovante','Pague pelo Pix e anexe o comprovante']);
  if(S.loja.aceitaDinheiro) opts.push(['dinheiro','cash','Dinheiro',(c.modo==='delivery'?'Na entrega':'Na retirada')]);
  if(S.loja.aceitaCartao) opts.push(['cartao','card','Cartão',(c.modo==='delivery'?'Maquininha na entrega':'Maquininha na retirada')]);
  h+=opts.map(function(o){ return '<div class="pay'+(c.pay===o[0]?' sel':'')+'" data-action="chk-pay" data-p="'+o[0]+'"><div class="pic">'+ic(o[1])+'</div><div><div class="pt">'+o[2]+'</div><div class="ps">'+o[3]+'</div></div></div>'; }).join('');
  if(c.pay==='pix'){
    h+='<div class="pixbox"><div class="qr">'+fakeQR()+'</div>'+
      '<div class="pix-cap">Chave Pix ('+esc(S.loja.pixNome)+')</div>'+
      '<div class="pixkey">'+esc(S.loja.pixKey)+'</div>'+
      '<button class="btn btn-outline btn-sm btn-block" data-action="chk-copiapix">'+ic('copy')+' Copiar chave Pix</button>'+
      '<div class="upload-wrap"><label class="up-lb">Comprovante do Pix</label>'+
      '<div class="upload'+(c.comprov?' has':'')+'" data-action="chk-upload">'+(c.comprov?ic('check')+' Comprovante anexado<img src="'+c.comprov+'">':ic('attach')+' Toque para anexar o comprovante')+'</div></div>'+
      '<div class="notice warn left">'+ic('warn')+'<div>O pedido só entra em preparo depois que a loja <strong>confirmar o Pix</strong>. Anexar o comprovante não aprova sozinho.</div></div></div>';
  } else if(c.pay==='dinheiro'){
    h+='<div class="card"><div class="field"><label>Precisa de troco? Para quanto? (opcional)</label><input inputmode="numeric" data-oninput="chk-f" data-k="troco" value="'+esc(c.troco)+'" placeholder="Ex.: 50"></div></div>';
  } else if(c.pay==='cartao'){
    h+='<div class="notice info">'+ic('card')+'<div>A maquininha vai '+(c.modo==='delivery'?'com o entregador':'estar no balcão')+'. Crédito ou débito. O sistema não guarda dados do cartão.</div></div>';
  }
  h+=resumoValores();
  var label = c.pay==='pix'?'Enviar pedido para validação':'Confirmar pedido';
  h+='<div class="sticky-cta"><button class="btn btn-primary btn-block btn-lg" data-action="chk-finalizar"'+(c.pay?'':' disabled')+'>'+label+'</button></div>';
  return h;
}

/* confirmado + tracker */
function cliConfirmado(){
  var o=order(UI.curOrder); if(!o) return cliHome();
  return '<div class="ok-hero">'+ic('checkc','xl gold')+'<h2>Pedido enviado!</h2>'+
    '<p>Pedido '+esc(o.id)+' · '+esc(statusCliente(o).lbl)+'</p></div>'+
    trackerHTML(o)+resumoPedidoBox(o)+
    '<a class="btn btn-outline btn-block" style="text-decoration:none;margin-top:12px" href="https://wa.me/55'+S.loja.whats.replace(/\D/g,'')+'" target="_blank" rel="noopener">'+ic('chat')+' Falar no WhatsApp</a>'+
    '<div class="sp"></div><button class="btn btn-primary btn-block" data-action="cli-go" data-s="pedidos">Ver meus pedidos</button>';
}
function cliTrack(){
  var o=order(UI.curOrder); if(!o) return cliPedidos();
  var h=backCli('pedidos')+'<div class="pagehead"><h2>Pedido '+esc(o.id)+' '+statusBadge(o)+'</h2><p>'+esc(o.dia)+' · '+esc(o.criadoEm)+'</p></div>';
  h+=trackerHTML(o)+resumoPedidoBox(o);
  if(o.status==='aguardando_comprovante')
    h+='<div class="sp"></div><button class="btn btn-primary btn-block" data-action="cli-reenviar" data-id="'+o.id+'">'+ic('attach')+' Reenviar comprovante</button>';
  if(['em_validacao','aguardando_comprovante','aguardando_aceite'].indexOf(o.status)>=0)
    h+='<div class="sp-sm"></div><button class="btn btn-red btn-block" data-action="cli-cancelar" data-id="'+o.id+'">Cancelar pedido</button>';
  h+='<a class="btn btn-outline btn-block" style="text-decoration:none;margin-top:10px" href="https://wa.me/55'+S.loja.whats.replace(/\D/g,'')+'" target="_blank" rel="noopener">'+ic('chat')+' Falar no WhatsApp</a>';
  return h;
}
function trackerHTML(o){
  var steps=[['Pedido recebido','receipt'],['Pagamento','pix'],['Em preparo','clock'],['Pronto','check'],[o.tipo==='delivery'?'Saiu para entrega':'Retirada',o.tipo==='delivery'?'delivery':'store']];
  var idx=stepIndex(o);
  if(o.status==='recusado'||o.status==='cancelado')
    return '<div class="card"><div class="notice err">'+ic('x')+'<div>'+(o.status==='recusado'?'Pedido recusado':'Pedido cancelado')+(o.pay.motivoRecusa?' · '+esc(o.pay.motivoRecusa):'')+'</div></div></div>';
  return '<div class="card"><div class="tracker">'+steps.map(function(s,i){
    var cls=i<idx?'done':i===idx?'cur':'future';
    var sub=i===idx?statusCliente(o).sub:'';
    return '<div class="tstep '+cls+'"><div class="tline"></div><div class="tdot">'+(i<idx?ic('check'):ic(s[1]))+'</div>'+
      '<div><div class="tt">'+s[0]+'</div>'+(sub?'<div class="ts">'+esc(sub)+'</div>':'')+'</div></div>';
  }).join('')+'</div></div>';
}
function stepIndex(o){
  switch(o.status){
    case 'aguardando_comprovante': return 1;
    case 'em_validacao': return 1;
    case 'aguardando_aceite': return 1;
    case 'em_preparo': return 2;
    case 'pronto': return 3;
    case 'saiu': return 4;
    case 'concluido': return 5;
    default: return 0;
  }
}
function statusCliente(o){
  var m={
    aguardando_comprovante:{lbl:'Aguardando comprovante',sub:'Reenvie o comprovante do Pix'},
    em_validacao:{lbl:'Comprovante em validação',sub:'Aguardando a loja confirmar seu Pix'},
    aguardando_aceite:{lbl:'Aguardando a loja',sub:'A loja vai aceitar seu pedido'},
    em_preparo:{lbl:'Em preparo',sub:'Seu pedido está sendo feito'},
    pronto:{lbl:o.tipo==='retirada'?'Pronto para retirada':'Pronto',sub:o.tipo==='retirada'?'Pode vir buscar!':'Aguardando o entregador'},
    saiu:{lbl:'Saiu para entrega',sub:'A caminho do seu endereço'},
    concluido:{lbl:'Concluído',sub:'Pedido finalizado. Obrigado pela preferência!'},
    recusado:{lbl:'Pedido recusado',sub:o.pay.motivoRecusa||''},
    cancelado:{lbl:'Cancelado',sub:''}
  };
  return m[o.status]||{lbl:o.status,sub:''};
}
function bairroLabel(o){ return o.bairro||''; }
function resumoPedidoBox(o){
  var h='<div class="dp-block"><h4>Itens</h4>'+o.itens.map(function(i){
    var det=itemDet(i);
    return '<div class="dp-item"><span>'+i.qty+'x '+esc(i.nome)+(det?'<div class="dp-obs">'+esc(det)+'</div>':'')+'</span><strong>'+money(i.preco*i.qty)+'</strong></div>';
  }).join('')+'</div>';
  h+='<div class="dp-block"><div class="dp-line"><span>'+(o.tipo==='delivery'?'Entrega':'Retirada')+'</span><strong>'+(o.tipo==='delivery'?esc(o.end)+' · '+esc(bairroLabel(o)):'No local')+'</strong></div>'+
     (o.tipo==='delivery'&&o.ref?'<div class="dp-line"><span>Referência</span><strong>'+esc(o.ref)+'</strong></div>':'')+
     '<div class="dp-line"><span>Pagamento</span><strong>'+esc(o.pay.label)+'</strong></div>'+
     '<div class="dp-line"><span>Subtotal</span><span>'+money(o.subtotal)+'</span></div>'+
     (o.desconto>0?'<div class="dp-line"><span>Desconto'+(o.cupom?' ('+esc(o.cupom)+')':'')+'</span><span>- '+money(o.desconto)+'</span></div>':'')+
     (o.tipo==='delivery'?'<div class="dp-line"><span>Taxa</span><span>'+money(o.taxa)+'</span></div>':'')+
     '<div class="dp-line big"><strong>Total</strong><strong class="gold">'+money(o.total)+'</strong></div></div>';
  return h;
}

/* meus pedidos */
function cliPedidos(){
  var meus=S.pedidos.filter(function(p){return p.tel===(UI.me.tel||'');});
  if(!meus.length) return '<div class="pagehead"><h2>Meus pedidos</h2></div><div class="empty">'+ic('receipt','big')+'Você ainda não fez pedidos.<br><button class="btn btn-outline btn-sm" style="margin-top:14px" data-action="cli-go" data-s="home">Ver catálogo</button></div>';
  var ativos=meus.filter(function(p){return ['concluido','recusado','cancelado'].indexOf(p.status)<0;});
  var hist=meus.filter(function(p){return ['concluido','recusado','cancelado'].indexOf(p.status)>=0;});
  var h='<div class="pagehead"><h2>Meus pedidos</h2></div>';
  if(ativos.length) h+='<div class="catlabel">Em andamento</div>'+ativos.map(ordCardCli).join('');
  if(hist.length) h+='<div class="catlabel">Histórico</div>'+hist.map(ordCardCli).join('');
  return h;
}
function ordCardCli(o){
  var itemsTxt=o.itens.map(function(i){return i.qty+'x '+i.nome;}).join(', ');
  return '<div class="ordcard" data-action="cli-track" data-id="'+o.id+'">'+
    '<div class="oc-top"><span class="oc-id">'+esc(o.id)+'</span>'+statusBadge(o)+'</div>'+
    '<div class="oc-meta">'+esc(o.dia)+' · '+esc(o.criadoEm)+' · '+(o.tipo==='delivery'?'Entrega':'Retirada')+'</div>'+
    '<div class="oc-items">'+esc(itemsTxt)+'</div>'+
    '<div class="oc-foot"><span class="oc-total">'+money(o.total)+'</span>'+
    (o.status==='concluido'?'<button class="btn btn-outline btn-sm" data-action="cli-repetir" data-id="'+o.id+'">Pedir novamente</button>':'<span class="muted">Toque para acompanhar '+ic('chev')+'</span>')+'</div></div>';
}

/* perfil */
function cliPerfil(){
  var me=UI.me, inicial=(me.nome||'?').trim().charAt(0).toUpperCase();
  var h='<div class="pagehead"><h2>Meu perfil</h2></div>';
  var avatar = me.foto ? '<img class="avatar-lg" src="'+me.foto+'" alt="">' : '<div class="avatar-lg">'+esc(inicial)+'</div>';
  h+='<div class="perfil-top">'+avatar+
     '<div><div class="pf-nome">'+esc(me.nome||'Visitante')+'</div><div class="pf-tel">'+esc(me.tel||'Sem telefone')+'</div>'+
     '<button class="btn btn-outline btn-sm" style="margin-top:8px" data-action="me-foto">'+ic('camera')+' '+(me.foto?'Trocar foto':'Adicionar foto')+'</button></div></div>';
  h+='<div class="card"><div class="field"><label>Nome</label><input data-oninput="me-f" data-k="nome" value="'+esc(me.nome||'')+'"></div>'+
     '<div class="field"><label>WhatsApp</label><input inputmode="tel" data-oninput="me-f" data-k="tel" value="'+esc(me.tel||'')+'"></div>'+
     '<button class="btn btn-outline btn-sm btn-block" data-action="me-salvar">Salvar dados</button></div>';
  h+='<div class="catlabel">Endereços salvos</div>';
  if((me.enderecos||[]).length){
    h+=me.enderecos.map(function(e,i){
      return '<div class="addr"><span class="ad-ic">'+ic('pin')+'</span><div class="ad-b"><div class="ad-t">'+esc((e.rua||'')+(e.numero?', '+e.numero:''))+'</div><div class="ad-s">'+esc(e.bairro||'')+(e.comp?' · '+esc(e.comp):'')+'</div></div>'+
        (i===0?'<span class="ad-def">Padrão</span>':'')+'<button class="ci-trash" data-action="me-endrm" data-i="'+i+'" aria-label="Remover endereço">'+ic('trash')+'</button></div>';
    }).join('');
  } else h+='<div class="empty" style="padding:24px">Nenhum endereço salvo ainda.</div>';
  h+='<button class="btn btn-ghost btn-block" style="margin-top:8px" data-action="me-endadd">'+ic('plus')+' Adicionar endereço</button>';
  h+='<div class="sp"></div><button class="btn btn-red btn-block" data-action="cli-logout">'+ic('x')+' Sair da conta</button>';
  return h;
}
function backCli(to){ return '<div class="backbar"><button class="backbtn" data-action="cli-go" data-s="'+to+'">'+ic('back')+' Voltar</button></div>'; }

/* status badge */
function statusBadge(o){
  var map={ aguardando_comprovante:['valid','attach','Aguard. comprovante'], em_validacao:['valid','clock','Em validação'],
    aguardando_aceite:['aceite','bell','Aguard. aceite'], em_preparo:['preparo','clock','Em preparo'],
    pronto:['pronto','check','Pronto'], saiu:['entrega','delivery','Saiu p/ entrega'],
    concluido:['ok','checkc','Concluído'], recusado:['recusado','x','Recusado'], cancelado:['cancel','x','Cancelado'] };
  var m=map[o.status]||['novo','dot',o.status];
  return '<span class="st '+m[0]+'">'+ic(m[1])+m[2]+'</span>';
}

/* ============================================================================
   APP DO DONO (ADMIN)
   ============================================================================ */
var ADM_MODS=[
  ['promocoes','percent','Promoções e ofertas','Combos, cupons e destaques'],
  ['entregas','delivery','Entregas','Bairros, taxas e retirada'],
  ['horarios','clock','Horários','Abrir, fechar ou pausar'],
  ['pagamentos','pix','Pagamentos','Chave Pix e formas aceitas'],
  ['impressao','printer','Impressão','Testar e configurar cupom'],
  ['relatorios','chart','Relatórios','Vendas, produtos e dias'],
  ['clientes','users','Clientes','Base e histórico'],
  ['equipe','lock','Equipe','Logins e permissões'],
  ['marca','paint','Marca','Logo, banner e aparência']
];
var ATENDENTE_MODS=['impressao'];
function modAllowed(m){ return isAdmin() || ATENDENTE_MODS.indexOf(m)>=0; }

/* Alerta flutuante fixo: pedidos esperando ação (validação/aceite). Some quando não há pendências. */
function admAlerta(){
  if(!UI.adm.logged) return '';
  var pend=S.pedidos.filter(function(p){return ['em_validacao','aguardando_aceite'].indexOf(p.status)>=0;}).length;
  if(!pend) return '';
  // não mostra quando já está na própria lista de pedidos
  if(!UI.adm.order && !UI.adm.mais && UI.adm.tab==='pedidos') return '';
  return '<button class="adm-alert" data-action="adm-kpi" data-f="todos"><span class="aa-ic">'+ic('bell')+'</span>'+
    '<span class="aa-tx"><strong>'+pend+' pedido(s) esperando ação</strong><span>Toque para ver e agilizar</span></span>'+
    '<span class="aa-cta">Ver pedidos</span></button>';
}

function viewAdmin(){
  if(!UI.adm.logged) return '<div class="stage">'+admLogin()+'</div>';
  var content;
  if(UI.adm.order) content=admDetalhe(order(UI.adm.order));
  else if(UI.adm.mais) content=modAllowed(UI.adm.mais)?admMaisModulo(UI.adm.mais):admSemPermissao();
  else if(UI.adm.tab==='visao') content=admVisao();
  else if(UI.adm.tab==='pedidos') content=admPedidos();
  else if(UI.adm.tab==='cardapio') content=admCardapio();
  else if(UI.adm.tab==='mais') content=admMais();
  else content=admVisao();
  return '<div class="stage wide">'+admTop()+admSidebar()+'<div class="adm-scroll">'+content+'</div>'+admAlerta()+admTabs()+'</div>';
}
function admSemPermissao(){ return '<div class="empty">'+ic('lock','big')+'Este módulo é exclusivo do dono.</div>'; }
function admLogin(){
  return '<div class="login"><img class="l-logo" src="assets/logo-lirio.png" alt=""><h1>'+esc(S.loja.nome)+' · Painel</h1>'+
    '<p>Acesso exclusivo do dono e da equipe.</p>'+
    '<div class="l-form"><div class="field"><label>Usuário</label><input id="lg-user" value="yara"></div>'+
    '<div class="field"><label>Senha</label><input id="lg-pass" type="password" value="1234"></div>'+
    '<button class="btn btn-primary btn-block btn-lg" data-action="adm-login">Entrar</button>'+
    '<div class="l-hint">Acesso de teste: <strong>yara</strong> / 1234 (dona) · <strong>atendente</strong> / 1234 (equipe)</div></div></div>';
}
function admTop(){
  var pend=S.pedidos.filter(function(p){return ['em_validacao','aguardando_aceite'].indexOf(p.status)>=0;}).length;
  return '<div class="topbar"><img class="logo" src="assets/logo-lirio.png" alt="">'+
    '<div class="tb-id"><div class="tb-tt">'+esc(S.loja.nome)+'</div><div class="tb-sub">'+esc(UI.adm.user.nome)+' · '+(isAdmin()?'Dono':'Atendente')+'</div></div>'+
    '<div class="tb-right"><button class="iconbtn" data-action="adm-tab" data-t="pedidos" aria-label="Pedidos pendentes">'+ic('bell')+(pend?'<span class="badge">'+pend+'</span>':'')+'</button>'+
    '<button class="iconbtn" data-action="adm-logout" aria-label="Sair" title="Sair">'+ic('logout')+'</button></div></div>';
}
function admSidebar(){
  var items=[['visao','chart','Visão geral'],['pedidos','receipt','Pedidos'],['cardapio','cardapio','Catálogo'],['mais','gear','Mais']];
  return '<div class="sidebar">'+items.map(function(it){
    var on=(!UI.adm.order&&!UI.adm.mais&&UI.adm.tab===it[0]);
    return '<button class="sidebtn'+(on?' on':'')+'" data-action="adm-tab" data-t="'+it[0]+'"><span class="si">'+ic(it[1])+'</span>'+it[2]+'</button>';
  }).join('')+'</div>';
}
function admTabs(){
  var pend=S.pedidos.filter(function(p){return ['em_validacao','aguardando_aceite'].indexOf(p.status)>=0;}).length;
  function t(k,icn,lb){ var on=(!UI.adm.order&&!UI.adm.mais&&UI.adm.tab===k);
    var b=(k==='pedidos'&&pend)?'<span class="tbadge">'+pend+'</span>':'';
    return '<button class="tab'+(on?' on':'')+'" data-action="adm-tab" data-t="'+k+'" aria-label="'+lb+'"><span class="ti">'+ic(icn)+'</span>'+lb+b+'</button>'; }
  return '<div class="tabbar">'+t('visao','chart','Visão')+t('pedidos','receipt','Pedidos')+t('cardapio','cardapio','Catálogo')+t('mais','gear','Mais')+'</div>';
}

/* Visão geral */
function admVisao(){
  var P=S.pedidos;
  function c(fn){ return P.filter(fn).length; }
  var novos=c(function(p){return p.status==='aguardando_aceite';});
  var valid=c(function(p){return p.status==='em_validacao';});
  var preparo=c(function(p){return p.status==='em_preparo';});
  var prontos=c(function(p){return p.status==='pronto';});
  var entrega=c(function(p){return p.status==='saiu';});
  var h='<img class="adm-banner" src="assets/banner-lirio.jpg" alt="Lírio das Águas">';
  h+='<div class="pagehead"><h2>Visão geral</h2><p>Resumo da operação · '+hoje()+'</p></div>';
  h+='<div class="kpi-grid">'+
    kpi('em_validacao',valid,'Aguard. validação','clock',valid>0)+
    kpi('aguardando_aceite',novos,'Novos pedidos','bell',novos>0)+
    kpi('em_preparo',preparo,'Em preparo','clock')+
    kpi('pronto',prontos,'Prontos','check')+
    kpi('saiu',entrega,'Em entrega','delivery')+'</div>';
  if(isAdmin()){
    var conclHoje=P.filter(function(p){return p.status==='concluido'&&p.dia===hoje();}).length;
    var fatHoje=P.filter(function(p){return p.status==='concluido'&&p.dia===hoje();}).reduce(function(a,p){return a+p.total;},0);
    var novosCli=S.clientes.filter(function(cl){return cl.criadoEm===hoje();}).length;
    h+='<div class="adm-sec-t">Hoje</div><div class="kpi-grid">'+
      kpiPlain(money(fatHoje),'Faturamento','tag',true)+kpiPlain(conclHoje,'Concluídos','checkc')+
      kpiPlain(S.clientes.length,'Clientes na base','users')+kpiPlain('+'+novosCli,'Novos hoje','star')+'</div>';
    // mini-dashboard de faturamento (mês / dia / 7 dias)
    var concl=P.filter(function(p){return p.status==='concluido';});
    var nowD=new Date(), yy=nowD.getFullYear(), mmn=nowD.getMonth();
    var mesArr=concl.filter(function(p){ var d=new Date(p.ts||0); return d.getFullYear()===yy&&d.getMonth()===mmn; });
    var fatMes=mesArr.reduce(function(a,p){return a+p.total;},0);
    var ticket=mesArr.length?fatMes/mesArr.length:0;
    var dnome=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'], d7=[], lbl7=[], baseD=new Date(yy,mmn,nowD.getDate());
    for(var kk=6;kk>=0;kk--){ var dd=new Date(baseD.getTime()-kk*86400000); lbl7.push(dnome[dd.getDay()]);
      d7.push(concl.filter(function(p){ var pd=new Date(p.ts||0); return pd.getFullYear()===dd.getFullYear()&&pd.getMonth()===dd.getMonth()&&pd.getDate()===dd.getDate(); }).reduce(function(a,p){return a+p.total;},0)); }
    var maxd=Math.max.apply(null,d7.concat([1]));
    h+='<div class="adm-sec-t">Faturamento</div><div class="kpi-grid">'+
      kpiPlain(money(fatMes),'Este mês','tag',true)+kpiPlain(money(fatHoje),'Hoje','tag')+
      kpiPlain(money(ticket),'Ticket médio','star')+kpiPlain(mesArr.length,'Pedidos no mês','checkc')+'</div>';
    h+='<div class="card" style="margin-top:10px"><div class="muted small2" style="margin-bottom:8px">Faturamento dos últimos 7 dias</div><div class="chart">'+
      d7.map(function(v,i){ return '<div class="bar-wrap"><div class="bar" style="height:'+Math.round(v/maxd*100)+'%" title="'+money(v)+'"></div><small>'+lbl7[i]+'</small></div>'; }).join('')+
      '</div>'+(fatMes===0?'<div class="empty" style="padding:10px">Sem faturamento ainda. Aparece aqui quando você concluir pedidos.</div>':'')+'</div>';
  }
  var esgotados=S.produtos.filter(function(p){return p.disp==='esgotado';}).length;
  if(esgotados) h+='<div class="notice info" style="margin-top:16px">'+ic('info')+'<div>'+esgotados+' produto(s) marcados como esgotados hoje.</div></div>';
  return h;
}
function kpi(filter,n,label,icn,hl){ return '<button class="kpi'+(hl?' hl':'')+'" data-action="adm-kpi" data-f="'+filter+'"><span class="k-ic">'+ic(icn)+'</span><div class="k-n">'+n+'</div><div class="k-l">'+label+'</div></button>'; }
function kpiPlain(n,label,icn,hl){ return '<div class="kpi'+(hl?' hl':'')+'"><span class="k-ic">'+ic(icn)+'</span><div class="k-n">'+n+'</div><div class="k-l">'+label+'</div></div>'; }

/* Pedidos */
var FILTERS=[['todos','Todos'],['aguardando_aceite','Novos'],['em_validacao','Validação'],['em_preparo','Preparo'],['pronto','Prontos'],['saiu','Entrega'],['concluido','Concluídos'],['recusado','Recusados']];
function admPedidos(){
  var f=UI.adm.filter||'todos', ft=UI.adm.filterTipo||'todos', fp=UI.adm.filterPay||'todos';
  var list=S.pedidos.filter(function(p){
    if(f!=='todos'&&p.status!==f) return false;
    if(ft!=='todos'&&p.tipo!==ft) return false;
    if(fp!=='todos'&&p.pay.metodo!==fp) return false;
    return true;
  });
  var h='<div class="pagehead"><h2>Pedidos</h2><p>'+list.length+' pedido(s)</p></div>';
  h+='<div class="filters">'+FILTERS.map(function(x){
    var n=x[0]==='todos'?S.pedidos.length:S.pedidos.filter(function(p){return p.status===x[0];}).length;
    return '<button class="chip'+(f===x[0]?' on':'')+'" data-action="adm-filter" data-f="'+x[0]+'">'+x[1]+' ('+n+')</button>';
  }).join('')+'</div>';
  h+='<div class="filters">'+
    [['todos','Tipo: todos'],['delivery','Entrega'],['retirada','Retirada']].map(function(x){return '<button class="chip'+(ft===x[0]?' on':'')+'" data-action="adm-filter-tipo" data-f="'+x[0]+'">'+x[1]+'</button>';}).join('')+
    [['todos','Pgto: todos'],['pix','Pix'],['dinheiro','Dinheiro'],['cartao','Cartão']].map(function(x){return '<button class="chip'+(fp===x[0]?' on':'')+'" data-action="adm-filter-pay" data-f="'+x[0]+'">'+x[1]+'</button>';}).join('')+'</div>';
  if(!list.length) h+='<div class="empty">'+ic('receipt','big')+'Nenhum pedido neste filtro.</div>';
  else h+='<div class="ord-grid">'+list.map(admOrderItem).join('')+'</div>';
  return h;
}
function admOrderItem(o){
  var acao=proximaAcaoLabel(o);
  return '<button class="oitem" data-action="adm-open" data-id="'+o.id+'">'+
    '<div class="oi-top"><span class="oi-id">'+esc(o.id)+'</span>'+statusBadge(o)+'</div>'+
    '<div class="oi-cli">'+esc(o.nome)+' · '+esc(o.tel)+'</div>'+
    '<div class="oi-tags"><span class="tag">'+(o.tipo==='delivery'?'Entrega':'Retirada')+'</span><span class="tag">'+esc(o.pay.label)+'</span><span class="tag">'+esc(o.criadoEm)+'</span></div>'+
    '<div class="oi-mid"><span class="oi-total">'+money(o.total)+'</span>'+(acao?'<span class="oi-acao">'+esc(acao)+' '+ic('chev')+'</span>':'<span class="muted">ver detalhes '+ic('chev')+'</span>')+'</div></button>';
}
function proximaAcaoLabel(o){
  switch(o.status){
    case 'em_validacao': return 'Validar Pix';
    case 'aguardando_aceite': return 'Aceitar';
    case 'em_preparo': return 'Marcar pronto';
    case 'pronto': return o.tipo==='delivery'?'Saiu p/ entrega':'Confirmar retirada';
    case 'saiu': return 'Concluir';
    default: return '';
  }
}

/* Mensagens rápidas do dono para o cliente (via WhatsApp, com o número cadastrado) */
function admMensagens(o){
  if(!telValido(o.tel)) return '<div class="dp-block"><h4>Mensagem ao cliente</h4><div class="notice warn">'+ic('warn')+'<div>Este cliente não tem um número válido cadastrado, então não dá pra enviar mensagem. Peça o WhatsApp e cadastre no pedido.</div></div></div>';
  var nome=(o.nome||'').split(' ')[0], loja=S.loja.nome;
  var msgs=[
    ['A caminho','Olá '+nome+'! Seu pedido '+o.id+' do '+loja+' já saiu e está a caminho.'],
    ['Vai atrasar','Olá '+nome+', aqui é do '+loja+'. Seu pedido '+o.id+' vai atrasar um pouquinho. Obrigado pela paciência!'],
    ['Achar endereço','Olá '+nome+', o entregador está com dificuldade para achar seu endereço. Pode mandar um ponto de referência ou a localização?'],
    ['Pronto p/ retirada','Olá '+nome+'! Seu pedido '+o.id+' já está pronto para retirada no '+loja+'.']
  ];
  return '<div class="dp-block"><h4>Mensagem ao cliente</h4><div class="msg-grid">'+
    msgs.map(function(m){ return '<a class="btn btn-outline btn-sm" href="'+waLink(o.tel,m[1])+'" target="_blank" rel="noopener">'+ic('chat')+' '+m[0]+'</a>'; }).join('')+'</div>'+
    '<a class="btn btn-ghost btn-sm btn-block" style="margin-top:8px" href="'+waLink(o.tel,'')+'" target="_blank" rel="noopener">'+ic('edit')+' Escrever mensagem livre</a></div>';
}
/* Detalhe do pedido */
function admDetalhe(o){
  if(!o) return admPedidos();
  var h='<div class="backbar"><button class="backbtn" data-action="adm-back">'+ic('back')+' Voltar aos pedidos</button></div>';
  h+='<div class="pagehead"><h2>Pedido '+esc(o.id)+' '+statusBadge(o)+'</h2><p>'+esc(o.dia)+' · '+esc(o.criadoEm)+'</p></div>';
  h+='<div class="det-cols">';
  h+='<div class="det-col"><div class="dp-block"><h4>Cliente</h4>'+
     '<div class="dp-line"><span>Nome</span><strong>'+esc(o.nome)+'</strong></div>'+
     '<div class="dp-line"><span>WhatsApp</span><strong>'+esc(o.tel)+'</strong></div>'+
     (o.tipo==='delivery'?'<div class="dp-line"><span>Endereço</span><strong>'+esc(o.end)+'</strong></div>'+
        '<div class="dp-line"><span>Bairro</span><strong>'+esc(bairroLabel(o))+'</strong></div>'+(o.comp?'<div class="dp-line"><span>Complemento</span><strong>'+esc(o.comp)+'</strong></div>':'')+(o.ref?'<div class="dp-line"><span>Referência</span><strong>'+esc(o.ref)+'</strong></div>':''):'<div class="dp-line"><span>Tipo</span><strong>Retirada no local</strong></div>')+
     '</div>'+admMensagens(o);
  h+='<div class="dp-block"><h4>Itens</h4>'+o.itens.map(function(i){
    var det=itemDet(i);
    return '<div class="dp-item"><span>'+i.qty+'x '+esc(i.nome)+(det?'<div class="dp-obs">'+esc(det)+'</div>':'')+'</span><strong>'+money(i.preco*i.qty)+'</strong></div>';
  }).join('')+(o.obs?'<div class="notice info">'+ic('edit')+'<div>'+esc(o.obs)+'</div></div>':'')+'</div></div>';
  h+='<div class="det-col"><div class="dp-block"><h4>Pagamento</h4>'+
     '<div class="dp-line"><span>Forma</span><strong>'+esc(o.pay.label)+'</strong></div>'+
     '<div class="dp-line"><span>Situação</span><strong>'+payStatusLabel(o)+'</strong></div>'+
     (o.pay.troco?'<div class="dp-line"><span>Troco para</span><strong>'+money(o.pay.troco)+'</strong></div>':'')+
     '<div class="dp-line"><span>Subtotal</span><span>'+money(o.subtotal)+'</span></div>'+
     (o.desconto>0?'<div class="dp-line"><span>Desconto'+(o.cupom?' ('+esc(o.cupom)+')':'')+'</span><span>- '+money(o.desconto)+'</span></div>':'')+
     (o.tipo==='delivery'?'<div class="dp-line"><span>Taxa de entrega</span><span>'+money(o.taxa)+'</span></div>':'')+
     '<div class="dp-line big"><strong>Total</strong><strong class="gold">'+money(o.total)+'</strong></div>'+
     (o.pay.comprovante?'<div class="comprov-wrap"><div class="up-lb">Comprovante enviado:</div><img class="comprov" src="'+o.pay.comprovante+'"></div>':'')+'</div>';
  h+='<div class="actionbar">'+admAcoes(o)+'</div>';
  h+='<div class="dp-block"><h4>Histórico</h4>'+(o.historico||[]).map(function(x){
    return '<div class="dp-line"><span>'+esc(x.t)+' · '+esc(x.who)+'</span><span>'+esc(x.act)+'</span></div>';
  }).join('')+'</div></div>';
  h+='</div>';
  return h;
}
function payStatusLabel(o){
  if(o.pay.metodo==='pix') return o.pay.status==='aprovado'?'Pix confirmado':o.pay.status==='enviado'?'Comprovante em validação':'Aguardando comprovante';
  return o.status==='concluido'?'Recebido no local':'A receber no local';
}
function admAcoes(o){
  switch(o.status){
    case 'em_validacao':
      return '<button class="btn btn-green btn-block" data-action="adm-aprovar-pix" data-id="'+o.id+'">'+ic('check')+' Aprovar pagamento (Pix confirmado)</button>'+
             '<button class="btn btn-outline btn-block" data-action="adm-solicitar-comprov" data-id="'+o.id+'">'+ic('attach')+' Solicitar novo comprovante</button>'+
             '<button class="btn btn-red btn-block" data-action="adm-recusar" data-id="'+o.id+'">Recusar pedido</button>';
    case 'aguardando_comprovante':
      return '<div class="notice info">'+ic('info')+'<div>Aguardando o cliente reenviar o comprovante.</div></div>'+
             '<button class="btn btn-red btn-block" data-action="adm-recusar" data-id="'+o.id+'">Recusar pedido</button>';
    case 'aguardando_aceite':
      return '<button class="btn btn-primary btn-block btn-lg" data-action="adm-aceitar" data-id="'+o.id+'">'+ic('printer')+' Aceitar e imprimir cupom</button>'+
             '<button class="btn btn-red btn-block" data-action="adm-recusar" data-id="'+o.id+'">Recusar pedido</button>';
    case 'em_preparo':
      return '<button class="btn btn-green btn-block btn-lg" data-action="adm-pronto" data-id="'+o.id+'">'+ic('check')+' Marcar como pronto</button>'+
             '<button class="btn btn-outline btn-block" data-action="adm-reimprimir" data-id="'+o.id+'">'+ic('printer')+' Reimprimir cupom</button>'+
             (isAdmin()?'<button class="btn btn-red btn-block" data-action="adm-cancelar-admin" data-id="'+o.id+'">Cancelar pedido (dono)</button>':'');
    case 'pronto':
      return (o.tipo==='delivery'
        ? '<button class="btn btn-primary btn-block btn-lg" data-action="adm-saiu" data-id="'+o.id+'">'+ic('delivery')+' Saiu para entrega</button>'
        : '<button class="btn btn-green btn-block btn-lg" data-action="adm-concluir" data-id="'+o.id+'">'+ic('check')+' Confirmar retirada e pagamento</button>')+
        (isAdmin()?'<button class="btn btn-red btn-block" data-action="adm-cancelar-admin" data-id="'+o.id+'">Cancelar pedido (dono)</button>':'');
    case 'saiu':
      return '<button class="btn btn-green btn-block btn-lg" data-action="adm-concluir" data-id="'+o.id+'">'+ic('check')+' Concluir entrega</button>';
    case 'concluido': return '<div class="notice ok">'+ic('checkc')+'<div>Pedido concluído.</div></div>';
    case 'recusado': return '<div class="notice err">'+ic('x')+'<div>Pedido recusado'+(o.pay.motivoRecusa?': '+esc(o.pay.motivoRecusa):'')+'</div></div>';
    case 'cancelado': return '<div class="notice">'+ic('x')+'<div>Pedido cancelado'+(o.pay.motivoRecusa?': '+esc(o.pay.motivoRecusa):'')+'</div></div>';
    default: return '';
  }
}

/* Cupom */
function cupomHTML(o,reimp){
  var itens=o.itens.map(function(i){
    var det=itemDet(i);
    return '<div class="tk-l"><span>'+i.qty+'x '+esc(i.nome)+'</span><span>'+money(i.preco*i.qty)+'</span></div>'+(det?'<div class="tk-obs">'+esc(det)+'</div>':'');
  }).join('');
  return '<div class="ticket"><h1>'+esc(String(S.loja.nome).toUpperCase())+'</h1><div class="tk-c">CUPOM DO PEDIDO</div>'+
    (reimp?'<div class="reimp">*** REIMPRESSAO ***</div>':'<div class="tk-c tk-strong">ORIGINAL</div>')+
    '<div class="tk-big">'+esc(o.id)+'</div><hr>'+
    '<div class="tk-l"><span>'+esc(o.dia)+'</span><span>'+esc(o.criadoEm)+'</span></div>'+
    '<div class="tk-l"><span>Tipo</span><strong>'+(o.tipo==='delivery'?'ENTREGA':'RETIRADA')+'</strong></div>'+
    '<div class="tk-l"><span>Cliente</span><span>'+esc(o.nome)+'</span></div>'+
    '<div class="tk-l"><span>Fone</span><span>'+esc(o.tel)+'</span></div>'+
    (o.tipo==='delivery'?'<div class="tk-l"><span>End.</span><span>'+esc(o.end)+' - '+esc(bairroLabel(o))+'</span></div>':'')+
    '<hr>'+itens+'<hr>'+
    '<div class="tk-l"><strong>TOTAL</strong><strong>'+(o.entregaSobConsulta?money(o.subtotal)+'+ent':money(o.total))+'</strong></div>'+
    '<div class="tk-l"><span>Pagto</span><span>'+esc(o.pay.label)+'</span></div>'+
    (o.pay.troco?'<div class="tk-l"><span>Troco p/</span><span>'+money(o.pay.troco)+'</span></div>':'')+
    (o.obs?'<div class="tk-obs">Obs.: '+esc(o.obs)+'</div>':'')+
    '<hr><div class="tk-c">Separe este cupom com o pedido</div></div>';
}
function abrirCupom(o,reimp){
  $('print-area').innerHTML=cupomHTML(o,reimp);
  modal('<h2 class="center">Cupom do pedido</h2>'+cupomHTML(o,reimp)+
    '<div class="sticky-cta"><button class="btn btn-primary btn-block" data-action="do-print">'+ic('printer')+' Imprimir</button>'+
    '<button class="btn btn-ghost btn-block" style="margin-top:8px" data-action="close-modal">Fechar</button></div>',true);
}
on('do-print',function(){ window.print(); });

/* Catálogo (admin) */
function admCardapio(){
  var admin=isAdmin();
  var h='<div class="pagehead"><h2>Catálogo</h2><p>'+S.produtos.filter(function(p){return p.disp!=='oculto';}).length+' produtos ativos</p></div>';
  if(admin) h+='<div class="row2"><button class="btn btn-primary" data-action="adm-novo-produto">'+ic('plus')+' Novo produto</button><button class="btn btn-ghost" data-action="adm-mais" data-m="categorias">'+ic('tag')+' Categorias</button></div><div class="sp-sm"></div>';
  else h+='<div class="notice info">'+ic('info')+'<div>Você (atendente) pode ligar/desligar a venda do dia. Preço, foto e cadastro são com o dono.</div></div>';
  catsOrd().forEach(function(c){
    var items=S.produtos.filter(function(p){return p.cat===c.id;}).sort(function(a,b){return a.ordem-b.ordem;});
    if(!items.length) return;
    h+='<div class="adm-sec-t">'+esc(c.nome)+' ('+items.length+')'+(c.oculta?' · <span class="tag">oculta</span>':'')+'</div>';
    h+='<div class="padm-grid">'+items.map(function(p){
      var on=p.disp==='disponivel';
      var nameCell='<div class="pa-b"'+(admin?' data-action="adm-edit-produto" data-id="'+p.id+'" style="cursor:pointer"':'')+'><div class="pa-n">'+esc(p.nome)+(p.disp==='oculto'?' <span class="tag">oculto</span>':p.disp==='esgotado'?' <span class="tag">esgotado</span>':'')+'</div><div class="pa-p">'+money(p.preco)+'</div></div>';
      return '<div class="padm"><img class="pa-img" src="'+prodImg(p)+'" alt="">'+nameCell+
        '<div class="switch'+(on?' on':'')+'" data-action="adm-toggle-disp" data-id="'+p.id+'" role="button" aria-label="Disponível hoje"></div></div>';
    }).join('')+'</div>';
  });
  return h;
}
function admCategorias(){
  var cs=catsOrd();
  var h='<div class="pagehead"><h2>Categorias</h2><p>Organize as seções do catálogo</p></div>';
  h+=cs.map(function(c,i){
    return '<div class="padm"><div class="pa-b"><div class="pa-n">'+esc(c.nome)+(c.oculta?' <span class="tag">oculta</span>':'')+'</div><div class="pa-p muted">'+S.produtos.filter(function(p){return p.cat===c.id;}).length+' produto(s)</div></div>'+
      '<div class="cat-actions">'+
      '<button class="btn btn-sm btn-ghost" data-action="cat-up" data-id="'+c.id+'" aria-label="Subir"'+(i===0?' disabled':'')+'>'+ic('back','rot90')+'</button>'+
      '<button class="btn btn-sm btn-ghost" data-action="cat-down" data-id="'+c.id+'" aria-label="Descer"'+(i===cs.length-1?' disabled':'')+'>'+ic('chev','rot90')+'</button>'+
      '<button class="btn btn-sm btn-ghost" data-action="cat-ren" data-id="'+c.id+'" aria-label="Renomear">'+ic('edit')+'</button>'+
      '<div class="switch'+(!c.oculta?' on':'')+'" data-action="cat-oculta" data-id="'+c.id+'" role="button" aria-label="Visível"></div></div></div>';
  }).join('');
  h+='<button class="btn btn-ghost btn-block" style="margin-top:8px" data-action="cat-add">'+ic('plus')+' Nova categoria</button>';
  h+='<div class="notice info">'+ic('info')+'<div>Ocultar uma categoria some ela do catálogo do cliente sem apagar o histórico de pedidos.</div></div>';
  return h;
}
/* Promoções */
function admPromos(){
  var h='<div class="pagehead"><h2>Promoções e ofertas</h2><p>Combos, cupons e destaques que aparecem no app do cliente</p></div>';
  h+='<button class="btn btn-primary btn-block" data-action="adm-promo-novo">'+ic('plus')+' Nova promoção / combo</button><div class="sp-sm"></div>';
  if(!(S.promos||[]).length){ h+='<div class="empty">'+ic('percent','big')+'Nenhuma promoção cadastrada.</div>'; }
  else h+=S.promos.map(function(p){
    return '<div class="padm"><div class="pa-img promo-mini">'+ic('percent')+'</div>'+
      '<div class="pa-b" data-action="adm-promo-edit" data-id="'+p.id+'" style="cursor:pointer"><div class="pa-n">'+esc(p.titulo)+(p.ativo?'':' <span class="tag">inativa</span>')+'</div><div class="pa-p">'+esc(p.desc)+' · <span class="gold">'+money(p.preco)+'</span></div></div>'+
      '<div class="switch'+(p.ativo?' on':'')+'" data-action="adm-promo-toggle" data-id="'+p.id+'" role="button" aria-label="Ativa"></div></div>';
  }).join('');
  h+='<div class="notice info">'+ic('info')+'<div>Promoções ativas aparecem em destaque no topo do catálogo do cliente. O combo/oferta é um cartão promocional (o pedido continua sendo montado pelos itens do catálogo).</div></div>';
  return h;
}
function promoForm(p){
  var novo=!p; p=p||{titulo:'',desc:'',preco:'',ativo:true,id:null};
  return '<h2>'+(novo?'Nova promoção':'Editar promoção')+'</h2>'+
    '<div class="field"><label>Título</label><input id="pr-t" value="'+esc(p.titulo)+'" placeholder="Ex.: Combo Casal"></div>'+
    '<div class="field"><label>Descrição</label><textarea id="pr-d" placeholder="O que inclui a oferta">'+esc(p.desc)+'</textarea></div>'+
    '<div class="field"><label>Preço da oferta (R$)</label><input id="pr-p" inputmode="decimal" value="'+esc(p.preco)+'"></div>'+
    '<div class="sticky-cta"><button class="btn btn-primary btn-block" data-action="adm-promo-save" data-id="'+(p.id||'')+'">'+(novo?'Criar promoção':'Salvar')+'</button>'+
    (novo?'':'<button class="btn btn-red btn-block" style="margin-top:8px" data-action="adm-promo-rm" data-id="'+p.id+'">Remover</button>')+'</div>';
}

/* Mais */
function admMais(){
  var h='<div class="pagehead"><h2>Mais</h2><p>Configurações e relatórios</p></div>';
  var mods=ADM_MODS.filter(function(m){return modAllowed(m[0]);});
  h+='<div class="mod-grid">'+mods.map(function(m){ return '<button class="modrow" data-action="adm-mais" data-m="'+m[0]+'"><div class="m-ic">'+ic(m[1])+'</div><div><div class="m-t">'+m[2]+'</div><div class="m-s">'+m[3]+'</div></div><div class="m-ch">'+ic('chev')+'</div></button>'; }).join('')+'</div>';
  if(!isAdmin()) h+='<div class="notice info">'+ic('lock')+'<div>Os demais módulos (promoções, pagamentos, relatórios, clientes, equipe, entregas, marca) são exclusivos do dono.</div></div>';
  return h;
}
function admMaisModulo(m){
  var back='<div class="backbar"><button class="backbtn" data-action="adm-mais-back">'+ic('back')+' Voltar</button></div>';
  var fn={promocoes:admPromos,categorias:admCategorias,entregas:admEntregas,horarios:admHorarios,pagamentos:admPagamentos,impressao:admImpressao,relatorios:admRelatorios,clientes:admClientes,equipe:admEquipe,marca:admMarca}[m];
  return back+(fn?fn():'');
}
function admEntregas(){
  var l=S.loja;
  return '<div class="pagehead"><h2>Entregas</h2><p>Taxa e retirada</p></div>'+
    '<div class="card"><div class="field"><label>Taxa de entrega (R$) — fixa para todos os endereços</label><input id="ent-taxa" inputmode="decimal" value="'+esc(l.taxaEntrega)+'"></div>'+
    '<div class="field"><label>Prazo estimado</label><input id="ent-prazo" value="'+esc(l.prazoEntrega||'')+'"></div>'+
    '<div class="bigopt'+(l.retirada?' sel':'')+'" data-action="adm-toggle-retirada"><div class="bo-ic">'+ic('store')+'</div><div><div class="bo-t">Retirada no local</div><div class="bo-s">'+(l.retirada?'Ativada':'Desligada')+'</div></div></div>'+
    '<button class="btn btn-primary btn-block" data-action="adm-save-entregas">Salvar</button></div>'+
    '<div class="notice info">'+ic('info')+'<div>A taxa de entrega é a mesma para qualquer bairro (definição da loja). O cliente digita o bairro manualmente no endereço.</div></div>';
}
function admHorarios(){
  var l=S.loja, js=janelasLoja(), ab=lojaAberta();
  var linhas=js.map(function(w,i){
    return '<div class="field" style="display:flex;gap:8px;align-items:flex-end">'+
      '<div style="flex:1"><label>Abre</label><input type="time" id="jr-a'+i+'" value="'+esc(w[0])+'"></div>'+
      '<div style="flex:1"><label>Fecha</label><input type="time" id="jr-b'+i+'" value="'+esc(w[1])+'"></div>'+
      '<button class="btn btn-ghost" data-action="adm-jan-rm" data-i="'+i+'">Remover</button></div>';
  }).join('');
  return '<div class="pagehead"><h2>Horários</h2></div>'+
    '<div class="notice '+(ab?'info':'warn')+'">'+ic(ab?'checkc':'clock')+'<div>Agora a loja está <strong>'+(ab?'ABERTA':'FECHADA')+'</strong> (horário de Breu Branco/PA). Ela abre e fecha sozinha conforme as janelas abaixo.</div></div>'+
    '<div class="card"><div class="field"><label>Janelas de funcionamento (todos os dias)</label></div><div id="janelas">'+linhas+'</div>'+
    '<button class="btn btn-ghost btn-block" data-action="adm-jan-add">'+ic('plus')+' Adicionar horário</button>'+
    '<div class="sp"></div><button class="btn btn-primary btn-block" data-action="adm-save-horarios">Salvar horários</button></div>'+
    '<div class="bigopt'+(l.pausado?' sel':'')+'" data-action="adm-toggle-pausa"><div class="bo-ic">'+ic(l.pausado?'x':'checkc')+'</div><div><div class="bo-t">'+(l.pausado?'PAUSADA manualmente (fechada)':'Seguindo o horário automático')+'</div><div class="bo-s">'+(l.pausado?'Toque para voltar a abrir no horário':'Toque para fechar agora, mesmo dentro do horário')+'</div></div></div>'+
    '<div class="notice info">'+ic('info')+'<div>Fora do horário, o cliente monta o pedido normalmente, mas ao avançar vê "Infelizmente estamos fechado no momento". A pausa serve pra fechar antes por algum imprevisto.</div></div>';
}
function admPagamentos(){
  var l=S.loja;
  return '<div class="pagehead"><h2>Pagamentos</h2></div>'+
    '<div class="card"><div class="field"><label>Chave Pix</label><input id="pg-key" value="'+esc(l.pixKey)+'"></div>'+
    '<div class="field"><label>Nome do favorecido</label><input id="pg-nome" value="'+esc(l.pixNome)+'"></div>'+
    '<div class="bigopt'+(l.aceitaPix?' sel':'')+'" data-action="adm-toggle-pag" data-k="aceitaPix"><div class="bo-ic">'+ic('pix')+'</div><div><div class="bo-t">Pix com comprovante</div><div class="bo-s">'+(l.aceitaPix?'Aceitando':'Desligado')+'</div></div></div>'+
    '<div class="bigopt'+(l.aceitaDinheiro?' sel':'')+'" data-action="adm-toggle-pag" data-k="aceitaDinheiro"><div class="bo-ic">'+ic('cash')+'</div><div><div class="bo-t">Dinheiro no local</div><div class="bo-s">'+(l.aceitaDinheiro?'Aceitando':'Desligado')+'</div></div></div>'+
    '<div class="bigopt'+(l.aceitaCartao?' sel':'')+'" data-action="adm-toggle-pag" data-k="aceitaCartao"><div class="bo-ic">'+ic('card')+'</div><div><div class="bo-t">Cartão no local</div><div class="bo-s">'+(l.aceitaCartao?'Aceitando':'Desligado')+'</div></div></div>'+
    '<button class="btn btn-primary btn-block" data-action="adm-save-pag">Salvar</button></div>'+
    '<div class="notice info">'+ic('info')+'<div>O sistema nunca guarda dados de cartão. Pix automático (confirmação sozinha) é a próxima fase.</div></div>';
}
function admImpressao(){
  return '<div class="pagehead"><h2>Impressão</h2></div>'+
    '<div class="card"><p class="muted" style="margin-top:0">Teste como o cupom do pedido vai sair na impressora.</p>'+
    '<button class="btn btn-primary btn-block" data-action="adm-test-print">'+ic('printer')+' Imprimir cupom de teste</button></div>'+
    '<div class="notice warn">'+ic('warn')+'<div>Como o celular não confirma se o papel saiu, todo pedido tem "Reimprimir cupom", e a 2ª via vem marcada como REIMPRESSÃO pra não duplicar produção.</div></div>';
}
function admRelatorios(){
  var per=UI.adm.relPer||'tudo';
  var lim = per==='hoje'?0 : per==='7'?7 : per==='30'?30 : null;
  var agora=Date.now();
  var concl=S.pedidos.filter(function(p){ if(p.status!=='concluido') return false;
    if(per==='hoje') return p.dia===hoje();
    if(lim) return (agora-(p.ts||agora))<=lim*86400000;
    return true; });
  var fat=concl.reduce(function(a,p){return a+p.total;},0);
  var ticket=concl.length?fat/concl.length:0;
  var canc=S.pedidos.filter(function(p){return p.status==='recusado'||p.status==='cancelado';});
  var contagem={}; concl.forEach(function(p){ p.itens.forEach(function(i){ contagem[i.nome]=(contagem[i.nome]||0)+i.qty; }); });
  var rank=Object.keys(contagem).map(function(k){return [k,contagem[k]];}).sort(function(a,b){return b[1]-a[1];}).slice(0,5);
  var pag={pix:0,dinheiro:0,cartao:0}; concl.forEach(function(p){ pag[p.pay.metodo]=(pag[p.pay.metodo]||0)+1; });
  var deliv=concl.filter(function(p){return p.tipo==='delivery';}).length, ret=concl.length-deliv;
  var dias=[0,0,0,0,0,0,0]; concl.forEach(function(p){ dias[new Date(p.ts||agora).getDay()]+=p.total; });
  var maxd=Math.max.apply(null,dias.concat([1])); var nomes=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  var h='<div class="pagehead"><h2>Relatórios</h2><p>Só pedidos concluídos</p></div>';
  h+='<div class="filters">'+[['hoje','Hoje'],['7','7 dias'],['30','30 dias'],['tudo','Tudo']].map(function(x){return '<button class="chip'+(per===x[0]?' on':'')+'" data-action="adm-rel-per" data-p="'+x[0]+'">'+x[1]+'</button>';}).join('')+'</div>';
  h+='<div class="kpi-grid">'+kpiPlain(money(fat),'Faturamento','tag',true)+kpiPlain(concl.length,'Pedidos','checkc')+kpiPlain(money(ticket),'Ticket médio','star')+kpiPlain(canc.length,'Recusados/cancel.','x')+'</div>';
  h+='<div class="adm-sec-t">Faturamento por dia</div><div class="card"><div class="chart">'+dias.map(function(v,i){ return '<div class="bar-wrap"><div class="bar" style="height:'+Math.round(v/maxd*100)+'%" title="'+money(v)+'"></div><small>'+nomes[i]+'</small></div>'; }).join('')+'</div>'+(fat===0?'<div class="empty" style="padding:12px">Sem faturamento no período.</div>':'')+'</div>';
  h+='<div class="admin-cols"><div><div class="adm-sec-t">Mais vendidos</div><div class="card">'+(rank.length?rank.map(function(r,i){return '<div class="rank"><span class="rn">'+(i+1)+'</span><div class="rb"><div class="rt">'+esc(r[0])+'</div><div class="rs">'+r[1]+' unidades</div></div></div>';}).join(''):'<div class="empty">Sem dados.</div>')+'</div></div>';
  h+='<div><div class="adm-sec-t">Por pagamento</div><div class="card"><div class="dp-line"><span>Pix</span><strong>'+pag.pix+'</strong></div><div class="dp-line"><span>Dinheiro</span><strong>'+pag.dinheiro+'</strong></div><div class="dp-line"><span>Cartão</span><strong>'+pag.cartao+'</strong></div></div>'+
     '<div class="adm-sec-t">Entrega x Retirada</div><div class="card"><div class="dp-line"><span>Delivery</span><strong>'+deliv+'</strong></div><div class="dp-line"><span>Retirada</span><strong>'+ret+'</strong></div></div></div></div>';
  h+='<div class="adm-sec-t">Recusas e cancelamentos</div><div class="card">'+(canc.length?canc.slice(0,8).map(function(p){return '<div class="dp-line"><span>'+esc(p.id)+' · '+esc(p.dia)+'</span><span>'+esc(p.pay.motivoRecusa||(p.status==='cancelado'?'cancelado':'recusado'))+'</span></div>';}).join(''):'<div class="empty">Nenhuma.</div>')+'</div>';
  return h;
}
function admClientes(){
  var q=(UI.adm.cliQ||'').trim().toLowerCase(), f=UI.adm.cliFilter||'todos';
  var lista=S.clientes.filter(function(c){
    if(q && (c.nome+' '+c.tel).toLowerCase().indexOf(q)<0) return false;
    var s=clienteStats(c.tel);
    if(f==='novos') return c.criadoEm===hoje();
    if(f==='compraram') return s.concl>=1;
    if(f==='recorrentes') return s.concl>=2;
    if(f==='sem') return s.total===0;
    if(f==='bloq') return c.bloq;
    return true;
  });
  var recorrentes=S.clientes.filter(function(c){return clienteStats(c.tel).concl>=2;}).length;
  var h='<div class="pagehead"><h2>Clientes</h2><p>'+S.clientes.length+' na base · '+recorrentes+' recorrentes</p></div>';
  h+='<div class="search">'+ic('search')+'<input placeholder="Buscar por nome ou telefone..." value="'+esc(UI.adm.cliQ||'')+'" data-oninput="cli-busca"></div>';
  h+='<div class="filters">'+[['todos','Todos'],['novos','Novos'],['compraram','Compraram'],['recorrentes','Recorrentes'],['sem','Sem pedidos'],['bloq','Bloqueados']].map(function(x){return '<button class="chip'+(f===x[0]?' on':'')+'" data-action="adm-cli-filter" data-f="'+x[0]+'">'+x[1]+'</button>';}).join('')+'</div>';
  if(!lista.length){ h+='<div class="empty">Nenhum cliente neste filtro.</div>'; return h; }
  h+='<div class="cli-grid">'+lista.map(function(c){ var s=clienteStats(c.tel);
    return '<button class="clirow" data-action="adm-cliente" data-tel="'+esc(c.tel)+'"><div class="cl-av">'+esc((c.nome||'?').charAt(0).toUpperCase())+'</div>'+
      '<div><div class="cl-n">'+esc(c.nome)+(c.bloq?' <span class="tag">bloqueado</span>':'')+'</div><div class="cl-s">'+esc(maskTel(c.tel))+' · '+s.concl+' pedido(s)</div></div>'+
      '<div class="cl-r"><b>'+money(s.gasto)+'</b><div class="muted small2">gasto</div></div></button>';
  }).join('')+'</div>';
  return h;
}
function admEquipe(){
  return '<div class="pagehead"><h2>Equipe</h2><p>Quem acessa o painel</p></div>'+
    S.equipe.map(function(u){ return '<div class="clirow"><div class="cl-av">'+esc(u.nome.charAt(0))+'</div><div><div class="cl-n">'+esc(u.nome)+'</div><div class="cl-s">@'+esc(u.user)+' · '+(u.papel==='admin'?'Dono (acesso total)':'Atendente (pedidos e catálogo do dia)')+'</div></div></div>'; }).join('')+
    '<div class="notice info">'+ic('info')+'<div>Na versão final cada pessoa tem login próprio; o atendente não mexe em Pix, relatórios nem exclui produto. Toda ação fica registrada com data/hora/usuário.</div></div>';
}
function admMarca(){
  var l=S.loja;
  return '<div class="pagehead"><h2>Marca</h2></div>'+
    '<div class="card"><div class="mk-logo-wrap"><img id="mk-logo" src="assets/logo-lirio.png" alt=""><button class="btn btn-outline btn-sm" data-action="adm-trocar-logo">'+ic('camera')+' Trocar logo</button></div>'+
    '<div class="field" style="margin-top:12px"><label>Nome exibido</label><input id="mk-nome" value="'+esc(l.nome)+'"></div>'+
    '<div class="field"><label>Banner promocional (texto)</label><input id="mk-banner" value="'+esc(l.banner)+'" placeholder="Ex.: Peça pelo app e ganhe brinde"></div>'+
    '<div class="field"><label>Endereço</label><input id="mk-end" value="'+esc(l.endereco)+'"></div>'+
    '<div class="field"><label>WhatsApp oficial</label><input id="mk-whats" value="'+esc(l.whats)+'"></div>'+
    '<button class="btn btn-primary btn-block" data-action="adm-save-marca">Salvar</button></div>';
}

/* ============================================================================
   HANDLERS — CLIENTE
   ============================================================================ */
on('cli-go',function(d){ UI.cli.screen=d.s; render(); var sc=document.querySelector('.scroll'); if(sc)sc.scrollTop=0; window.scrollTo(0,0); });
on('cli-search',function(d,t){ UI.cli.q=t.value; var l=$('menu-list'); if(l) l.innerHTML=menuInner(); var cc=$('cli-cats'); if(cc) cc.innerHTML=catsChips(); });
on('cli-cat',function(d){ UI.cli.cat=d.c; UI.cli.q=''; render(); });
on('cli-prod',function(d){ abrirProduto(d.id); });
on('pd-img-nav',function(d){ var p=prod(UI._pdId); if(!p)return; var fotos=prodFotos(p); if(fotos.length<2)return; pdSel.imgIdx=((pdSel.imgIdx||0)+(+d.d)+fotos.length)%fotos.length; var img=$('pd-carimg'); if(img)img.src=fotos[pdSel.imgIdx]; var dots=document.querySelectorAll('.pd-dot'); for(var i=0;i<dots.length;i++) dots[i].classList.toggle('on', i===pdSel.imgIdx); });
on('cart-edit',function(d){ var i=+d.i; var it=UI.cart[i]; if(it) abrirProduto(it.prodId,i); });
on('pd-var',function(d){ pdSel.varIdx=+d.v; patchPd(); });
on('pd-adic',function(d){ var g=+d.g, i=+d.i, dd=+d.d; var p=prod(UI._pdId); if(!p)return; var gr=(p.grupos||[])[g]; if(!gr)return;
  pdSel.g[g]=pdSel.g[g]||{}; var cur=pdSel.g[g][i]||0;
  if(dd>0 && gr.max>0 && grpSum(g)>=gr.max){ toast('Você pode escolher até '+gr.max+' em '+gr.nome,'err'); return; }
  var nv=cur+dd; if(nv<0)nv=0; pdSel.g[g][i]=nv; patchPd(); });
on('pd-qty',function(d){ pdSel.qty=Math.max(1,pdSel.qty+(+d.d)); patchPd(); });
on('pd-obs',function(d,t){ pdSel.obs=t.value; });
function patchPd(){ var p=prod(UI._pdId); if(!p) return; var m=document.querySelector('#modal-root .modal'); if(!m) return;
  m.innerHTML='<div class="modal-grip"></div><button class="modal-x" data-action="close-modal" aria-label="Fechar">'+ic('x')+'</button>'+pdHTML(p); }
on('pd-add',function(d){
  var p=prod(d.id); if(!p) return;
  var vars=pdVars(p), varNome='', inclui=[], base=p.preco;
  if(vars){ if(pdSel.varIdx<0){ toast('Escolha uma opção','err'); return; } var v=vars[pdSel.varIdx]; varNome=v.nome; inclui=v.inclui||[]; base=v.preco; }
  var adics=[];
  (p.grupos||[]).forEach(function(gr,gi){ var sel=pdSel.g[gi]||{}; gr.itens.forEach(function(it,ii){ var q=sel[ii]||0; if(q>0) adics.push({nome:it.nome,preco:it.preco,qty:q}); }); });
  var unit=base+adics.reduce(function(a,x){return a+x.preco*x.qty;},0);
  var item={prodId:p.id,nome:p.nome,cat:p.cat,hue:p.hue,foto:p.foto,base:base,varNome:varNome,inclui:inclui,adics:adics,qty:pdSel.qty,obs:pdSel.obs,preco:unit};
  if(pdSel.edit!=null){ UI.cart[pdSel.edit]=item; toast('Item atualizado','ok'); }
  else { UI.cart.push(item); toast(pdSel.qty+'x '+p.nome+' na sacola','ok'); }
  saveCliente(); closeModal(); render();
});
on('cart-inc',function(d){ UI.cart[+d.i].qty++; saveCliente(); render(); });
on('cart-dec',function(d){ var i=+d.i; if(UI.cart[i].qty>1){ UI.cart[i].qty--; saveCliente(); render(); } else H['cart-rm'](d); });
on('cart-rm',function(d){ var i=+d.i; var it=UI.cart[i]; if(!it) return;
  confirmar('Remover item?','Remover "'+it.nome+'" da sacola?','Remover',function(){ UI.cart.splice(i,1); saveCliente(); render(); toast('Item removido','info'); },true); });
function revalidarCarrinho(){
  var avisos=[];
  for(var i=UI.cart.length-1;i>=0;i--){
    var it=UI.cart[i], p=prod(it.prodId);
    if(!p || p.disp!=='disponivel'){ avisos.push(it.nome+' saiu do catálogo'); UI.cart.splice(i,1); continue; }
    var novo=(it.base||p.preco)+(it.adics||[]).reduce(function(a,x){return a+x.preco*(x.qty||1);},0);
    if(novo!==it.preco){ it.preco=novo; }
  }
  return avisos;
}
on('cart-continuar',function(){
  if(!UI.cart.length){ toast('Sua sacola está vazia','err'); return; }
  var av=revalidarCarrinho();
  if(av.length){ render(); toast(av[0],'info'); if(!UI.cart.length) return; }
  if(S.loja.minPedido>0 && cartSubtotal()<S.loja.minPedido){ toast('Pedido mínimo de '+money(S.loja.minPedido),'err'); render(); return; }
  UI.cli.screen='receber'; render();
});
on('chk-modo',function(d){ UI.chk.modo=d.m; UI.cli.screen=(d.m==='delivery'?'endereco':'dados'); render(); });
on('chk-endsalvo',function(d){ var e=UI.me.enderecos[+d.i]; UI.chk.bairro=e.bairro||''; UI.chk.rua=e.rua||''; UI.chk.numero=e.numero||''; UI.chk.comp=e.comp||''; UI.chk.ref=e.ref||''; render(); });
on('chk-f',function(d,t){ UI.chk[d.k]=t.value; });
on('chk-endok',function(){
  var c=UI.chk;
  if(!(c.bairro||'').trim()){ toast('Informe o bairro','err'); return; }
  if(!(c.rua||'').trim()){ toast('Informe a rua ou avenida','err'); return; }
  if(!(c.numero||'').trim()){ toast('Informe o número','err'); return; }
  if(!(c.ref||'').trim()){ toast('Informe um ponto de referência','err'); return; }
  if(!lojaAberta()){ toast('Infelizmente estamos fechado no momento','err'); return; }
  UI.cli.screen='dados'; render();
});
on('chk-dadosok',function(){
  var c=UI.chk;
  var nome=(c.nome||UI.me.nome||'').trim(), whats=(c.whats||UI.me.tel||'').trim();
  if(!nome){ toast('Informe seu nome','err'); return; }
  if(!telValido(whats)){ toast('Cadastre um WhatsApp válido com DDD — a loja precisa dele pra avisar sobre o pedido','err'); return; }
  c.nome=nome; c.whats=whats;   // fixa os valores (inclusive quando vieram do perfil já cadastrado)
  if(!lojaAberta()){ toast('Infelizmente estamos fechado no momento','err'); return; }
  UI.cli.screen='pagamento'; render();
});
on('chk-pay',function(d){ UI.chk.pay=d.p; render(); });
on('chk-copiapix',function(){ try{ navigator.clipboard.writeText(S.loja.pixKey); }catch(e){} toast('Chave Pix copiada','ok'); });
on('chk-upload',function(){ pickImage(function(u){ UI.chk.comprov=u; render(); toast('Comprovante anexado','ok'); }); });
on('chk-finalizar',function(){
  var c=UI.chk;
  if(!lojaAberta()){ toast('Infelizmente estamos fechado no momento','err'); return; }
  if(!c.pay){ toast('Escolha a forma de pagamento','err'); return; }
  if(c.pay==='pix' && !c.comprov){ toast('Anexe o comprovante do Pix','err'); return; }
  var av=revalidarCarrinho();
  if(av.length){ toast(av[0]+'. Confira a sacola.','err'); UI.cli.screen='carrinho'; render(); return; }
  if(c.modo==='delivery' && c.bairro!=='__outro'){ var b=bairro(c.bairro); if(b&&b.min>0&&cartSubtotal()<b.min){ toast('Pedido mínimo de '+money(b.min)+' para '+c.bairro,'err'); return; } }
  criarPedido();
});
function criarPedido(){
  var c=UI.chk, sub=cartSubtotal(), taxa=c.modo==='delivery'?(S.loja.taxaEntrega||0):0, desc=descontoValor(sub);
  var payMap={pix:'Pix com comprovante',dinheiro:'Dinheiro no local',cartao:'Cartão no local'};
  var status = c.pay==='pix' ? 'em_validacao' : 'aguardando_aceite';
  var endComp = c.modo==='delivery' ? ((c.rua||'')+', '+(c.numero||'')) : '';
  var ped={ id:'#'+(++seedCounter), tel:c.whats, nome:c.nome, tipo:c.modo,
    bairro:c.modo==='delivery'?c.bairro:'', end:endComp, comp:c.comp||'', ref:c.ref||'', entregaSobConsulta:false,
    itens:JSON.parse(JSON.stringify(UI.cart)), subtotal:sub, taxa:taxa, desconto:desc, cupom:(UI.cupom?UI.cupom.code:''), total:sub-desc+taxa, obs:c.obs||'',
    pay:{ metodo:c.pay, label:payMap[c.pay], status:c.pay==='pix'?'enviado':'pendente', comprovante:c.comprov||null, troco:c.troco||'' },
    status:status, criadoEm:nowHM(), dia:hoje(), ts:Date.now(),
    historico:[{t:nowHM(),who:'Cliente',act:'Pedido criado'}], reimpressoes:0 };
  S.pedidos.unshift(ped);
  UI.me.nome=c.nome; UI.me.tel=c.whats;
  if(c.modo==='delivery'&&c.rua){ var ex=(UI.me.enderecos||[]).filter(function(e){return e.rua===c.rua&&e.numero===c.numero;})[0]; if(!ex) UI.me.enderecos.unshift({bairro:c.bairro,rua:c.rua,numero:c.numero,comp:c.comp,ref:c.ref,end:endComp}); }
  upsertCliente(c.whats,c.nome,c.modo==='delivery'?{end:endComp,bairro:c.bairro,rua:c.rua,numero:c.numero,comp:c.comp,ref:c.ref}:null);
  if(CLOUD) cloudCliUpsert();   // sincroniza a conta/endereços do cliente na nuvem
  UI.curOrder=ped.id; UI.cart=[]; UI.cupom=null;
  UI.chk={modo:null,bairro:'',rua:'',numero:'',comp:'',ref:'',nome:c.nome,whats:c.whats,pay:null,troco:'',comprov:null,obs:''};
  UI.cli.screen='confirmado'; save(); render();
}
on('cli-track',function(d){ UI.curOrder=d.id; UI.cli.screen='track'; render(); });
on('cli-repetir',function(d){
  var o=order(d.id); if(!o) return;
  o.itens.forEach(function(i){ UI.cart.push(JSON.parse(JSON.stringify(i))); });
  var av=revalidarCarrinho();
  saveCliente(); UI.cli.screen='home'; render();
  toast(av.length?('Itens adicionados. '+av[0]):'Itens adicionados à sacola','ok');
});
on('cli-cancelar',function(d){
  var o=order(d.id); if(!o) return;
  if(['em_validacao','aguardando_comprovante','aguardando_aceite'].indexOf(o.status)<0){ toast('Não dá mais para cancelar','err'); return; }
  confirmar('Cancelar pedido?','O pedido '+o.id+' será cancelado.','Cancelar pedido',function(){
    o.status='cancelado'; o.historico.unshift({t:nowHM(),who:'Cliente',act:'Cancelou o pedido'}); save(); toast('Pedido cancelado','info'); render();
  },true);
});
on('cli-reenviar',function(d){ var o=order(d.id); if(!o) return; pickImage(function(u){ o.pay.comprovante=u; o.pay.status='enviado'; o.status='em_validacao'; o.historico.unshift({t:nowHM(),who:'Cliente',act:'Reenviou o comprovante'}); save(); toast('Comprovante reenviado','ok'); render(); }); });
on('cli-login-f',function(d,t){ UI.login=UI.login||{}; UI.login[d.k]=t.value; });
on('cli-login',function(){
  var L=UI.login||{}; var nome=(L.nome||'').trim().replace(/\s+/g,' '); var whats=(L.whats||'').trim();
  if(nome.split(' ').length<2 || nome.replace(/\s/g,'').length<3){ toast('Digite seu nome completo (nome e sobrenome)','err'); return; }
  if(!telValido(whats)){ toast('Digite um WhatsApp válido com DDD','err'); return; }
  function entrarNovo(){ UI.me.nome=nome; UI.me.tel=whats; if(!Array.isArray(UI.me.enderecos))UI.me.enderecos=[]; persistLocal(); if(CLOUD) cloudCliUpsert(); UI.login=null; UI.cli.screen='home'; render(); toast('Cadastro feito! Bem-vindo, '+nome.split(' ')[0]+'!','ok'); }
  function entrarExistente(cli){ UI.me.nome=cli.nome||nome; UI.me.tel=whats; UI.me.foto=cli.foto||null; UI.me.enderecos=Array.isArray(cli.enderecos)?cli.enderecos:[]; persistLocal(); UI.login=null; UI.cli.screen='home'; render(); toast('Bem-vindo de volta, '+(UI.me.nome.split(' ')[0])+'!','ok'); }
  if(!CLOUD){ entrarNovo(); return; }
  cloudCliGet(normWhats(whats)).then(function(cli){
    if(cli && (cli.nome||'').trim()){
      if(normNome(cli.nome)===normNome(nome)) entrarExistente(cli);
      else toast('Esse WhatsApp já tem cadastro em outro nome. Confira o nome completo.','err');
    } else entrarNovo();
  });
});
on('cli-logout',function(){ confirmar('Sair da conta?','Seus dados continuam salvos. Você pode entrar de novo com o mesmo WhatsApp e nome.','Sair',function(){ UI.me={nome:'',tel:'',foto:null,enderecos:[]}; UI.cart=[]; UI.login=null; UI.cli.screen='home'; persistLocal(); render(); },false); });
on('me-f',function(d,t){ UI.me[d.k]=t.value; });
on('me-salvar',function(){ saveCliente(); toast('Dados salvos','ok'); render(); });
on('me-foto',function(){ pickImage(function(u){ UI.me.foto=u; saveCliente(); render(); toast('Foto de perfil atualizada','ok'); }); });
on('me-endrm',function(d){ var i=+d.i; confirmar('Remover endereço?','','Remover',function(){ UI.me.enderecos.splice(i,1); saveCliente(); render(); },true); });
on('me-endadd',function(){
  modal('<h2>Novo endereço</h2>'+
    '<div class="field"><label>Bairro *</label><input id="na-bairro" placeholder="Ex.: Centro"></div>'+
    '<div class="field"><label>Rua ou Avenida *</label><input id="na-rua" placeholder="Ex.: Av. Principal"></div>'+
    '<div class="row2"><div class="field"><label>Número *</label><input id="na-num" inputmode="numeric" placeholder="123"></div>'+
    '<div class="field"><label>Complemento</label><input id="na-comp" placeholder="opcional"></div></div>'+
    '<div class="field"><label>Ponto de referência *</label><input id="na-ref" placeholder="Perto de..."></div>'+
    '<div class="sticky-cta"><button class="btn btn-primary btn-block" data-action="me-endsave">Salvar endereço</button></div>');
});
on('me-endsave',function(){
  var bairro=$('na-bairro').value.trim(), rua=$('na-rua').value.trim(), num=$('na-num').value.trim(), ref=$('na-ref').value.trim();
  if(!bairro||!rua||!num||!ref){ toast('Preencha bairro, rua, número e referência','err'); return; }
  UI.me.enderecos.unshift({bairro:bairro,rua:rua,numero:num,comp:$('na-comp').value.trim(),ref:ref,end:rua+', '+num}); saveCliente(); closeModal(); toast('Endereço salvo','ok'); render(); });

/* ============================================================================
   HANDLERS — ADMIN
   ============================================================================ */
function needAdmin(){ if(!isAdmin()){ toast('Sem permissão para esta ação','err'); return false; } return true; }
on('adm-login',function(){
  var u=($('lg-user').value||'').trim().toLowerCase(), p=$('lg-pass').value;
  var acc=S.equipe.filter(function(x){return x.user===u;})[0];
  if(!acc || p!=='1234'){ toast('Usuário ou senha inválidos','err'); return; }
  UI.adm.logged=true; UI.adm.user=acc; UI.adm.tab='visao'; UI.adm.order=null; UI.adm.mais=null;
  audit('Entrou no painel',''); render();
});
on('adm-logout',function(){ UI.adm.logged=false; UI.adm.user=null; UI.adm.order=null; UI.adm.mais=null; render(); });
on('adm-tab',function(d){ UI.adm.tab=d.t; UI.adm.order=null; UI.adm.mais=null; render(); scrollAdmTop(); });
on('adm-kpi',function(d){ UI.adm.tab='pedidos'; UI.adm.filter=d.f; UI.adm.filterTipo='todos'; UI.adm.filterPay='todos'; UI.adm.order=null; UI.adm.mais=null; render(); });
on('adm-filter',function(d){ UI.adm.filter=d.f; render(); });
on('adm-filter-tipo',function(d){ UI.adm.filterTipo=d.f; render(); });
on('adm-filter-pay',function(d){ UI.adm.filterPay=d.f; render(); });
on('adm-open',function(d){ UI.adm.order=d.id; render(); scrollAdmTop(); });
on('adm-back',function(){ UI.adm.order=null; render(); });
on('adm-mais',function(d){ if(!modAllowed(d.m)){ toast('Módulo exclusivo do dono','err'); return; } UI.adm.mais=d.m; render(); scrollAdmTop(); });
on('adm-mais-back',function(){ UI.adm.mais=null; render(); });
function scrollAdmTop(){ var sc=document.querySelector('.adm-scroll'); if(sc)sc.scrollTop=0; }
function addHist(o,act){ o.historico.unshift({t:nowHM(),who:UI.adm.user.nome,act:act}); }
function guard(o,st){ if(!o||st.indexOf(o.status)<0){ toast('Ação indisponível para o estado atual','err'); render(); return false; } return true; }
on('adm-aprovar-pix',function(d){ var o=order(d.id); if(!guard(o,['em_validacao']))return; o.pay.status='aprovado'; o.status='aguardando_aceite'; addHist(o,'Aprovou o Pix'); audit('Aprovou Pix '+o.id,o.id); save(); toast('Pix confirmado. Agora aceite e imprima.','ok'); render(); });
on('adm-solicitar-comprov',function(d){ var o=order(d.id); if(!guard(o,['em_validacao']))return; o.status='aguardando_comprovante'; o.pay.status='pendente'; addHist(o,'Pediu novo comprovante'); save(); toast('Cliente vai poder reenviar o comprovante','info'); render(); });
on('adm-recusar',function(d){ var o=order(d.id); if(!guard(o,['em_validacao','aguardando_comprovante','aguardando_aceite']))return; pedirMotivo('Recusar pedido',['Comprovante ilegível','Valor divergente','Fora da área de entrega','Produto indisponível'],function(m){ o.status='recusado'; o.pay.motivoRecusa=m; addHist(o,'Recusou: '+m); audit('Recusou '+o.id,o.id); save(); toast('Pedido recusado','err'); render(); }); });
on('adm-aceitar',function(d){ var o=order(d.id); if(!guard(o,['aguardando_aceite']))return; o.status='em_preparo'; o.reimpressoes=0; addHist(o,'Aceitou e imprimiu o cupom'); audit('Aceitou '+o.id,o.id); save(); abrirCupom(o,false); toast('Pedido aceito. Foi para o preparo.','ok'); });
on('adm-reimprimir',function(d){ var o=order(d.id); if(!o)return; o.reimpressoes=(o.reimpressoes||0)+1; addHist(o,'Reimprimiu (via '+(o.reimpressoes+1)+')'); save(); abrirCupom(o,true); });
on('adm-pronto',function(d){ var o=order(d.id); if(!guard(o,['em_preparo']))return; o.status='pronto'; addHist(o,'Marcou como pronto'); save(); toast('Pedido pronto','ok'); render(); });
on('adm-saiu',function(d){ var o=order(d.id); if(!guard(o,['pronto']))return; if(o.tipo!=='delivery'){ toast('Retirada não sai para entrega','err'); return; } o.status='saiu'; addHist(o,'Saiu para entrega'); save(); toast('Saiu para entrega','ok'); render(); });
on('adm-concluir',function(d){ var o=order(d.id); if(!guard(o,['pronto','saiu']))return; o.status='concluido'; if(o.pay.metodo!=='pix')o.pay.status='recebido'; addHist(o,'Concluiu o pedido'); audit('Concluiu '+o.id,o.id); save(); toast('Pedido concluído','ok'); render(); });
on('adm-cancelar-admin',function(d){ if(!needAdmin())return; var o=order(d.id); if(!guard(o,['em_preparo','pronto']))return; pedirMotivo('Cancelar pedido (dono)',['Cliente desistiu','Sem insumo','Erro no pedido','Fora de área'],function(m){ o.status='cancelado'; o.pay.motivoRecusa=m; addHist(o,'Dono cancelou: '+m); audit('Cancelou '+o.id,o.id); save(); toast('Pedido cancelado','info'); render(); }); });
function pedirMotivo(titulo,ops,cb){
  modal('<h2>'+esc(titulo)+'</h2><p style="color:var(--text2)">Escolha ou escreva o motivo (vai para o cliente).</p>'+
    ops.map(function(o){return '<div class="bigopt" data-mot="'+esc(o)+'"><div class="bo-ic">'+ic('dot')+'</div><div class="bo-t">'+esc(o)+'</div></div>';}).join('')+
    '<div class="field"><label>Outro motivo</label><input id="mot-outro" placeholder="Escreva..."></div>'+
    '<div class="sticky-cta"><button class="btn btn-red btn-block" id="mot-ok">Confirmar</button></div>',true);
  var sel='', root=$('modal-root');
  root.querySelectorAll('[data-mot]').forEach(function(el){ el.onclick=function(){ sel=el.getAttribute('data-mot'); root.querySelectorAll('[data-mot]').forEach(function(x){x.classList.remove('sel');}); el.classList.add('sel'); }; });
  $('mot-ok').onclick=function(){ var m=($('mot-outro').value||'').trim()||sel; if(!m){ toast('Escolha um motivo','err'); return; } closeModal(); cb(m); };
}
/* catálogo */
on('adm-novo-produto',function(){ if(!needAdmin())return; openProdForm(null); });
on('adm-edit-produto',function(d){ if(!needAdmin())return; openProdForm(prod(d.id)); });
on('adm-toggle-disp',function(d){ var p=prod(d.id); p.disp=(p.disp==='disponivel')?'esgotado':'disponivel'; audit((p.disp==='esgotado'?'Esgotou ':'Reativou ')+p.nome,''); save(); toast(p.nome+' · '+(p.disp==='disponivel'?'disponível':'esgotado'),'info'); render(); });
function openProdForm(p){
  UI.adm._pedit = p ? JSON.parse(JSON.stringify(p)) : {nome:'',desc:'',preco:'',cat:S.categorias[0].id,hue:20,disp:'disponivel',foto:null,fotos:[],ordem:S.produtos.length,variacoes:[],grupos:[]};
  if(!UI.adm._pedit.variacoes) UI.adm._pedit.variacoes=[];
  if(!UI.adm._pedit.grupos) UI.adm._pedit.grupos=[];
  if(!UI.adm._pedit.fotos||!UI.adm._pedit.fotos.length) UI.adm._pedit.fotos = UI.adm._pedit.foto ? [UI.adm._pedit.foto] : [];
  UI.adm._pedit._id = p?p.id:null;
  modal(prodFormHTML());
}
function captureProdForm(){
  var e=UI.adm._pedit; if(!e) return;
  if($('pf-nome'))e.nome=$('pf-nome').value; if($('pf-desc'))e.desc=$('pf-desc').value;
  if($('pf-preco'))e.preco=$('pf-preco').value; if($('pf-cat'))e.cat=$('pf-cat').value;
  if($('pf-disp'))e.disp=$('pf-disp').value; if($('pf-ordem'))e.ordem=parseInt($('pf-ordem').value,10)||0;
}
function admFormProduto(p){ openProdForm(p); return ''; }
function prodFormHTML(){
  var p=UI.adm._pedit, novo=!p._id;
  var cats=S.categorias.map(function(c){return '<option value="'+c.id+'"'+(p.cat===c.id?' selected':'')+'>'+esc(c.nome)+'</option>';}).join('');
  var vars=(p.variacoes||[]).map(function(v,i){ return '<div class="opt sel nohover"><span class="oname">'+esc(v.nome)+(v.inclui&&v.inclui.length?' <span class="muted small2">(inclui '+esc(v.inclui.join(', '))+')</span>':'')+'</span><span class="oprice">'+money(v.preco)+'</span><button class="ci-trash sm" data-action="pf-rm-var" data-i="'+i+'" aria-label="Remover">'+ic('trash')+'</button></div>'; }).join('');
  var grupos=(p.grupos||[]).map(function(g,gi){
    var itens=(g.itens||[]).map(function(it,ii){ return '<div class="opt sel nohover"><span class="oname">'+esc(it.nome)+'</span><span class="oprice">+ '+money(it.preco)+'</span><button class="ci-trash sm" data-action="pf-rm-gitem" data-g="'+gi+'" data-i="'+ii+'" aria-label="Remover">'+ic('trash')+'</button></div>'; }).join('');
    return '<div class="soft"><div class="soft-head"><strong>'+esc(g.nome)+(g.max>0?' <span class="muted small2">(até '+g.max+')</span>':'')+'</strong><button class="ci-trash sm" data-action="pf-rm-grupo" data-g="'+gi+'" aria-label="Remover">'+ic('trash')+'</button></div>'+(itens||'<div class="muted small2 mb6">Sem itens</div>')+'<button class="btn btn-ghost btn-sm btn-block" data-action="pf-add-gitem" data-g="'+gi+'">'+ic('plus')+' Item</button></div>';
  }).join('');
  return '<h2>'+(novo?'Novo produto':'Editar produto')+'</h2>'+
    '<div class="field"><label>Fotos do produto (até 5)</label><div class="pf-gallery">'+
      (p.fotos||[]).map(function(f,i){ return '<div class="pf-thumb"><img src="'+f+'" alt="">'+(i===0?'<span class="pf-capa">Capa</span>':'')+'<button class="pf-thumb-rm" data-action="pf-rm-foto" data-i="'+i+'" aria-label="Remover foto">'+ic('x')+'</button></div>'; }).join('')+
      ((p.fotos||[]).length<5?'<button class="pf-thumb pf-add" data-action="pf-foto" aria-label="Adicionar foto">'+ic('camera')+'<span>Foto</span></button>':'')+
    '</div><div class="muted small2">A 1ª foto é a capa. No catálogo, o cliente passa as fotos pelas setas.</div></div>'+
    '<div class="field"><label>Nome</label><input id="pf-nome" value="'+esc(p.nome)+'"></div>'+
    '<div class="field"><label>Descrição</label><textarea id="pf-desc">'+esc(p.desc)+'</textarea></div>'+
    '<div class="row2"><div class="field"><label>Preço base (R$)</label><input id="pf-preco" inputmode="decimal" value="'+esc(p.preco)+'"></div>'+
    '<div class="field"><label>Categoria</label><select id="pf-cat">'+cats+'</select></div></div>'+
    '<div class="row2"><div class="field"><label>Disponibilidade</label><select id="pf-disp">'+
      '<option value="disponivel"'+(p.disp==='disponivel'?' selected':'')+'>Disponível agora</option>'+
      '<option value="esgotado"'+(p.disp==='esgotado'?' selected':'')+'>Esgotado hoje</option>'+
      '<option value="oculto"'+(p.disp==='oculto'?' selected':'')+'>Oculto (rascunho)</option></select></div>'+
    '<div class="field"><label>Ordem</label><input id="pf-ordem" inputmode="numeric" value="'+esc(p.ordem)+'"></div></div>'+
    '<div class="field"><label>Opções (ex.: Simples / Completo)</label>'+(vars||'<div class="muted small2 mb6">Nenhuma — usa o preço base.</div>')+'<button class="btn btn-ghost btn-sm btn-block" data-action="pf-add-var">'+ic('plus')+' Opção</button></div>'+
    '<div class="field"><label>Grupos de adicionais</label>'+(grupos||'<div class="muted small2 mb6">Nenhum</div>')+'<button class="btn btn-ghost btn-sm btn-block" data-action="pf-add-grupo">'+ic('plus')+' Grupo de adicionais</button></div>'+
    '<div class="sticky-cta"><button class="btn btn-primary btn-block" data-action="pf-save">'+(novo?'Publicar produto':'Salvar alterações')+'</button>'+
    (novo?'':'<div class="row2" style="margin-top:8px"><button class="btn btn-ghost" data-action="pf-dup">Duplicar</button><button class="btn btn-red" data-action="pf-arquivar">Arquivar</button></div>')+'</div>';
}
on('pf-foto',function(){ captureProdForm(); var e=UI.adm._pedit; if(!e.fotos)e.fotos=e.foto?[e.foto]:[]; if(e.fotos.length>=5){ toast('Máximo de 5 fotos','err'); return; } pickImage(function(u){ e.fotos.push(u); e.foto=e.fotos[0]; modal(prodFormHTML()); toast('Foto adicionada','ok'); }); });
on('pf-rm-foto',function(d){ captureProdForm(); var e=UI.adm._pedit; if(!e.fotos)e.fotos=e.foto?[e.foto]:[]; e.fotos.splice(+d.i,1); e.foto=e.fotos[0]||null; modal(prodFormHTML()); toast('Foto removida','info'); });
on('pf-add-var',function(){ captureProdForm(); modal('<h2>Nova opção</h2><div class="field"><label>Nome</label><input id="v-nome" placeholder="Ex.: Completo"></div><div class="field"><label>Preço (R$)</label><input id="v-preco" inputmode="decimal" value="0"></div><div class="field"><label>Acompanha (separado por vírgula, opcional)</label><input id="v-incl" placeholder="Arroz, Feijão, Macaxeira, Vinagrete"></div><div class="sticky-cta"><button class="btn btn-primary btn-block" data-action="pf-add-var-ok">Adicionar</button></div>',true); });
on('pf-add-var-ok',function(){ var n=$('v-nome').value.trim(); if(!n){ toast('Informe o nome','err'); return; } var incl=($('v-incl').value||'').split(',').map(function(s){return s.trim();}).filter(Boolean); UI.adm._pedit.variacoes.push({nome:n,preco:parseFloat(String($('v-preco').value).replace(',','.'))||0,inclui:incl}); modal(prodFormHTML()); });
on('pf-rm-var',function(d){ captureProdForm(); UI.adm._pedit.variacoes.splice(+d.i,1); modal(prodFormHTML()); });
on('pf-add-grupo',function(){ captureProdForm(); modal('<h2>Grupo de adicionais</h2><div class="field"><label>Nome do grupo</label><input id="g-nome" placeholder="Ex.: Adicionais, Molhos"></div><div class="field"><label>Escolha até (0 = sem limite)</label><input id="g-max" inputmode="numeric" value="0"></div><div class="sticky-cta"><button class="btn btn-primary btn-block" data-action="pf-add-grupo-ok">Criar grupo</button></div>',true); });
on('pf-add-grupo-ok',function(){ var n=$('g-nome').value.trim(); if(!n){ toast('Informe o nome','err'); return; } UI.adm._pedit.grupos.push({nome:n,max:parseInt($('g-max').value,10)||0,itens:[]}); modal(prodFormHTML()); });
on('pf-rm-grupo',function(d){ captureProdForm(); UI.adm._pedit.grupos.splice(+d.g,1); modal(prodFormHTML()); });
on('pf-add-gitem',function(d){ captureProdForm(); UI.adm._pedit._gi=+d.g; modal('<h2>Novo adicional</h2><div class="field"><label>Nome</label><input id="gi-nome" placeholder="Ex.: Bacon extra"></div><div class="field"><label>Preço (R$)</label><input id="gi-preco" inputmode="decimal" value="0"></div><div class="sticky-cta"><button class="btn btn-primary btn-block" data-action="pf-add-gitem-ok">Adicionar</button></div>',true); });
on('pf-add-gitem-ok',function(){ var gi=UI.adm._pedit._gi, g=UI.adm._pedit.grupos[gi]; if(!g)return; var n=$('gi-nome').value.trim(); if(!n){ toast('Informe o nome','err'); return; } g.itens.push({nome:n,preco:parseFloat(String($('gi-preco').value).replace(',','.'))||0}); modal(prodFormHTML()); });
on('pf-rm-gitem',function(d){ captureProdForm(); var g=UI.adm._pedit.grupos[+d.g]; if(g)g.itens.splice(+d.i,1); modal(prodFormHTML()); });
on('pf-save',function(){
  captureProdForm(); var e=UI.adm._pedit;
  if(!(e.nome||'').trim()){ toast('Informe o nome','err'); return; }
  e.preco=parseFloat(String(e.preco).replace(',','.'))||0;
  e.fotos=e.fotos||[]; e.foto=e.fotos[0]||null;
  if(e._id){ var p=prod(e._id); ['nome','desc','preco','cat','disp','foto','fotos','ordem','variacoes','grupos'].forEach(function(k){p[k]=e[k];}); audit('Editou '+e.nome,''); }
  else { S.produtos.push({id:uid('p'),nome:e.nome,desc:e.desc,preco:e.preco,cat:e.cat,disp:e.disp,foto:e.foto,fotos:e.fotos,hue:20,ordem:e.ordem||S.produtos.length,variacoes:e.variacoes||[],grupos:e.grupos||[]}); audit('Criou '+e.nome,''); }
  save(); closeModal(); toast('Produto salvo','ok'); render();
});
on('pf-dup',function(){ var e=UI.adm._pedit; if(!e._id)return; var p=prod(e._id); var c=JSON.parse(JSON.stringify(p)); c.id=uid('p'); c.nome=p.nome+' (cópia)'; S.produtos.push(c); save(); closeModal(); toast('Produto duplicado','ok'); render(); });
on('pf-arquivar',function(){ var e=UI.adm._pedit; if(!e._id)return; var p=prod(e._id); confirmar('Arquivar produto?','"'+p.nome+'" some do catálogo (histórico é preservado).','Arquivar',function(){ p.disp='oculto'; audit('Arquivou '+p.nome,''); save(); closeModal(); toast('Produto arquivado','info'); render(); },true); });
/* promoções */
on('adm-promo-novo',function(){ if(!needAdmin())return; modal(promoForm(null)); });
on('adm-promo-edit',function(d){ if(!needAdmin())return; var p=(S.promos||[]).filter(function(x){return x.id===d.id;})[0]; modal(promoForm(p)); });
on('adm-promo-save',function(d){
  var t=$('pr-t').value.trim(); if(!t){ toast('Informe o título','err'); return; }
  var desc=$('pr-d').value.trim(), preco=parseFloat(String($('pr-p').value).replace(',','.'))||0;
  if(d.id){ var p=(S.promos||[]).filter(function(x){return x.id===d.id;})[0]; p.titulo=t; p.desc=desc; p.preco=preco; }
  else { S.promos.push({id:uid('promo'),titulo:t,desc:desc,preco:preco,ativo:true}); }
  audit('Salvou promoção '+t,''); save(); closeModal(); render(); toast('Promoção salva','ok');
});
on('adm-promo-toggle',function(d){ var p=(S.promos||[]).filter(function(x){return x.id===d.id;})[0]; if(p){ p.ativo=!p.ativo; save(); render(); } });
on('adm-promo-rm',function(d){ confirmar('Remover promoção?','','Remover',function(){ S.promos=S.promos.filter(function(x){return x.id!==d.id;}); save(); closeModal(); render(); toast('Promoção removida','info'); },true); });
/* categorias */
on('cat-add',function(){ if(!needAdmin())return; modal('<h2>Nova categoria</h2><div class="field"><label>Nome</label><input id="ct-nome" placeholder="Ex.: Promoções"></div><div class="sticky-cta"><button class="btn btn-primary btn-block" data-action="cat-add-ok">Criar</button></div>',true); });
on('cat-add-ok',function(){ var n=$('ct-nome').value.trim(); if(!n){ toast('Informe o nome','err'); return; } S.categorias.push({id:uid('cat'),nome:n,ordem:S.categorias.length+1,oculta:false}); save(); closeModal(); render(); toast('Categoria criada','ok'); });
on('cat-ren',function(d){ if(!needAdmin())return; var c=cat(d.id); modal('<h2>Renomear categoria</h2><div class="field"><label>Nome</label><input id="ct-nome" value="'+esc(c.nome)+'"></div><div class="sticky-cta"><button class="btn btn-primary btn-block" data-action="cat-ren-ok" data-id="'+d.id+'">Salvar</button></div>',true); });
on('cat-ren-ok',function(d){ var c=cat(d.id); var n=$('ct-nome').value.trim(); if(!n){ toast('Informe o nome','err'); return; } c.nome=n; save(); closeModal(); render(); toast('Categoria renomeada','ok'); });
on('cat-up',function(d){ moveCat(d.id,-1); });
on('cat-down',function(d){ moveCat(d.id,1); });
function moveCat(id,dir){ var cs=catsOrd(); var i=cs.findIndex(function(c){return c.id===id;}); var j=i+dir; if(j<0||j>=cs.length)return; var t=cs[i].ordem; cs[i].ordem=cs[j].ordem; cs[j].ordem=t; save(); render(); }
on('cat-oculta',function(d){ var c=cat(d.id); c.oculta=!c.oculta; save(); render(); });
/* entregas/horários/pagamentos */
on('adm-save-entregas',function(){ if(!needAdmin())return; S.loja.taxaEntrega=parseFloat(String($('ent-taxa').value).replace(',','.'))||0; S.loja.prazoEntrega=$('ent-prazo').value; save(); toast('Entregas salvas','ok'); });
on('adm-toggle-retirada',function(){ S.loja.retirada=!S.loja.retirada; render(); });
on('adm-toggle-pausa',function(){ if(!needAdmin())return; S.loja.pausado=!S.loja.pausado; save(); toast(S.loja.pausado?'Loja pausada (fechada agora)':'Loja voltou ao horário automático', S.loja.pausado?'info':'ok'); render(); });
function _janelasAtuais(){ var js=(S.loja.janelas&&S.loja.janelas.length)?S.loja.janelas:DEFAULT_JANELAS; return js.map(function(w){return [w[0],w[1]];}); }
on('adm-jan-add',function(){ if(!needAdmin())return; var js=_janelasAtuais(); js.push(['18:00','23:00']); S.loja.janelas=js; render(); });
on('adm-jan-rm',function(d){ if(!needAdmin())return; var js=_janelasAtuais(); js.splice(+d.i,1); S.loja.janelas=js; render(); });
on('adm-save-horarios',function(){ if(!needAdmin())return; var js=[]; for(var i=0;;i++){ var a=$('jr-a'+i), b=$('jr-b'+i); if(!a||!b) break; if(a.value&&b.value) js.push([a.value,b.value]); } if(!js.length){ toast('Adicione pelo menos uma janela de horário','err'); return; } S.loja.janelas=js; S.loja.horario=fmtJanelas(js); save(); toast('Horários salvos','ok'); render(); });
on('adm-toggle-pag',function(d){ S.loja[d.k]=!S.loja[d.k]; render(); });
on('adm-save-pag',function(){ if(!needAdmin())return; S.loja.pixKey=$('pg-key').value; S.loja.pixNome=$('pg-nome').value; save(); toast('Pagamentos salvos','ok'); });
on('adm-test-print',function(){ var demo={id:'#TESTE',dia:hoje(),criadoEm:nowHM(),tipo:'delivery',nome:'Cliente Teste',tel:'(00) 00000-0000',end:'Rua de Teste, 1',bairro:'Centro',entregaSobConsulta:false,itens:[{qty:2,nome:'Buquê de Rosas',preco:8,adic:[],obs:'',opc:{}}],total:16,subtotal:16,pay:{label:'Pix',troco:''},obs:''}; abrirCupom(demo,false); });
on('adm-rel-per',function(d){ UI.adm.relPer=d.p; render(); });
/* clientes */
on('cli-busca',function(d,t){ UI.adm.cliQ=t.value; var sc=document.querySelector('.adm-scroll'); var st=sc?sc.scrollTop:0; render(); sc=document.querySelector('.adm-scroll'); if(sc)sc.scrollTop=st; var inp=document.querySelector('[data-oninput="cli-busca"]'); if(inp){ var v=inp.value; inp.focus(); inp.value=''; inp.value=v; } });
on('adm-cli-filter',function(d){ UI.adm.cliFilter=d.f; render(); });
on('adm-cliente',function(d){
  var c=S.clientes.filter(function(x){return x.tel===d.tel;})[0]; if(!c)return;
  var s=clienteStats(c.tel), pedidos=S.pedidos.filter(function(p){return p.tel===c.tel;});
  modal('<h2>'+esc(c.nome)+'</h2><p class="muted mt0">'+esc(c.tel)+' · desde '+esc(c.criadoEm)+(c.bloq?' · <span class="err-txt">bloqueado</span>':'')+'</p>'+
    '<div class="kpi-grid"><div class="kpi hl"><div class="k-n">'+s.concl+'</div><div class="k-l">Pedidos</div></div>'+
    '<div class="kpi"><div class="k-n sm">'+money(s.gasto)+'</div><div class="k-l">Total gasto</div></div>'+
    '<div class="kpi"><div class="k-n sm">'+money(s.ticket)+'</div><div class="k-l">Ticket médio</div></div>'+
    '<div class="kpi"><div class="k-n">'+(c.enderecos.length)+'</div><div class="k-l">Endereços</div></div></div>'+
    '<div class="adm-sec-t">Últimos pedidos</div>'+(pedidos.length?pedidos.slice(0,5).map(function(p){return '<div class="dp-line"><span>'+esc(p.id)+' · '+esc(p.dia)+'</span><strong>'+money(p.total)+' · '+esc(statusCliente(p).lbl)+'</strong></div>';}).join(''):'<div class="empty">Sem pedidos.</div>')+
    '<a class="btn btn-outline btn-block" style="margin-top:12px;text-decoration:none" href="https://wa.me/55'+c.tel.replace(/\D/g,'')+'" target="_blank" rel="noopener">'+ic('chat')+' WhatsApp</a>'+
    (isAdmin()?'<button class="btn '+(c.bloq?'btn-ghost':'btn-red')+' btn-block" style="margin-top:8px" data-action="adm-cli-bloq" data-tel="'+esc(c.tel)+'">'+(c.bloq?'Desbloquear cliente':'Bloquear novos pedidos')+'</button>':''),true);
});
on('adm-cli-bloq',function(d){ if(!needAdmin())return; var c=S.clientes.filter(function(x){return x.tel===d.tel;})[0]; if(!c)return;
  if(c.bloq){ c.bloq=false; audit('Desbloqueou cliente '+c.nome,''); save(); closeModal(); render(); toast('Cliente desbloqueado','ok'); }
  else pedirMotivo('Bloquear cliente',['Golpe/comprovante falso','Trote recorrente','Comportamento abusivo'],function(m){ c.bloq=true; c.obsInterna=m; audit('Bloqueou cliente '+c.nome+': '+m,''); save(); closeModal(); render(); toast('Cliente bloqueado','info'); }); });
/* marca */
on('adm-trocar-logo',function(){ pickImage(function(u){ var im=$('mk-logo'); if(im)im.src=u; toast('Logo atualizada (visual)','ok'); }); });
on('adm-save-marca',function(){ if(!needAdmin())return; S.loja.nome=$('mk-nome').value; S.loja.banner=$('mk-banner').value; S.loja.endereco=$('mk-end').value; S.loja.whats=$('mk-whats').value; save(); toast('Marca salva','ok'); });

/* ============================================================================
   UPLOAD DE IMAGEM
   ============================================================================ */
function pickImage(cb){
  var inp=$('filepick'); inp.value='';
  inp.onchange=function(){ var f=inp.files[0]; if(!f) return;
    var r=new FileReader();
    r.onload=function(ev){ var img=new Image();
      img.onload=function(){ var max=900,w=img.width,h=img.height;
        if(w>h&&w>max){ h=h*max/w; w=max; } else if(h>max){ w=w*max/h; h=max; }
        var cv=$('imgcanvas'); cv.width=w; cv.height=h; cv.getContext('2d').drawImage(img,0,0,w,h); cb(cv.toDataURL('image/jpeg',0.75));
      };
      img.src=ev.target.result;
    };
    r.readAsDataURL(f);
  };
  inp.click();
}

/* ============================================================================
   TROCA DE APP (Cliente/Dono) + INIT
   ============================================================================ */
function initUI(){
  UI={ app:APP_MODE, cli:{screen:'home',cat:'Todos',q:''},
    chk:{modo:null,bairro:'',rua:'',numero:'',comp:'',ref:'',nome:'',whats:'',pay:null,troco:'',comprov:null,obs:''}, cupom:null,
    cart:[], login:null, me:{nome:'',tel:'',foto:null,enderecos:[]},
    curOrder:null, _pdId:null,
    adm:{logged:false,user:null,tab:'visao',filter:'todos',filterTipo:'todos',filterPay:'todos',order:null,mais:null,relPer:'tudo',cliQ:'',cliFilter:'todos',_pedit:null} };
}
function boot(){
  initUI(); seed();
  var restored=load();
  if(restored){ var maxN=100; S.pedidos.forEach(function(p){ var n=parseInt(String(p.id).replace('#',''),10); if(n>maxN)maxN=n; }); seedCounter=maxN; }
  try{ lastRev=localStorage.getItem(REVKEY); }catch(e){}
  render();
}
/* Sincronização entre abas E apps instalados (PWA): storage + BroadcastChannel + polling + foco/visibilidade.
   O polling (a cada 1.5s) garante o sync mesmo no PWA, onde o evento 'storage' não cruza a janela. */
/* ---- nuvem (Supabase): estado compartilhado entre todos os aparelhos ---- */
function cloudPush(){
  if(!sb) return;
  lastRev = String(Date.now())+'-'+Math.floor(Math.random()*1e6);
  sb.from('estado').upsert({id:1,data:S,rev:lastRev,updated_at:new Date().toISOString()}).then(function(r){ if(r&&r.error) console.warn('Lírio cloud push:', r.error.message); });
}
function aplicarNuvem(row){
  if(!row||!row.rev||row.rev===lastRev) return false;
  if(!row.data||!row.data.produtos) return false;
  lastRev=row.rev; S=row.data; if(!S.promos)S.promos=[];
  var maxN=100; S.pedidos.forEach(function(p){ var n=parseInt(String(p.id).replace('#',''),10); if(n>maxN)maxN=n; }); if(maxN>seedCounter)seedCounter=maxN;
  return true;
}
function cloudPull(){
  if(!sb) return Promise.resolve();
  return sb.from('estado').select('data,rev').eq('id',1).single().then(function(r){ if(r&&r.data&&aplicarNuvem(r.data)) render(); }).catch(function(){});
}
function cloudSubscribe(){ if(!sb) return; try{ sb.channel('estado-rt').on('postgres_changes',{event:'*',schema:'public',table:'estado'}, function(){ cloudPull(); }).subscribe(); }catch(e){} }
function cloudBoot(){
  initUI(); seed(); load(); render();   // pinta na hora com cache local; a nuvem sobrescreve em seguida
  refreshCliente();   // puxa a conta/endereços do cliente logado (ou cria a linha se ainda não existir)
  sb.from('estado').select('data,rev').eq('id',1).single().then(function(r){
    if(r&&r.data&&r.data.data&&r.data.data.produtos){ if(aplicarNuvem(r.data)) render(); }
    else { cloudPush(); }   // nuvem vazia -> sobe o catálogo atual
  }).catch(function(e){ console.warn('Lírio cloud boot:', e&&e.message); });
  cloudSubscribe();
  setInterval(cloudPull, 5000);   // reforço caso o tempo-real caia
}

if(CLOUD){
  cloudBoot();
  window.addEventListener('focus', function(){ cloudPull(); refreshCliente(); });
  if(typeof document!=='undefined') document.addEventListener('visibilitychange', function(){ if(!document.hidden){ cloudPull(); refreshCliente(); } });
} else {
  if(bc){ bc.onmessage=function(ev){ if(ev&&ev.data&&ev.data!==lastRev){ lastRev=ev.data; if(reloadShared()) render(); } }; }
  window.addEventListener('storage', function(e){ if(e.key===LSKEY||e.key===REVKEY) syncCheck(); });
  window.addEventListener('focus', syncCheck);
  if(typeof document!=='undefined') document.addEventListener('visibilitychange', function(){ if(!document.hidden) syncCheck(); });
  setInterval(syncCheck, 1000);
  boot();
}
if(typeof window!=='undefined') setInterval(clockWatch, 30000);   // vira Aberto/Fechado sozinho ao cruzar o horário
