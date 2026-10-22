(function () {
  "use strict";

  var questions = window.DK_QUIZ_QUESTIONS;
  var letters = ["A", "B", "C"];
  var state = { phase: "home", index: 0, answers: [] };
  var lastDialogTrigger = null;
  var lastPostedHeight = 0;
  var resizeFrame = 0;
  var hostStage = document.querySelector(".host-stage");
  var reactions = {
    k: { correct: "耶！你猜中了，金牌掌聲送給你！", wrong: "哎呀，差一點點！一起把這個獎記住。" },
    e: { correct: "叮咚！金牌小秘密被你發現啦！", wrong: "咦？秘密藏在鞋底啦～陪我再看一次！" },
    d: { correct: "答對啦！開心到想蹦兩下！", wrong: "噗～猜錯也沒關係，我陪你一起記住！" },
    c: { correct: "好棒！給你一個大大的氣球抱抱！", wrong: "差一點就中了～下一題我們再加油！" }
  };
  var els = {};
  ["home-screen", "question-screen", "result-screen", "question-title", "question-category", "question-counter", "score-counter", "progress-bar", "progress-fill", "host-speech", "host-mascot", "host-image", "host-name", "answer-list", "answer-feedback", "choose-hint", "next-button", "result-title", "result-intro", "final-score", "result-count", "review-list", "review-toggle", "review-panel", "awards-dialog", "close-awards"].forEach(function (id) { els[id] = document.getElementById(id); });

  function correctCount() {
    return state.answers.reduce(function (count, answer, index) { return count + (answer === questions[index].correct ? 1 : 0); }, 0);
  }

  function focusHeading(id) {
    window.requestAnimationFrame(function () {
      var heading = document.getElementById(id);
      heading.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
      // The embed host can bring the whole game, including its balloon host, into view.
      if (window.parent !== window) window.parent.postMessage({ type: "dk-air-quiz:navigate" }, "*");
      postHeight();
    });
  }

  function switchScreen(phase) {
    state.phase = phase;
    ["home", "question", "result"].forEach(function (name) { els[name + "-screen"].hidden = name !== phase; });
  }

  function makeText(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function begin() {
    state.index = 0;
    state.answers = [];
    els["review-panel"].hidden = true;
    updateReviewToggle(false);
    switchScreen("question");
    renderQuestion();
  }

  function renderQuestion() {
    var question = questions[state.index];
    delete hostStage.dataset.reaction;
    els["question-counter"].textContent = "第 " + (state.index + 1) + " / " + questions.length + " 題";
    els["score-counter"].textContent = "已答對 " + correctCount() + " 題";
    els["progress-bar"].setAttribute("aria-valuenow", String(state.answers.length));
    els["progress-bar"].setAttribute("aria-valuetext", "已完成 " + state.answers.length + " 題，共 " + questions.length + " 題");
    els["progress-fill"].style.width = (state.answers.length / questions.length * 100) + "%";
    els["question-category"].textContent = question.category;
    els["question-title"].textContent = question.title;
    els["host-speech"].textContent = question.speech;
    els["host-mascot"].className = "mascot mascot-" + question.host;
    els["host-image"].src = "assets/mascot-" + question.host + ".png";
    els["host-image"].alt = question.host.toUpperCase() + " 小氣球";
    els["host-name"].textContent = question.host.toUpperCase() + " 小氣球";
    els["choose-hint"].textContent = "選一個答案，看看你猜對了沒。";
    els["answer-feedback"].replaceChildren();
    els["answer-list"].replaceChildren();
    els["next-button"].hidden = true;
    els["next-button"].replaceChildren(document.createTextNode(state.index === questions.length - 1 ? "看看我的成績 " : "下一題 "));
    var arrow = makeText("span", "", "→");
    arrow.setAttribute("aria-hidden", "true");
    els["next-button"].appendChild(arrow);

    question.answers.forEach(function (answer, index) {
      var button = document.createElement("button");
      button.className = "answer-button";
      button.type = "button";
      button.dataset.answer = String(index);
      button.append(makeText("span", "answer-letter", letters[index]), makeText("span", "answer-label", answer));
      button.addEventListener("click", function () { selectAnswer(index); });
      els["answer-list"].appendChild(button);
    });
    focusHeading("question-title");
  }

  function selectAnswer(answer) {
    if (state.phase !== "question" || state.answers.length > state.index) return;
    var question = questions[state.index];
    var isCorrect = answer === question.correct;
    state.answers.push(answer);
    var reaction = isCorrect ? "correct" : "wrong";
    var reactionSpeech = reactions[question.host][reaction];
    hostStage.dataset.reaction = reaction;
    els["host-speech"].textContent = reactionSpeech;

    Array.prototype.forEach.call(els["answer-list"].children, function (button, index) {
      button.disabled = true;
      if (index === question.correct) {
        button.classList.add("is-correct");
        button.appendChild(makeText("span", "answer-mark", "✓ 正解"));
      } else if (index === answer) {
        button.classList.add("is-wrong");
        button.appendChild(makeText("span", "answer-mark", "× 你選的"));
      } else {
        button.classList.add("is-muted");
      }
    });
    els["choose-hint"].textContent = "答案揭曉！每答對一題得到 20 分。";
    var reactionNote = makeText("div", "reaction-note", "");
    reactionNote.dataset.reaction = reaction;
    var reactionFigure = makeText("div", "reaction-figure", "");
    reactionFigure.setAttribute("aria-hidden", "true");
    var reactionMascot = makeText("div", "mascot mascot-" + question.host, "");
    var reactionImage = document.createElement("img");
    reactionImage.src = "assets/mascot-" + question.host + ".png";
    reactionImage.alt = "";
    reactionImage.draggable = false;
    reactionMascot.appendChild(reactionImage);
    reactionFigure.appendChild(reactionMascot);
    var reactionCopy = makeText("div", "reaction-copy", "");
    reactionCopy.append(makeText("p", "feedback-title", isCorrect ? "答對啦！好厲害！" : "差一點點～沒關係！"), makeText("p", "reaction-speech", reactionSpeech));
    reactionNote.append(reactionFigure, reactionCopy);
    els["answer-feedback"].appendChild(reactionNote);
    if (!isCorrect) els["answer-feedback"].appendChild(makeText("p", "feedback-correct", "正確答案：" + letters[question.correct] + ". " + question.answers[question.correct]));
    els["answer-feedback"].appendChild(makeText("p", "feedback-explanation", question.explanation));
    els["score-counter"].textContent = "已答對 " + correctCount() + " 題";
    els["progress-bar"].setAttribute("aria-valuenow", String(state.answers.length));
    els["progress-bar"].setAttribute("aria-valuetext", "已完成 " + state.answers.length + " 題，共 " + questions.length + " 題");
    els["progress-fill"].style.width = (state.answers.length / questions.length * 100) + "%";
    els["next-button"].hidden = false;
    postHeight();
    window.requestAnimationFrame(function () {
      // Keep the nearby reaction visible after tapping a low answer on a small screen.
      var rect = reactionNote.getBoundingClientRect();
      if (window.parent !== window) {
        window.parent.postMessage({ type: "dk-air-quiz:reveal", top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY }, "*");
      }
      if (rect.top < 12 || rect.bottom > window.innerHeight - 12) {
        reactionNote.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      }
    });
  }

  function nextQuestion() {
    if (state.phase !== "question" || state.answers.length <= state.index) return;
    if (state.index < questions.length - 1) {
      state.index += 1;
      renderQuestion();
    } else {
      showResults();
    }
  }

  function showResults() {
    switchScreen("result");
    var correct = correctCount();
    var title = correct === 5 ? "空氣鞋知識王！" : correct >= 3 ? "空氣鞋探索高手！" : "空氣鞋好奇小隊員！";
    var intro = correct === 5 ? "五題全對！獎項、專利、底台巧思，你都記住了。" : correct >= 3 ? "答得很棒！再看一次重點，讓新知識牢牢記住。" : "謝謝你一起探索！從今天起，又更認識 DK 空氣鞋了。";
    els["result-title"].textContent = title;
    els["result-intro"].textContent = intro;
    els["final-score"].textContent = String(correct * 20);
    els["result-count"].textContent = "答對 " + correct + " / " + questions.length + " 題";
    els["review-list"].replaceChildren();
    questions.forEach(function (question, index) {
      var item = document.createElement("li");
      var body = document.createElement("div");
      body.append(makeText("p", "review-item-title", question.answers[question.correct]), makeText("p", "", question.takeaway));
      body.appendChild(makeText("span", "review-result", state.answers[index] === question.correct ? "✓ 這題你答對了" : "本題正解：" + letters[question.correct]));
      item.appendChild(body);
      els["review-list"].appendChild(item);
    });
    focusHeading("result-title");
  }

  function updateReviewToggle(open) {
    els["review-toggle"].setAttribute("aria-expanded", String(open));
    els["review-toggle"].replaceChildren(document.createTextNode(open ? "收起 5 題重點 " : "看看 5 題重點 "));
    var mark = makeText("span", "", open ? "−" : "＋");
    mark.setAttribute("aria-hidden", "true");
    els["review-toggle"].appendChild(mark);
  }

  function openAwards(event) {
    if (els["awards-dialog"].open) return;
    lastDialogTrigger = event.currentTarget;
    els["awards-dialog"].showModal();
    els["close-awards"].focus();
    els["awards-dialog"].scrollTop = 0;
  }

  function closeAwards() {
    if (els["awards-dialog"].open) els["awards-dialog"].close();
  }

  function postHeight() {
    if (resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(function () {
      resizeFrame = 0;
      // Element height can both grow and shrink, unlike document scrollHeight in a tall iframe.
      var height = Math.ceil(document.getElementById("quiz-shell").getBoundingClientRect().height);
      if (height === lastPostedHeight) return;
      lastPostedHeight = height;
      if (window.parent !== window) window.parent.postMessage({ type: "dk-air-quiz:resize", height: height }, "*");
    });
  }

  document.getElementById("start-button").addEventListener("click", begin);
  document.getElementById("restart-button").addEventListener("click", begin);
  els["next-button"].addEventListener("click", nextQuestion);
  els["review-toggle"].addEventListener("click", function () {
    var open = els["review-panel"].hidden;
    els["review-panel"].hidden = !open;
    updateReviewToggle(open);
    postHeight();
  });
  document.querySelectorAll("[data-open-awards]").forEach(function (button) { button.addEventListener("click", openAwards); });
  els["close-awards"].addEventListener("click", closeAwards);
  els["awards-dialog"].addEventListener("click", function (event) {
    if (event.target !== els["awards-dialog"]) return;
    var rect = els["awards-dialog"].getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeAwards();
  });
  els["awards-dialog"].addEventListener("close", function () { if (lastDialogTrigger) lastDialogTrigger.focus({ preventScroll: true }); });
  // Native dialog handles Escape and makes the background inert; this explicitly wraps Tab.
  els["awards-dialog"].addEventListener("keydown", function (event) {
    if (event.key === "Escape") { event.preventDefault(); closeAwards(); return; }
    if (event.key !== "Tab") return;
    var focusable = els["awards-dialog"].querySelectorAll("button:not([disabled]), a[href], input, select, textarea, [tabindex='0']");
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.addEventListener("resize", postHeight);
  window.addEventListener("load", postHeight);
  if ("ResizeObserver" in window) new ResizeObserver(postHeight).observe(document.getElementById("quiz-shell"));
  postHeight();
}());
