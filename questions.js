/* 題目與答案集中在此，便於後續更新活動內容。correct 為從 0 開始的選項序號。 */
window.DK_QUIZ_QUESTIONS = Object.freeze([
  {
    category: "01 · 得獎小知識", host: "k", speech: "掌聲準備好！第一題來囉～",
    title: "猜猜看！DK 空氣鞋技術在 KIDE 發明展拿了什麼獎？",
    answers: ["最會綁鞋帶獎", "大會鉑金獎與金牌", "氣球吹最大獎"], correct: 1,
    explanation: "KIDE 國際發明暨設計展：大會鉑金獎與金牌。厲害的是技術，拍手的是我！",
    takeaway: "KIDE 國際發明暨設計展：大會鉑金獎與金牌。"
  },
  {
    category: "02 · 金牌的秘密", host: "e", speech: "噓～金牌的秘密，藏在腳底下！",
    title: "哪個設計幫 DK 拿下 IIIC 金牌？",
    answers: ["鞋盒變城堡", "鞋帶變蝴蝶", "鞋底透氣結構改良"], correct: 2,
    explanation: "「鞋底透氣結構改良」獲得 IIIC 金牌。原來金牌的秘密，藏在腳底下！",
    takeaway: "IIIC 國際創新發明競賽：「鞋底透氣結構改良」金牌。"
  },
  {
    category: "03 · 專利小機關", host: "d", speech: "小鞋底藏了小機關！你猜是什麼？",
    title: "DK 空氣鞋介紹的專利技術叫什麼？",
    answers: ["空氣力學幫浦", "迷你噴射引擎", "隱形電風扇"], correct: 0,
    explanation: "答案是空氣力學幫浦！走路一踩一壓，帶動空氣循環。",
    takeaway: "空氣力學幫浦：透過走路踩踏，帶動空氣循環。"
  },
  {
    category: "04 · 腳下的好幫手", host: "c", speech: "跟我踏踏步！記住三個小重點～",
    title: "DK 空氣鞋底台主打哪三個特色？",
    answers: ["飛天、隱形、瞬間移動", "減壓、緩衝、助推", "唱歌、跳舞、放煙火"], correct: 1,
    explanation: "三個重點一起記：減壓、緩衝、助推！這就是底台設計主打的三個特色。",
    takeaway: "底台設計的三個主打特色：減壓、緩衝、助推。"
  },
  {
    category: "05 · 記住我們的名字", host: "d", speech: "最後一題！大聲喊出我們的名字～",
    title: "今天認識的空氣鞋技術，來自哪個品牌？",
    answers: ["雲朵福利社", "氣球研究所", "DK 高博士"], correct: 2,
    explanation: "空氣鞋，記得 DK 高博士！謝謝你和小氣球小隊一起完成挑戰。",
    takeaway: "今天認識的空氣鞋品牌，就是 DK 高博士。"
  }
].map(function (question) { return Object.freeze(question); }));
