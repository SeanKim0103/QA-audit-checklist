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
        { id: 4, text: "입고원료 보관기일 준수" }
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
        line: "배합라인",
        inspector: "이름 입력",
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
    factoryLineEl.value = state.basic.line || "배합라인";
    inspectorNameEl.value = state.basic.inspector !== undefined ? state.basic.inspector : "이름 입력";
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

  // Shared Report Stats & Meta Helpers
  function getReportStats() {
    let passCount = 0;
    let failCount = 0;
    let naCount = 0;
    let totalPhotos = 0;
    const failItems = [];

    CATEGORIES.forEach((cat) => {
      cat.items.forEach((item) => {
        const res = state.results[item.id];
        if (!res) return;
        const photos = Array.isArray(res.photos) ? res.photos : [];
        totalPhotos += photos.length;
        if (res.status === "pass") passCount++;
        else if (res.status === "fail") {
          failCount++;
          failItems.push({
            id: item.id,
            text: item.text,
            memo: (res.memo || "").trim()
          });
        } else if (res.status === "na") {
          naCount++;
        }
      });
    });

    const totalDone = passCount + failCount + naCount;
    const denom = passCount + failCount;
    const passRateNum = denom === 0 ? null : Math.round((passCount / denom) * 100);
    const passRate = passRateNum === null ? "-" : `${passRateNum}%`;

    return {
      passCount,
      failCount,
      naCount,
      totalDone,
      passRate,
      passRateNum,
      totalPhotos,
      failItems
    };
  }

  function sanitizeFilePart(str) {
    const cleaned = String(str || "")
      .trim()
      .replace(/[\\/:*?"<>|\s]+/g, "");
    return cleaned || "공장";
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function buildReportMeta(stats) {
    const dateStr = state.basic.date || getTodayLocal();
    const lineName = state.basic.line || "공장";
    const safeLine = sanitizeFilePart(lineName);
    const inspector = (state.basic.inspector || "").trim() || "-";
    const shift = state.basic.shift || "-";
    const fileName = `QA사진보고서_${dateStr}_${safeLine}.pdf`;
    const shareTitle = `QA 점검 사진보고서 (${dateStr} · ${lineName})`;

    const lines = [
      "[사료 제조 공장 QA 점검 요약]",
      `• 점검 일자: ${dateStr}`,
      `• 공장 / 라인: ${lineName}`,
      `• 점검자 / 교대조: ${inspector} / ${shift}`,
      `• 진행률: ${stats.totalDone}/${TOTAL_ITEMS} 완료`,
      `• 적합률: ${stats.passRate} (적합 ${stats.passCount} / 부적합 ${stats.failCount} / N/A ${stats.naCount})`,
      `• 첨부 사진: ${stats.totalPhotos}장`
    ];

    if (stats.failItems.length > 0) {
      lines.push("");
      lines.push(`[부적합 항목 (${stats.failItems.length}건)]`);
      stats.failItems.forEach((fi) => {
        lines.push(`- #${fi.id} ${fi.text}${fi.memo ? ` (메모: ${fi.memo})` : ""}`);
      });
    }

    if (state.overallMemo && state.overallMemo.trim()) {
      lines.push("");
      lines.push("[종합 메모 / 특이사항]");
      lines.push(state.overallMemo.trim());
    }

    return {
      dateStr,
      lineName,
      safeLine,
      inspector,
      shift,
      fileName,
      shareTitle,
      summaryText: lines.join("\n")
    };
  }

  function triggerDownload(url, fileName) {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

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

  function statusBadgeText(st) {
    if (st === "pass") return "적합";
    if (st === "fail") return "부적합";
    if (st === "na") return "해당없음";
    return "미점검";
  }

  document.getElementById("exportCsvBtn").addEventListener("click", () => {
    const stats = getReportStats();
    const rows = [];
    rows.push(["사료 제조 공장 현장 위생 및 공정 품질(QA) 점검 결과"]);
    rows.push(["점검 일자", state.basic.date || "", "공장/라인", state.basic.line || ""]);
    rows.push(["점검자", state.basic.inspector || "", "교대조", state.basic.shift || ""]);
    rows.push(["진행률", `${stats.totalDone}/${TOTAL_ITEMS}`, "적합률", stats.passRate]);
    rows.push(["적합", stats.passCount, "부적합", stats.failCount, "해당없음", stats.naCount]);
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

    const safeLine = sanitizeFilePart(state.basic.line || "공장");
    const dateStr = state.basic.date || getTodayLocal();
    const fileName = `QA점검표_${dateStr}_${safeLine}.csv`;

    triggerDownload(url, fileName);
    URL.revokeObjectURL(url);

    showToast("CSV 파일이 다운로드되었습니다.");
  });

  // Legacy Photo-Embedded HTML Report Export
  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function exportLegacyHtmlReport() {
    const stats = getReportStats();

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
  <div><strong>진행률:</strong> ${stats.totalDone}/${TOTAL_ITEMS}</div>
  <div><strong>적합률:</strong> ${stats.passRate} (적합 ${stats.passCount} / 부적합 ${stats.failCount} / N/A ${stats.naCount})</div>
</div>
${sectionsHtml}
${state.overallMemo && state.overallMemo.trim() ? `<h2>종합 메모 / 특이사항</h2><div class="overall">${escapeHtml(state.overallMemo.trim())}</div>` : ""}
</body></html>`;

    const blob = new Blob([reportHtml], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const safeLine = sanitizeFilePart(state.basic.line || "공장");
    const dateStr = state.basic.date || getTodayLocal();
    triggerDownload(url, `QA사진보고서_${dateStr}_${safeLine}.html`);
    URL.revokeObjectURL(url);
    showToast("사진 포함 보고서(HTML)가 저장되었습니다.");
  }

  // Zero-Dependency High-DPI A4 PDF Report Renderer & Binary Writer
  const PDF_PAGE_W = 744;
  const PDF_PAGE_H = 1052;
  const PDF_SCALE = 2;
  const PDF_MARGIN_X = 36;
  const PDF_MARGIN_TOP = 34;
  const PDF_CONTENT_W = 672;
  const PDF_MAX_Y = 992;
  const PDF_FOOTER_LINE_Y = 1004;
  const PDF_FOOTER_TEXT_Y = 1022;
  const PDF_FONT = '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", "NanumGothic", -apple-system, BlinkMacSystemFont, sans-serif';

  function drawRoundedRect(ctx, x, y, w, h, r) {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.arcTo(x + w, y, x + w, y + radius, radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
    ctx.lineTo(x + radius, y + h);
    ctx.arcTo(x, y + h, x, y + h - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxWidth) {
    const raw = String(text == null ? "" : text);
    if (!raw) return [];
    const paragraphs = raw.split(/\r?\n/);
    const lines = [];

    paragraphs.forEach((para) => {
      if (!para) {
        lines.push("");
        return;
      }
      const tokens = para.split(/(\s+)/);
      let current = "";

      const flushLine = () => {
        if (current) {
          lines.push(current.trimEnd());
          current = "";
        }
      };

      tokens.forEach((token) => {
        if (!token) return;
        if (!current && /^\s+$/.test(token)) return;

        const candidate = current + token;
        if (ctx.measureText(candidate).width <= maxWidth) {
          current = candidate;
          return;
        }

        if (current.trimEnd()) {
          flushLine();
          if (/^\s+$/.test(token)) return;
        }

        if (ctx.measureText(token).width > maxWidth) {
          let part = "";
          for (const ch of Array.from(token)) {
            if (ctx.measureText(part + ch).width > maxWidth && part) {
              lines.push(part);
              part = ch;
            } else {
              part += ch;
            }
          }
          current = part;
        } else {
          current = token;
        }
      });

      if (current) {
        lines.push(current.trimEnd());
      }
    });

    return lines;
  }

  function loadImageElement(dataUrl) {
    return new Promise((resolve) => {
      if (!dataUrl || typeof dataUrl !== "string") {
        resolve(null);
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  async function preloadReportPhotos() {
    const loadedMap = {};
    const tasks = [];
    CATEGORIES.forEach((cat) => {
      cat.items.forEach((item) => {
        const photos = (state.results[item.id] && state.results[item.id].photos) || [];
        loadedMap[item.id] = new Array(photos.length);
        photos.forEach((src, idx) => {
          tasks.push(
            loadImageElement(src).then((img) => {
              loadedMap[item.id][idx] = img;
            })
          );
        });
      });
    });
    await Promise.all(tasks);
    return loadedMap;
  }

  function drawContainedImage(ctx, img, x, y, w, h) {
    ctx.save();
    drawRoundedRect(ctx, x, y, w, h, 6);
    ctx.fillStyle = "#f1f5f9";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#cbd5e1";
    ctx.stroke();

    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
      const pad = 4;
      const maxW = Math.max(1, w - pad * 2);
      const maxH = Math.max(1, h - pad * 2);
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const dx = x + (w - dw) / 2;
      const dy = y + (h - dh) / 2;
      drawRoundedRect(ctx, x + 1, y + 1, w - 2, h - 2, 5);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      ctx.fillStyle = "#64748b";
      ctx.font = `600 11px ${PDF_FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("이미지 로드 실패", x + w / 2, y + h / 2);
    }
    ctx.restore();
  }

  function measureItemLayout(measureCtx, item, res, imgs) {
    const padTop = 12;
    const padBottom = 12;
    const padX = 13;
    const innerW = PDF_CONTENT_W - padX * 2;
    const titleMaxW = innerW - 28 - 94;

    measureCtx.font = `700 12.5px ${PDF_FONT}`;
    const titleLines = wrapText(measureCtx, item.text, titleMaxW);
    const titleLineH = 18;
    const headerH = Math.max(24, titleLines.length * titleLineH + 4);

    const memoText = (res.memo || "").trim();
    let memoLines = [];
    let memoBoxH = 0;
    if (memoText) {
      measureCtx.font = `400 11px ${PDF_FONT}`;
      memoLines = wrapText(measureCtx, memoText, innerW - 24);
      memoBoxH = 14 + 16 + memoLines.length * 16;
    }

    const photoRows = [];
    const PHOTO_COLS = 3;
    for (let i = 0; i < imgs.length; i += PHOTO_COLS) {
      const rowEntries = [];
      for (let j = i; j < Math.min(i + PHOTO_COLS, imgs.length); j++) {
        rowEntries.push({ img: imgs[j], photoNum: j + 1 });
      }
      photoRows.push(rowEntries);
    }

    let photosH = 0;
    if (photoRows.length > 0) {
      photosH = 10 + photoRows.length * 160 + (photoRows.length - 1) * 10;
    }

    const totalH =
      padTop +
      headerH +
      (memoLines.length > 0 ? 8 + memoBoxH : 0) +
      photosH +
      padBottom;

    return {
      item,
      status: res.status || "",
      titleLines,
      headerH,
      memoLines,
      memoIsFail: res.status === "fail",
      memoBoxH,
      photoRows,
      totalH
    };
  }

  function planPdfPages(stats, loadedPhotosMap) {
    const measureCanvas = document.createElement("canvas");
    measureCanvas.width = 10;
    measureCanvas.height = 10;
    const measureCtx = measureCanvas.getContext("2d");

    const pages = [[]];
    let currentPage = pages[0];
    let cursorY = PDF_MARGIN_TOP;

    function startNewPage() {
      if (currentPage.length === 0) return;
      currentPage = [];
      pages.push(currentPage);
      cursorY = PDF_MARGIN_TOP;
    }

    // Header block on Page 1
    const headerHeight = 180;
    currentPage.push({
      type: "header",
      y: cursorY,
      height: headerHeight
    });
    cursorY += headerHeight + 16;

    const MAX_PAGE_CONTENT_H = PDF_MAX_Y - PDF_MARGIN_TOP;
    const ITEM_GAP = 10;
    const CAT_HEADER_H = 34;
    const CAT_HEADER_GAP = 8;

    CATEGORIES.forEach((cat) => {
      let catDone = 0;
      const itemLayouts = cat.items.map((item) => {
        const res = state.results[item.id] || { status: "", memo: "", photos: [] };
        if (res.status) catDone++;
        const imgs = loadedPhotosMap[item.id] || [];
        return measureItemLayout(measureCtx, item, res, imgs);
      });

      const firstLayout = itemLayouts[0];
      const firstMinH = firstLayout
        ? Math.min(
            firstLayout.totalH,
            12 + firstLayout.headerH + (firstLayout.photoRows.length ? 170 : 0) + 12
          )
        : 60;

      if (currentPage.length > 0 && cursorY + CAT_HEADER_H + CAT_HEADER_GAP + firstMinH > PDF_MAX_Y) {
        startNewPage();
      }

      currentPage.push({
        type: "category_header",
        y: cursorY,
        height: CAT_HEADER_H,
        catId: cat.id,
        catTitle: cat.title,
        catDone,
        catTotal: cat.items.length
      });
      cursorY += CAT_HEADER_H + CAT_HEADER_GAP;

      itemLayouts.forEach((layout) => {
        // Case A: Fits on current page
        if (cursorY + layout.totalH <= PDF_MAX_Y) {
          currentPage.push({
            type: "item",
            y: cursorY,
            height: layout.totalH,
            item: layout.item,
            status: layout.status,
            titleLines: layout.titleLines,
            headerH: layout.headerH,
            memoLines: layout.memoLines,
            memoIsFail: layout.memoIsFail,
            memoBoxH: layout.memoBoxH,
            photoRows: layout.photoRows
          });
          cursorY += layout.totalH + ITEM_GAP;
          return;
        }

        // Case B: Fits cleanly on a fresh page
        if (layout.totalH <= MAX_PAGE_CONTENT_H) {
          startNewPage();
          currentPage.push({
            type: "item",
            y: cursorY,
            height: layout.totalH,
            item: layout.item,
            status: layout.status,
            titleLines: layout.titleLines,
            headerH: layout.headerH,
            memoLines: layout.memoLines,
            memoIsFail: layout.memoIsFail,
            memoBoxH: layout.memoBoxH,
            photoRows: layout.photoRows
          });
          cursorY += layout.totalH + ITEM_GAP;
          return;
        }

        // Case C: Multi-page item split (long memo / many photos)
        const minHeadH = 12 + layout.headerH + 12 + (layout.memoLines.length > 0 ? 48 : 0);
        if (currentPage.length > 0 && cursorY + minHeadH > PDF_MAX_Y) {
          startNewPage();
        }

        let memoIdx = 0;
        let rowIdx = 0;

        // First slice with item header + fitting memo lines + fitting photo rows
        const availFirst = PDF_MAX_Y - cursorY;
        let usedFirst = 12 + layout.headerH;
        const firstMemoLines = [];
        if (layout.memoLines.length > 0) {
          const memoBase = 8 + 14 + 16; // top gap + box padding + label
          if (usedFirst + memoBase + 16 + 12 <= availFirst) {
            usedFirst += memoBase;
            while (memoIdx < layout.memoLines.length && usedFirst + 16 + 12 <= availFirst) {
              firstMemoLines.push(layout.memoLines[memoIdx]);
              usedFirst += 16;
              memoIdx++;
            }
          }
        }

        const firstPhotoRows = [];
        if (memoIdx === layout.memoLines.length && rowIdx < layout.photoRows.length) {
          let firstPhotoExtra = 10;
          while (rowIdx < layout.photoRows.length) {
            const addH = firstPhotoExtra + 160;
            if (usedFirst + addH + 12 <= availFirst) {
              firstPhotoRows.push(layout.photoRows[rowIdx]);
              usedFirst += addH;
              firstPhotoExtra = 10;
              rowIdx++;
            } else {
              break;
            }
          }
        }

        const firstBlockH = usedFirst + 12;
        currentPage.push({
          type: "item",
          y: cursorY,
          height: firstBlockH,
          item: layout.item,
          status: layout.status,
          titleLines: layout.titleLines,
          headerH: layout.headerH,
          memoLines: firstMemoLines,
          memoIsFail: layout.memoIsFail,
          memoBoxH: firstMemoLines.length > 0 ? 14 + 16 + firstMemoLines.length * 16 : 0,
          photoRows: firstPhotoRows
        });
        cursorY += firstBlockH + ITEM_GAP;

        // Remaining memo slices if any
        while (memoIdx < layout.memoLines.length) {
          startNewPage();
          const avail = PDF_MAX_Y - cursorY;
          const headerLabelH = 20;
          let used = 12 + headerLabelH + 8 + 14 + 16;
          const chunkMemo = [];
          while (memoIdx < layout.memoLines.length && used + 16 + 12 <= avail) {
            chunkMemo.push(layout.memoLines[memoIdx]);
            used += 16;
            memoIdx++;
          }
          if (chunkMemo.length === 0) {
            chunkMemo.push(layout.memoLines[memoIdx]);
            used += 16;
            memoIdx++;
          }
          const contH = used + 12;
          currentPage.push({
            type: "item_memo_cont",
            y: cursorY,
            height: contH,
            itemId: layout.item.id,
            headerLabel: `항목 ${layout.item.id} 메모 (계속)`,
            memoLines: chunkMemo,
            memoIsFail: layout.memoIsFail,
            memoBoxH: 14 + 16 + chunkMemo.length * 16
          });
          cursorY += contH + ITEM_GAP;
        }

        // Remaining photo row slices if any
        while (rowIdx < layout.photoRows.length) {
          startNewPage();
          const avail = PDF_MAX_Y - cursorY;
          const headerLabelH = 22;
          let used = 12 + headerLabelH + 8;
          const chunkRows = [];
          while (rowIdx < layout.photoRows.length) {
            const addH = (chunkRows.length === 0 ? 0 : 10) + 160;
            if (used + addH + 12 <= avail || chunkRows.length === 0) {
              chunkRows.push(layout.photoRows[rowIdx]);
              used += addH;
              rowIdx++;
            } else {
              break;
            }
          }
          const contH = used + 12;
          currentPage.push({
            type: "item_cont",
            y: cursorY,
            height: contH,
            itemId: layout.item.id,
            headerLabel: `항목 ${layout.item.id} 첨부 사진 (계속)`,
            photoRows: chunkRows
          });
          cursorY += contH + ITEM_GAP;
        }
      });

      cursorY += 6;
    });

    // Overall Memo section
    const overallText = (state.overallMemo || "").trim();
    if (overallText) {
      measureCtx.font = `400 11.5px ${PDF_FONT}`;
      const memoLines = wrapText(measureCtx, overallText, PDF_CONTENT_W - 28);
      const lineH = 17;
      const titleH = 28;
      const boxPad = 24;
      const totalMemoH = titleH + boxPad + memoLines.length * lineH;

      if (cursorY + totalMemoH <= PDF_MAX_Y) {
        currentPage.push({
          type: "overall_memo",
          y: cursorY,
          height: totalMemoH,
          lines: memoLines,
          isContinued: false
        });
      } else if (totalMemoH <= MAX_PAGE_CONTENT_H) {
        startNewPage();
        currentPage.push({
          type: "overall_memo",
          y: cursorY,
          height: totalMemoH,
          lines: memoLines,
          isContinued: false
        });
      } else {
        let idx = 0;
        let isCont = false;
        while (idx < memoLines.length) {
          if (currentPage.length > 0 && cursorY + titleH + boxPad + lineH > PDF_MAX_Y) {
            startNewPage();
          }
          const avail = PDF_MAX_Y - cursorY;
          const maxLines = Math.max(1, Math.floor((avail - titleH - boxPad) / lineH));
          const chunk = memoLines.slice(idx, idx + maxLines);
          const blockH = titleH + boxPad + chunk.length * lineH;
          currentPage.push({
            type: "overall_memo",
            y: cursorY,
            height: blockH,
            lines: chunk,
            isContinued: isCont
          });
          idx += chunk.length;
          isCont = true;
          if (idx < memoLines.length) {
            startNewPage();
          }
        }
      }
    }

    measureCanvas.width = 0;
    measureCanvas.height = 0;
    return pages;
  }

  function getStatusStyle(status) {
    if (status === "pass") {
      return { bg: "#dcfce7", border: "#86efac", text: "#15803d", cardBg: "#f7fef9" };
    }
    if (status === "fail") {
      return { bg: "#fee2e2", border: "#fca5a5", text: "#b91c1c", cardBg: "#fff8f8" };
    }
    if (status === "na") {
      return { bg: "#e2e8f0", border: "#cbd5e1", text: "#475569", cardBg: "#ffffff" };
    }
    return { bg: "#f1f5f9", border: "#cbd5e1", text: "#64748b", cardBg: "#ffffff" };
  }

  function drawHeaderBlock(ctx, block, stats, reportMeta) {
    const x = PDF_MARGIN_X;
    const y = block.y;
    const w = PDF_CONTENT_W;

    // Navy Banner
    const grad = ctx.createLinearGradient(x, y, x + w, y + 68);
    grad.addColorStop(0, "#0b1f3a");
    grad.addColorStop(1, "#122d52");
    drawRoundedRect(ctx, x, y, w, 68, 10);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 18px ${PDF_FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("사료 제조 공장 QA 점검 사진보고서", x + 18, y + 30);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = `500 11px ${PDF_FONT}`;
    ctx.fillText("현장 위생 및 공정 품질(HACCP / 선행요건) 점검 결과", x + 18, y + 51);

    // Right Date & Shift Pill
    const tagText = `${reportMeta.dateStr} · ${reportMeta.shift}`;
    ctx.font = `700 11px ${PDF_FONT}`;
    const tagW = ctx.measureText(tagText).width + 20;
    drawRoundedRect(ctx, x + w - 16 - tagW, y + 21, tagW, 26, 13);
    ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(tagText, x + w - 16 - tagW / 2, y + 38);

    // Summary Card
    const boxY = y + 78;
    const boxH = 102;
    drawRoundedRect(ctx, x, boxY, w, boxH, 10);
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
    ctx.strokeStyle = "#d7e0ea";
    ctx.lineWidth = 1;
    ctx.stroke();

    const col1X = x + 16;
    const col2X = x + 344;
    ctx.textAlign = "left";

    const drawMetaPair = (px, py, label, value, valColor) => {
      ctx.fillStyle = "#5b6b7f";
      ctx.font = `700 11px ${PDF_FONT}`;
      ctx.fillText(label, px, py);
      ctx.fillStyle = valColor || "#182433";
      ctx.font = `700 11.5px ${PDF_FONT}`;
      ctx.fillText(value, px + 76, py, 230);
    };

    drawMetaPair(col1X, boxY + 22, "점검 일자", reportMeta.dateStr);
    drawMetaPair(col2X, boxY + 22, "공장 / 라인", reportMeta.lineName);
    drawMetaPair(col1X, boxY + 43, "점검자", reportMeta.inspector);
    drawMetaPair(col2X, boxY + 43, "교대조", reportMeta.shift);
    drawMetaPair(col1X, boxY + 64, "진행률", `${stats.totalDone}/${TOTAL_ITEMS} 완료`);

    let rateColor = "#0b1f3a";
    if (stats.passRateNum !== null) {
      if (stats.passRateNum >= 90) rateColor = "#15803d";
      else if (stats.passRateNum >= 70) rateColor = "#d97706";
      else rateColor = "#b91c1c";
    }
    drawMetaPair(col2X, boxY + 64, "적합률", stats.passRate, rateColor);

    // Count Pills Row
    const pills = [
      { label: `적합 ${stats.passCount}`, bg: "#dcfce7", color: "#15803d" },
      { label: `부적합 ${stats.failCount}`, bg: "#fee2e2", color: "#b91c1c" },
      { label: `해당없음 ${stats.naCount}`, bg: "#e2e8f0", color: "#475569" },
      { label: `첨부 사진 ${stats.totalPhotos}장`, bg: "#e8eef6", color: "#122d52" }
    ];
    let pillX = col1X;
    const pillY = boxY + 74;
    pills.forEach((p) => {
      ctx.font = `700 10.5px ${PDF_FONT}`;
      const pw = ctx.measureText(p.label).width + 18;
      drawRoundedRect(ctx, pillX, pillY, pw, 20, 10);
      ctx.fillStyle = p.bg;
      ctx.fill();
      ctx.fillStyle = p.color;
      ctx.textAlign = "center";
      ctx.fillText(p.label, pillX + pw / 2, pillY + 14);
      pillX += pw + 8;
    });
    ctx.textAlign = "left";
  }

  function drawCategoryHeaderBlock(ctx, block) {
    const x = PDF_MARGIN_X;
    const y = block.y;
    const w = PDF_CONTENT_W;

    drawRoundedRect(ctx, x, y, w, block.height, 8);
    ctx.fillStyle = "#f3f6fa";
    ctx.fill();
    ctx.strokeStyle = "#d7e0ea";
    ctx.lineWidth = 1;
    ctx.stroke();

    drawRoundedRect(ctx, x + 8, y + 6, 22, 22, 6);
    ctx.fillStyle = "#122d52";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 11.5px ${PDF_FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(block.catId, x + 19, y + 21);

    const progText = `${block.catDone}/${block.catTotal}`;
    ctx.font = `700 10.5px ${PDF_FONT}`;
    const progW = ctx.measureText(progText).width + 16;

    ctx.textAlign = "left";
    ctx.fillStyle = "#0b1f3a";
    ctx.font = `800 12.5px ${PDF_FONT}`;
    ctx.fillText(`${block.catId}. ${block.catTitle}`, x + 38, y + 21.5, Math.max(100, w - 38 - progW - 22));

    const isDone = block.catDone === block.catTotal;
    drawRoundedRect(ctx, x + w - 10 - progW, y + 7, progW, 20, 10);
    ctx.fillStyle = isDone ? "#dcfce7" : "#ffffff";
    ctx.fill();
    ctx.strokeStyle = isDone ? "#86efac" : "#d7e0ea";
    ctx.stroke();
    ctx.fillStyle = isDone ? "#15803d" : "#122d52";
    ctx.textAlign = "center";
    ctx.fillText(progText, x + w - 10 - progW / 2, y + 20.5);
    ctx.textAlign = "left";
  }

  function drawMemoBox(ctx, x, y, w, memoLines, memoIsFail, memoBoxH) {
    ctx.save();
    drawRoundedRect(ctx, x, y, w, memoBoxH, 6);
    ctx.fillStyle = memoIsFail ? "#fff5f5" : "#f1f5f9";
    ctx.fill();

    // Left accent bar
    drawRoundedRect(ctx, x, y, 4, memoBoxH, 2);
    ctx.fillStyle = memoIsFail ? "#b91c1c" : "#1b4072";
    ctx.fill();

    ctx.fillStyle = memoIsFail ? "#b91c1c" : "#122d52";
    ctx.font = `700 10.5px ${PDF_FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(memoIsFail ? "부적합 상세 메모" : "메모 / 특이사항", x + 12, y + 18);

    ctx.fillStyle = "#1e293b";
    ctx.font = `400 11px ${PDF_FONT}`;
    let lineY = y + 34;
    memoLines.forEach((line) => {
      ctx.fillText(line, x + 12, lineY);
      lineY += 16;
    });
    ctx.restore();
  }

  function drawPhotoRows(ctx, x, startY, innerW, photoRows) {
    const PHOTO_COLS = 3;
    const PHOTO_GAP = 10;
    const tileW = Math.floor((innerW - PHOTO_GAP * (PHOTO_COLS - 1)) / PHOTO_COLS);
    const tileH = 144;
    let rowY = startY;

    photoRows.forEach((row) => {
      row.forEach((entry, colIdx) => {
        const px = x + colIdx * (tileW + PHOTO_GAP);
        drawContainedImage(ctx, entry.img, px, rowY, tileW, tileH);
        ctx.fillStyle = "#5b6b7f";
        ctx.font = `600 10px ${PDF_FONT}`;
        ctx.textAlign = "center";
        ctx.fillText(`사진 ${entry.photoNum}`, px + tileW / 2, rowY + tileH + 13);
      });
      rowY += 170;
    });
    ctx.textAlign = "left";
  }

  function drawItemBlock(ctx, block) {
    const x = PDF_MARGIN_X;
    const y = block.y;
    const w = PDF_CONTENT_W;
    const padX = 13;
    const innerW = w - padX * 2;
    const innerX = x + padX;

    if (block.type === "item") {
      const stStyle = getStatusStyle(block.status);
      drawRoundedRect(ctx, x, y, w, block.height, 9);
      ctx.fillStyle = stStyle.cardBg;
      ctx.fill();
      ctx.strokeStyle = block.status === "fail" ? "#fca5a5" : "#d7e0ea";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Number badge
      drawRoundedRect(ctx, innerX, y + 12, 22, 22, 5);
      ctx.fillStyle = "#e8eef6";
      ctx.fill();
      ctx.fillStyle = "#122d52";
      ctx.font = `800 11px ${PDF_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(String(block.item.id), innerX + 11, y + 27);

      // Item text
      ctx.textAlign = "left";
      ctx.fillStyle = "#182433";
      ctx.font = `700 12.5px ${PDF_FONT}`;
      let textY = y + 27;
      block.titleLines.forEach((line) => {
        ctx.fillText(line, innerX + 28, textY);
        textY += 18;
      });

      // Right status badge
      const badgeLabel = statusBadgeText(block.status);
      const badgeW = 76;
      const badgeH = 22;
      const badgeX = x + w - padX - badgeW;
      const badgeY = y + 12;
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 11);
      ctx.fillStyle = stStyle.bg;
      ctx.fill();
      ctx.strokeStyle = stStyle.border;
      ctx.stroke();
      ctx.fillStyle = stStyle.text;
      ctx.font = `700 10.5px ${PDF_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(badgeLabel, badgeX + badgeW / 2, badgeY + 15);
      ctx.textAlign = "left";

      let curY = y + 12 + block.headerH;
      if (block.memoLines.length > 0) {
        curY += 8;
        drawMemoBox(ctx, innerX, curY, innerW, block.memoLines, block.memoIsFail, block.memoBoxH);
        curY += block.memoBoxH;
      }

      if (block.photoRows.length > 0) {
        curY += 10;
        drawPhotoRows(ctx, innerX, curY, innerW, block.photoRows);
      }
      return;
    }

    if (block.type === "item_memo_cont") {
      drawRoundedRect(ctx, x, y, w, block.height, 9);
      ctx.fillStyle = block.memoIsFail ? "#fff8f8" : "#ffffff";
      ctx.fill();
      ctx.strokeStyle = block.memoIsFail ? "#fca5a5" : "#d7e0ea";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#122d52";
      ctx.font = `700 11.5px ${PDF_FONT}`;
      ctx.textAlign = "left";
      ctx.fillText(block.headerLabel, innerX, y + 26);

      drawMemoBox(ctx, innerX, y + 40, innerW, block.memoLines, block.memoIsFail, block.memoBoxH);
      return;
    }

    if (block.type === "item_cont") {
      drawRoundedRect(ctx, x, y, w, block.height, 9);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#d7e0ea";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#122d52";
      ctx.font = `700 11.5px ${PDF_FONT}`;
      ctx.textAlign = "left";
      ctx.fillText(block.headerLabel, innerX, y + 27);

      drawPhotoRows(ctx, innerX, y + 42, innerW, block.photoRows);
    }
  }

  function drawOverallMemoBlock(ctx, block) {
    const x = PDF_MARGIN_X;
    const y = block.y;
    const w = PDF_CONTENT_W;

    ctx.fillStyle = "#122d52";
    ctx.font = `800 13px ${PDF_FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(
      block.isContinued ? "종합 메모 / 특이사항 (계속)" : "종합 메모 / 특이사항",
      x,
      y + 18
    );

    const boxY = y + 28;
    const boxH = block.height - 28;
    drawRoundedRect(ctx, x, boxY, w, boxH, 9);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#d7e0ea";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#1e293b";
    ctx.font = `400 11.5px ${PDF_FONT}`;
    let lineY = boxY + 22;
    block.lines.forEach((line) => {
      ctx.fillText(line, x + 14, lineY);
      lineY += 17;
    });
  }

  function dataUrlToUint8Array(dataUrl) {
    const commaIdx = dataUrl.indexOf(",");
    const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function renderPdfPagesToJpegs(pages, stats, reportMeta) {
    const canvas = document.createElement("canvas");
    canvas.width = PDF_PAGE_W * PDF_SCALE;
    canvas.height = PDF_PAGE_H * PDF_SCALE;
    const ctx = canvas.getContext("2d");
    const jpegPages = [];

    for (let idx = 0; idx < pages.length; idx++) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(PDF_SCALE, PDF_SCALE);
      ctx.textBaseline = "alphabetic";

      pages[idx].forEach((block) => {
        if (block.type === "header") {
          drawHeaderBlock(ctx, block, stats, reportMeta);
        } else if (block.type === "category_header") {
          drawCategoryHeaderBlock(ctx, block);
        } else if (
          block.type === "item" ||
          block.type === "item_memo_cont" ||
          block.type === "item_cont"
        ) {
          drawItemBlock(ctx, block);
        } else if (block.type === "overall_memo") {
          drawOverallMemoBlock(ctx, block);
        }
      });

      // Footer
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PDF_MARGIN_X, PDF_FOOTER_LINE_Y);
      ctx.lineTo(PDF_PAGE_W - PDF_MARGIN_X, PDF_FOOTER_LINE_Y);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = `500 10px ${PDF_FONT}`;
      ctx.textAlign = "left";
      ctx.fillText(
        `사료 제조 공장 QA 점검 사진보고서 · ${reportMeta.dateStr} · ${reportMeta.lineName}`,
        PDF_MARGIN_X,
        PDF_FOOTER_TEXT_Y
      );

      ctx.fillStyle = "#475569";
      ctx.font = `700 10px ${PDF_FONT}`;
      ctx.textAlign = "right";
      ctx.fillText(`${idx + 1} / ${pages.length}`, PDF_PAGE_W - PDF_MARGIN_X, PDF_FOOTER_TEXT_Y);

      ctx.restore();

      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.88);
      jpegPages.push({
        bytes: dataUrlToUint8Array(jpegDataUrl),
        width: canvas.width,
        height: canvas.height
      });
    }

    canvas.width = 0;
    canvas.height = 0;
    return jpegPages;
  }

  function encodePdfUtf16Hex(str) {
    let hex = "FEFF";
    const text = String(str || "");
    for (let i = 0; i < text.length; i++) {
      hex += text.charCodeAt(i).toString(16).toUpperCase().padStart(4, "0");
    }
    return `<${hex}>`;
  }

  function formatPdfDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `D:${y}${m}${d}${hh}${mm}${ss}`;
  }

  function buildPdfFromJpegs(jpegPages, title) {
    const chunks = [];
    let offset = 0;

    function pushBytes(u8) {
      chunks.push(u8);
      offset += u8.length;
    }

    function pushAscii(str) {
      const u8 = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        u8[i] = str.charCodeAt(i) & 0xff;
      }
      pushBytes(u8);
    }

    const N = jpegPages.length;
    const offsets = new Array(3 + N * 3 + 1);

    pushAscii("%PDF-1.4\n");
    pushBytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

    offsets[1] = offset;
    pushAscii("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

    const kidsRefs = [];
    for (let i = 0; i < N; i++) {
      kidsRefs.push(`${3 + i * 3} 0 R`);
    }
    offsets[2] = offset;
    pushAscii(`2 0 obj\n<< /Type /Pages /Kids [${kidsRefs.join(" ")}] /Count ${N} >>\nendobj\n`);

    for (let i = 0; i < N; i++) {
      const pageObj = 3 + i * 3;
      const imgObj = 4 + i * 3;
      const contentObj = 5 + i * 3;
      const p = jpegPages[i];

      offsets[pageObj] = offset;
      pushAscii(
        `${pageObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${imgObj} 0 R >> >> /Contents ${contentObj} 0 R >>\nendobj\n`
      );

      offsets[imgObj] = offset;
      pushAscii(
        `${imgObj} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`
      );
      pushBytes(p.bytes);
      pushAscii("\nendstream\nendobj\n");

      const streamBody = "q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n";
      offsets[contentObj] = offset;
      pushAscii(
        `${contentObj} 0 obj\n<< /Length ${streamBody.length} >>\nstream\n${streamBody}endstream\nendobj\n`
      );
    }

    const infoObj = 3 + N * 3;
    offsets[infoObj] = offset;
    pushAscii(
      `${infoObj} 0 obj\n<< /Title ${encodePdfUtf16Hex(title)} /Creator (Feed Factory QA Checklist) /CreationDate (${formatPdfDate(new Date())}) >>\nendobj\n`
    );

    const xrefOffset = offset;
    const totalObjects = infoObj + 1;
    pushAscii(`xref\n0 ${totalObjects}\n`);
    pushAscii("0000000000 65535 f \n");
    for (let objNum = 1; objNum <= infoObj; objNum++) {
      pushAscii(`${String(offsets[objNum]).padStart(10, "0")} 00000 n \n`);
    }

    pushAscii(
      `trailer\n<< /Size ${totalObjects} /Root 1 0 R /Info ${infoObj} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
    );

    return new Blob(chunks, { type: "application/pdf" });
  }

  // Smart Web Share & PDF Report Orchestration
  let isGeneratingPdf = false;
  let currentPdfReport = null;

  function revokeCurrentPdfUrl() {
    if (currentPdfReport && currentPdfReport.blobUrl) {
      URL.revokeObjectURL(currentPdfReport.blobUrl);
      currentPdfReport.blobUrl = "";
    }
  }

  window.addEventListener("beforeunload", revokeCurrentPdfUrl);

  async function generatePdfReport() {
    const stats = getReportStats();
    const meta = buildReportMeta(stats);
    const loadedPhotosMap = await preloadReportPhotos();
    const pages = planPdfPages(stats, loadedPhotosMap);
    const jpegPages = renderPdfPagesToJpegs(pages, stats, meta);
    const blob = buildPdfFromJpegs(jpegPages, meta.shareTitle);

    let file = null;
    try {
      file = new File([blob], meta.fileName, {
        type: "application/pdf",
        lastModified: Date.now()
      });
    } catch (err) {
      file = null;
    }

    revokeCurrentPdfUrl();
    const blobUrl = URL.createObjectURL(blob);
    const report = {
      blob,
      file,
      blobUrl,
      fileName: meta.fileName,
      pageCount: jpegPages.length,
      shareTitle: meta.shareTitle,
      summaryText: meta.summaryText
    };
    currentPdfReport = report;
    return report;
  }

  function buildCompatibleShareData(file, title, text) {
    if (
      typeof navigator === "undefined" ||
      typeof navigator.share !== "function" ||
      typeof navigator.canShare !== "function" ||
      !file
    ) {
      return null;
    }
    const candidates = [
      { files: [file], title, text },
      { files: [file], title },
      { files: [file] }
    ];
    for (const payload of candidates) {
      try {
        if (navigator.canShare(payload)) {
          return payload;
        }
      } catch (err) {
        // Fallback to simpler share payload
      }
    }
    return null;
  }

  const exportPdfBtn = document.getElementById("exportPdfBtn");
  const exportPdfBtnLabel = exportPdfBtn ? exportPdfBtn.querySelector(".btn-label") : null;
  const pdfShareModal = document.getElementById("pdfShareModal");
  const pdfShareFileNameEl = document.getElementById("pdfShareFileName");
  const pdfShareFileMetaEl = document.getElementById("pdfShareFileMeta");
  const pdfShareDescEl = document.getElementById("pdfShareDesc");
  const retryNativeShareBtn = document.getElementById("retryNativeShareBtn");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");

  function setExportPdfBusy(busy) {
    isGeneratingPdf = busy;
    if (!exportPdfBtn) return;
    exportPdfBtn.disabled = busy;
    exportPdfBtn.classList.toggle("is-busy", busy);
    if (exportPdfBtnLabel) {
      exportPdfBtnLabel.textContent = busy ? "PDF 생성중..." : "사진보고서";
    }
  }

  function openPdfShareModal(report, mode) {
    pdfShareFileNameEl.textContent = report.fileName;
    pdfShareFileMetaEl.textContent = `총 ${report.pageCount}페이지 · ${formatBytes(report.blob.size)}`;

    if (mode === "retry-share") {
      retryNativeShareBtn.hidden = false;
      downloadPdfBtn.classList.remove("primary");
      pdfShareDescEl.textContent =
        "모바일 브라우저 보안 정책으로 자동 공유가 제한되었습니다. 아래 버튼을 누르면 즉시 공유 앱을 선택할 수 있습니다.";
    } else if (mode === "insecure-downloaded") {
      retryNativeShareBtn.hidden = true;
      downloadPdfBtn.classList.add("primary");
      pdfShareDescEl.textContent =
        "보안 연결(HTTPS)이 아니어서 자동 공유 창을 열 수 없어 PDF 파일을 자동으로 저장했습니다. 저장된 파일을 원하는 앱으로 전달해 주세요.";
    } else {
      retryNativeShareBtn.hidden = true;
      downloadPdfBtn.classList.add("primary");
      pdfShareDescEl.textContent =
        "현재 브라우저에서는 PDF 파일 직접 공유가 지원되지 않아 PDF 파일을 자동으로 저장했습니다. 미리보기·재저장·요약 복사를 이용할 수 있습니다.";
    }

    pdfShareModal.classList.add("open");
  }

  function closePdfShareModal() {
    pdfShareModal.classList.remove("open");
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        // Fallback to execCommand
      }
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }

  exportPdfBtn.addEventListener("click", async () => {
    if (isGeneratingPdf) return;
    setExportPdfBusy(true);
    try {
      const report = await generatePdfReport();
      const shareData = buildCompatibleShareData(
        report.file,
        report.shareTitle,
        report.summaryText
      );

      if (shareData) {
        try {
          await navigator.share(shareData);
          showToast("PDF 사진보고서가 공유되었습니다.");
        } catch (err) {
          if (err && err.name === "AbortError") {
            showToast("공유가 취소되었습니다.");
          } else {
            openPdfShareModal(report, "retry-share");
          }
        }
      } else {
        triggerDownload(report.blobUrl, report.fileName);
        showToast("PDF 보고서가 다운로드되었습니다.");
        openPdfShareModal(
          report,
          window.isSecureContext ? "desktop-downloaded" : "insecure-downloaded"
        );
      }
    } catch (err) {
      showToast("PDF 보고서 생성 중 오류가 발생했습니다.");
    } finally {
      setExportPdfBusy(false);
    }
  });

  retryNativeShareBtn.addEventListener("click", async () => {
    if (!currentPdfReport) return;
    const shareData = buildCompatibleShareData(
      currentPdfReport.file,
      currentPdfReport.shareTitle,
      currentPdfReport.summaryText
    );
    if (!shareData) {
      triggerDownload(currentPdfReport.blobUrl, currentPdfReport.fileName);
      showToast("PDF 보고서가 다운로드되었습니다.");
      return;
    }
    try {
      await navigator.share(shareData);
      closePdfShareModal();
      showToast("PDF 사진보고서가 공유되었습니다.");
    } catch (err) {
      if (err && err.name === "AbortError") {
        showToast("공유가 취소되었습니다.");
      } else {
        triggerDownload(currentPdfReport.blobUrl, currentPdfReport.fileName);
        showToast("공유 창을 열 수 없어 PDF를 저장했습니다.");
      }
    }
  });

  downloadPdfBtn.addEventListener("click", () => {
    if (!currentPdfReport || !currentPdfReport.blobUrl) return;
    triggerDownload(currentPdfReport.blobUrl, currentPdfReport.fileName);
    showToast("PDF 보고서가 다운로드되었습니다.");
  });

  document.getElementById("previewPdfBtn").addEventListener("click", () => {
    if (!currentPdfReport || !currentPdfReport.blobUrl) return;
    const win = window.open(currentPdfReport.blobUrl, "_blank");
    if (!win) {
      triggerDownload(currentPdfReport.blobUrl, currentPdfReport.fileName);
      showToast("팝업이 차단되어 PDF 파일을 저장했습니다.");
    }
  });

  document.getElementById("copySummaryBtn").addEventListener("click", async () => {
    if (!currentPdfReport) return;
    const ok = await copyTextToClipboard(currentPdfReport.summaryText);
    showToast(ok ? "점검 요약이 클립보드에 복사되었습니다." : "클립보드 복사에 실패했습니다.");
  });

  document.getElementById("emailSummaryBtn").addEventListener("click", () => {
    if (!currentPdfReport) return;
    const subject = encodeURIComponent(currentPdfReport.shareTitle);
    const body = encodeURIComponent(
      `${currentPdfReport.summaryText}\n\n※ 저장된 PDF 파일(${currentPdfReport.fileName})을 이메일에 첨부해 주세요.`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  });

  document.getElementById("exportLegacyHtmlBtn").addEventListener("click", () => {
    exportLegacyHtmlReport();
  });

  document.getElementById("closePdfShareBtn").addEventListener("click", closePdfShareModal);
  pdfShareModal.addEventListener("click", (e) => {
    if (e.target === pdfShareModal) closePdfShareModal();
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
      closePdfShareModal();
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
