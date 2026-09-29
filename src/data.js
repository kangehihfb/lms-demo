const NOW0=new Date('2026-09-28T20:41:07');
let now=new Date(NOW0);
const T=(h,m,s=0)=>{const d=new Date(NOW0); d.setHours(h,m,s,0); return d;};
const hm=d=>`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
const U={a:"수학 상 · 이차함수 최대최소",b:"영어 구문 · 관계사 심화",c:"수학 하 · 삼각함수 활용",d:"영어 독해 · 빈칸추론 3강",e:"수학 1 · 수열의 극한",f:"영어 어법 · 준동사",g:"수학 상 · 절대부등식",h:"영어 독해 · 순서배열",i:"수학 2 · 미분계수"};
const CLS={
  "19:00":{range:"19:00–20:00", start:T(19,0), end:T(20,0)},
  "20:00":{range:"20:00–21:00", start:T(20,0), end:T(21,0)},
  "20:30":{range:"20:30–21:30", start:T(20,30), end:T(21,30)},
  "21:30":{range:"21:30–22:30", start:T(21,30), end:T(22,30)},
};
// st: live | offline | done | ended | absent | pre
const S=[
  {name:"김서연",cls:"20:00",st:"live",unit:U.a,cur:7,total:10,wrong:[3],since:T(20,30,40),last:"쌤 7번 이거 왜 이렇게 돼요?",img:true},
  {name:"박도윤",cls:"20:00",st:"live",unit:U.b,cur:5,total:10,wrong:[2],since:T(20,38,10),last:"사진 보냈어요 확인해주세요",img:true},
  {name:"이하준",cls:"20:00",st:"offline",unit:U.c,cur:0,total:10,wrong:[],since:T(20,0,0),last:"",memo:"지난주 목요일도 결석"},
  {name:"최지우",cls:"20:00",st:"live",unit:U.d,cur:8,total:10,wrong:[4],since:T(20,39,2),last:"여기까지 했어요"},
  {name:"정예준",cls:"20:00",st:"live",unit:U.e,cur:4,total:10,wrong:[],since:T(20,37,30),last:"2번 답이 3번 아니에요?"},
  {name:"강수아",cls:"20:00",st:"live",unit:U.f,cur:9,total:10,wrong:[1,6],since:T(20,40,1),last:"감사합니다 👍"},
  {name:"윤시우",cls:"20:30",st:"live",unit:U.g,cur:0,total:10,wrong:[],since:T(20,34,50),last:"지금 시작할게요"},
  {name:"임채원",cls:"20:30",st:"live",unit:U.h,cur:3,total:10,wrong:[],since:T(20,39,40),last:"넵 알겠습니다"},
  {name:"오건우",cls:"20:30",st:"live",unit:U.i,cur:4,total:10,wrong:[2],since:T(20,36,0),last:"이 문제 잘 모르겠어요"},
  {name:"한서윤",cls:"20:30",st:"done",unit:U.a,cur:10,total:10,wrong:[5],since:T(20,40,20),last:"다 풀었어요!"},
  {name:"신민재",cls:"20:30",st:"live",unit:U.b,cur:2,total:10,wrong:[],since:T(20,40,30),last:"오늘 조금 늦었어요",memo:"보강 필요"},
  {name:"조유진",cls:"20:30",st:"live",unit:U.c,cur:6,total:10,wrong:[3,4,5],since:T(20,38,0),last:"계속 틀려요 ㅠ"},
  {name:"배준호",cls:"20:30",st:"live",unit:U.d,cur:3,total:10,wrong:[],since:T(20,40,10),last:"넵"},
  {name:"문지호",cls:"21:30",st:"pre",unit:U.e,cur:0,total:10,wrong:[],last:""},
  {name:"송아린",cls:"21:30",st:"pre",unit:U.f,cur:0,total:10,wrong:[],last:"쌤 오늘 10분 일찍 들어가도 돼요?"},
  {name:"권태현",cls:"21:30",st:"pre",unit:U.g,cur:0,total:10,wrong:[],last:""},
  {name:"황시윤",cls:"21:30",st:"pre",unit:U.h,cur:0,total:10,wrong:[],last:""},
  {name:"고은서",cls:"21:30",st:"pre",unit:U.i,cur:0,total:10,wrong:[],last:""},
  {name:"남주원",cls:"21:30",st:"pre",unit:U.a,cur:0,total:10,wrong:[],last:""},
  // 이미 끝난 19:00 반
  {name:"이서진",cls:"19:00",st:"ended",unit:U.b,cur:10,total:10,wrong:[2,7],since:T(19,58,0),last:"수고하셨습니다!",endAt:T(20,0)},
  {name:"김도현",cls:"19:00",st:"ended",unit:U.e,cur:10,total:10,wrong:[4],since:T(19,55,0),last:"넵 내일 봬요",endAt:T(20,0)},
  {name:"박하은",cls:"19:00",st:"ended",unit:U.h,cur:6,total:10,wrong:[1,3,5],since:T(19,59,0),last:"다 못 풀었어요 ㅠ",endAt:T(20,0),memo:"6번부터 숙제로"},
  {name:"정민서",cls:"19:00",st:"absent",unit:U.c,cur:0,total:10,wrong:[],last:"",memo:"감기 · 학부모 연락 옴"},
];
S.forEach((s,i)=>{s.id=i; s.sent=[]; s.memo=s.memo||"";});
let A=[
  {id:"a1",sid:2,sev:"alarm",kind:"offline",text:"수업 시간인데 미접속",at:T(20,0,0)},
  {id:"a2",sid:0,sev:"alarm",kind:"stuck",text:"7번 문항에서 10분째 멈춤",at:T(20,30,40)},
  {id:"a3",sid:1,sev:"warning",kind:"chat",n:2,text:"새 채팅 2건 · 3분 넘게 미응답",at:T(20,38,10)},
  {id:"a4",sid:6,sev:"warning",kind:"nostart",text:"6분째 학습 미시작",at:T(20,34,50)},
  {id:"a5",sid:11,sev:"warning",kind:"wrong",text:"연속 오답 3회",at:T(20,38,0),waitAt:T(20,39,10)},
  {id:"a6",sid:0,sev:"caution",kind:"chat",n:3,text:"새 채팅 3건 · 사진 1장",at:T(20,39,30)},
  {id:"a7",sid:4,sev:"caution",kind:"chat",n:1,text:"새 채팅 1건",at:T(20,40,5)},
  {id:"a8",sid:9,sev:"caution",kind:"done",text:"학습 완료 · 종료 대기",at:T(20,40,20)},
  {id:"a9",sid:14,sev:"caution",kind:"chat",n:1,text:"새 채팅 1건 (수업 전)",at:T(20,36,40)},
  {id:"a10",sid:21,sev:"caution",kind:"chat",n:1,text:"수업 후 채팅 1건",at:T(20,12,0)},
];
S[21].last="쌤 6번부터 숙제로 하면 돼요?";
const WAIT={offline:"연락함 · 접속하면 사라짐",stuck:"답장함 · 다시 풀면 사라짐",nostart:"답장함 · 시작하면 사라짐",wrong:"답장함 · 다음 문항 맞히면 사라짐"};
const SEV={alarm:0,warning:1,caution:2};
const STXT={live:"수업 중",offline:"미접속",done:"학습 완료",ended:"수업 종료",absent:"결석",pre:"수업 전"};
const SGROUP={live:"live",offline:"off",absent:"off",pre:"pre",done:"fin",ended:"fin"};
const SGL={live:"수업 중",off:"미접속 · 결석",pre:"수업 전",fin:"끝남"};

const QM=[
  "이차함수 y = −x² + 4x + 1 의 최댓값을 구하시오.",
  "x² − 6x + k = 0 이 중근을 가질 때, 상수 k 의 값은?",
  "y = 2x² − 8x + 3 의 꼭짓점의 좌표를 구하시오.",
  "0 ≤ x ≤ 3 에서 y = x² − 2x − 1 의 최솟값은?",
  "직선 y = 2x + a 가 포물선 y = x² 에 접할 때 a 의 값은?",
  "y = −(x−1)² + 5 의 그래프가 x축과 만나는 두 점 사이의 거리는?",
  "둘레가 20인 직사각형의 넓이의 최댓값을 구하시오.",
  "y = x² + 2ax + 4 의 최솟값이 0 일 때, 양수 a 의 값은?",
  "−1 ≤ x ≤ 2 에서 y = −x² + 2x + 3 의 최댓값과 최솟값의 합은?",
  "지면에서 던진 공의 높이가 h = −5t² + 20t 일 때 최고 높이는?",
];
const QE=[
  "다음 빈칸에 들어갈 관계사로 가장 적절한 것은? ― This is the house ___ my father built.",
  "밑줄 친 부분 중 어법상 틀린 것은?",
  "다음 문장을 관계대명사를 사용해 한 문장으로 바꿀 때 알맞은 것은?",
  "글의 흐름으로 보아 빈칸에 들어갈 말로 가장 적절한 것은?",
  "주어진 문장이 들어가기에 가장 적절한 곳은?",
  "다음 글의 요지로 가장 적절한 것은?",
  "밑줄 친 it 이 가리키는 것은?",
  "다음 중 what 의 쓰임이 나머지와 다른 하나는?",
  "글의 순서로 가장 적절한 것은?",
  "다음 글의 제목으로 가장 적절한 것은?",
];
const CH_M=["① 3","② 4","③ 5","④ 6","⑤ 7"], CH_E=["① which","② who","③ what","④ where","⑤ whose"];
const INK=["M20 70 C 50 30, 80 30, 110 60 S 170 90, 200 50","M230 40 l 30 0 M245 25 l 0 30","M40 95 q 20 -15 40 0 t 40 0 t 40 0","M300 70 c 10 -30 40 -30 50 0 c 10 30 40 30 50 0","M420 40 l 60 50 M480 40 l -60 50"];

const CUR=[
  {id:"c1",name:"수학 상 · 이차함수",subj:"수학",units:12,auto:"월·수·금 20:00",linked:true},
  {id:"c2",name:"영어 구문 · 관계사",subj:"영어",units:10,auto:"화·목 20:30",linked:false},
  {id:"c3",name:"수학 1 · 수열",subj:"수학",units:14,auto:"자동 발송 없음",linked:false},
  {id:"c4",name:"오답 모음 · 9월 3주",subj:"수학",units:6,auto:"토 10:00",linked:false,wrong:true},
];
const GROUPS=[
  {id:"g1",name:"고1 수학 A반",cls:"20:00",subj:"수학",cur:["c1","c4"],team:[["1모둠",[0,1,2]],["2모둠",[3,4,5]]]},
  {id:"g2",name:"고1 영어 B반",cls:"20:30",subj:"영어",cur:["c2"],team:[["1모둠",[6,7,8,9]],["2모둠",[10,11,12]]]},
  {id:"g3",name:"고2 수학 C반",cls:"21:30",subj:"수학",cur:["c3","c1"],team:[]},
  {id:"g0",name:"중3 수학 D반",cls:"19:00",subj:"수학",cur:["c1"],team:[]},
];
const gOf=s=>GROUPS.find(g=>g.cls===s.cls);
const FEEDS=[];
[["09-21",0],["09-23",0],["09-25",0],["09-28",0],["09-30",0],["10-02",0]].forEach(([d,_],i)=>FEEDS.push({d,g:"g1",c:"c1",unit:`Day ${i+5}`,st:d<"09-28"?"done":d==="09-28"?"sent":"plan"}));
[["09-22",0],["09-24",0],["09-29",0],["10-01",0]].forEach(([d,_],i)=>FEEDS.push({d,g:"g2",c:"c2",unit:`Day ${i+3}`,st:d<"09-28"?"done":"plan"}));
[["09-26",0],["10-03",0]].forEach(([d,_],i)=>FEEDS.push({d,g:"g1",c:"c4",unit:`오답 ${i+1}회차`,st:d<"09-28"?"done":"plan"}));
FEEDS.push({d:"09-28",g:"g3",c:"c3",unit:"Day 2",st:"plan"},{d:"09-30",g:"g3",c:"c3",unit:"Day 3",st:"plan"});
const HOLI={"10-03":"개천절","10-09":"한글날"};
const PRESETS=[{n:"기본 인사말",t:"이번 달도 꾸준히 학습해주셔서 감사합니다."},{n:"수학 · 개념 강조",t:"개념 정리 노트를 먼저 완성한 뒤 문제풀이로 넘어가고 있습니다."},{n:"다음 달 계획",t:"다음 달에는 오답 복습 비중을 늘릴 예정입니다."}];
const DIAG=[{n:"이서진",sub:"영어",score:78,grade:"3",done:true},{n:"김도현",sub:"수학",score:64,grade:"4",done:true},{n:"박하은",sub:"영어",score:0,grade:"-",done:false},{n:"정민서",sub:"수학",score:91,grade:"1",done:true}];


export { S as initialStudents, A as initialAlerts, CLS, STXT, SGROUP, SGL, SEV, WAIT, CUR, GROUPS, FEEDS, HOLI, PRESETS, DIAG, QM, QE, CH_M, CH_E, INK, NOW0 };

