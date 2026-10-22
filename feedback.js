(function () {
  "use strict";

  var STORAGE_KEY = "dk-air-quiz-feedback.v1";
  var VERSION = "2026-10-22";
  var overallRatings = ["喜歡", "還可以", "需要調整"];
  var questionRatings = ["喜歡這題", "可以調整", "沒意見"];
  var questions = window.DK_QUIZ_QUESTIONS;
  var endpoint = typeof window.DK_FEEDBACK_ENDPOINT === "string" ? window.DK_FEEDBACK_ENDPOINT.trim() : "";
  var form = document.getElementById("feedback-form");
  var submitButton = document.getElementById("submit-feedback");
  var status = document.getElementById("submission-status");
  var availability = document.getElementById("availability-note");
  var draftNote = document.getElementById("draft-note");
  var questionList = document.getElementById("question-feedback-list");
  var state = { ready: false, busy: false, submissionId: "", submissionSignature: "", savedSignature: "" };
  var draftTimer = 0;
  var resizeFrame = 0;
  var postedHeight = 0;
  var questionsReady = Array.isArray(questions) && questions.length === 5;

  function textNode(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function fieldValue(name) {
    var field = form.elements.namedItem(name);
    return field && typeof field.value === "string" ? field.value : "";
  }

  function boundedText(value, max) {
    return typeof value === "string" ? value.slice(0, max) : "";
  }

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    var bytes = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (var i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    var hex = Array.prototype.map.call(bytes, function (byte) { return byte.toString(16).padStart(2, "0"); }).join("");
    return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
  }

  function renderQuestions() {
    questions.forEach(function (question, index) {
      var id = "q" + (index + 1);
      var block = textNode("article", "question-block", "");
      block.appendChild(textNode("p", "question-label", "第 " + (index + 1) + " 題"));
      var title = textNode("h3", "question-title", question.title);
      title.id = id + "-title";
      block.setAttribute("aria-labelledby", title.id);
      block.appendChild(title);
      var fieldset = document.createElement("fieldset");
      fieldset.className = "rating-fieldset";
      fieldset.appendChild(textNode("legend", "question-rating-label", "這一題的感覺（選填）"));
      var options = document.createElement("div");
      options.className = "rating-options";
      questionRatings.forEach(function (rating) {
        var label = document.createElement("label");
        label.className = "rating-choice";
        var radio = document.createElement("input");
        radio.type = "radio";
        radio.name = id + "Rating";
        radio.value = rating;
        label.append(radio, textNode("span", "", rating));
        options.appendChild(label);
      });
      fieldset.appendChild(options);
      block.appendChild(fieldset);
      var details = document.createElement("details");
      details.className = "question-note";
      details.appendChild(textNode("summary", "", "補充這題的建議（選填）"));
      var noteLabel = textNode("label", "sr-only", "第 " + (index + 1) + " 題建議，最多 500 字");
      noteLabel.htmlFor = id + "-note";
      var note = document.createElement("textarea");
      note.id = id + "-note";
      note.name = id + "Note";
      note.rows = 3;
      note.maxLength = 500;
      note.placeholder = "題目好懂嗎？選項或解說有什麼可以調整？";
      note.setAttribute("aria-describedby", id + "-count");
      var count = textNode("span", "character-count", "0 / 500 字");
      count.id = id + "-count";
      details.append(noteLabel, note, count);
      details.addEventListener("toggle", postHeight);
      block.appendChild(details);
      questionList.appendChild(block);
    });
  }

  function collect() {
    return {
      dept: fieldValue("dept").trim(),
      name: fieldValue("name").trim(),
      overall: fieldValue("overall"),
      overallNote: fieldValue("overallNote").trim(),
      questions: questionsReady ? questions.map(function (question, index) {
        var id = "q" + (index + 1);
        return { id: id, rating: fieldValue(id + "Rating"), note: fieldValue(id + "Note").trim() };
      }) : [],
      version: VERSION
    };
  }

  function updateCounts() {
    document.getElementById("overall-note-count").textContent = fieldValue("overallNote").length + " / 1000 字";
    if (questionsReady) questions.forEach(function (question, index) {
      var id = "q" + (index + 1);
      document.getElementById(id + "-count").textContent = fieldValue(id + "Note").length + " / 500 字";
    });
  }

  function saveDraft() {
    window.clearTimeout(draftTimer);
    try {
      // Keep the exact in-progress text while the submitted payload trims surrounding whitespace.
      var data = collect();
      data.dept = fieldValue("dept");
      data.name = fieldValue("name");
      data.overallNote = fieldValue("overallNote");
      data.questions.forEach(function (question) { question.note = fieldValue(question.id + "Note"); });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: data, submissionId: state.submissionId, submissionSignature: state.submissionSignature, savedSignature: state.savedSignature }));
      draftNote.textContent = "草稿已自動儲存在這台裝置。";
    } catch (error) {
      draftNote.textContent = "這台裝置無法暫存草稿，請保持此頁開啟。";
    }
  }

  function restoreDraft() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var draft = JSON.parse(raw);
      if (!draft || !draft.data || draft.data.version !== VERSION) return;
      var data = draft.data;
      form.elements.namedItem("dept").value = boundedText(data.dept, 40);
      form.elements.namedItem("name").value = boundedText(data.name, 40);
      form.elements.namedItem("overallNote").value = boundedText(data.overallNote, 1000);
      if (overallRatings.indexOf(data.overall) !== -1) form.elements.namedItem("overall").value = data.overall;
      if (questionsReady && Array.isArray(data.questions)) data.questions.slice(0, 5).forEach(function (item, index) {
        if (!item || item.id !== "q" + (index + 1)) return;
        if (questionRatings.indexOf(item.rating) !== -1) form.elements.namedItem(item.id + "Rating").value = item.rating;
        var note = form.elements.namedItem(item.id + "Note");
        note.value = boundedText(item.note, 500);
        if (note.value) note.closest("details").open = true;
      });
      if (typeof draft.submissionId === "string" && /^[a-f0-9-]{36}$/i.test(draft.submissionId)) state.submissionId = draft.submissionId;
      state.submissionSignature = boundedText(draft.submissionSignature, 20000);
      state.savedSignature = boundedText(draft.savedSignature, 20000);
      draftNote.textContent = "已恢復這台裝置上的草稿。";
    } catch (error) {
      draftNote.textContent = "這台裝置無法恢復草稿，仍可直接填寫。";
    }
  }

  function setStatus(message, kind, focus) {
    status.textContent = message;
    status.dataset.kind = kind || "info";
    if (focus) {
      status.focus({ preventScroll: true });
      window.requestAnimationFrame(function () {
        var rect = status.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          status.scrollIntoView({
            block: "nearest",
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
          });
        }
      });
    }
    postHeight();
  }

  function updateSubmitAvailability() {
    submitButton.disabled = !state.ready || state.busy || !endpoint || !questionsReady;
    submitButton.replaceChildren(document.createTextNode(state.busy ? "正在送出，請稍候…" : "送出回饋 "));
    if (!state.busy) {
      var arrow = textNode("span", "", "→");
      arrow.setAttribute("aria-hidden", "true");
      submitButton.appendChild(arrow);
    }
    form.setAttribute("aria-busy", String(state.busy));
  }

  async function submitFeedback(event) {
    event.preventDefault();
    if (state.busy) return;
    saveDraft();
    if (!endpoint || !questionsReady) {
      setStatus("目前尚未開放送出；你可以先填寫並保留草稿。", "info", true);
      return;
    }
    ["dept", "name"].forEach(function (name) {
      var input = form.elements.namedItem(name);
      input.setCustomValidity(input.value.trim() ? "" : "請填寫" + (name === "dept" ? "部門" : "姓名") + "，不能只有空白。");
    });
    if (!form.reportValidity()) return;
    var data = collect();
    var signature = JSON.stringify(data);
    if (!state.submissionId || state.submissionSignature !== signature) {
      state.submissionId = uuid();
      state.submissionSignature = signature;
    }
    var payload = Object.assign({ action: "submit", submissionId: state.submissionId }, data);
    saveDraft();
    state.busy = true;
    updateSubmitAvailability();
    setStatus("正在儲存回饋，請稍候。", "info", false);
    var controller = new AbortController();
    var timeout = window.setTimeout(function () { controller.abort(); }, 20000);
    try {
      var response = await window.fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        credentials: "omit",
        redirect: "follow",
        signal: controller.signal
      });
      var result = await response.json();
      if (!response.ok || !result || result.ok !== true) {
        var failure = result && typeof result.message === "string" ? result.message.slice(0, 200) : "回饋尚未成功儲存，請稍後再試。";
        throw new Error(failure);
      }
      state.savedSignature = signature;
      saveDraft();
      var changed = JSON.stringify(collect()) !== signature;
      setStatus(changed ? "回饋已成功送出！你剛修改的內容尚未送出，可以再按一次更新。" : "回饋已成功送出，謝謝你！之後修改內容再次送出，就會更新這份回饋。", "success", true);
    } catch (error) {
      var message;
      if (error && error.name === "AbortError") message = "連線等候超過 20 秒，尚未確認是否儲存完成。內容已保留，請再試一次；同一份回饋不會重複新增。";
      else if (error instanceof TypeError) message = "目前無法連線，尚未確認是否儲存完成。內容已保留，請確認網路後再試一次。";
      else if (error instanceof SyntaxError) message = "伺服器沒有回傳儲存確認。內容已保留，請稍後再試一次。";
      else message = (error && error.message ? error.message : "回饋尚未成功送出。") + " 內容已保留，可以重試。";
      setStatus(message, "error", true);
    } finally {
      window.clearTimeout(timeout);
      state.busy = false;
      updateSubmitAvailability();
      postHeight();
    }
  }

  function postHeight() {
    if (resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(function () {
      resizeFrame = 0;
      var height = Math.ceil(document.getElementById("feedback-shell").getBoundingClientRect().height);
      if (height === postedHeight) return;
      postedHeight = height;
      if (window.parent !== window) window.parent.postMessage({ type: "dk-air-quiz:resize", height: height }, "*");
    });
  }

  if (questionsReady) renderQuestions();
  else questionList.appendChild(textNode("p", "availability-note", "題目資料暫時讀取失敗，請重新整理頁面。"));
  if (!endpoint) {
    availability.hidden = false;
    availability.textContent = "目前尚未開放送出。可以先填寫，草稿會保留在這台裝置；開放後重新整理即可送出。";
  }
  restoreDraft();
  updateCounts();
  form.addEventListener("submit", submitFeedback);
  form.addEventListener("input", function (event) {
    if (event.target.name === "dept" || event.target.name === "name") event.target.setCustomValidity("");
    updateCounts();
    window.clearTimeout(draftTimer);
    draftTimer = window.setTimeout(saveDraft, 200);
  });
  form.addEventListener("change", saveDraft);
  window.addEventListener("pagehide", saveDraft);
  window.addEventListener("resize", postHeight);
  window.addEventListener("load", postHeight);
  if ("ResizeObserver" in window) new ResizeObserver(postHeight).observe(document.getElementById("feedback-shell"));
  postHeight();
  // The HTML stays disabled unless initialization and submit interception both complete.
  state.ready = true;
  updateSubmitAvailability();
}());
