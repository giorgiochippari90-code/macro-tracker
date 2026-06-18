import { useState, useCallback, useRef, useEffect } from "react";

const C = {
  bg:"#f5f5f0",surface:"#ffffff",surface2:"#f0efe8",
  border:"#e2e0d8",
  lime:"#5a8a00",limeLight:"#e8f5c0",
  blue:"#1a6fa8",blueLight:"#ddeef8",
  amber:"#b85c00",amberLight:"#fdecd8",
  pink:"#b5006e",pinkLight:"#fce4f0",
  red:"#cc2200",
  text:"#1a1a18",muted:"#6b6960",mutedLight:"#a8a59c",
};

const CAT_ORDER  = ["colazione","spuntino_m","pranzo","spuntino_p","cena"];
const CAT_LABELS = {
  colazione:"☕ Colazione",spuntino_m:"🍎 Spuntino mattina",
  pranzo:"🥗 Pranzo",spuntino_p:"🥜 Spuntino pomeriggio",cena:"🍽️ Cena",
};

const ACTIVITY_OPTIONS = [
  {id:"rest",  label:"🛋️ Riposo",        desc:"Solo 3-4k passi quotidiani.",                     pal:1.32,extraKcal:0},
  {id:"gym",   label:"🏋️ Palestra pesi", desc:"Allenamento pesi 60-75 min (~500 kcal nette).",   pal:1.50,extraKcal:500},
  {id:"walk",  label:"🚶 Camminata",      desc:"40 min, pendenza 6%, 5.5 km/h (~420 kcal nette).",pal:1.46,extraKcal:420},
];

const DEFAULT_PROFILE = {peso:82.7,altezza:175,eta:35,pgc:18.7,sesso:"M"};
function getProfile(){ try{return{...DEFAULT_PROFILE,...JSON.parse(localStorage.getItem("profile")||"{}")}}catch{return DEFAULT_PROFILE;}}
function saveProfile(p){localStorage.setItem("profile",JSON.stringify(p));}
function calcBMR(p){const b=10*p.peso+6.25*p.altezza-5*p.eta;return Math.round(p.sesso==="M"?b+5:b-161);}
function calcLBM(p){return+(p.peso*(1-p.pgc/100)).toFixed(1);}
function calcTargets(actId,goal,prof){
  const p=prof||getProfile(),act=ACTIVITY_OPTIONS.find(a=>a.id===actId)||ACTIVITY_OPTIONS[0];
  const bmr=calcBMR(p),lbm=calcLBM(p),tdee=Math.round(bmr*act.pal);
  const delta=goal==="deficit"?-350:goal==="surplus"?+250:0;
  const kcal=tdee+delta,prot=Math.round(lbm*2.2);
  const f=Math.round(kcal*0.28/9),c=Math.round((kcal-prot*4-f*9)/4);
  return{bmr,lbm,tdee,kcal,p:prot,c,f,extraKcal:act.extraKcal};
}

function todayStr(){return new Date().toISOString().slice(0,10);}
function getLog(d){try{return JSON.parse(localStorage.getItem("log_"+d)||"[]");}catch{return[];}}
function saveLog(d,e){localStorage.setItem("log_"+d,JSON.stringify(e));}
function getActivity(d){return localStorage.getItem("act_"+d)||"rest";}
function saveActivity(d,a){localStorage.setItem("act_"+d,a);}
function getGoal(){return localStorage.getItem("goal")||"deficit";}
function saveGoal(g){localStorage.setItem("goal",g);}
function getUserDB(){try{return JSON.parse(localStorage.getItem("userDB")||"{}");}catch{return{};}}
function saveUserDB(db){localStorage.setItem("userDB",JSON.stringify(db));}
function learnFood(name,kcal,p,c,f){
  const db=getUserDB(),k=name.toLowerCase();
  if(!db[k])db[k]={name,kcal,p,c,f,uses:0,cat:"user",aliases:[k]};
  db[k].uses=(db[k].uses||0)+1;saveUserDB(db);
}
function getAllFoods(){
  const user=getUserDB(),map={};
  BASE_FOODS.forEach(f=>{map[f.name.toLowerCase()]={...f,source:"base"};});
  Object.values(user).forEach(f=>{map[f.name.toLowerCase()]={...f,source:"user"};});
  return Object.values(map);
}

const BASE_FOODS = [
  // 🥛 LATTICINI & UOVA
  {name:"Yogurt greco 0%",         cat:"dairy",aliases:["yogurt greco 0","yogurt greco zero","yogurt greco magro","yogurt greco","greek yogurt","yogurt"],kcal:57,p:10,c:4,f:0.4},
  {name:"Yogurt greco intero",     cat:"dairy",aliases:["yogurt greco intero"],kcal:97,p:9,c:4,f:5},
  {name:"Fiocchi di latte",        cat:"dairy",aliases:["fiocchi di latte","cottage cheese"],kcal:72,p:11,c:3,f:2},
  {name:"Ricotta vaccina",         cat:"dairy",aliases:["ricotta di mucca","ricotta vaccina","ricotta"],kcal:136,p:11,c:3,f:9},
  {name:"Mozzarella light",        cat:"dairy",aliases:["mozzarella light","mozzarella magra"],kcal:180,p:20,c:2,f:10},
  {name:"Mozzarella",              cat:"dairy",aliases:["mozzarella"],kcal:254,p:18,c:2,f:20},
  {name:"Parmigiano",              cat:"dairy",aliases:["parmigiano","grana","grana padano"],kcal:392,p:33,c:0,f:28},
  {name:"Gorgonzola",              cat:"dairy",aliases:["gorgonzola"],kcal:324,p:19,c:0,f:28},
  {name:"Pecorino",                cat:"dairy",aliases:["pecorino","pecorino romano"],kcal:387,p:26,c:0,f:32},
  {name:"Emmental",                cat:"dairy",aliases:["emmental","emmenthal"],kcal:380,p:28,c:0,f:30},
  {name:"Crescenza",               cat:"dairy",aliases:["crescenza","stracchino"],kcal:256,p:16,c:1,f:21},
  {name:"Burro",                   cat:"dairy",aliases:["burro"],kcal:741,p:0.5,c:0.5,f:82},
  {name:"Panna da cucina",         cat:"dairy",aliases:["panna da cucina","panna","panna fresca"],kcal:337,p:2.4,c:3.5,f:35},
  {name:"Kefir",                   cat:"dairy",aliases:["kefir"],kcal:64,p:3.4,c:4.8,f:3.5},
  {name:"Latte d'avena barista",   cat:"dairy",aliases:["latte d'avena barista","latte avena barista","oat milk barista","bevanda vegetale avena","oat drink","avena barista"],kcal:60,p:1.5,c:9,f:1.5},
  {name:"Latte d'avena",           cat:"dairy",aliases:["latte d'avena","latte di avena","avena drink","oat milk"],kcal:45,p:1,c:7,f:1.5},
  {name:"Latte di soia",           cat:"dairy",aliases:["latte di soia","soy milk","bevanda di soia"],kcal:40,p:3.3,c:2.8,f:1.8},
  {name:"Latte di riso",           cat:"dairy",aliases:["latte di riso","rice milk"],kcal:47,p:0.3,c:10,f:1},
  {name:"Latte di cocco",          cat:"dairy",aliases:["latte di cocco","coconut milk"],kcal:230,p:2.3,c:6,f:24},
  {name:"Bevanda di mandorla",     cat:"dairy",aliases:["bevanda di mandorla","latte di mandorla"],kcal:13,p:0.5,c:0.1,f:1.1},
  {name:"Latte scremato",          cat:"dairy",aliases:["latte scremato","latte parzialmente scremato","latte"],kcal:36,p:3.4,c:5,f:0.1},
  {name:"Latte intero",            cat:"dairy",aliases:["latte intero"],kcal:65,p:3.2,c:4.8,f:3.6},
  {name:"Albumi",                  cat:"dairy",aliases:["albume d'uovo","albumi d'uovo","albume","albumi","bianco d'uovo","bianchi uovo"],kcal:52,p:11,c:0.7,f:0.2},
  {name:"Uova intere",             cat:"dairy",aliases:["uovo intero","uova intere","uovo","uova"],kcal:155,p:13,c:1,f:11},
  // 💪 PROTEINE POLVERE
  {name:"Whey MyProtein",          cat:"powder",aliases:["whey concentrate","whey protein","proteine whey concentrate","proteine concentrate","proteine concentrate way","proteine way","myprotein","my protein","m protein","mprotein","whey","way","proteina in polvere","proteine in polvere","proteina","proteine"],kcal:380,p:74,c:5,f:6},
  {name:"Caseina",                 cat:"powder",aliases:["caseina","casein","proteine caseina"],kcal:374,p:78,c:5,f:2},
  {name:"Albumina",                cat:"powder",aliases:["albumina","egg white protein"],kcal:382,p:82,c:4,f:1},
  {name:"Proteine vegetali pisello",cat:"powder",aliases:["proteine di pisello","pea protein","proteine vegetali"],kcal:360,p:80,c:3,f:4},
  {name:"Creatina monoidrato",     cat:"powder",aliases:["creatina","creatina monoidrato","creatine"],kcal:0,p:0,c:0,f:0},
  {name:"Destrosio",               cat:"powder",aliases:["destrosio","dextrose","glucosio in polvere"],kcal:390,p:0,c:100,f:0},
  {name:"Maltodestrine",           cat:"powder",aliases:["maltodestrine","maltodextrin"],kcal:380,p:0,c:95,f:0},
  // 🥩 CARNE
  {name:"Petto di pollo",          cat:"meat",aliases:["petto di pollo","petto pollo","pollo"],kcal:165,p:31,c:0,f:4,alwaysRaw:true},
  {name:"Sovracoscia di pollo",    cat:"meat",aliases:["sovracoscia di pollo","sovracoscia pollo","sovracoscia senza pelle","sovracoscia"],kcal:185,p:26,c:0,f:9,alwaysRaw:true},
  {name:"Coscia di pollo",         cat:"meat",aliases:["coscia di pollo","cosce di pollo"],kcal:215,p:26,c:0,f:12,alwaysRaw:true},
  {name:"Fesa di tacchino",        cat:"meat",aliases:["fesa di tacchino","fesa tacchino"],kcal:107,p:23,c:0,f:1.5,alwaysRaw:true},
  {name:"Tacchino",                cat:"meat",aliases:["petto di tacchino","tacchino"],kcal:157,p:30,c:0,f:4,alwaysRaw:true},
  {name:"Tacchino macinato",       cat:"meat",aliases:["tacchino macinato","macinato di tacchino"],kcal:149,p:21,c:0,f:7,alwaysRaw:true},
  {name:"Hamburger di bovino",     cat:"meat",aliases:["hamburger di bovino","hamburger bovino","hamburger di scottona","scottona","hamburger"],kcal:250,p:17,c:0,f:20,alwaysRaw:true},
  {name:"Manzo magro",             cat:"meat",aliases:["manzo magro","bistecca","carne rossa","bovino","fettina di manzo","fettina"],kcal:143,p:26,c:0,f:4,alwaysRaw:true},
  {name:"Macinato di manzo",       cat:"meat",aliases:["macinato di manzo","macinato","macinata"],kcal:254,p:17,c:0,f:20,alwaysRaw:true},
  {name:"Vitello",                 cat:"meat",aliases:["vitello","fesa di vitello"],kcal:109,p:21,c:0,f:2.5,alwaysRaw:true},
  {name:"Lonza di maiale",         cat:"meat",aliases:["lonza","lonza di maiale","arista"],kcal:159,p:22,c:0,f:8,alwaysRaw:true},
  {name:"Filetto di maiale",       cat:"meat",aliases:["filetto di maiale"],kcal:143,p:22,c:0,f:6,alwaysRaw:true},
  {name:"Prosciutto crudo",        cat:"meat",aliases:["prosciutto crudo","crudo"],kcal:249,p:25,c:0,f:16},
  {name:"Prosciutto cotto",        cat:"meat",aliases:["prosciutto cotto","cotto"],kcal:136,p:19,c:0,f:7},
  {name:"Bresaola",                cat:"meat",aliases:["bresaola"],kcal:151,p:32,c:0,f:2},
  {name:"Speck",                   cat:"meat",aliases:["speck"],kcal:287,p:27,c:0.5,f:19},
  {name:"Salame Milano",           cat:"meat",aliases:["salame milano","salame"],kcal:408,p:22,c:1,f:36},
  {name:"Pancetta",                cat:"meat",aliases:["pancetta","pancetta tesa","pancetta arrotolata"],kcal:410,p:17,c:0,f:38},
  {name:"Wurstel",                 cat:"meat",aliases:["wurstel","hot dog"],kcal:290,p:12,c:3,f:26},
  {name:"Carpaccio di manzo",      cat:"meat",aliases:["carpaccio","carpaccio di manzo"],kcal:105,p:21,c:0,f:2},
  // 🐟 PESCE
  {name:"Salmone",                 cat:"fish",aliases:["salmone","filetto di salmone"],kcal:208,p:20,c:0,f:13,alwaysRaw:true},
  {name:"Salmone affumicato",      cat:"fish",aliases:["salmone affumicato"],kcal:172,p:25,c:0,f:8},
  {name:"Sgombro al naturale",     cat:"fish",aliases:["sgombro al naturale","sgombro in scatola","sgombro in barattolo"],kcal:185,p:19,c:0,f:12,alwaysCooked:true},
  {name:"Sgombro sottolio",        cat:"fish",aliases:["sgombro sottolio","sgombro sott'olio"],kcal:237,p:17,c:0,f:19,alwaysCooked:true},
  {name:"Sgombro fresco",          cat:"fish",aliases:["sgombro fresco","sgombro","filetto di sgombro"],kcal:205,p:19,c:0,f:14,alwaysRaw:true},
  {name:"Tonno al naturale",       cat:"fish",aliases:["tonno al naturale","tonno in scatola","tonno"],kcal:116,p:26,c:0,f:1,alwaysCooked:true},
  {name:"Tonno sottolio",          cat:"fish",aliases:["tonno sottolio","tonno sott'olio","tonno in olio"],kcal:200,p:26,c:0,f:10,alwaysCooked:true},
  {name:"Merluzzo",                cat:"fish",aliases:["merluzzo","filetto di merluzzo","baccalà"],kcal:82,p:18,c:0,f:1,alwaysRaw:true},
  {name:"Orata",                   cat:"fish",aliases:["orata","filetto di orata"],kcal:96,p:18,c:0,f:3,alwaysRaw:true},
  {name:"Branzino",                cat:"fish",aliases:["branzino","filetto di branzino","spigola"],kcal:82,p:16,c:0,f:1.5,alwaysRaw:true},
  {name:"Platessa",                cat:"fish",aliases:["platessa","filetto di platessa","passera"],kcal:83,p:17,c:0,f:1.2,alwaysRaw:true},
  {name:"Sogliola",                cat:"fish",aliases:["sogliola","filetto di sogliola"],kcal:85,p:17,c:0,f:1.5,alwaysRaw:true},
  {name:"Trota",                   cat:"fish",aliases:["trota","filetto di trota","trota salmonata"],kcal:119,p:20,c:0,f:4,alwaysRaw:true},
  {name:"Polpo",                   cat:"fish",aliases:["polpo","polipo"],kcal:82,p:17,c:0,f:1},
  {name:"Calamari",                cat:"fish",aliases:["calamaro","calamari","totano"],kcal:82,p:16,c:1.5,f:1},
  {name:"Cozze",                   cat:"fish",aliases:["cozza","cozze","mitili"],kcal:86,p:12,c:4,f:2},
  {name:"Vongole",                 cat:"fish",aliases:["vongola","vongole"],kcal:72,p:11,c:3.2,f:1},
  {name:"Gamberetti",              cat:"fish",aliases:["gamberi","gamberetti","mazzancolle"],kcal:99,p:20,c:0.9,f:1.7},
  {name:"Alici",                   cat:"fish",aliases:["alice","alici","acciuga","acciughe"],kcal:131,p:20,c:0,f:6,alwaysRaw:true},
  {name:"Sarde",                   cat:"fish",aliases:["sarda","sarde"],kcal:185,p:20,c:0,f:12,alwaysRaw:true},
  {name:"Surimi",                  cat:"fish",aliases:["surimi","bastoncini di granchio"],kcal:99,p:14,c:9,f:1},
  {name:"Baccalà ammollato",       cat:"fish",aliases:["baccalà ammollato","baccalà dissalato"],kcal:94,p:22,c:0,f:0.7},
  // 🫘 LEGUMI
  {name:"Ceci cotti",              cat:"legume",aliases:["ceci cotti","ceci"],kcal:164,p:9,c:27,f:2.6,alwaysCooked:true},
  {name:"Lenticchie cotte",        cat:"legume",aliases:["lenticchie cotte","lenticchie"],kcal:116,p:9,c:20,f:0.4,alwaysCooked:true},
  {name:"Lenticchie rosse",        cat:"legume",aliases:["lenticchie rosse","lenticchia rossa"],kcal:116,p:9,c:20,f:0.4,alwaysCooked:true},
  {name:"Fagioli borlotti cotti",  cat:"legume",aliases:["fagioli borlotti","fagioli borlotti cotti","fagioli"],kcal:112,p:8,c:20,f:0.5,alwaysCooked:true},
  {name:"Edamame",                 cat:"legume",aliases:["edamame","fagioli di soia","soia"],kcal:122,p:11,c:10,f:5,alwaysCooked:true},
  {name:"Piselli",                 cat:"legume",aliases:["pisello","piselli","piselli in scatola","piselli al naturale"],kcal:81,p:5.4,c:14,f:0.4,alwaysCooked:true},
  {name:"Fave cotte",              cat:"legume",aliases:["fava","fave","fave cotte"],kcal:110,p:8,c:20,f:0.5,alwaysCooked:true},
  {name:"Lupini",                  cat:"legume",aliases:["lupino","lupini"],kcal:371,p:36,c:40,f:10,alwaysCooked:true},
  {name:"Tofu",                    cat:"legume",aliases:["tofu"],kcal:76,p:8,c:2,f:4},
  {name:"Seitan",                  cat:"legume",aliases:["seitan"],kcal:370,p:75,c:14,f:1.9},
  {name:"Tempeh",                  cat:"legume",aliases:["tempeh"],kcal:193,p:19,c:9,f:11},
  {name:"Falafel",                 cat:"legume",aliases:["falafel"],kcal:333,p:13,c:32,f:18},
  // 🌾 CEREALI
  {name:"Fiocchi di avena",        cat:"grain",aliases:["fiocchi d'avena","fiocchi di avena","avena","porridge"],kcal:379,p:13,c:67,f:7,alwaysRaw:true},
  {name:"Pasta integrale",         cat:"grain",aliases:["pasta integrale","pasta integrale cruda"],kcal:356,p:13,c:66,f:3,alwaysRaw:true},
  {name:"Pasta",                   cat:"grain",aliases:["pasta","spaghetti","penne","fusilli","pasta cruda"],kcal:360,p:13,c:70,f:2,alwaysRaw:true},
  {name:"Pasta di farro",          cat:"grain",aliases:["pasta di farro","pasta farro"],kcal:339,p:15,c:62,f:2.5,alwaysRaw:true},
  {name:"Pasta di ceci",           cat:"grain",aliases:["pasta di ceci"],kcal:340,p:20,c:55,f:4,alwaysRaw:true},
  {name:"Pasta di lenticchie",     cat:"grain",aliases:["pasta di lenticchie"],kcal:337,p:24,c:54,f:1.5,alwaysRaw:true},
  {name:"Pasta di soia",           cat:"grain",aliases:["pasta di soia","spaghetti di soia","noodles di soia"],kcal:338,p:43,c:25,f:5},
  {name:"Mie Noodles",             cat:"grain",aliases:["mie noodles","mie","noodles di frumento","noodles"],kcal:355,p:8,c:72,f:1.5},
  {name:"Riso basmati",            cat:"grain",aliases:["riso basmati","riso basmati crudo","riso"],kcal:360,p:7.5,c:79,f:0.5,alwaysRaw:true},
  {name:"Riso integrale",          cat:"grain",aliases:["riso integrale","riso integrale crudo"],kcal:362,p:7.5,c:76,f:2.7,alwaysRaw:true},
  {name:"Riso venere",             cat:"grain",aliases:["riso venere","riso nero"],kcal:359,p:8.3,c:76,f:3.5,alwaysRaw:true},
  {name:"Riso per sushi",          cat:"grain",aliases:["riso per sushi","riso sushi"],kcal:356,p:7,c:78,f:0.5,alwaysRaw:true},
  {name:"Farro",                   cat:"grain",aliases:["farro","farro crudo","farro perlato"],kcal:340,p:15,c:68,f:2.5,alwaysRaw:true},
  {name:"Orzo",                    cat:"grain",aliases:["orzo","orzo crudo","orzo perlato"],kcal:354,p:12,c:73,f:2.1,alwaysRaw:true},
  {name:"Quinoa",                  cat:"grain",aliases:["quinoa","quinoa cruda"],kcal:368,p:14,c:64,f:6,alwaysRaw:true},
  {name:"Couscous",                cat:"grain",aliases:["couscous","cous cous"],kcal:376,p:13,c:77,f:2,alwaysRaw:true},
  {name:"Bulgur",                  cat:"grain",aliases:["bulgur"],kcal:342,p:12,c:76,f:1.3,alwaysRaw:true},
  {name:"Miglio",                  cat:"grain",aliases:["miglio"],kcal:378,p:11,c:73,f:4,alwaysRaw:true},
  {name:"Polenta",                 cat:"grain",aliases:["polenta","farina di mais"],kcal:362,p:8.7,c:74,f:3.6,alwaysRaw:true},
  {name:"Farina 00",               cat:"grain",aliases:["farina 00","farina bianca","farina"],kcal:364,p:11,c:76,f:1,alwaysRaw:true},
  {name:"Farina integrale",        cat:"grain",aliases:["farina integrale"],kcal:339,p:13,c:68,f:2.5,alwaysRaw:true},
  {name:"Farina di avena",         cat:"grain",aliases:["farina di avena","oat flour"],kcal:379,p:13,c:65,f:7},
  {name:"Pane integrale",          cat:"grain",aliases:["pane integrale"],kcal:247,p:9,c:46,f:3},
  {name:"Pane di segale",          cat:"grain",aliases:["pane di segale","pane segale"],kcal:259,p:9,c:48,f:3},
  {name:"Pane comune",             cat:"grain",aliases:["pane bianco","panino","pane"],kcal:275,p:8,c:55,f:1},
  {name:"Pane carasau",            cat:"grain",aliases:["pane carasau","carasau","pane sardo"],kcal:392,p:11,c:80,f:3},
  {name:"Focaccia",                cat:"grain",aliases:["focaccia"],kcal:289,p:7,c:44,f:10},
  {name:"Grissini",                cat:"grain",aliases:["grissino","grissini"],kcal:411,p:11,c:72,f:9},
  {name:"Wasa integrale",          cat:"grain",aliases:["wasa integrale","wasa","crackers wasa"],kcal:336,p:11,c:62,f:4},
  {name:"Fette biscottate integrali",cat:"grain",aliases:["fette biscottate integrali","fette biscottate"],kcal:382,p:11,c:72,f:6},
  {name:"Gallette di riso",        cat:"grain",aliases:["gallette di riso","galletta di riso","gallette"],kcal:381,p:8,c:85,f:2.8},
  {name:"Crackers integrali",      cat:"grain",aliases:["crackers integrali","crackers","cracker"],kcal:412,p:10,c:68,f:12},
  {name:"Piadina al farro",        cat:"grain",aliases:["piadina al farro","piadina farro","piadina"],kcal:290,p:9,c:48,f:8},
  {name:"Cornflakes",              cat:"grain",aliases:["cornflakes","corn flakes","cereali da colazione"],kcal:357,p:7,c:84,f:1},
  {name:"Gnocchi di patate",       cat:"grain",aliases:["gnocchi","gnocchi di patate"],kcal:131,p:3,c:28,f:0.5},
  {name:"Patate dolci",            cat:"grain",aliases:["patata dolce","patate dolci","sweet potato"],kcal:86,p:1.6,c:20,f:0.1},
  {name:"Patate bollite",          cat:"grain",aliases:["patate bollite","patate lesse","patata","patate"],kcal:77,p:2,c:17,f:0.1},
  // 🥑 GRASSI & CONDIMENTI
  {name:"Burro di arachidi in polvere",cat:"fat",aliases:["burro di arachidi in polvere","burro arachidi in polvere","burro d'arachidi in polvere","polvere di burro di arachidi","polvere di arachidi","arachidi in polvere","pb2","prozis peanut","peanut butter powder"],kcal:376,p:38,c:35,f:8},
  {name:"Burro di arachidi",       cat:"fat",aliases:["burro di arachidi","burro d'arachidi","burro arachidi","peanut butter"],kcal:588,p:25,c:20,f:50},
  {name:"Burro di mandorle",       cat:"fat",aliases:["burro di mandorle"],kcal:614,p:21,c:13,f:56},
  {name:"Mandorle",                cat:"fat",aliases:["mandorle","mandorla"],kcal:579,p:21,c:22,f:50},
  {name:"Noci",                    cat:"fat",aliases:["noci","noce"],kcal:654,p:15,c:14,f:65},
  {name:"Nocciole",                cat:"fat",aliases:["nocciole","nocciola"],kcal:628,p:13,c:17,f:61},
  {name:"Olive verdi",             cat:"fat",aliases:["olive verdi","oliva verde"],kcal:145,p:1,c:3,f:15},
  {name:"Olive nere",              cat:"fat",aliases:["olive nere","oliva nera","olive","oliva","olive taggiasche","taggiasche"],kcal:115,p:0.8,c:6,f:10},
  {name:"Avocado",                 cat:"fat",aliases:["avocado"],kcal:160,p:2,c:9,f:15},
  {name:"Olio EVO",                cat:"fat",aliases:["olio extravergine","olio evo","olio d'oliva","olio di oliva","filo d'olio","filo di olio","olio"],kcal:884,p:0,c:0,f:100},
  {name:"Olio di cocco",           cat:"fat",aliases:["olio di cocco","coconut oil"],kcal:884,p:0,c:0,f:99},
  {name:"Olio MCT",                cat:"fat",aliases:["olio mct","mct oil","mct"],kcal:884,p:0,c:0,f:100},
  {name:"Semi di chia",            cat:"fat",aliases:["semi di chia","chia"],kcal:486,p:17,c:42,f:31},
  {name:"Semi di lino",            cat:"fat",aliases:["semi di lino","lino"],kcal:534,p:18,c:29,f:42},
  {name:"Semi di sesamo",          cat:"fat",aliases:["semi di sesamo","sesamo"],kcal:573,p:18,c:23,f:50},
  {name:"Semi di zucca",           cat:"fat",aliases:["semi di zucca"],kcal:559,p:30,c:10,f:49},
  {name:"Tahini",                  cat:"fat",aliases:["tahini","pasta di sesamo"],kcal:595,p:17,c:21,f:54},
  {name:"Hummus",                  cat:"fat",aliases:["hummus","hummus di ceci"],kcal:177,p:8,c:17,f:10},
  {name:"Guacamole",               cat:"fat",aliases:["guacamole"],kcal:150,p:1.9,c:8,f:13},
  {name:"Pesto",                   cat:"fat",aliases:["pesto","pesto genovese"],kcal:439,p:6,c:4,f:45},
  {name:"Passata di pomodoro",     cat:"fat",aliases:["passata di pomodoro","passata","sugo di pomodoro"],kcal:35,p:1.5,c:7,f:0.4},
  {name:"Concentrato di pomodoro", cat:"fat",aliases:["concentrato di pomodoro","estratto di pomodoro"],kcal:82,p:4.3,c:18,f:0.5},
  {name:"Salsa di soia",           cat:"fat",aliases:["salsa di soia","soia salsa","tamari"],kcal:60,p:5.5,c:7,f:0},
  {name:"Salsa barbecue",          cat:"fat",aliases:["salsa barbecue","salsa bbq","bbq sauce"],kcal:95,p:1,c:22,f:0.5},
  {name:"Senape",                  cat:"fat",aliases:["senape","mustard"],kcal:66,p:4.4,c:6,f:3.3},
  {name:"Ketchup",                 cat:"fat",aliases:["ketchup"],kcal:112,p:1.5,c:27,f:0.3},
  {name:"Maionese",                cat:"fat",aliases:["maionese","mayo"],kcal:680,p:1.5,c:3,f:75},
  {name:"Salsa teriyaki",          cat:"fat",aliases:["salsa teriyaki","teriyaki"],kcal:89,p:5.6,c:15,f:0.7},
  {name:"Salsa sriracha",          cat:"fat",aliases:["sriracha","salsa sriracha"],kcal:93,p:2,c:20,f:1},
  {name:"Aceto balsamico",         cat:"fat",aliases:["aceto balsamico","balsamico"],kcal:88,p:0.5,c:17,f:0},
  {name:"Aceto di mele",           cat:"fat",aliases:["aceto di mele","apple cider vinegar"],kcal:22,p:0,c:0.9,f:0},
  {name:"Brodo di pollo",          cat:"fat",aliases:["brodo di pollo","brodo pollo"],kcal:15,p:1.5,c:1,f:0.5},
  {name:"Brodo vegetale",          cat:"fat",aliases:["brodo vegetale","brodo verdure"],kcal:10,p:0.5,c:2,f:0.2},
  {name:"Curcuma",                 cat:"fat",aliases:["curcuma","turmeric"],kcal:312,p:10,c:67,f:3},
  {name:"Cannella",                cat:"fat",aliases:["cannella","cinnamon"],kcal:247,p:4,c:81,f:1.2},
  {name:"Curry in polvere",        cat:"fat",aliases:["curry","curry in polvere"],kcal:325,p:14,c:58,f:14},
  // 🥦 VERDURE
  {name:"Insalata mista",          cat:"veg",aliases:["insalata mista","lattuga","rucola","valeriana","misticanza","insalata"],kcal:20,p:1.5,c:3,f:0.3},
  {name:"Rucola",                  cat:"veg",aliases:["rucola"],kcal:25,p:2.6,c:3.7,f:0.7},
  {name:"Pomodorini",              cat:"veg",aliases:["pomodorini","pomodoro ciliegino","ciliegini"],kcal:18,p:0.9,c:3.5,f:0.2},
  {name:"Pomodori",                cat:"veg",aliases:["pomodoro","pomodori"],kcal:18,p:0.9,c:3.5,f:0.2},
  {name:"Pomodori secchi",         cat:"veg",aliases:["pomodori secchi","pomodoro secco"],kcal:258,p:14,c:56,f:3},
  {name:"Cetrioli",                cat:"veg",aliases:["cetriolo","cetrioli"],kcal:15,p:0.7,c:2.5,f:0.1},
  {name:"Zucchine",                cat:"veg",aliases:["zucchina","zucchine"],kcal:17,p:1.2,c:2.5,f:0.3},
  {name:"Broccoli",                cat:"veg",aliases:["broccoli","broccolo"],kcal:35,p:3,c:5,f:0.4},
  {name:"Spinaci",                 cat:"veg",aliases:["spinaci","spinacio","spinaci surgelati","spinaci in busta"],kcal:23,p:2.9,c:3.6,f:0.4},
  {name:"Peperoni",                cat:"veg",aliases:["peperone","peperoni"],kcal:31,p:1,c:6,f:0.3},
  {name:"Carote",                  cat:"veg",aliases:["carota","carote"],kcal:41,p:0.9,c:10,f:0.2},
  {name:"Cipolla",                 cat:"veg",aliases:["cipolla","cipolle"],kcal:40,p:1.1,c:9,f:0.1},
  {name:"Asparagi",                cat:"veg",aliases:["asparago","asparagi"],kcal:20,p:2.2,c:3.7,f:0.1},
  {name:"Fagiolini",               cat:"veg",aliases:["fagiolino","fagiolini"],kcal:31,p:1.8,c:7,f:0.1},
  {name:"Melanzane",               cat:"veg",aliases:["melanzana","melanzane"],kcal:25,p:1,c:5.5,f:0.2},
  {name:"Cavolfiore",              cat:"veg",aliases:["cavolfiore"],kcal:25,p:1.9,c:5,f:0.3},
  {name:"Broccoli romanesco",      cat:"veg",aliases:["romanesco","cavolo romanesco"],kcal:25,p:2.5,c:4,f:0.3},
  {name:"Cavolo nero",             cat:"veg",aliases:["cavolo nero","kale"],kcal:35,p:2.9,c:4.4,f:0.7},
  {name:"Cavolo cappuccio",        cat:"veg",aliases:["cavolo cappuccio","cavolo bianco","cavolo verde"],kcal:25,p:1.3,c:5.8,f:0.1},
  {name:"Verza",                   cat:"veg",aliases:["verza","cavolo verza"],kcal:27,p:1.9,c:5,f:0.2},
  {name:"Finocchio",               cat:"veg",aliases:["finocchio","finocchi"],kcal:31,p:1.2,c:7,f:0.2},
  {name:"Sedano",                  cat:"veg",aliases:["sedano"],kcal:16,p:0.7,c:3,f:0.2},
  {name:"Funghi champignon",       cat:"veg",aliases:["funghi","champignon","fungo"],kcal:22,p:3.1,c:3.3,f:0.3},
  {name:"Zucca",                   cat:"veg",aliases:["zucca"],kcal:26,p:1,c:6.5,f:0.1},
  {name:"Mais in scatola",         cat:"veg",aliases:["mais","granturco","mais in scatola"],kcal:86,p:3.2,c:19,f:1.2,alwaysCooked:true},
  {name:"Carciofi",                cat:"veg",aliases:["carciofo","carciofi"],kcal:47,p:3.3,c:10,f:0.2},
  {name:"Porro",                   cat:"veg",aliases:["porro","porri"],kcal:29,p:1.5,c:6,f:0.3},
  {name:"Bietola",                 cat:"veg",aliases:["bietola","bietole","coste"],kcal:19,p:1.8,c:3.7,f:0.1},
  {name:"Radicchio",               cat:"veg",aliases:["radicchio"],kcal:23,p:1.4,c:4.5,f:0.3},
  {name:"Capperi",                 cat:"veg",aliases:["cappero","capperi"],kcal:23,p:2.4,c:4.9,f:0.9},
  {name:"Germogli di soia",        cat:"veg",aliases:["germogli di soia","germogli","bean sprouts"],kcal:30,p:3,c:5.9,f:0.2},
  {name:"Pak choi",                cat:"veg",aliases:["pak choi","bok choy","cavolo cinese"],kcal:13,p:1.5,c:2,f:0.2},
  {name:"Barbabietola rossa",      cat:"veg",aliases:["barbabietola","barbabietola rossa"],kcal:43,p:1.6,c:10,f:0.2},
  // 🍓 FRUTTA
  {name:"Anguria",                 cat:"fruit",aliases:["anguria","cocomero","watermelon"],kcal:30,p:0.6,c:7.5,f:0.2},
  {name:"Banana",                  cat:"fruit",aliases:["banana"],kcal:89,p:1.1,c:23,f:0.3},
  {name:"Mela",                    cat:"fruit",aliases:["mela","mele"],kcal:52,p:0.3,c:14,f:0.2},
  {name:"Pesche",                  cat:"fruit",aliases:["pesca","pesche"],kcal:39,p:0.9,c:9.5,f:0.3},
  {name:"Fragole",                 cat:"fruit",aliases:["fragola","fragole"],kcal:32,p:0.7,c:8,f:0.3},
  {name:"Mirtilli",                cat:"fruit",aliases:["mirtillo","mirtilli","blueberry"],kcal:57,p:0.7,c:14,f:0.3},
  {name:"Lamponi",                 cat:"fruit",aliases:["lampone","lamponi","raspberry"],kcal:52,p:1.2,c:12,f:0.7},
  {name:"More",                    cat:"fruit",aliases:["mora","more","blackberry"],kcal:43,p:1.4,c:10,f:0.5},
  {name:"Ciliegie",                cat:"fruit",aliases:["ciliegia","ciliegie"],kcal:50,p:1,c:12,f:0.3},
  {name:"Albicocche",              cat:"fruit",aliases:["albicocca","albicocche"],kcal:48,p:1.4,c:11,f:0.4},
  {name:"Prugne secche",           cat:"fruit",aliases:["prugna secca","prugne secche","prugna","prugne","susina secca","susine secche"],kcal:251,p:6.3,c:59,f:0.3},
  {name:"Prugne fresche",          cat:"fruit",aliases:["prugna fresca","prugne fresche","susina","susine"],kcal:46,p:0.7,c:11,f:0.3},
  {name:"Fichi",                   cat:"fruit",aliases:["fico","fichi"],kcal:74,p:0.8,c:19,f:0.3},
  {name:"Kiwi",                    cat:"fruit",aliases:["kiwi"],kcal:61,p:1.1,c:15,f:0.5},
  {name:"Arancia",                 cat:"fruit",aliases:["arancia","arance"],kcal:47,p:0.9,c:12,f:0.1},
  {name:"Clementine",              cat:"fruit",aliases:["clementina","clementine","mandarino","mandarini"],kcal:47,p:0.9,c:12,f:0.2},
  {name:"Pompelmo",                cat:"fruit",aliases:["pompelmo","grapefruit"],kcal:42,p:0.8,c:11,f:0.1},
  {name:"Pere",                    cat:"fruit",aliases:["pera","pere"],kcal:57,p:0.4,c:15,f:0.1},
  {name:"Uva",                     cat:"fruit",aliases:["uva"],kcal:67,p:0.6,c:17,f:0.4},
  {name:"Melone",                  cat:"fruit",aliases:["melone"],kcal:34,p:0.8,c:8,f:0.2},
  {name:"Mango",                   cat:"fruit",aliases:["mango"],kcal:60,p:0.8,c:15,f:0.4},
  {name:"Ananas",                  cat:"fruit",aliases:["ananas","pineapple"],kcal:50,p:0.5,c:13,f:0.1},
  {name:"Melograno",               cat:"fruit",aliases:["melograno","melagrana"],kcal:83,p:1.7,c:19,f:1.2},
  {name:"Cachi",                   cat:"fruit",aliases:["cachi","caco","kaki"],kcal:65,p:0.6,c:17,f:0.2},
  {name:"Castagne",                cat:"fruit",aliases:["castagna","castagne"],kcal:245,p:3.7,c:57,f:2.6},
  {name:"Avocado Hass",            cat:"fruit",aliases:["avocado hass"],kcal:167,p:2,c:9,f:15},
  {name:"Acqua di cocco",          cat:"fruit",aliases:["acqua di cocco","coconut water"],kcal:19,p:0.7,c:3.7,f:0.2},
  // 🍫 DOLCI & SNACK
  {name:"Cioccolato fondente 85%", cat:"sweet",aliases:["cioccolato fondente 85","fondente 85","cioccolato 85","cioccolato fondente","fondente","dark chocolate"],kcal:598,p:8,c:23,f:52},
  {name:"Cioccolato fondente 70%", cat:"sweet",aliases:["cioccolato fondente 70","fondente 70","cioccolato 70"],kcal:571,p:8,c:33,f:43},
  {name:"Cioccolato al latte",     cat:"sweet",aliases:["cioccolato al latte","milk chocolate"],kcal:535,p:7,c:60,f:30},
  {name:"Cacao amaro in polvere",  cat:"sweet",aliases:["cacao amaro","cacao in polvere","cacao","cocoa"],kcal:228,p:20,c:58,f:14},
  {name:"Nutella",                 cat:"sweet",aliases:["nutella","crema di nocciole"],kcal:539,p:6,c:58,f:31},
  {name:"Miele",                   cat:"sweet",aliases:["miele"],kcal:304,p:0.3,c:82,f:0},
  {name:"Sciroppo d'acero",        cat:"sweet",aliases:["sciroppo d'acero","maple syrup","acero"],kcal:260,p:0,c:67,f:0},
  {name:"Sciroppo di agave",       cat:"sweet",aliases:["sciroppo di agave","agave"],kcal:310,p:0,c:76,f:0},
  {name:"Marmellata",              cat:"sweet",aliases:["marmellata","confettura"],kcal:250,p:0.4,c:62,f:0.1},
  {name:"Zucchero semolato",       cat:"sweet",aliases:["zucchero","zucchero semolato","zucchero bianco"],kcal:392,p:0,c:100,f:0},
  {name:"Zucchero di canna",       cat:"sweet",aliases:["zucchero di canna","brown sugar"],kcal:377,p:0,c:97,f:0},
  {name:"Eritritolo",              cat:"sweet",aliases:["eritritolo","erythritol"],kcal:0,p:0,c:0,f:0},
  {name:"Stevia",                  cat:"sweet",aliases:["stevia"],kcal:0,p:0,c:0,f:0},
  {name:"Crema di pistacchio",     cat:"sweet",aliases:["crema di pistacchio","pasta di pistacchio"],kcal:571,p:15,c:30,f:45},
  // 🌱 BURGER VEGETALI & PRODOTTI VEGANI
  // Kioene (valori per 100g da etichetta ufficiale)
  {name:"Kioene Burger Quinoa Lenticchie",  cat:"out", aliases:["kioene quinoa lenticchie","kioni quinoa lenticchie","burger quinoa lenticchie","quinoa lenticchie burger","kioene quinoa","kioni quinoa","burger kioene quinoa","burger kioni quinoa","kioene lenticchie","kioni lenticchie"],      kcal:185, p:8.5, c:22,  f:6.5 },
  {name:"Kioene Burger Tofu Spinaci",        cat:"out", aliases:["kioene tofu spinaci","burger tofu spinaci","kioene tofu"],                                               kcal:145, p:9.5, c:10,  f:6.5 },
  {name:"Kioene Burger Ceci Carote",         cat:"out", aliases:["kioene ceci carote","burger ceci carote","kioene ceci"],                                                 kcal:175, p:7,   c:22,  f:5.5 },
  {name:"Kioene Burger Avena Miglio",        cat:"out", aliases:["kioene avena miglio","burger avena miglio","kioene avena"],                                              kcal:195, p:6,   c:28,  f:5.5 },
  {name:"Kioene Burger Fagioli Neri",        cat:"out", aliases:["kioene fagioli neri","burger fagioli neri","kioene fagioli"],                                            kcal:178, p:8,   c:23,  f:5   },
  {name:"Kioene Burger Classico Vegetale",   cat:"out", aliases:["kioene burger classico","kioene classico","burger classico kioene","kioene burger"],                     kcal:182, p:7.5, c:20,  f:7   },
  {name:"Kioene Polpette Vegetali",          cat:"out", aliases:["kioene polpette","polpette kioene","polpette vegetali kioene"],                                          kcal:188, p:7,   c:22,  f:7   },
  {name:"Kioene Nuggets Vegetali",           cat:"out", aliases:["kioene nuggets","nuggets kioene","nuggets vegetali kioene"],                                             kcal:220, p:8,   c:26,  f:8   },
  {name:"Kioene Wurstel Vegetale",           cat:"out", aliases:["kioene wurstel","wurstel kioene","wurstel vegetale kioene"],                                             kcal:200, p:10,  c:12,  f:12  },
  // Esselunga Bio & Veggie
  {name:"Esselunga Burger Quinoa Lenticchie",cat:"out", aliases:["esselunga quinoa lenticchie","esselunga burger quinoa","burger quinoa esselunga"],                       kcal:180, p:8,   c:22,  f:5.5 },
  {name:"Esselunga Burger Vegetale",         cat:"out", aliases:["esselunga burger vegetale","esselunga veggie burger"],                                                   kcal:175, p:7.5, c:20,  f:6   },
  // Altri brand italiani comuni
  {name:"Naturasi Burger Vegetale",          cat:"out", aliases:["naturasi burger","burger naturasi"],                                                                     kcal:172, p:8,   c:19,  f:6   },
  {name:"Vivera Burger Vegetale",            cat:"out", aliases:["vivera burger","burger vivera","vivera"],                                                                kcal:196, p:18,  c:8,   f:10  },
  {name:"Beyond Burger",                     cat:"out", aliases:["beyond burger","beyond meat burger","beyond meat"],                                                      kcal:250, p:20,  c:6,   f:17  },
  {name:"Impossible Burger",                 cat:"out", aliases:["impossible burger","impossible meat"],                                                                   kcal:240, p:19,  c:9,   f:14  },
  {name:"Quorn Burger",                      cat:"out", aliases:["quorn burger","quorn"],                                                                                  kcal:162, p:14,  c:8,   f:8   },
  {name:"Heura Burger",                      cat:"out", aliases:["heura burger","heura"],                                                                                  kcal:190, p:22,  c:5,   f:9   },
  {name:"HappyVore Burger",                  cat:"out", aliases:["happyvore","happy vore burger"],                                                                         kcal:196, p:18,  c:8,   f:10  },
  // Generici
  {name:"Burger Vegetale (generico)",        cat:"out", aliases:["burger vegetale","veggie burger","burger vegano","burger vegan","hamburger vegetale","hamburger vegano"], kcal:185, p:9,   c:18,  f:7   },
  {name:"Burger di Fagioli",                 cat:"out", aliases:["burger di fagioli","bean burger"],                                                                       kcal:170, p:8,   c:22,  f:4   },
  {name:"Burger di Tofu",                    cat:"out", aliases:["burger di tofu","tofu burger"],                                                                          kcal:150, p:10,  c:10,  f:7   },
  {name:"Burger di Lenticchie",              cat:"out", aliases:["burger di lenticchie","lentil burger","burger lenticchie"],                                              kcal:165, p:9,   c:20,  f:4   },
  {name:"Burger di Ceci",                    cat:"out", aliases:["burger di ceci","chickpea burger","burger ceci"],                                                        kcal:175, p:8,   c:22,  f:5.5 },
  {name:"Falafel (confezionato)",            cat:"out", aliases:["falafel confezionato","falafel pronti"],                                                                 kcal:240, p:9,   c:28,  f:10  },
  // 🍕 FUORI CASA
  {name:"Baked pancake",           cat:"out",aliases:["baked pancake","pancake baked","pancake al forno","pancake"],kcal:253,p:7.7,c:31.6,f:10.3},
  {name:"Pizza margherita",        cat:"out",aliases:["pizza margherita","pizza"],kcal:266,p:11,c:33,f:10},
  {name:"Pasta al pomodoro",       cat:"out",aliases:["pasta al pomodoro","spaghetti al pomodoro"],kcal:160,p:5,c:30,f:3},
  {name:"Pasta alla carbonara",    cat:"out",aliases:["carbonara","pasta alla carbonara"],kcal:310,p:14,c:30,f:15},
  {name:"Risotto ai funghi",       cat:"out",aliases:["risotto ai funghi","risotto"],kcal:180,p:5,c:28,f:6},
  {name:"Caprese",                 cat:"out",aliases:["caprese","insalata caprese"],kcal:200,p:12,c:4,f:16},
  {name:"Frittata",                cat:"out",aliases:["frittata","frittata di uova"],kcal:175,p:12,c:1,f:14},
  {name:"Minestrone",              cat:"out",aliases:["minestrone"],kcal:55,p:2.5,c:8,f:1.5},
  {name:"Zuppa di lenticchie",     cat:"out",aliases:["zuppa di lenticchie"],kcal:95,p:6,c:15,f:2},
  {name:"Pollo alla griglia",      cat:"out",aliases:["pollo alla griglia","pollo grigliato"],kcal:165,p:31,c:0,f:4},
  {name:"Salmone al vapore",       cat:"out",aliases:["salmone al vapore","salmone cotto"],kcal:182,p:24,c:0,f:9},
  {name:"Tiramisù",                cat:"out",aliases:["tiramisù","tiramisu"],kcal:280,p:6,c:25,f:17},
  {name:"Gelato (media)",          cat:"out",aliases:["gelato","gelato artigianale"],kcal:207,p:3.5,c:25,f:11},
];

const DB_SECTION_META = {
  dairy: {label:"🥛 Latticini & Uova"},
  powder:{label:"💪 Proteine in Polvere"},
  meat:  {label:"🥩 Carne"},
  fish:  {label:"🐟 Pesce"},
  legume:{label:"🫘 Legumi"},
  grain: {label:"🌾 Cereali & Carboidrati"},
  fat:   {label:"🥑 Grassi & Condimenti"},
  veg:   {label:"🥦 Verdure"},
  fruit: {label:"🍓 Frutta"},
  sweet: {label:"🍫 Dolci & Snack"},
  out:   {label:"🍕 Fuori casa"},
  user:  {label:"✦ Aggiunti da te"},
};

const DEFAULT_QTY_MAP = {
  "olio evo":5,"filo d'olio":5,"olio di cocco":10,
  "miele":10,"marmellata":20,"salsa di soia":15,"salsa barbecue":30,
  "guacamole":30,"hummus":50,"pesto":30,"tahini":20,
  "concentrato di pomodoro":15,"passata di pomodoro":100,
  "curcuma":5,"cannella":5,"curry in polvere":5,
  "aceto balsamico":15,"aceto di mele":15,
  "cioccolato fondente 85%":20,"cioccolato fondente 70%":20,"cacao amaro in polvere":15,
  "nutella":20,"crema di pistacchio":20,
  "parmigiano":20,"burro":10,
  "burro di arachidi in polvere":20,"burro di arachidi":30,"burro di mandorle":30,
  "mandorle":15,"noci":20,"nocciole":20,
  "semi di chia":15,"semi di lino":15,"semi di sesamo":10,"semi di zucca":20,
  "olive verdi":40,"olive nere":40,
  "whey myprotein":30,"caseina":30,
  "prosciutto crudo":50,"prosciutto cotto":50,"bresaola":50,"speck":50,
  "insalata mista":120,"pomodori":100,"pomodorini":100,"cetrioli":100,
  "zucchine":150,"spinaci":150,"broccoli":150,"asparagi":150,
  "fagiolini":150,"melanzane":150,"cavolfiore":150,"finocchio":150,
  "funghi champignon":100,"avocado":80,"zucca":150,
  "capperi":15,"senape":15,"ketchup":20,"maionese":20,
  "pizza margherita":300,"frittata":150,"burger":100,"burger vegetale":100,"burger kioene":100,"kioene burger":100,
  "prugne secche":40,"datteri freschi":40,
  "castagne":80,"mango":150,"ananas":150,
};
function getDefaultQty(name){
  const k=name.toLowerCase();
  for(const[key,qty]of Object.entries(DEFAULT_QTY_MAP)){if(k.includes(key))return qty;}
  return 100;
}

const PIECE_WEIGHTS=[
  {keys:["prugne secche","prugna secca"],g:8},
  {keys:["prugne","prugna"],g:8},
  {keys:["mandorle","mandorla"],g:1.2},
  {keys:["nocciole","nocciola"],g:1.5},
  {keys:["noci","noce"],g:5},
  {keys:["datteri","dattero"],g:8},
  {keys:["uova","uovo"],g:60},
  // Burger vegetali: 1 burger = ~100g
  {keys:["burger kioene","burger kioni","kioene burger","kioni burger"],g:100},
  {keys:["burger vegetale","burger vegetali","veggie burger"],g:100},
  {keys:["burger di quinoa","burger quinoa"],g:100},
  {keys:["burger di lenticchie","burger lenticchie"],g:100},
  {keys:["burger di ceci","burger ceci"],g:100},
  {keys:["burger di tofu","tofu burger"],g:100},
  {keys:["beyond burger"],g:113},
  {keys:["burger"],g:100},
];

const NUM_WORDS={
  zero:0,uno:1,una:1,due:2,tre:3,quattro:4,cinque:5,sei:6,sette:7,otto:8,nove:9,
  dieci:10,undici:11,dodici:12,tredici:13,quattordici:14,quindici:15,sedici:16,
  diciassette:17,diciotto:18,diciannove:19,venti:20,trenta:30,quaranta:40,
  cinquanta:50,sessanta:60,settanta:70,ottanta:80,novanta:90,cento:100,
  duecento:200,trecento:300,quattrocento:400,cinquecento:500,mille:1000,
  ventuno:21,ventidue:22,ventitre:23,ventiquattro:24,venticinque:25,
  ventisei:26,ventisette:27,ventotto:28,ventinove:29,
  trentuno:31,trentadue:32,trentatre:33,trentaquattro:34,trentacinque:35,
  trentasei:36,trentasette:37,trentotto:38,trentanove:39,
  quarantuno:41,quarantadue:42,quarantatre:43,quarantacinque:45,
  cinquantuno:51,cinquantadue:52,cinquantacinque:55,
  sessantuno:61,settantuno:71,ottantuno:81,ottantacinque:85,novantacinque:95,
  centocinquanta:150,centoventi:120,centotrenta:130,centoquaranta:140,
  centosessanta:160,centosettanta:170,duecentocinquanta:250,
};
function parseNumber(str){
  str=str.toLowerCase().trim();
  const n=parseFloat(str.replace(",","."));if(!isNaN(n))return n;
  if(NUM_WORDS[str]!==undefined)return NUM_WORDS[str];
  let total=0,rem=str;
  for(const[w,v]of Object.entries(NUM_WORDS).sort((a,b)=>b[0].length-a[0].length)){
    if(rem.includes(w)){total+=v;rem=rem.replace(w,"");}
  }
  return total||null;
}

function parsePieces(text){
  const lower=text.toLowerCase();
  for(const{keys,g}of PIECE_WEIGHTS){
    for(const key of keys){
      const idx=lower.indexOf(key);if(idx===-1)continue;
      const before=lower.slice(Math.max(0,idx-15),idx).trim();
      const nm=before.match(/(\d+)\s*$/);
      if(nm)return{item:key,grams:Math.round(parseInt(nm[1])*g)};
      const wk=Object.keys(NUM_WORDS).sort((a,b)=>b.length-a.length);
      for(const w of wk){if(before.endsWith(w)){const n=NUM_WORDS[w];if(n)return{item:key,grams:Math.round(n*g)};}}
    }
  }
  return null;
}

function normStr(s){return s.toLowerCase().replace(/['''\u02bc`]/g,"").replace(/\s+/g," ").trim();}

const CAT_LISTS={
  spuntino_m:["spuntino di meta mattinata","spuntino meta mattinata","spuntino mattinata","spuntino mattina","spuntino di mattina","meta mattinata","meta mattina","spuntino delle 10"],
  spuntino_p:["spuntino pomeridiano","spuntino del pomeriggio","spuntino pomeriggio","merenda pomeridiana","spuntino delle 16","spuntino pre-cena","merenda","pomeriggio"],
  colazione:["come colazione","per colazione","a colazione","colazione","stamattina","stamani","questa mattina","breakfast"],
  pranzo:["come pranzo","per pranzo","a pranzo","ho pranzato","mezzogiorno","a mezzogiorno","lunch","pranzo"],
  cena:["come cena","per cena","a cena","ho cenato","questa sera","stasera","dinner","sera","cena"],
};
function detectCategory(text){
  const t=text.toLowerCase();
  for(const cat of["spuntino_m","spuntino_p","colazione","pranzo","cena"]){
    if((CAT_LISTS[cat]||[]).some(k=>t.includes(k)))return{cat,detected:true};
  }
  return{cat:"pranzo",detected:false};
}
function buildCategoryMap(lower){
  const hits=[];
  for(const cat of["spuntino_m","spuntino_p","colazione","pranzo","cena"]){
    for(const kw of(CAT_LISTS[cat]||[])){
      let i=lower.indexOf(kw);
      while(i!==-1){hits.push({pos:i,end:i+kw.length,cat});i=lower.indexOf(kw,i+1);}
    }
  }
  hits.sort((a,b)=>a.pos-b.pos);
  const clean=[];
  hits.forEach(h=>{if(!clean.some(c=>h.pos>=c.pos&&h.pos<c.end))clean.push(h);});
  return clean;
}
function getCategoryAtPos(catMap,pos,fallback,fallbackDetected){
  let result=fallback,detected=fallbackDetected||false;
  for(const hit of catMap){if(hit.end<=pos){result=hit.cat;detected=true;}else break;}
  return{cat:result,detected};
}

function localParse(text){
  text=text.replace(/[\u2018\u2019\u201a\u201b\u02bc]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/\s+/g," ").trim();
  const foods=getAllFoods(),lower=text.toLowerCase(),lowerNorm=normStr(lower);
  const found=[],usedRanges=[];
  const aliasIndex=[];
  foods.forEach(food=>{
    const aliases=[food.name.toLowerCase(),...(food.aliases||[]).map(a=>a.toLowerCase())];
    aliases.forEach(alias=>aliasIndex.push({alias,aliasNorm:normStr(alias),food}));
  });
  aliasIndex.sort((a,b)=>b.alias.length-a.alias.length);
  const foodMatches=[];
  aliasIndex.forEach(({alias,aliasNorm,food})=>{
    for(const[st,sa]of[[lower,alias],[lowerNorm,aliasNorm]]){
      let idx=st.indexOf(sa);
      while(idx!==-1){
        const overlaps=usedRanges.some(([s,e])=>idx<e&&idx+sa.length>s);
        if(!overlaps){foodMatches.push({idx,end:idx+sa.length,food,alias});usedRanges.push([idx,idx+sa.length]);}
        idx=st.indexOf(sa,idx+1);
      }
      if(foodMatches.some(m=>m.food===food))break;
    }
  });
  foodMatches.sort((a,b)=>a.idx-b.idx);
  const catMap=buildCategoryMap(lower);
  const{cat:globalCat,detected:globalDetected}=detectCategory(text);
  foodMatches.forEach(match=>{
    const before=lower.slice(Math.max(0,match.idx-45),match.idx);
    const after=lower.slice(match.end,match.end+30);
    let qty=null;
    const pieceCtx=lower.slice(Math.max(0,match.idx-20),match.end+5);
    const pieceMatch=parsePieces(pieceCtx);
    if(pieceMatch){qty=pieceMatch.grams;}
    else{
      const bm=before.match(/(\d+(?:[.,]\d+)?)\s*(?:g(?:rammi?)?|ml)?\s*(?:di\s+|d[i']\s*)?\s*$/);
      if(bm)qty=parseFloat(bm[1].replace(",","."));
      if(!qty){const am=after.match(/^\s*(?:g(?:rammi?)?|ml)?\s*(\d+(?:[.,]\d+)?)/);if(am)qty=parseFloat(am[1].replace(",","."))}
      if(!qty){
        const wk=Object.keys(NUM_WORDS).sort((a,b)=>b.length-a.length).join("|");
        const wm=before.match(new RegExp("("+wk+")\\s*(?:grammi?|g|ml)?\\s*(?:di\\s+)?$","i"));
        if(wm)qty=parseNumber(wm[1]);
      }
      if(!qty)qty=getDefaultQty(match.food.name);
    }
    let resolvedFood=match.food;
    // Burro di arachidi → in polvere if "polvere" nearby
    if(match.food.name==="Burro di arachidi"){
      const ctx=lower.slice(Math.max(0,match.idx-25),match.end+25);
      if(ctx.includes("polvere")){const p=getAllFoods().find(f=>f.name==="Burro di arachidi in polvere");if(p)resolvedFood=p;}
    }
    // "burger" alone → skip if veggie/brand context nearby, avoid matching bovino
    if(match.food.name==="Hamburger di bovino"&&match.alias==="burger"){
      const ctx=lower.slice(Math.max(0,match.idx-40),match.end+40);
      const veggieSignals=["kioene","kioni","vegetale","vegano","vegan","quinoa","lenticchie","tofu","ceci","beyond","quorn","heura","vivera"];
      if(veggieSignals.some(s=>ctx.includes(s))){
        // Try to find a better veggie burger match
        const vb=getAllFoods().find(f=>f.cat==="out"&&veggieSignals.some(s=>f.name.toLowerCase().includes(s)&&ctx.includes(s)));
        if(vb)resolvedFood=vb;
        else return; // skip this match entirely
      }
    }
    const{cat,detected:catDetected}=getCategoryAtPos(catMap,match.idx,globalCat,globalDetected);
    if(!found.some(f=>f.food.name===resolvedFood.name&&f.category===cat)){
      found.push({food:resolvedFood,qty,category:cat,catDetected,isRaw:!!resolvedFood.alwaysRaw,isCooked:!!resolvedFood.alwaysCooked});
    }
  });
  return{items:found,category:globalCat};
}

function needsAI(text){
  return["ristorante","trattoria","sushi","burger","kebab","thai","indiano","messicano","pub","osteria"].some(s=>text.toLowerCase().includes(s));
}

async function searchOpenFoodFacts(query){
  try{
    const url="https://world.openfoodfacts.org/cgi/search.pl?search_terms="+encodeURIComponent(query)+"&search_simple=1&action=process&json=1&page_size=8&fields=product_name,nutriments,brands,image_small_url";
    const res=await fetch(url);
    const data=await res.json();
    if(!data.products||!data.products.length)return[];
    return data.products
      .filter(p=>p.nutriments&&p.nutriments["energy-kcal_100g"])
      .map(p=>{
        const n=p.nutriments||{};
        return{
          name:((p.product_name||"")+" "+(p.brands||"")).trim().slice(0,60)||"Prodotto",
          kcal:Math.round(n["energy-kcal_100g"]||0),
          p100:+((n["proteins_100g"]||0)).toFixed(1),
          c100:+((n["carbohydrates_100g"]||0)).toFixed(1),
          f100:+((n["fat_100g"]||0)).toFixed(1),
          qty:100,
        };
      }).slice(0,6);
  }catch{return[];}
}

function BarcodeScanner({onResult,onClose}){
  const scannerRef=useRef(null);
  const scannerDivId="barcode-reader-div";
  const[error,setError]=useState(null);
  const[loading,setLoading]=useState(false);

  useEffect(()=>{
    // Dynamically load html5-qrcode from CDN
    if(window.Html5Qrcode){initScanner();return;}
    const script=document.createElement("script");
    script.src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
    script.onload=()=>initScanner();
    script.onerror=()=>setError("Impossibile caricare lo scanner. Usa la ricerca per nome.");
    document.head.appendChild(script);
    return()=>stopScanner();
  },[]);

  const initScanner=()=>{
    try{
      const html5QrCode=new window.Html5Qrcode(scannerDivId);
      scannerRef.current=html5QrCode;
      html5QrCode.start(
        {facingMode:"environment"},
        {fps:10,qrbox:{width:250,height:150},aspectRatio:1.5},
        async(decodedText)=>{
          await stopScanner();
          setLoading(true);
          const res=await searchOpenFoodFacts(decodedText);
          if(res&&res.length>0)onResult(res[0]);
          else{
            // try barcode direct lookup
            try{
              const r=await fetch("https://world.openfoodfacts.org/api/v2/product/"+decodedText+".json?fields=product_name,nutriments,brands");
              const d=await r.json();
              if(d.status===1&&d.product){
                const p=d.product,n=p.nutriments||{};
                onResult({name:((p.product_name||"")+" "+(p.brands||"")).trim().slice(0,60)||"Prodotto",kcal:Math.round(n["energy-kcal_100g"]||0),p100:+((n["proteins_100g"]||0)).toFixed(1),c100:+((n["carbohydrates_100g"]||0)).toFixed(1),f100:+((n["fat_100g"]||0)).toFixed(1),qty:100});
              }else setError("Prodotto non trovato. Prova la ricerca per nome.");
            }catch{setError("Prodotto non trovato. Prova la ricerca per nome.");}
          }
          setLoading(false);
        },
        ()=>{}
      ).catch(e=>setError("Fotocamera non disponibile: "+e));
    }catch(e){setError("Errore scanner: "+e);}
  };

  const stopScanner=async()=>{
    if(scannerRef.current){
      try{await scannerRef.current.stop();scannerRef.current.clear();}catch{}
      scannerRef.current=null;
    }
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{width:"100%",maxWidth:440,background:C.surface,borderRadius:20,overflow:"hidden"}}>
        <div style={{padding:"13px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid "+C.border}}>
          <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:12,fontWeight:700,color:C.lime}}>📷 Scansiona Barcode</div>
          <button onClick={()=>{stopScanner();onClose();}} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{minHeight:240,background:"#000",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
          {loading?(
            <div style={{color:"#fff",textAlign:"center",padding:20}}>
              <div style={{fontSize:28,marginBottom:8}}>⏳</div>
              <div style={{fontSize:12,fontFamily:"'DM Mono',monospace"}}>Cerco prodotto...</div>
            </div>
          ):error?(
            <div style={{color:"#fff",textAlign:"center",padding:20}}>
              <div style={{fontSize:24,marginBottom:8}}>⚠️</div>
              <div style={{fontSize:11,fontFamily:"'DM Mono',monospace",color:"#ffcc80",lineHeight:1.6}}>{error}</div>
              <button onClick={()=>{setError(null);onClose();}} style={{marginTop:12,padding:"8px 16px",background:C.lime,color:"#fff",border:"none",borderRadius:8,fontFamily:"'Unbounded',sans-serif",fontSize:10,fontWeight:700,cursor:"pointer"}}>Chiudi</button>
            </div>
          ):(
            <div id={scannerDivId} style={{width:"100%"}}/>
          )}
        </div>
        <div style={{padding:"12px 16px",fontSize:10,color:C.muted,textAlign:"center"}}>
          Inquadra il codice a barre del prodotto · <b style={{color:C.blue}}>Open Food Facts</b>
        </div>
      </div>
    </div>
  );
}

function ProductSearch({onResult,onClose}){
  const[query,setQuery]=useState("");
  const[results,setResults]=useState([]);
  const[loading,setLoading]=useState(false);
  const[searched,setSearched]=useState(false);
  const inputRef=useRef(null);

  useEffect(()=>{if(inputRef.current)inputRef.current.focus();},[]);

  const doSearch=async()=>{
    if(!query.trim())return;
    setLoading(true);setSearched(false);setResults([]);
    const res=await searchOpenFoodFacts(query);
    setResults(res);setLoading(false);setSearched(true);
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:700,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"60px 14px 14px"}}>
      <div style={{width:"100%",maxWidth:480,background:C.surface,borderRadius:20,overflow:"hidden",boxShadow:"0 8px 40px rgba(0,0,0,.2)",maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
        {/* Header */}
        <div style={{padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid "+C.border,flexShrink:0}}>
          <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:12,fontWeight:700,color:C.lime}}>🔍 Cerca prodotto</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        {/* Search bar */}
        <div style={{padding:"12px 14px",borderBottom:"1px solid "+C.border,flexShrink:0}}>
          <div style={{display:"flex",gap:8}}>
            <input ref={inputRef} type="text"
              placeholder='es. "Yogurt Greco Fage 0%" o "Avena MyProtein"'
              value={query} onChange={e=>setQuery(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")doSearch();}}
              style={{flex:1,background:C.surface2,border:"1px solid "+C.border,borderRadius:9,color:C.text,fontFamily:"'DM Mono',monospace",fontSize:12,padding:"10px 12px",outline:"none",transition:"border-color .2s"}}/>
            <button onClick={doSearch} disabled={loading||!query.trim()}
              style={{padding:"10px 16px",background:loading||!query.trim()?C.mutedLight:C.lime,color:"#fff",border:"none",borderRadius:9,fontFamily:"'Unbounded',sans-serif",fontSize:11,fontWeight:700,cursor:loading?"not-allowed":"pointer",whiteSpace:"nowrap"}}>
              {loading?"...":"Cerca"}
            </button>
          </div>
          <div style={{fontSize:9,color:C.muted,marginTop:6}}>
            Powered by <b style={{color:C.blue}}>Open Food Facts</b> · milioni di prodotti italiani ed europei
          </div>
        </div>
        {/* Results */}
        <div style={{overflowY:"auto",flex:1,padding:"8px 14px 14px"}}>
          {loading&&(
            <div style={{textAlign:"center",padding:"28px 0",color:C.muted,fontSize:12}}>
              <div style={{fontSize:24,marginBottom:8}}>⏳</div>Cercando su Open Food Facts...
            </div>
          )}
          {!loading&&searched&&results.length===0&&(
            <div style={{textAlign:"center",padding:"28px 0",color:C.muted,fontSize:11}}>
              <div style={{fontSize:24,marginBottom:8}}>😕</div>
              Nessun risultato trovato.<br/>
              <span style={{fontSize:10}}>Prova con un nome più generico o in inglese.</span>
            </div>
          )}
          {!loading&&results.map((r,i)=>(
            <div key={i} onClick={()=>onResult(r)}
              style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 12px",marginBottom:6,background:C.surface2,border:"1px solid "+C.border,borderRadius:10,cursor:"pointer",transition:"border-color .2s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.lime}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <div style={{flex:1,minWidth:0,marginRight:10}}>
                <div style={{fontSize:12,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:2}}>
                  P {r.p100}g · C {r.c100}g · G {r.f100}g
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:14,fontWeight:700,color:C.pink}}>{r.kcal}</div>
                <div style={{fontSize:9,color:C.muted}}>kcal/100g</div>
              </div>
            </div>
          ))}
          {!loading&&!searched&&(
            <div style={{textAlign:"center",padding:"24px 0",color:C.muted,fontSize:11,lineHeight:1.8}}>
              Cerca un prodotto per nome o marca.<br/>
              <span style={{fontSize:10}}>Esempi: "Fage 0%", "Barilla Penne", "Activia", "Kinder"</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfiloPanel({goal,setGoal,prof,setProf}){
  const[editing,setEditing]=useState(false);
  const[draft,setDraft]=useState({...prof});
  const tgt=calcTargets("rest",goal,prof);
  const bmr=calcBMR(prof),lbm=calcLBM(prof);
  const saveEdits=()=>{
    const cleaned={
      peso:parseFloat(draft.peso)||prof.peso,
      altezza:parseFloat(draft.altezza)||prof.altezza,
      eta:parseInt(draft.eta)||prof.eta,
      pgc:parseFloat(draft.pgc)||prof.pgc,
      sesso:draft.sesso||prof.sesso,
    };
    saveProfile(cleaned);setProf(cleaned);setEditing(false);
  };
  const FI=({k,label,unit,step="0.1"})=>(
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <label style={{fontSize:8,color:C.muted,letterSpacing:".1em",textTransform:"uppercase"}}>{label}</label>
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        <input type="number" step={step} value={draft[k]} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))}
          style={{flex:1,background:C.surface2,border:"1px solid "+C.border,borderRadius:6,color:C.text,fontFamily:"'DM Mono',monospace",fontSize:13,padding:"6px 8px",outline:"none"}}/>
        <span style={{fontSize:10,color:C.muted,whiteSpace:"nowrap"}}>{unit}</span>
      </div>
    </div>
  );
  return(
    <div>
      <div style={{background:C.surface,border:"1px solid "+C.border,borderRadius:14,padding:16,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:9,letterSpacing:".14em",textTransform:"uppercase",color:C.muted}}>📊 Dati corporei</div>
          <button onClick={()=>{setDraft({...prof});setEditing(e=>!e);}}
            style={{background:editing?C.limeLight:"none",border:"1px solid "+(editing?C.lime:C.border),borderRadius:7,padding:"4px 11px",fontFamily:"'DM Mono',monospace",fontSize:10,color:editing?C.lime:C.muted,cursor:"pointer"}}>
            {editing?"✕ Annulla":"✏️ Modifica"}
          </button>
        </div>
        {editing?(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <FI k="peso" label="Peso" unit="kg"/>
              <FI k="altezza" label="Altezza" unit="cm" step="1"/>
              <FI k="eta" label="Età" unit="anni" step="1"/>
              <FI k="pgc" label="% Grasso corp." unit="%"/>
              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                <label style={{fontSize:8,color:C.muted,letterSpacing:".1em",textTransform:"uppercase"}}>Sesso</label>
                <select value={draft.sesso} onChange={e=>setDraft(d=>({...d,sesso:e.target.value}))}
                  style={{background:C.surface2,border:"1px solid "+C.border,borderRadius:6,color:C.text,fontFamily:"'DM Mono',monospace",fontSize:13,padding:"6px 8px",outline:"none"}}>
                  <option value="M">Maschio</option><option value="F">Femmina</option>
                </select>
              </div>
            </div>
            <button onClick={saveEdits} style={{width:"100%",padding:11,background:C.lime,color:"#fff",border:"none",borderRadius:9,fontFamily:"'Unbounded',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>✓ Salva e ricalcola</button>
          </div>
        ):(
          <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {[{l:"Peso",v:prof.peso+" kg",c:C.text},{l:"Altezza",v:prof.altezza+" cm",c:C.text},{l:"Età",v:prof.eta+" anni",c:C.text},{l:"% Grasso",v:prof.pgc+"%",c:C.amber},{l:"LBM",v:lbm+" kg",c:C.blue},{l:"BMR",v:bmr+" kcal",c:C.pink}].map(({l,v,c})=>(
                <div key={l} style={{background:C.surface2,borderRadius:9,padding:"9px 11px",border:"1px solid "+C.border}}>
                  <div style={{fontSize:8,color:C.muted,letterSpacing:".1em",textTransform:"uppercase",marginBottom:3}}>{l}</div>
                  <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:14,fontWeight:700,color:c}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:12,padding:"9px 13px",background:C.blueLight,border:"1px solid "+C.blue+"33",borderRadius:8,fontSize:10,color:C.muted,lineHeight:1.7}}>
              ⚠️ <b style={{color:C.amber}}>Target:</b> portare PGC al 12–15% (perdere ~{Math.round(prof.peso*(prof.pgc-13.5)/100)} kg di grasso).
            </div>
          </>
        )}
      </div>
      <div style={{background:C.surface,border:"1px solid "+C.border,borderRadius:14,padding:16,marginBottom:12}}>
        <div style={{fontSize:9,letterSpacing:".14em",textTransform:"uppercase",color:C.muted,marginBottom:14}}>⚡ Metabolismo</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          {[{l:"BMR",v:bmr,u:"kcal/gg",c:C.pink},{l:"TDEE Riposo",v:Math.round(bmr*1.32),u:"kcal/gg",c:C.blue},{l:"TDEE Palestra",v:Math.round(bmr*1.50),u:"kcal/gg",c:C.lime}].map(({l,v,u,c})=>(
            <div key={l} style={{background:C.surface2,borderRadius:9,padding:"9px 11px",border:"1px solid "+C.border}}>
              <div style={{fontSize:8,color:C.muted,letterSpacing:".1em",textTransform:"uppercase",marginBottom:3}}>{l}</div>
              <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:16,fontWeight:700,color:c}}>{v}</div>
              <div style={{fontSize:9,color:C.muted}}>{u}</div>
            </div>
          ))}
        </div>
        <div style={{padding:"9px 13px",background:C.blueLight,border:"1px solid "+C.blue+"33",borderRadius:8,fontSize:10,color:C.muted,lineHeight:1.7}}>
          💡 <b style={{color:C.blue}}>PAL:</b> Con 3-4k passi/gg il PAL base è 1.32. Palestra aggiunge ~500 kcal → PAL 1.50.
        </div>
      </div>
      <div style={{background:C.surface,border:"1px solid "+C.border,borderRadius:14,padding:16,marginBottom:12}}>
        <div style={{fontSize:9,letterSpacing:".14em",textTransform:"uppercase",color:C.muted,marginBottom:12}}>🎯 Obiettivo</div>
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          {[["deficit","🔥 Deficit"],["mantenimento","⚖️ Mantieni"],["surplus","💪 Surplus"]].map(([v,l])=>(
            <button key={v} onClick={()=>setGoal(v)}
              style={{flex:1,padding:"8px 4px",background:goal===v?C.limeLight:C.surface2,border:"1px solid "+(goal===v?C.lime:C.border),borderRadius:8,color:goal===v?C.lime:C.muted,fontFamily:"'DM Mono',monospace",fontSize:10,cursor:"pointer"}}>
              {l}
            </button>
          ))}
        </div>
        <div style={{background:C.limeLight,border:"1px solid "+C.lime+"55",borderRadius:10,padding:"11px 14px",marginBottom:14}}>
          <div style={{fontFamily:"'Unbounded',sans-serif",fontSize:22,fontWeight:700,color:C.lime}}>{tgt.kcal} kcal</div>
          <div style={{fontSize:10,color:C.muted,marginTop:3}}>
            giorni riposo · TDEE {tgt.tdee}{goal==="deficit"?" – 350":goal==="surplus"?" + 250":""} kcal
            <br/>giorni palestra: <b>{calcTargets("gym",goal,prof).kcal} kcal</b>
          </div>
        </div>
        {[{l:"Proteine",v:tgt.p,c:C.lime,u:"g",n:"2.2g/kg LBM"},{l:"Carboidrati",v:tgt.c,c:C.blue,u:"g",n:Math.round(tgt.c*4)+" kcal"},{l:"Grassi",v:tgt.f,c:C.amber,u:"g",n:"28% kcal"}].map(({l,v,c,u,n})=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+C.border}}>
            <div><div style={{fontSize:12}}>{l}</div><div style={{fontSize:9,color:C.muted,marginTop:1}}>{n}</div></div>
            <div style={{textAlign:"right"}}><span style={{fontFamily:"'Unbounded',sans-serif",fontSize:16,fontWeight:700,color:c}}>{v}</span><span style={{fontSize:10,color:C.muted,marginLeft:3}}>{u}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

const css=`
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Unbounded:wght@400;700;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#f5f5f0;color:#1a1a18;font-family:'DM Mono',monospace;-webkit-font-smoothing:antialiased;}
.app{min-height:100vh;padding-bottom:72px;}
.hdr{position:sticky;top:0;z-index:50;background:rgba(245,245,240,.92);backdrop-filter:blur(16px);border-bottom:1px solid #e2e0d8;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;}
.logo{font-family:'Unbounded',sans-serif;font-size:12px;font-weight:700;letter-spacing:.14em;color:#5a8a00;}
.dnav{display:flex;align-items:center;gap:10px;}
.dbtn{background:#fff;border:1px solid #e2e0d8;color:#1a1a18;width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:14px;transition:border-color .2s;}
.dbtn:hover{border-color:#5a8a00;}
.dlabel{font-size:11px;color:#6b6960;min-width:68px;text-align:center;}
.main{max-width:840px;margin:0 auto;padding:18px 14px;}
.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px;}
.sc{background:#fff;border:1px solid #e2e0d8;border-radius:12px;padding:12px 12px 10px;border-top:3px solid var(--cc);}
.sc-lbl{font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:#6b6960;margin-bottom:5px;}
.sc-val{font-family:'Unbounded',sans-serif;font-size:18px;font-weight:700;color:var(--cc);line-height:1;}
.sc-unit{font-size:8px;color:#6b6960;margin-top:2px;}
.sc-bar{margin-top:7px;height:3px;background:#e2e0d8;border-radius:2px;overflow:hidden;}
.sc-fill{height:100%;border-radius:2px;background:var(--cc);transition:width .5s cubic-bezier(.4,0,.2,1);}
.sc-tgt{font-size:8px;color:#6b6960;margin-top:3px;}
.act-strip{display:flex;gap:6px;margin-bottom:16px;overflow-x:auto;padding-bottom:2px;}
.act-btn{flex:0 0 auto;padding:7px 14px;background:#fff;border:1px solid #e2e0d8;border-radius:20px;font-family:'DM Mono',monospace;font-size:11px;color:#6b6960;cursor:pointer;transition:all .2s;white-space:nowrap;}
.act-btn.on{background:#e8f5c0;border-color:#5a8a00;color:#5a8a00;font-weight:500;}
.tab-nav{display:flex;gap:6px;margin-bottom:16px;border-bottom:1px solid #e2e0d8;padding-bottom:0;}
.tab-btn{padding:8px 16px;background:none;border:none;border-bottom:2px solid transparent;font-family:'DM Mono',monospace;font-size:12px;color:#6b6960;cursor:pointer;transition:all .2s;margin-bottom:-1px;}
.tab-btn.on{color:#5a8a00;border-bottom-color:#5a8a00;}
.ibox{background:#fff;border:1px solid #e2e0d8;border-radius:14px;padding:14px;margin-bottom:12px;}
.ibox-hdr{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
.ibox-title{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#6b6960;}
.badge{font-size:9px;padding:2px 7px;border-radius:4px;}
.badge-lime{background:#e8f5c0;color:#5a8a00;}
.badge-blue{background:#ddeef8;color:#1a6fa8;}
.irow{display:flex;gap:8px;align-items:flex-end;}
.ita{flex:1;background:#f0efe8;border:1px solid #e2e0d8;border-radius:9px;color:#1a1a18;font-family:'DM Mono',monospace;font-size:12px;padding:10px 12px;outline:none;resize:none;min-height:50px;transition:border-color .2s;line-height:1.5;}
.ita:focus{border-color:#5a8a00;}
.ita::placeholder{color:#a8a59c;}
.ibtn{height:50px;padding:0 16px;background:#5a8a00;color:#fff;border:none;border-radius:9px;font-family:'Unbounded',sans-serif;font-size:11px;font-weight:700;cursor:pointer;transition:opacity .2s;white-space:nowrap;flex-shrink:0;}
.ibtn:hover:not(:disabled){opacity:.85;}
.ibtn:disabled{opacity:.35;cursor:not-allowed;}
.scan-btn{height:50px;width:50px;flex-shrink:0;background:#f0efe8;border:1px solid #e2e0d8;border-radius:9px;font-size:20px;cursor:pointer;transition:border-color .2s;display:flex;align-items:center;justify-content:center;}
.scan-btn:hover{border-color:#5a8a00;}
.ai-loading{display:flex;align-items:center;gap:8px;font-size:10px;color:#1a6fa8;margin-top:8px;}
.dots span{display:inline-block;width:4px;height:4px;border-radius:50%;background:#1a6fa8;margin:0 2px;animation:db .9s ease-in-out infinite;}
.dots span:nth-child(2){animation-delay:.15s;}.dots span:nth-child(3){animation-delay:.3s;}
@keyframes db{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}
.preview{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px;}
.pchip{display:flex;align-items:center;gap:5px;background:#f0efe8;border:1px solid #e2e0d8;border-radius:8px;padding:5px 9px;font-size:11px;animation:ci .15s ease;}
@keyframes ci{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
.pchip-raw{border-color:#1a6fa8;background:#ddeef8;}
.pchip-cooked{border-color:#b85c00;background:#fdecd8;}
.pchip-rm{background:none;border:none;color:#6b6960;cursor:pointer;font-size:11px;padding:0 0 0 2px;}
.pchip-rm:hover{color:#cc2200;}
.cat-row{display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;}
.cat-sel{background:#f0efe8;border:1px solid #e2e0d8;border-radius:8px;color:#6b6960;font-family:'DM Mono',monospace;font-size:11px;padding:6px 9px;outline:none;cursor:pointer;}
.add-all-btn{padding:7px 16px;background:#5a8a00;color:#fff;border:none;border-radius:8px;font-family:'Unbounded',sans-serif;font-size:10px;font-weight:700;cursor:pointer;}
.add-all-btn:hover{opacity:.85;}
.tip{display:flex;gap:8px;align-items:flex-start;background:#ddeef8;border:1px solid #1a6fa833;border-radius:8px;padding:8px 12px;margin-top:8px;}
.tip-text{font-size:10px;color:#6b6960;line-height:1.7;}
.tip-text b{color:#1a6fa8;}
.man-hdr{display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;padding:11px 14px;background:#fff;border:1px solid #e2e0d8;border-radius:12px;margin-bottom:12px;transition:border-color .2s;}
.man-hdr:hover{border-color:#5a8a0055;}
.man-hdr-open{border-radius:12px 12px 0 0;margin-bottom:0;border-bottom-color:transparent;}
.man-body{background:#fff;border:1px solid #e2e0d8;border-top:none;border-radius:0 0 12px 12px;padding:12px 14px 14px;margin-bottom:12px;}
.slbl{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#6b6960;}
.chv{font-size:10px;color:#6b6960;transition:transform .2s;}
.chv.open{transform:rotate(180deg);}
.fgrid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:8px;align-items:end;margin-top:8px;}
.field{display:flex;flex-direction:column;gap:3px;}
.field label{font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:#6b6960;}
.field input,.field select{background:#f0efe8;border:1px solid #e2e0d8;border-radius:7px;color:#1a1a18;font-family:'DM Mono',monospace;font-size:12px;padding:7px 9px;outline:none;transition:border-color .2s;width:100%;}
.field input:focus,.field select:focus{border-color:#5a8a00;}
.field input::placeholder{color:#a8a59c;}
.btn-add{background:#5a8a00;color:#fff;border:none;border-radius:7px;font-family:'Unbounded',sans-serif;font-size:10px;font-weight:700;padding:8px 12px;cursor:pointer;height:34px;white-space:nowrap;}
.ac-wrap{position:relative;}
.ac-list{position:absolute;top:calc(100% + 3px);left:0;right:0;background:#fff;border:1px solid #e2e0d8;border-radius:9px;z-index:200;box-shadow:0 6px 24px rgba(0,0,0,.1);max-height:180px;overflow-y:auto;}
.ac-item{padding:8px 12px;cursor:pointer;transition:background .12s;display:flex;justify-content:space-between;align-items:center;font-size:12px;}
.ac-item:hover,.ac-item.act{background:#f0efe8;}
.ac-meta{font-size:10px;color:#6b6960;}
.sec-lbl{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#6b6960;margin-bottom:10px;margin-top:2px;}
.mg{margin-bottom:16px;}
.mg-title{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#6b6960;padding:0 4px 6px;border-bottom:2px solid #e2e0d8;margin-bottom:8px;}
.entry{background:#fff;border:1px solid #e2e0d8;border-radius:10px;padding:9px 12px;display:flex;align-items:center;gap:7px;margin-bottom:5px;transition:border-color .2s;animation:ei .18s ease;}
@keyframes ei{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
.entry:hover{border-color:#5a8a0055;}
.en{flex:1;font-size:12px;}
.eq{font-size:10px;color:#6b6960;margin-left:3px;}
.pill{font-size:9px;padding:2px 6px;border-radius:4px;font-weight:500;white-space:nowrap;}
.pk{background:#fce4f0;color:#b5006e;}
.pp{background:#e8f5c0;color:#5a8a00;}
.pc{background:#ddeef8;color:#1a6fa8;}
.pf{background:#fdecd8;color:#b85c00;}
.bedit{background:none;border:none;color:#6b6960;cursor:pointer;font-size:12px;padding:2px 4px;border-radius:4px;transition:color .2s;}
.bedit:hover{color:#5a8a00;}
.bdel{background:none;border:none;color:#6b6960;cursor:pointer;font-size:12px;padding:2px 4px;border-radius:4px;transition:color .2s;}
.bdel:hover{color:#cc2200;}
.mg-subtotal{display:flex;align-items:center;gap:6px;padding:6px 4px 2px;border-top:1px solid #e2e0d8;margin-top:4px;}
.mgs-lbl{font-size:9px;color:#6b6960;flex:1;letter-spacing:.06em;}
.empty{text-align:center;padding:40px 0;color:#6b6960;font-size:11px;}
.empty-ico{font-size:28px;display:block;margin-bottom:10px;}
.fab-row{position:fixed;bottom:18px;left:0;right:0;display:flex;justify-content:space-between;padding:0 18px;pointer-events:none;}
.fab{width:42px;height:42px;border-radius:50%;border:1px solid #e2e0d8;background:#fff;font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;pointer-events:all;box-shadow:0 2px 8px rgba(0,0,0,.08);}
.fab:hover{border-color:#1a6fa8;}
.povl{position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:300;}
.panel{position:fixed;top:0;bottom:0;width:min(380px,100vw);background:#fff;z-index:400;display:flex;flex-direction:column;box-shadow:-4px 0 24px rgba(0,0,0,.08);}
.pr{right:0;border-left:1px solid #e2e0d8;transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);}
.pr.open{transform:translateX(0);}
.pl{left:0;border-right:1px solid #e2e0d8;transform:translateX(-100%);transition:transform .3s cubic-bezier(.4,0,.2,1);}
.pl.open{transform:translateX(0);}
.phd{padding:14px 16px;border-bottom:1px solid #e2e0d8;display:flex;justify-content:space-between;align-items:center;}
.phd h2{font-family:'Unbounded',sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;}
.pcls{background:none;border:none;color:#6b6960;font-size:16px;cursor:pointer;}
.pb{flex:1;overflow-y:auto;padding:12px;}
.hd{margin-bottom:8px;background:#f0efe8;border:1px solid #e2e0d8;border-radius:10px;overflow:hidden;}
.hdh{padding:9px 12px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;}
.hdh:hover{background:#e2e0d855;}
.hdt{font-size:11px;}.hdk{font-size:12px;color:#b5006e;font-weight:500;}
.hdb{padding:0 12px 8px;}
.hde{font-size:10px;color:#6b6960;padding:3px 0;}
.dbi{background:#f0efe8;border:1px solid #e2e0d8;border-radius:9px;padding:8px 12px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;}
.dbn{font-size:12px;}.dbm{font-size:10px;color:#6b6960;margin-top:1px;}
.db-sec-hdr{display:flex;justify-content:space-between;align-items:center;padding:7px 2px;cursor:pointer;border-bottom:1px solid #e2e0d8;margin-bottom:6px;}
.db-sec-lbl{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#6b6960;}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:600;display:flex;align-items:center;justify-content:center;padding:14px;}
.modal{background:#fff;border:1px solid #e2e0d8;border-radius:16px;padding:22px;max-width:460px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,.12);}
.modal-title{font-family:'Unbounded',sans-serif;font-size:13px;font-weight:700;color:#5a8a00;margin-bottom:4px;}
.modal-sub{font-size:10px;color:#6b6960;margin-bottom:16px;}
.cif{display:flex;flex-direction:column;gap:3px;}
.cif label{font-size:8px;color:#6b6960;letter-spacing:.1em;text-transform:uppercase;}
.cif input,.cif select{background:#f0efe8;border:1px solid #e2e0d8;border-radius:6px;color:#1a1a18;font-family:'DM Mono',monospace;font-size:12px;padding:6px 8px;outline:none;width:100%;transition:border-color .2s;}
.cif input:focus,.cif select:focus{border-color:#5a8a00;}
.modal-actions{display:flex;gap:8px;}
.btn-confirm{flex:1;padding:11px;background:#5a8a00;color:#fff;border:none;border-radius:9px;font-family:'Unbounded',sans-serif;font-size:11px;font-weight:700;cursor:pointer;}
.btn-confirm:hover{opacity:.85;}
.btn-cancel{padding:11px 16px;background:none;border:1px solid #e2e0d8;border-radius:9px;color:#6b6960;font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;}
.btn-cancel:hover{border-color:#cc2200;color:#cc2200;}
.toast{position:fixed;bottom:68px;left:50%;transform:translateX(-50%);background:#1a1a18;border-radius:9px;padding:9px 18px;font-size:12px;color:#fff;z-index:999;max-width:300px;text-align:center;animation:ti .3s ease;}
@keyframes ti{from{opacity:0;transform:translateX(-50%) translateY(6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@media(max-width:560px){
  .summary{grid-template-columns:repeat(2,1fr);}
  .fgrid{grid-template-columns:1fr 1fr;}
  .entry .pc,.entry .pf{display:none;}
}
`;

export default function MacroTracker(){
  const[date,setDate]=useState(todayStr);
  const[log,setLog]=useState(()=>getLog(todayStr()));
  const[activity,setActivitySt]=useState(()=>getActivity(todayStr()));
  const[goal,setGoalSt]=useState(getGoal);
  const[prof,setProf]=useState(getProfile);
  const[activeTab,setActiveTab]=useState("log");
  const[inputText,setInputText]=useState("");
  const[preview,setPreview]=useState([]);
  const[aiLoading,setAiLoading]=useState(false);
  const[selectedCat,setSelectedCat]=useState("pranzo");
  const[showScanner,setShowScanner]=useState(false); // false | 'search' | 'camera'
  const[showHistory,setShowHistory]=useState(false);
  const[showDB,setShowDB]=useState(false);
  const[showManual,setShowManual]=useState(false);
  const[toast,setToast]=useState(null);
  const[userDB,setUserDB]=useState(getUserDB);
  const[manForm,setManForm]=useState({name:"",qty:"",kcal:"",pcg:"",cat:"pranzo"});
  const[acMatches,setAcMatches]=useState([]);
  const[acIdx,setAcIdx]=useState(-1);
  const[histExp,setHistExp]=useState({});
  const[dbExp,setDbExp]=useState({});
  const[editingEntry,setEditingEntry]=useState(null);
  const toastTimer=useRef(null);

  const setGoal=g=>{setGoalSt(g);saveGoal(g);};
  const showT=useCallback(msg=>{setToast(msg);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(null),2800);},[]);
  const shiftDate=d=>{const nd=new Date(date+"T12:00:00");nd.setDate(nd.getDate()+d);const s=nd.toISOString().slice(0,10);setDate(s);setLog(getLog(s));setActivitySt(getActivity(s));};
  const setActivity=a=>{setActivitySt(a);saveActivity(date,a);};
  const dateLabel=()=>{if(date===todayStr())return"Oggi";return new Date(date+"T12:00:00").toLocaleDateString("it-IT",{weekday:"short",day:"2-digit",month:"short"});};

  const tgt=calcTargets(activity,goal,prof);
  const totals=log.reduce((a,e)=>({kcal:a.kcal+e.kcal,p:a.p+e.p,c:a.c+e.c,f:a.f+e.f}),{kcal:0,p:0,c:0,f:0});

  const makePreviewItems=items=>items.map(({food,qty,category:ic,isRaw,isCooked,catDetected})=>({
    food,qty,category:(catDetected?ic:null)||selectedCat,isRaw,isCooked,
    kcal:+(food.kcal*qty/100).toFixed(1),p:+(food.p*qty/100).toFixed(1),
    c:+(food.c*qty/100).toFixed(1),f:+(food.f*qty/100).toFixed(1),
  }));

  const handleInput=val=>{
    setInputText(val);
    if(!val.trim()){setPreview([]);return;}
    const{items,category}=localParse(val);
    setSelectedCat(category);
    if(items.length)setPreview(makePreviewItems(items));
    else setPreview([]);
  };

  const handleAnalyze=async()=>{
    const text=inputText.trim();if(!text)return;
    const{items,category}=localParse(text);
    setSelectedCat(category);
    const localResolved=makePreviewItems(items);
    if(localResolved.length&&!needsAI(text)){setPreview(localResolved);return;}
    if(!localResolved.length&&!needsAI(text)){showT("Nessun alimento riconosciuto — prova ad essere più specifico");return;}
    setAiLoading(true);
    const foods=getAllFoods();
    const foodList=foods.slice(0,80).map(f=>f.name+":"+f.kcal+"kcal,P"+f.p+"C"+f.c+"G"+f.f).join(";");
    const histCtx=[...Array(4)].map((_,i)=>{
      const d=new Date(date+"T12:00:00");d.setDate(d.getDate()-i-1);
      const l=getLog(d.toISOString().slice(0,10));
      if(!l.length)return"";
      return(i===0?"ieri":(i+1)+"gg fa")+": "+l.map(e=>e.name+e.qty+"g").join(",");
    }).filter(Boolean).join("|");
    const sys="Nutrizionista preciso. Estrai alimenti non riconosciuti e rispondi SOLO JSON array.\nDB:"+foodList+"\nSTORICO:"+histCtx+"\nREGOLE: filo d olio=5g, qualche=30-50g, verdure senza quantita=100g, category:colazione|spuntino_m|pranzo|spuntino_p|cena\nJSON:[{\"name\":\"...\",\"qty\":100,\"category\":\"pranzo\",\"kcalPer100\":165,\"p100\":31,\"c100\":0,\"f100\":4}]";
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,system:sys,messages:[{role:"user",content:text}]})});
      const data=await res.json();
      const raw=(data.content||[]).map(b=>b.text||"").join("");
      const aiItems=JSON.parse(raw.replace(/```json|```/g,"").trim());
      const aiResolved=aiItems.map(item=>({
        food:{name:item.name,kcal:item.kcalPer100,p:item.p100,c:item.c100,f:item.f100},
        qty:item.qty,category:item.category||category,isRaw:false,isCooked:false,
        kcal:+(item.kcalPer100*item.qty/100).toFixed(1),p:+(item.p100*item.qty/100).toFixed(1),
        c:+(item.c100*item.qty/100).toFixed(1),f:+(item.f100*item.qty/100).toFixed(1),
      }));
      setPreview([...localResolved,...aiResolved]);
    }catch(e){
      if(localResolved.length){setPreview(localResolved);showT("AI non disponibile — mostro alimenti riconosciuti");}
      else showT("Alimento non trovato. Prova l'inserimento manuale.");
    }finally{setAiLoading(false);}
  };

  const removePreview=i=>setPreview(p=>p.filter((_,idx)=>idx!==i));
  const commitPreview=()=>{
    if(!preview.length)return;
    const nl=[...log];
    preview.forEach(item=>{
      nl.push({id:Date.now()+Math.random(),name:item.food.name,qty:item.qty,category:item.category||selectedCat,kcal:item.kcal,p:item.p,c:item.c,f:item.f,kcalPer100:item.food.kcal,p100:item.food.p,c100:item.food.c,f100:item.food.f});
      learnFood(item.food.name,item.food.kcal,item.food.p,item.food.c,item.food.f);
    });
    saveLog(date,nl);setLog(nl);setUserDB(getUserDB());setPreview([]);setInputText("");
  };

  const handleBarcodeResult=result=>{
    setShowScanner(false);
    const entry={
      food:{name:result.name,kcal:result.kcal,p:result.p100,c:result.c100,f:result.f100},
      qty:100,category:selectedCat,isRaw:false,isCooked:false,
      kcal:result.kcal,p:result.p100,c:result.c100,f:result.f100,
    };
    setPreview(prev=>[...prev,entry]);
    showT("Prodotto trovato! Modifica la quantità se necessario.");
  };

  const openEdit=e=>setEditingEntry({...e,qty:String(e.qty),kcalPer100:String(e.kcalPer100||(e.kcal/(e.qty/100)).toFixed(1)),p100:String(e.p100||((e.p/(e.qty/100))).toFixed(1)),c100:String(e.c100||((e.c/(e.qty/100))).toFixed(1)),f100:String(e.f100||((e.f/(e.qty/100))).toFixed(1))});
  const saveEdit=()=>{
    if(!editingEntry)return;
    const qty=parseFloat(editingEntry.qty)||0,k100=parseFloat(editingEntry.kcalPer100)||0;
    const p100=parseFloat(editingEntry.p100)||0,c100=parseFloat(editingEntry.c100)||0,f100=parseFloat(editingEntry.f100)||0;
    const factor=qty/100;
    const updated={...editingEntry,qty,kcalPer100:k100,p100,c100,f100,kcal:+(k100*factor).toFixed(1),p:+(p100*factor).toFixed(1),c:+(c100*factor).toFixed(1),f:+(f100*factor).toFixed(1)};
    const nl=log.map(e=>e.id===updated.id?updated:e);
    saveLog(date,nl);setLog(nl);setEditingEntry(null);
  };
  const deleteEntry=id=>{const nl=log.filter(e=>e.id!==id);saveLog(date,nl);setLog(nl);};

  const addManual=()=>{
    const{name,qty,kcal,pcg,cat}=manForm;
    if(!name||!qty||!kcal||!pcg){showT("Compila tutti i campi");return;}
    const parts=pcg.split("/").map(Number);
    if(parts.length!==3||parts.some(isNaN)){showT("Formato P/C/G non valido");return;}
    const[p100,c100,f100]=parts,factor=+qty/100;
    const entry={id:Date.now(),name,qty:+qty,category:cat,kcal:+(+kcal*factor).toFixed(1),p:+(p100*factor).toFixed(1),c:+(c100*factor).toFixed(1),f:+(f100*factor).toFixed(1),kcalPer100:+kcal,p100,c100,f100};
    const nl=[...log,entry];saveLog(date,nl);setLog(nl);
    learnFood(name,+kcal,p100,c100,f100);setUserDB(getUserDB());
    setManForm({name:"",qty:"",kcal:"",pcg:"",cat:"pranzo"});setAcMatches([]);
  };
  const handleManName=val=>{
    setManForm(f=>({...f,name:val}));
    if(!val){setAcMatches([]);return;}
    const m=getAllFoods().filter(f=>f.name.toLowerCase().includes(val.toLowerCase())).sort((a,b)=>(b.uses||0)-(a.uses||0)).slice(0,8);
    setAcMatches(m);setAcIdx(-1);
  };
  const selAC=food=>{setManForm(f=>({...f,name:food.name,kcal:String(food.kcal),pcg:food.p+"/"+food.c+"/"+food.f}));setAcMatches([]);};

  const groups={};CAT_ORDER.forEach(c=>groups[c]=[]);
  log.forEach(e=>{if(!groups[e.category])groups[e.category]=[];groups[e.category].push(e);});
  const histKeys=Object.keys(localStorage).filter(k=>k.startsWith("log_")).map(k=>k.replace("log_","")).sort().reverse();
  const allDBFoods=getAllFoods().sort((a,b)=>(b.uses||0)-(a.uses||0));
  const delUserFood=k=>{const db=getUserDB();delete db[k];saveUserDB(db);setUserDB(getUserDB());};

  const SC=({label,value,unit,target,color,pct})=>(
    <div className="sc" style={{"--cc":color}}>
      <div className="sc-lbl">{label}</div>
      <div className="sc-val">{value}</div>
      <div className="sc-unit">{unit}</div>
      <div className="sc-bar"><div className="sc-fill" style={{width:Math.min(pct,100)+"%"}}/></div>
      <div className="sc-tgt">/ {target}</div>
    </div>
  );

  return(
    <>
      <style>{css}</style>
      <div className="app">
        <header className="hdr">
          <div className="logo">⚡ Macro Tracker</div>
          <div className="dnav">
            <button className="dbtn" onClick={()=>shiftDate(-1)}>‹</button>
            <span className="dlabel">{dateLabel()}</span>
            <button className="dbtn" onClick={()=>shiftDate(1)}>›</button>
          </div>
        </header>
        <main className="main">
          <div className="summary">
            <SC label="Kcal"        value={Math.round(totals.kcal)} unit="kcal" target={tgt.kcal}     color="#b5006e" pct={totals.kcal/tgt.kcal*100}/>
            <SC label="Proteine"    value={totals.p.toFixed(1)}     unit="g"    target={tgt.p+"g"}    color="#5a8a00" pct={totals.p/tgt.p*100}/>
            <SC label="Carboidrati" value={totals.c.toFixed(1)}     unit="g"    target={tgt.c+"g"}    color="#1a6fa8" pct={totals.c/tgt.c*100}/>
            <SC label="Grassi"      value={totals.f.toFixed(1)}     unit="g"    target={tgt.f+"g"}    color="#b85c00" pct={totals.f/tgt.f*100}/>
          </div>
          <div className="act-strip">
            {ACTIVITY_OPTIONS.map(a=>(
              <button key={a.id} className={"act-btn"+(activity===a.id?" on":"")} onClick={()=>setActivity(a.id)}>
                {a.label}<span style={{fontSize:9,opacity:.7,marginLeft:4}}>+{a.extraKcal}kcal</span>
              </button>
            ))}
          </div>
          <div className="tab-nav">
            <button className={"tab-btn"+(activeTab==="log"?" on":"")} onClick={()=>setActiveTab("log")}>📋 Diario</button>
            <button className={"tab-btn"+(activeTab==="profilo"?" on":"")} onClick={()=>setActiveTab("profilo")}>👤 Profilo & Target</button>
          </div>
          {activeTab==="profilo"&&<ProfiloPanel goal={goal} setGoal={setGoal} prof={prof} setProf={setProf}/>}
          {activeTab==="log"&&<>
            <div className="ibox">
              <div className="ibox-hdr">
                <span className="ibox-title">Cosa hai mangiato?</span>
                <span className="badge badge-lime">⚡ Istantaneo</span>
                {aiLoading&&<span className="badge badge-blue">✦ AI</span>}
              </div>
              <div className="irow">
                <textarea className="ita" value={inputText}
                  onChange={e=>handleInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleAnalyze();}}}
                  placeholder={'es. "a colazione 250g yogurt greco e 30g avena"\noppure "200g pollo a pranzo con insalata e olio"'}
                  rows={2}/>
                <button className="ibtn" onClick={handleAnalyze} disabled={aiLoading||!inputText.trim()}>→</button>
                <button className="scan-btn" onClick={()=>setShowScanner("search")} title="Cerca su Open Food Facts">🔍</button>
                <button className="scan-btn" onClick={()=>setShowScanner("camera")} title="Scansiona barcode con fotocamera">📷</button>
              </div>
              {preview.length>0&&(
                <>
                  <div className="preview">
                    {preview.map((item,i)=>(
                      <div key={i} className={"pchip"+(item.isRaw?" pchip-raw":item.isCooked?" pchip-cooked":"")}>
                        <span>{item.food.name} <span style={{color:C.muted,fontSize:10}}>{item.qty}g</span>
                          {item.isRaw&&<span style={{fontSize:9,color:C.blue,marginLeft:3}}>crudo</span>}
                          {item.isCooked&&<span style={{fontSize:9,color:C.amber,marginLeft:3}}>sgocciolato</span>}
                        </span>
                        <span style={{color:C.pink,fontSize:10}}>{item.kcal}kcal</span>
                        <button className="pchip-rm" onClick={()=>removePreview(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="cat-row">
                    <select className="cat-sel" value={selectedCat} onChange={e=>setSelectedCat(e.target.value)}>
                      {CAT_ORDER.map(c=><option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                    </select>
                    <button className="add-all-btn" onClick={commitPreview}>✓ Aggiungi{preview.length>1?" ("+preview.length+")":""}</button>
                  </div>
                </>
              )}
              {aiLoading&&<div className="ai-loading"><div className="dots"><span/><span/><span/></div><span>AI in elaborazione...</span></div>}
              <div className="tip">
                <span>🎙️</span>
                <div className="tip-text"><b>Dettatura:</b> usa il mic della tastiera · <b>iPhone</b>: 🎤 sulla tastiera · <b>Mac</b>: Fn+Fn · <b>Win</b>: Win+H</div>
              </div>
            </div>
            <div className={"man-hdr"+(showManual?" man-hdr-open":"")} onClick={()=>setShowManual(s=>!s)}>
              <span className="slbl">Inserimento manuale</span>
              <span className={"chv"+(showManual?" open":"")}>▼</span>
            </div>
            {showManual&&(
              <div className="man-body">
                <select value={manForm.cat} onChange={e=>setManForm(f=>({...f,cat:e.target.value}))}
                  style={{background:"#f0efe8",border:"1px solid #e2e0d8",borderRadius:7,color:"#6b6960",fontFamily:"'DM Mono',monospace",fontSize:11,padding:"5px 8px",outline:"none",cursor:"pointer",marginBottom:6}}>
                  {CAT_ORDER.map(c=><option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                </select>
                <div className="fgrid">
                  <div className="field ac-wrap">
                    <label>Alimento</label>
                    <input type="text" placeholder="es. Petto di pollo" value={manForm.name}
                      onChange={e=>handleManName(e.target.value)}
                      onKeyDown={e=>{if(e.key==="ArrowDown")setAcIdx(i=>Math.min(i+1,acMatches.length-1));else if(e.key==="ArrowUp")setAcIdx(i=>Math.max(i-1,0));else if(e.key==="Enter"&&acIdx>=0){selAC(acMatches[acIdx]);e.preventDefault();}else if(e.key==="Escape")setAcMatches([]);}}
                      autoComplete="off"/>
                    {acMatches.length>0&&(
                      <div className="ac-list">
                        {acMatches.map((f,i)=>(
                          <div key={f.name} className={"ac-item"+(i===acIdx?" act":"")} onMouseDown={()=>selAC(f)}>
                            <span>{f.name}</span><span className="ac-meta">{f.kcal}kcal · P{f.p}/C{f.c}/G{f.f}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="field"><label>Qtà (g)</label><input type="number" placeholder="100" value={manForm.qty} onChange={e=>setManForm(f=>({...f,qty:e.target.value}))}/></div>
                  <div className="field"><label>Kcal/100g</label><input type="number" placeholder="165" value={manForm.kcal} onChange={e=>setManForm(f=>({...f,kcal:e.target.value}))}/></div>
                  <div className="field"><label>P/C/G</label><input type="text" placeholder="31/0/4" value={manForm.pcg} onChange={e=>setManForm(f=>({...f,pcg:e.target.value}))}/></div>
                  <button className="btn-add" onClick={addManual}>+ Add</button>
                </div>
              </div>
            )}
            <div className="sec-lbl">Pasti di oggi</div>
            {log.length===0
              ?<div className="empty"><span className="empty-ico">🍽️</span>Nessun alimento registrato</div>
              :CAT_ORDER.map(cat=>{
                if(!groups[cat]?.length)return null;
                const st=groups[cat].reduce((a,e)=>({k:a.k+e.kcal,p:a.p+e.p,c:a.c+e.c,f:a.f+e.f}),{k:0,p:0,c:0,f:0});
                return(
                  <div key={cat} className="mg">
                    <div className="mg-title">{CAT_LABELS[cat]}</div>
                    {groups[cat].map(e=>(
                      <div key={e.id} className="entry">
                        <span className="en">{e.name}<span className="eq"> {e.qty}g</span></span>
                        <span className="pill pk">{e.kcal}kcal</span>
                        <span className="pill pp">P {e.p}g</span>
                        <span className="pill pc">C {e.c}g</span>
                        <span className="pill pf">G {e.f}g</span>
                        <button className="bedit" onClick={()=>openEdit(e)}>✏️</button>
                        <button className="bdel" onClick={()=>deleteEntry(e.id)}>✕</button>
                      </div>
                    ))}
                    <div className="mg-subtotal">
                      <span className="mgs-lbl">Totale</span>
                      <span className="pill pk">{Math.round(st.k)}kcal</span>
                      <span className="pill pp">P {st.p.toFixed(1)}g</span>
                      <span className="pill pc">C {st.c.toFixed(1)}g</span>
                      <span className="pill pf">G {st.f.toFixed(1)}g</span>
                    </div>
                  </div>
                );
              })}
          </>}
        </main>
        <div className="fab-row">
          <button className="fab" onClick={()=>setShowDB(true)}>🗂️</button>
          <button className="fab" onClick={()=>setShowHistory(true)}>📅</button>
        </div>
        {editingEntry&&(
          <div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget)setEditingEntry(null);}}>
            <div className="modal">
              <div className="modal-title">✏️ Modifica</div>
              <div className="modal-sub">{editingEntry.name}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                <div className="cif"><label>Quantità (g)</label><input type="number" value={editingEntry.qty} onChange={e=>setEditingEntry(v=>({...v,qty:e.target.value}))}/></div>
                <div className="cif"><label>Tipo pasto</label>
                  <select value={editingEntry.category} onChange={e=>setEditingEntry(v=>({...v,category:e.target.value}))}
                    style={{background:"#f0efe8",border:"1px solid #e2e0d8",borderRadius:6,color:"#1a1a18",fontFamily:"'DM Mono',monospace",fontSize:11,padding:"6px 8px",outline:"none",width:"100%"}}>
                    {CAT_ORDER.map(c=><option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                  </select>
                </div>
                <div className="cif" style={{gridColumn:"1/-1"}}><label>Kcal/100g</label><input type="number" value={editingEntry.kcalPer100} onChange={e=>setEditingEntry(v=>({...v,kcalPer100:e.target.value}))}/></div>
                <div className="cif"><label>Proteine/100g</label><input type="number" value={editingEntry.p100} onChange={e=>setEditingEntry(v=>({...v,p100:e.target.value}))}/></div>
                <div className="cif"><label>Carbo/100g</label><input type="number" value={editingEntry.c100} onChange={e=>setEditingEntry(v=>({...v,c100:e.target.value}))}/></div>
                <div className="cif"><label>Grassi/100g</label><input type="number" value={editingEntry.f100} onChange={e=>setEditingEntry(v=>({...v,f100:e.target.value}))}/></div>
              </div>
              <div className="modal-actions">
                <button className="btn-confirm" onClick={saveEdit}>✓ Salva</button>
                <button className="btn-cancel" onClick={()=>setEditingEntry(null)}>Annulla</button>
              </div>
            </div>
          </div>
        )}
        {showHistory&&(
          <><div className="povl" onClick={()=>setShowHistory(false)}/>
          <div className="panel pr open">
            <div className="phd"><h2>📅 Storico</h2><button className="pcls" onClick={()=>setShowHistory(false)}>✕</button></div>
            <div className="pb">
              {histKeys.length===0?<p style={{color:C.muted,fontSize:12,textAlign:"center",padding:28}}>Nessuna cronologia</p>
              :histKeys.map(d=>{
                const l=getLog(d);if(!l.length)return null;
                let hk=0,hp=0,hc=0,hf=0;l.forEach(e=>{hk+=e.kcal;hp+=e.p;hc+=e.c;hf+=e.f;});
                const lbl=new Date(d+"T12:00:00").toLocaleDateString("it-IT",{weekday:"short",day:"2-digit",month:"short"});
                return(
                  <div key={d} className="hd">
                    <div className="hdh" onClick={()=>setHistExp(p=>({...p,[d]:!p[d]}))}>
                      <span className="hdt">{lbl}</span><span className="hdk">{Math.round(hk)} kcal</span>
                    </div>
                    {histExp[d]&&<div className="hdb">
                      <div style={{fontSize:10,color:C.muted,marginBottom:5}}>P {hp.toFixed(0)}g · C {hc.toFixed(0)}g · G {hf.toFixed(0)}g</div>
                      {l.map((e,i)=><div key={i} className="hde">· {e.name} {e.qty}g — {e.kcal} kcal</div>)}
                    </div>}
                  </div>
                );
              })}
            </div>
          </div></>
        )}
        {showDB&&(
          <><div className="povl" onClick={()=>setShowDB(false)}/>
          <div className="panel pl open">
            <div className="phd"><h2>🗂️ Alimenti ({allDBFoods.length})</h2><button className="pcls" onClick={()=>setShowDB(false)}>✕</button></div>
            <div className="pb">
              <div style={{fontSize:10,color:C.muted,marginBottom:10}}>{BASE_FOODS.length} base · <span style={{color:C.lime}}>✦ {Object.keys(userDB).length} tuoi</span></div>
              {Object.entries(DB_SECTION_META).map(([catKey,{label}])=>{
                const foods=allDBFoods.filter(f=>(f.cat||"user")===catKey);
                if(!foods.length)return null;
                const open=dbExp[catKey]!==false;
                return(
                  <div key={catKey} style={{marginBottom:10}}>
                    <div className="db-sec-hdr" onClick={()=>setDbExp(p=>({...p,[catKey]:!open}))}>
                      <span className="db-sec-lbl">{label} ({foods.length})</span>
                      <span style={{fontSize:10,color:C.muted,transform:open?"rotate(180deg)":"none",display:"inline-block",transition:"transform .2s"}}>▼</span>
                    </div>
                    {open&&foods.map(f=>(
                      <div key={f.name} className="dbi">
                        <div>
                          <div className="dbn">{f.name}{f.source==="user"&&<span style={{fontSize:9,color:C.lime,marginLeft:4}}>✦</span>}</div>
                          <div className="dbm">{f.kcal}kcal · P{f.p} C{f.c} G{f.f}{f.uses?" · "+f.uses+"×":""}</div>
                        </div>
                        {f.source==="user"&&<button className="bdel" onClick={()=>delUserFood(f.name.toLowerCase())}>✕</button>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div></>
        )}
        {showScanner==="search"&&<ProductSearch onResult={handleBarcodeResult} onClose={()=>setShowScanner(false)}/>}
        {showScanner==="camera"&&<BarcodeScanner onResult={handleBarcodeResult} onClose={()=>setShowScanner(false)}/>}
        {toast&&<div className="toast">{toast}</div>}
      </div>
    </>
  );
}
