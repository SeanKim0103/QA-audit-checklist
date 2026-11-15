(function () {
  "use strict";

  const STORAGE_KEY = "feed_factory_qa_checklist_v1";

  const CATEGORIES = [
    {
      id: "A",
      title: "원료 입고 및 보관 (CCP/선행요건)",
      items: [
        { id: 1, text: "원료 입고 시 차량 위생 상태 및 방수포 덮개 이상 유무" },
        { id: 2, text: "주요 곡물 및 박류 곰팡이·해충·이물 혼입 육안 확인" },
        { id: 3, text: "사일로(Silo) 및 원료 빈(Bin) 상부 결로, 누수 및 청결 상태" },
        { id: 4, text: "알레르기 유발 물질 및 약제 첨가 원료의 구분 보관(라벨링) 준수" }
      ]
    },
    {
      id: "B",
      title: "배합·분쇄·펠렛 공정 관리",
      items: [
        { id: 5, text: "자석봉(Magnet) 및 체(Sieve) 이물 포집 상태 및 주기적 청소 기록 확인" },
        { id: 6, text: "펠렛 컨디셔너(Conditioner) 스팀 온도 및 체류 시간 기준치 준수 여부" },
        { id: 7, text: "쿨러(Cooler) 배출 제품 온도(외기 온도 +5℃ 이내) 및 수분 편차 확인" },
        { id: 8, text: "라인 전환 시 플러싱(Flushing) 실시 및 교차오염 방지 기록 확인" }
      ]
    },
    {
      id: "C",
      title: "작업장 일반 위생 및 방충·방서",
      items: [
        { id: 9, text: "작업장 바닥 분진 퇴적, 원료 낙하물 방치 및 배수로 청결 상태" },
        { id: 10, text: "포충등, 쥐덫 등 방충·방서 트랩 작동 상태 및 파손 여부" },
        { id: 11, text: "작업자 위생복, 안전모, 방진마스크 착용 및 손 소독 상태" }
      ]
    }
  ];

  const TOTAL_ITEMS = CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);

  function getTodayLocal() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function createDefaultState() {
    const results = {};
    CATEGORIES.forEach((cat) => {
      cat.items.forEach((item) => {
        results[item.id] = {
          status: "", // "", "pass", "fail", "na"
          memo: "",
          photos: [] // Array of compressed DataURL strings
        };
      });
    });

    return {
      basic: {
        date: getTodayLocal(),
        line: "1공장 배합라인",
        inspector: "김현승",
        shift: "주간"
      },
      activeTab: "all",
      collapsed: { A: false, B: false, C: false },
      overallMemo: "",
      results
    };
  }

  let state = loadState();

  function loadState() {
    const def = createDefaultState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return def;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return def;

      const merged = {
        basic: Object.assign({}, def.basic, parsed.basic || {}),
        activeTab: parsed.activeTab || "all",
        collapsed: Object.assign({}, def.collapsed, parsed.collapsed || {}),
        overallMemo: parsed.overallMemo || "",
        results: Object.assign({}, def.results)
      };

      if (parsed.results) {
        Object.keys(def.results).forEach((id) => {
          if (parsed.results[id]) {
            merged.results[id] = {
              status: parsed.results[id].status || "",
              memo: parsed.results[id].memo || "",
              photos: Array.isArray(parsed.results[id].photos) ? parsed.results[id].photos : []
            };
          }
        });
      }
      return merged;
    } catch (err) {
      return def;
    }
  }

  function saveState(showTime = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (showTime) {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const ss = String(now.getSeconds()).padStart(2, "0");
        document.getElementById("saveStatusText").textContent = `자동 저장됨 (${hh}:${mm}:${ss})`;
      }
    } catch (err) {
      showToast("저장 공간이 부족합니다. 사진 수를 줄여주세요.");
    }
  }

  function showToast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      el.classList.remove("show");
    }, 2600);
  }

  // DOM Elements
  const inspectDateEl = document.getElementById("inspectDate");
  const factoryLineEl = document.getElementById("factoryLine");
  const inspectorNameEl = document.getElementById("inspectorName");
  const overallMemoEl = document.getElementById("overallMemo");
  const shiftBtns = document.querySelectorAll(".shift-btn");
  const tabBtns = document.querySelectorAll(".tab-btn");
  const checklistContainer = document.getElementById("checklistContainer");

  function syncBasicInputs() {
    inspectDateEl.value = state.basic.date || getTodayLocal();
    factoryLineEl.value = state.basic.line || "1공장 배합라인";
    inspectorNameEl.value = state.basic.inspector !== undefined ? state.basic.inspector : "김현승";
    overallMemoEl.value = state.overallMemo || "";

    shiftBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.shift === state.basic.shift);
    });
  }

  function bindBasicInputs() {
    inspectDateEl.addEventListener("change", (e) => {
      state.basic.date = e.target.value;
      saveState();
    });

    factoryLineEl.addEventListener("change", (e) => {
      state.basic.line = e.target.value;
      saveState();
    });

    inspectorNameEl.addEventListener("input", (e) => {
      state.basic.inspector = e.target.value;
      saveState();
    });

    overallMemoEl.addEventListener("input", (e) => {
      state.overallMemo = e.target.value;
      saveState();
    });

    shiftBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.basic.shift = btn.dataset.shift;
        syncBasicInputs();
        saveState();
      });
    });
  }

  function renderChecklist() {
    checklistContainer.innerHTML = "";

    CATEGORIES.forEach((cat) => {
      const section = document.createElement("section");
      section.className = "category-section";
      section.dataset.category = cat.id;

      if (state.collapsed[cat.id]) {
        section.classList.add("collapsed");
      }
      if (state.activeTab !== "all" && state.activeTab !== cat.id) {
        section.classList.add("hidden-by-tab");
      }

      // Category Header
      const headerBtn = document.createElement("button");
      headerBtn.type = "button";
      headerBtn.className = "category-header";
      headerBtn.innerHTML = `
        <div class="category-header-left">
          <span class="category-code">${cat.id}</span>
          <span class="category-name">${cat.title}</span>
        </div>
        <div class="category-meta">
          <span class="cat-progress" id="catProgress_${cat.id}">0/${cat.items.length}</span>
          <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      `;

      headerBtn.addEventListener("click", () => {
        state.collapsed[cat.id] = !state.collapsed[cat.id];
        section.classList.toggle("collapsed", state.collapsed[cat.id]);
        saveState(false);
      });

      const body = document.createElement("div");
      body.className = "category-body";

      cat.items.forEach((item) => {
        const res = state.results[item.id];
        const itemDiv = document.createElement("div");
        itemDiv.className = "qa-item";
        itemDiv.id = `qaItem_${item.id}`;
        if (res.status) {
          itemDiv.classList.add(`status-${res.status}`);
        }

        itemDiv.innerHTML = `
          <div class="qa-item-header">
            <span class="qa-num">${item.id}</span>
            <div class="qa-text">${item.text}</div>
          </div>
          <div class="qa-actions" role="group" aria-label="항목 ${item.id} 판정">
            <button type="button" class="judge-btn pass ${res.status === "pass" ? "selected" : ""}" data-id="${item.id}" data-status="pass">
              ✓ 적합
            </button>
            <button type="button" class="judge-btn fail ${res.status === "fail" ? "selected" : ""}" data-id="${item.id}" data-status="fail">
              ✕ 부적합
            </button>
            <button type="button" class="judge-btn na ${res.status === "na" ? "selected" : ""}" data-id="${item.id}" data-status="na">
              — 해당없음
            </button>
          </div>
          <div class="item-memo-box">
            <div class="item-memo-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              부적합 상세 내용 메모
            </div>
            <textarea class="item-memo" data-id="${item.id}" placeholder="간단한 메모 또는 특이사항을 입력하세요..."></textarea>
          </div>
          <div class="photo-section">
            <div class="photo-controls">
              <button type="button" class="photo-btn primary-cam" data-action="camera" data-id="${item.id}">
                📷 사진 찍기
              </button>
              <button type="button" class="photo-btn" data-action="gallery" data-id="${item.id}">
                🖼 사진 업로드
              </button>
              <span class="photo-count-tag" id="photoCountTag_${item.id}"></span>
              <input type="file" accept="image/*" capture="environment" class="hidden-file-input" id="cameraInput_${item.id}">
              <input type="file" accept="image/*" multiple class="hidden-file-input" id="galleryInput_${item.id}">
            </div>
            <div class="photo-preview-list" id="photoList_${item.id}"></div>
          </div>
        `;

        const memoEl = itemDiv.querySelector(".item-memo");
        memoEl.value = res.memo || "";
        memoEl.addEventListener("input", (e) => {
          state.results[item.id].memo = e.target.value;
          saveState();
        });

        // Judge button handlers
        itemDiv.querySelectorAll(".judge-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const clickedStatus = btn.dataset.status;
            const currentStatus = state.results[item.id].status;
            const nextStatus = currentStatus === clickedStatus ? "" : clickedStatus;

            state.results[item.id].status = nextStatus;

            itemDiv.classList.remove("status-pass", "status-fail", "status-na");
            if (nextStatus) {
              itemDiv.classList.add(`status-${nextStatus}`);
            }

            itemDiv.querySelectorAll(".judge-btn").forEach((b) => {
              b.classList.toggle("selected", b.dataset.status === nextStatus);
            });

            updateDashboard();
            saveState();
          });
        });

        // Photo buttons
        const cameraInput = itemDiv.querySelector(`#cameraInput_${item.id}`);
        const galleryInput = itemDiv.querySelector(`#galleryInput_${item.id}`);

        itemDiv.querySelector('[data-action="camera"]').addEventListener("click", () => {
          openCameraModal(item.id, cameraInput);
        });
        itemDiv.querySelector('[data-action="gallery"]').addEventListener("click", () => {
          galleryInput.click();
        });

        cameraInput.addEventListener("change", (e) => handleFiles(item.id, e.target.files, cameraInput));
        galleryInput.addEventListener("change", (e) => handleFiles(item.id, e.target.files, galleryInput));

        body.appendChild(itemDiv);
        renderPhotoList(item.id, itemDiv.querySelector(`#photoList_${item.id}`), itemDiv.querySelector(`#photoCountTag_${item.id}`));
      });

      section.appendChild(headerBtn);
      section.appendChild(body);
      checklistContainer.appendChild(section);
    });

    applyActiveTab();
    updateDashboard();
  }

  function renderPhotoList(itemId, containerEl, countTagEl) {
    const listEl = containerEl || document.getElementById(`photoList_${itemId}`);
    const tagEl = countTagEl || document.getElementById(`photoCountTag_${itemId}`);
    if (!listEl) return;
    listEl.innerHTML = "";

    const photos = state.results[itemId].photos || [];
    if (tagEl) {
      tagEl.textContent = photos.length > 0 ? `첨부 ${photos.length}장` : "";
    }

    photos.forEach((dataUrl, idx) => {
      const wrap = document.createElement("div");
      wrap.className = "photo-thumb-wrap";

      const img = document.createElement("img");
      img.className = "photo-thumb";
      img.src = dataUrl;
      img.alt = `항목 ${itemId} 첨부 사진 ${idx + 1}`;
      img.addEventListener("click", () => openLightbox(dataUrl));

      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "photo-save-btn";
      saveBtn.textContent = "⬇";
      saveBtn.title = "사진 저장";
      saveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `QA_항목${itemId}_사진${idx + 1}_${state.basic.date || getTodayLocal()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });

      const rmBtn = document.createElement("button");
      rmBtn.type = "button";
      rmBtn.className = "photo-remove-btn";
      rmBtn.textContent = "×";
      rmBtn.title = "사진 삭제";
      rmBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        state.results[itemId].photos.splice(idx, 1);
        renderPhotoList(itemId);
        saveState();
      });

      wrap.appendChild(img);
      wrap.appendChild(saveBtn);
      wrap.appendChild(rmBtn);
      listEl.appendChild(wrap);
    });
  }

  function compressImage(file, maxDim = 900, quality = 0.72) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w >= h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = ev.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(itemId, fileList, inputEl) {
    if (!fileList || fileList.length === 0) return;
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const compressed = await compressImage(file);
        state.results[itemId].photos.push(compressed);
      } catch (err) {
        showToast("이미지를 불러오는 중 오류가 발생했습니다.");
      }
    }
    inputEl.value = "";
    renderPhotoList(itemId);
    saveState();
  }

  function updateDashboard() {
    let passCount = 0;
    let failCount = 0;
    let naCount = 0;

    CATEGORIES.forEach((cat) => {
      let catDone = 0;
      cat.items.forEach((item) => {
        const st = state.results[item.id].status;
        if (st) {
          catDone++;
          if (st === "pass") passCount++;
          else if (st === "fail") failCount++;
          else if (st === "na") naCount++;
        }
      });

      const catBadge = document.getElementById(`catProgress_${cat.id}`);
      if (catBadge) {
        catBadge.textContent = `${catDone}/${cat.items.length}`;
        catBadge.classList.toggle("done", catDone === cat.items.length);
      }

      const tabBadge = document.getElementById(`tabBadge${cat.id}`);
      if (tabBadge) {
        tabBadge.textContent = `${catDone}/${cat.items.length}`;
      }
    });

    const totalDone = passCount + failCount + naCount;
    const pctDone = Math.round((totalDone / TOTAL_ITEMS) * 100);

    document.getElementById("progressText").textContent = `${totalDone}/${TOTAL_ITEMS} 완료`;
    document.getElementById("progressBar").style.width = `${pctDone}%`;
    document.getElementById("tabBadgeAll").textContent = `${totalDone}/${TOTAL_ITEMS}`;

    document.getElementById("countPass").textContent = `적합 ${passCount}`;
    document.getElementById("countFail").textContent = `부적합 ${failCount}`;
    document.getElementById("countNa").textContent = `N/A ${naCount}`;

    const passRateEl = document.getElementById("passRateText");
    const denom = passCount + failCount;
    passRateEl.classList.remove("pass-rate-good", "pass-rate-warn", "pass-rate-bad");

    if (denom === 0) {
      passRateEl.textContent = "-%";
    } else {
      const rate = Math.round((passCount / denom) * 100);
      passRateEl.textContent = `${rate}%`;
      if (rate >= 90) passRateEl.classList.add("pass-rate-good");
      else if (rate >= 70) passRateEl.classList.add("pass-rate-warn");
      else passRateEl.classList.add("pass-rate-bad");
    }
  }

  // Tabs
  function applyActiveTab() {
    tabBtns.forEach((btn) => {
      const isActive = btn.dataset.tab === state.activeTab;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });

    document.querySelectorAll(".category-section").forEach((sec) => {
      const show = state.activeTab === "all" || sec.dataset.category === state.activeTab;
      sec.classList.toggle("hidden-by-tab", !show);
    });
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeTab = btn.dataset.tab;
      if (state.activeTab !== "all") {
        state.collapsed[state.activeTab] = false;
        const sec = document.querySelector(`.category-section[data-category="${state.activeTab}"]`);
        if (sec) sec.classList.remove("collapsed");
      }
      applyActiveTab();
      saveState(false);
    });
  });

  // CSV Export (UTF-8 BOM)
  function csvEscape(val) {
    const str = String(val == null ? "" : val);
    return `"${str.replace(/"/g, '""')}"`;
  }

  function statusLabel(st) {
    if (st === "pass") return "적합(Pass)";
    if (st === "fail") return "부적합(Fail)";
    if (st === "na") return "해당없음(N/A)";
    return "미점검";
  }

  document.getElementById("exportCsvBtn").addEventListener("click", () => {
    let passCount = 0;
    let failCount = 0;
    let naCount = 0;
    Object.values(state.results).forEach((r) => {
      if (r.status === "pass") passCount++;
      else if (r.status === "fail") failCount++;
      else if (r.status === "na") naCount++;
    });
    const totalDone = passCount + failCount + naCount;
    const denom = passCount + failCount;
    const passRate = denom === 0 ? "-" : `${Math.round((passCount / denom) * 100)}%`;

    const rows = [];
    rows.push(["사료 제조 공장 현장 위생 및 공정 품질(QA) 점검 결과"]);
    rows.push(["점검 일자", state.basic.date || "", "공장/라인", state.basic.line || ""]);
    rows.push(["점검자", state.basic.inspector || "", "교대조", state.basic.shift || ""]);
    rows.push(["진행률", `${totalDone}/${TOTAL_ITEMS}`, "적합률", passRate]);
    rows.push(["적합", passCount, "부적합", failCount, "해당없음", naCount]);
    rows.push([]);
    rows.push(["카테고리", "번호", "점검 항목", "판정 결과", "메모 / 특이사항", "첨부 사진 수"]);

    CATEGORIES.forEach((cat) => {
      cat.items.forEach((item) => {
        const res = state.results[item.id];
        rows.push([
          `${cat.id}. ${cat.title}`,
          item.id,
          item.text,
          statusLabel(res.status),
          res.memo || "",
          res.photos ? res.photos.length : 0
        ]);
      });
    });

    if (state.overallMemo && state.overallMemo.trim()) {
      rows.push([]);
      rows.push(["종합 메모 / 특이사항", state.overallMemo.trim()]);
    }

    const csvContent = "\uFEFF" + rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const safeLine = (state.basic.line || "공장").replace(/\s+/g, "");
    const dateStr = state.basic.date || getTodayLocal();
    const fileName = `QA점검표_${dateStr}_${safeLine}.csv`;

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("CSV 파일이 다운로드되었습니다.");
  });

  // Photo-Embedded HTML Report Export
  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  document.getElementById("exportHtmlBtn").addEventListener("click", () => {
    let passCount = 0;
    let failCount = 0;
    let naCount = 0;
    Object.values(state.results).forEach((r) => {
      if (r.status === "pass") passCount++;
      else if (r.status === "fail") failCount++;
      else if (r.status === "na") naCount++;
    });
    const totalDone = passCount + failCount + naCount;
    const denom = passCount + failCount;
    const passRate = denom === 0 ? "-" : `${Math.round((passCount / denom) * 100)}%`;

    let sectionsHtml = "";
    CATEGORIES.forEach((cat) => {
      let rowsHtml = "";
      cat.items.forEach((item) => {
        const res = state.results[item.id];
        const photosHtml = (res.photos || []).length
          ? `<div class="photos">${res.photos.map((src, i) => `<img src="${src}" alt="항목 ${item.id} 사진 ${i + 1}">`).join("")}</div>`
          : "";
        const memoHtml = res.memo
          ? `<div class="memo ${res.status === "fail" ? "fail" : ""}"><strong>${res.status === "fail" ? "부적합 메모:" : "메모:"}</strong> ${escapeHtml(res.memo)}</div>`
          : "";
        const badgeClass = res.status || "none";
        rowsHtml += `
          <div class="item">
            <div class="item-top">
              <span class="num">${item.id}</span>
              <span class="txt">${escapeHtml(item.text)}</span>
              <span class="badge ${badgeClass}">${statusLabel(res.status)}</span>
            </div>
            ${memoHtml}
            ${photosHtml}
          </div>`;
      });
      sectionsHtml += `<h2>${escapeHtml(cat.id + ". " + cat.title)}</h2>${rowsHtml}`;
    });

    const reportHtml = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>QA 점검 사진보고서</title><style>
body{font-family:"Malgun Gothic",sans-serif;max-width:900px;margin:24px auto;padding:0 16px;color:#182433;background:#f8fafc}
h1{color:#0b1f3a;margin-bottom:8px}
.meta{background:#fff;border:1px solid #d7e0ea;border-radius:10px;padding:14px;margin-bottom:18px;display:grid;grid-template-columns:repeat(2,1fr);gap:8px;font-size:14px}
h2{color:#122d52;border-bottom:2px solid #cbd5e1;padding-bottom:6px;margin-top:22px}
.item{background:#fff;border:1px solid #d7e0ea;border-radius:10px;padding:12px;margin-bottom:10px}
.item-top{display:flex;align-items:center;gap:10px}
.num{background:#e8eef6;color:#122d52;font-weight:700;padding:2px 8px;border-radius:6px;font-size:13px}
.txt{flex:1;font-weight:600}
.badge{padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700}
.badge.pass{background:#dcfce7;color:#15803d}
.badge.fail{background:#fee2e2;color:#b91c1c}
.badge.na{background:#e2e8f0;color:#475569}
.badge.none{background:#f1f5f9;color:#64748b}
.memo{margin-top:8px;padding:8px 10px;background:#f1f5f9;border-left:3px solid #1b4072;font-size:13px;white-space:pre-wrap}
.memo.fail{background:#fff5f5;border-left-color:#b91c1c}
.overall{background:#fff;border:1px solid #d7e0ea;border-radius:10px;padding:14px;margin-top:16px;font-size:14px;white-space:pre-wrap}
.photos{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.photos img{width:180px;height:180px;object-fit:cover;border-radius:8px;border:1px solid #cbd5e1}
</style></head><body>
<h1>사료 제조 공장 QA 점검 보고서</h1>
<div class="meta">
  <div><strong>점검 일자:</strong> ${escapeHtml(state.basic.date)}</div>
  <div><strong>공장 / 라인:</strong> ${escapeHtml(state.basic.line)}</div>
  <div><strong>점검자:</strong> ${escapeHtml(state.basic.inspector)}</div>
  <div><strong>교대조:</strong> ${escapeHtml(state.basic.shift)}</div>
  <div><strong>진행률:</strong> ${totalDone}/${TOTAL_ITEMS}</div>
  <div><strong>적합률:</strong> ${passRate} (적합 ${passCount} / 부적합 ${failCount} / N/A ${naCount})</div>
</div>
${sectionsHtml}
${state.overallMemo && state.overallMemo.trim() ? `<h2>종합 메모 / 특이사항</h2><div class="overall">${escapeHtml(state.overallMemo.trim())}</div>` : ""}
</body></html>`;

    const blob = new Blob([reportHtml], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const safeLine = (state.basic.line || "공장").replace(/\s+/g, "");
    const dateStr = state.basic.date || getTodayLocal();
    const a = document.createElement("a");
    a.href = url;
    a.download = `QA사진보고서_${dateStr}_${safeLine}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("사진 포함 보고서(HTML)가 저장되었습니다.");
  });

  // Live Camera Modal (WebRTC + file fallback)
  const cameraModal = document.getElementById("cameraModal");
  const cameraVideo = document.getElementById("cameraVideo");
  let activeCameraStream = null;
  let activeCameraItemId = null;
  let activeCameraFallbackInput = null;
  let currentFacingMode = "environment";

  function stopCameraStream() {
    if (activeCameraStream) {
      activeCameraStream.getTracks().forEach((t) => t.stop());
      activeCameraStream = null;
    }
    cameraVideo.srcObject = null;
  }

  function closeCameraModal() {
    stopCameraStream();
    cameraModal.classList.remove("open");
    activeCameraItemId = null;
    activeCameraFallbackInput = null;
  }

  async function startCameraStream() {
    stopCameraStream();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: currentFacingMode } },
      audio: false
    });
    activeCameraStream = stream;
    cameraVideo.srcObject = stream;
  }

  async function openCameraModal(itemId, fallbackInput) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      fallbackInput.click();
      return;
    }
    activeCameraItemId = itemId;
    activeCameraFallbackInput = fallbackInput;
    try {
      await startCameraStream();
      cameraModal.classList.add("open");
    } catch (err) {
      closeCameraModal();
      fallbackInput.click();
    }
  }

  document.getElementById("closeCameraBtn").addEventListener("click", closeCameraModal);
  cameraModal.addEventListener("click", (e) => {
    if (e.target === cameraModal) closeCameraModal();
  });

  document.getElementById("switchCameraBtn").addEventListener("click", async () => {
    currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
    try {
      await startCameraStream();
    } catch (err) {
      showToast("카메라 전환에 실패했습니다.");
    }
  });

  document.getElementById("fallbackFileBtn").addEventListener("click", () => {
    const input = activeCameraFallbackInput;
    closeCameraModal();
    if (input) input.click();
  });

  document.getElementById("capturePhotoBtn").addEventListener("click", () => {
    if (!activeCameraItemId || !cameraVideo.videoWidth) return;
    const maxDim = 900;
    let w = cameraVideo.videoWidth;
    let h = cameraVideo.videoHeight;
    if (w > maxDim || h > maxDim) {
      if (w >= h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(cameraVideo, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.72);

    const targetId = activeCameraItemId;
    state.results[targetId].photos.push(dataUrl);
    renderPhotoList(targetId);
    saveState();
    closeCameraModal();
    showToast("사진이 촬영되어 첨부되었습니다.");
  });

  // Reset Modal
  const resetModal = document.getElementById("resetModal");
  document.getElementById("resetBtn").addEventListener("click", () => {
    resetModal.classList.add("open");
  });
  document.getElementById("cancelResetBtn").addEventListener("click", () => {
    resetModal.classList.remove("open");
  });
  resetModal.addEventListener("click", (e) => {
    if (e.target === resetModal) resetModal.classList.remove("open");
  });
  document.getElementById("confirmResetBtn").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state = createDefaultState();
    syncBasicInputs();
    renderChecklist();
    saveState(false);
    document.getElementById("saveStatusText").textContent = "초기화 완료";
    resetModal.classList.remove("open");
    showToast("모든 점검 내용이 초기화되었습니다.");
  });

  // Lightbox Modal
  const lightboxModal = document.getElementById("lightboxModal");
  const lightboxImg = document.getElementById("lightboxImg");
  function openLightbox(src) {
    lightboxImg.src = src;
    lightboxModal.classList.add("open");
  }
  lightboxModal.addEventListener("click", () => {
    lightboxModal.classList.remove("open");
    lightboxImg.src = "";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      resetModal.classList.remove("open");
      lightboxModal.classList.remove("open");
      closeCameraModal();
    }
  });

  // Initialize App
  syncBasicInputs();
  bindBasicInputs();
  renderChecklist();

  if (localStorage.getItem(STORAGE_KEY)) {
    document.getElementById("saveStatusText").textContent = "임시 저장 불러옴";
  }
})();
