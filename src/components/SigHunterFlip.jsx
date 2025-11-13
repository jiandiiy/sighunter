import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { sigCards, normalMessages, specialMessages } from "../data/sigData";
import "./flip.css";

export default function SigHunterFlip() {
  const fileInputRefs = useRef({});
  const popupWindowRef = useRef(null);

  const [flipped, setFlipped] = useState({});
  const [locked, setLocked] = useState({});
  
  const [revealed, setRevealed] = useState(() => {
    try {
      const saved = localStorage.getItem("sigRevealed");
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error("localStorage 로드 실패:", error);
      return {};
    }
  });

  const [popup, setPopup] = useState(null);

  const [randomImages, setRandomImages] = useState(() => {
    try {
      const saved = localStorage.getItem("sigImages");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (error) {
      console.error("이미지 데이터 로드 실패:", error);
    }
    
    const init = {};
    sigCards.forEach((c) => {
      const imgs = c.frontImages;
      if (imgs && imgs.length > 0) {
        init[c.id] = imgs[Math.floor(Math.random() * imgs.length)];
      }
    });
    return init;
  });

  // ✅ 카드별 확률 상태 (각 카드마다 독립적인 확률)
  const [cardWeights, setCardWeights] = useState(() => {
    try {
      const saved = localStorage.getItem("cardWeights");
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.error("카드별 확률 로드 실패:", error);
    }
    
    const init = {};
    sigCards.forEach(card => {
      if (card.isSpecial) {
        init[card.id] = specialMessages.map(m => m.weight);
      } else {
        init[card.id] = normalMessages.map(m => m.weight);
      }
    });
    return init;
  });

  // ✅ 카드별 확률 저장
  useEffect(() => {
    try {
      localStorage.setItem("cardWeights", JSON.stringify(cardWeights));
    } catch (error) {
      console.error("cardWeights 저장 실패:", error);
    }
  }, [cardWeights]);

  // ✅ localStorage 저장
  useEffect(() => {
    try {
      localStorage.setItem("sigRevealed", JSON.stringify(revealed));
    } catch (error) {
      console.error("sigRevealed 저장 실패:", error);
    }
  }, [revealed]);

  useEffect(() => {
    try {
      localStorage.setItem("sigImages", JSON.stringify(randomImages));
    } catch (error) {
      console.error("sigImages 저장 실패:", error);
    }
  }, [randomImages]);

  useEffect(() => {
    try {
      localStorage.setItem("sigLocked", JSON.stringify(locked));
    } catch (error) {
      console.error("sigLocked 저장 실패:", error);
    }
  }, [locked]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sigLocked");
      if (saved) {
        const parsed = JSON.parse(saved);
        setLocked(parsed);
      }
    } catch (error) {
      console.error("locked 상태 로드 실패:", error);
    }
  }, []);

  // ✅ 팝업 창과 메인 창 간 통신 (localStorage 변경 감지)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "sigRevealed") {
        try {
          const newRevealed = JSON.parse(e.newValue || "{}");
          setRevealed(newRevealed);
        } catch (error) {
          console.error("revealed 동기화 오류:", error);
        }
      } else if (e.key === "cardWeights") {
        try {
          const newWeights = JSON.parse(e.newValue || "{}");
          setCardWeights(newWeights);
        } catch (error) {
          console.error("cardWeights 동기화 오류:", error);
        }
      } else if (e.key === "sigImages") {
        try {
          const newImages = JSON.parse(e.newValue || "{}");
          setRandomImages(newImages);
        } catch (error) {
          console.error("randomImages 동기화 오류:", error);
        }
      } else if (e.key === "sigLocked") {
        try {
          const newLocked = JSON.parse(e.newValue || "{}");
          setLocked(newLocked);
        } catch (error) {
          console.error("locked 동기화 오류:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ✅ 불꽃놀이 효과
  const fireConfetti = (tier) => {
    try {
      const isLegend = ["전설", "레전드"].includes(tier);
      const isRare = ["희귀", "레어"].includes(tier);
      if (!isLegend && !isRare) return;

      const colors = isLegend
        ? ["#FFD700", "#FFA500", "#FF69B4", "#FA709A", "#FFF4B3"]
        : ["#93F9B9", "#77A1D3", "#B2FEFA", "#1D976C"];

      const launchFirework = (xOrigin, yTarget, colorSet, delay = 0) => {
        setTimeout(() => {
          try {
            const myCanvas = document.createElement("canvas");
            myCanvas.style.position = "fixed";
            myCanvas.style.top = "0";
            myCanvas.style.left = "0";
            myCanvas.style.width = "100%";
            myCanvas.style.height = "100%";
            myCanvas.style.pointerEvents = "none";
            myCanvas.style.zIndex = "9998";
            document.body.appendChild(myCanvas);

            const myConfetti = confetti.create(myCanvas, {
              resize: true,
              useWorker: true,
            });

            myConfetti({
              particleCount: 12,
              startVelocity: 60,
              spread: 8,
              angle: xOrigin < 0.5 ? 80 : 100,
              gravity: 0.8,
              colors: ["#ffffff"],
              ticks: 100,
              scalar: 0.8,
              origin: { x: xOrigin, y: 1 },
            }).catch((err) => console.error("Confetti 오류:", err));

            setTimeout(() => {
              myConfetti({
                particleCount: 50,
                startVelocity: 45,
                spread: 120,
                gravity: 0.6,
                decay: 0.9,
                ticks: 250,
                scalar: 1.4,
                colors: colorSet,
                shapes: ["circle", "star"],
                origin: { x: xOrigin, y: yTarget },
              }).catch((err) => console.error("Confetti 오류:", err));

              setTimeout(() => {
                try {
                  if (document.body.contains(myCanvas)) {
                    document.body.removeChild(myCanvas);
                  }
                } catch (err) {
                  console.error("Canvas 제거 오류:", err);
                }
              }, 5000);
            }, 500 + Math.random() * 200);
          } catch (err) {
            console.error("불꽃놀이 생성 오류:", err);
          }
        }, delay);
      };

      if (isLegend) {
        for (let i = 0; i < 6; i++) {
          const x = i % 2 === 0 ? 0.2 + Math.random() * 0.1 : 0.8 - Math.random() * 0.1;
          const y = 0.3 + Math.random() * 0.2;
          launchFirework(x, y, colors, i * 400);
        }
      } else {
        launchFirework(0.5, 0.4, colors);
      }
    } catch (error) {
      console.error("불꽃놀이 효과 오류:", error);
    }
  };

  // ✅ 가중치 기반 랜덤 선택 함수
  const weightedRandomPick = (messages, weights) => {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) return messages[0];

    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < messages.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return messages[i];
      }
    }
    
    return messages[messages.length - 1];
  };

  // ✅ 카드 뒤집기 (카드별 확률 적용)
  const handleFlip = (card, e) => {
    try {
      if (
        e &&
        (e.target.classList.contains("upload-btn") ||
          e.target.classList.contains("edit-msg-btn") ||
          e.target.classList.contains("admin-btn") ||
          e.target.closest(".upload-btn") ||
          e.target.closest(".edit-msg-btn") ||
          e.target.closest(".admin-btn") ||
          e.target.closest(".back-content"))
      ) {
        return;
      }

      const { id, amount, isSpecial } = card;
      if (locked[id]) return;

      const next = !flipped[id];
      setFlipped((prev) => ({ ...prev, [id]: next }));
      
      if (next) {
        setLocked((prev) => ({ ...prev, [id]: true }));

        const cardImages = card.frontImages;
        if (!cardImages || cardImages.length === 0) {
          console.error(`카드 ${id}에 이미지가 없습니다.`);
          return;
        }

        const newImg = cardImages[Math.floor(Math.random() * cardImages.length)];
        
        const baseMessages = isSpecial ? specialMessages : normalMessages;
        const weights = cardWeights[id] || baseMessages.map(m => m.weight);
        const newMsg = weightedRandomPick(baseMessages, weights);

        if (!newMsg) {
          console.error("메시지를 가져올 수 없습니다.");
          return;
        }

        console.log(`🎰 카드 ${id} (${isSpecial ? '특별' : '일반'}):`, newMsg.text, `[${newMsg.tier}]`);

        fireConfetti(newMsg.tier);

        if (["전설", "레전드"].includes(newMsg.tier)) {
          setPopup({ title: "🎶 전설 시그!", message: newMsg.text, amount });
        }

        setRandomImages((prev) => ({ ...prev, [id]: newImg }));
        setRevealed((prev) => ({ ...prev, [id]: newMsg }));
      }
    } catch (error) {
      console.error("카드 뒤집기 오류:", error);
    }
  };

  // ✅ 뒷면 클릭 (잠금 해제)
  const handleBackClick = (id, e) => {
    try {
      e.stopPropagation();
      
      if (locked[id]) {
        setLocked((p) => {
          const updated = { ...p, [id]: false };
          return updated;
        });
      }
    } catch (error) {
      console.error("잠금 토글 오류:", error);
    }
  };

  // ✅ 메시지 수정 팝업 열기 (새 창)
  const handleEditClick = (card, e) => {
    try {
      e.stopPropagation();
      e.preventDefault();

      const current = revealed[card.id] || {
        text: "",
        tier: "일반",
        color: "#ffffff",
        bgColor: "#443288",
      };

      // 새 창으로 열기
      const width = 500;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const editWindow = window.open(
        "",
        `edit-${card.id}`,
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (editWindow) {
        popupWindowRef.current = editWindow;
        
        editWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>카드 ${card.id}번 메시지 수정</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: "Pretendard", -apple-system, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 30px;
                min-height: 100vh;
              }
              .container {
                background: white;
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
              }
              h2 {
                color: #333;
                margin-bottom: 25px;
                text-align: center;
                font-size: 24px;
              }
              label {
                display: block;
                margin-top: 20px;
                margin-bottom: 8px;
                font-weight: 600;
                color: #444;
                font-size: 14px;
              }
              input[type="text"],
              select {
                width: 100%;
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 15px;
                transition: border-color 0.3s;
              }
              input[type="text"]:focus,
              select:focus {
                outline: none;
                border-color: #667eea;
              }
              input[type="color"] {
                width: 100%;
                height: 50px;
                border: 2px solid #ddd;
                border-radius: 8px;
                cursor: pointer;
              }
              .button-group {
                display: flex;
                gap: 10px;
                margin-top: 30px;
              }
              button {
                flex: 1;
                padding: 14px;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
              }
              button:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
              }
              .save-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .cancel-btn {
                background: #e0e0e0;
                color: #333;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>📝 카드 ${card.id}번 메시지 수정</h2>
              
              <label for="msg-text">메시지 내용</label>
              <input
                id="msg-text"
                type="text"
                value="${current.text}"
                placeholder="메시지를 입력하세요"
              />

              <label for="tier-select">등급 선택</label>
              <select id="tier-select">
                <option value="일반" ${current.tier === "일반" ? "selected" : ""}>일반</option>
                <option value="희귀" ${current.tier === "희귀" ? "selected" : ""}>희귀</option>
                <option value="레어" ${current.tier === "레어" ? "selected" : ""}>레어</option>
                <option value="전설" ${current.tier === "전설" ? "selected" : ""}>전설</option>
                <option value="레전드" ${current.tier === "레전드" ? "selected" : ""}>레전드</option>
              </select>

              <label for="color-picker">텍스트 색상</label>
              <input
                id="color-picker"
                type="color"
                value="${current.color}"
              />

              <label for="bg-color-picker">배경 색상</label>
              <input
                id="bg-color-picker"
                type="color"
                value="${current.bgColor}"
              />

              <div class="button-group">
                <button class="save-btn" onclick="saveChanges()">저장 💾</button>
                <button class="cancel-btn" onclick="window.close()">취소</button>
              </div>
            </div>

            <script>
              function saveChanges() {
                const text = document.getElementById('msg-text').value.trim();
                const tier = document.getElementById('tier-select').value;
                const color = document.getElementById('color-picker').value;
                const bgColor = document.getElementById('bg-color-picker').value;

                if (!text) {
                  alert('메시지 내용을 입력해주세요!');
                  return;
                }

                // localStorage에 저장
                try {
                  const revealed = JSON.parse(localStorage.getItem('sigRevealed') || '{}');
                  revealed[${card.id}] = { text, tier, color, bgColor };
                  localStorage.setItem('sigRevealed', JSON.stringify(revealed));

                  // 잠금 해제
                  const locked = JSON.parse(localStorage.getItem('sigLocked') || '{}');
                  locked[${card.id}] = false;
                  localStorage.setItem('sigLocked', JSON.stringify(locked));

                  alert('✅ 수정 완료!');
                  window.close();
                } catch (error) {
                  alert('❌ 저장 실패: ' + error.message);
                }
              }
            </script>
          </body>
          </html>
        `);
        editWindow.document.close();
      } else {
        alert("팝업 차단이 활성화되어 있습니다. 팝업 허용 후 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("수정 팝업 오류:", error);
    }
  };

  // ✅ 확률 조절 팝업 열기 (새 창)
  const handleAdminClick = (e, cardId) => {
    try {
      e.stopPropagation();
      e.preventDefault();

      const card = sigCards.find(c => c.id === cardId);
      const currentWeights = cardWeights[cardId] || [];
      const currentMessages = card?.isSpecial ? specialMessages : normalMessages;

      const width = 800;
      const height = 800;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const adminWindow = window.open(
        "",
        `admin-${cardId}`,
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (adminWindow) {
        popupWindowRef.current = adminWindow;

        const weightsHTML = currentMessages.map((msg, i) => {
          const weight = currentWeights[i] || 0;
          const total = currentWeights.reduce((a, b) => a + b, 0) || 1;
          const percent = ((weight / total) * 100).toFixed(1);

          return `
            <div class="prob-control">
              <div class="prob-header">
                <label>${msg.text}</label>
                <span class="prob-percent">(${percent}%)</span>
              </div>
              <div class="prob-inputs">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value="${weight}"
                  class="range-input"
                  data-index="${i}"
                  oninput="updateWeight(${i}, this.value)"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value="${weight}"
                  class="number-input"
                  data-index="${i}"
                  oninput="updateWeight(${i}, this.value)"
                />
              </div>
            </div>
          `;
        }).join('');

        adminWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>카드 ${cardId}번 확률 조절</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: "Pretendard", -apple-system, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                min-height: 100vh;
              }
              .container {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                max-height: 90vh;
                overflow-y: auto;
              }
              h2 {
                color: #333;
                margin-bottom: 10px;
                text-align: center;
                font-size: 26px;
              }
              .card-type {
                text-align: center;
                color: #666;
                margin-bottom: 25px;
                font-size: 16px;
              }
              .prob-control {
                background: rgba(102, 126, 234, 0.1);
                border-radius: 12px;
                padding: 15px;
                margin-bottom: 15px;
                transition: all 0.3s;
              }
              .prob-control:hover {
                background: rgba(102, 126, 234, 0.2);
                transform: translateX(3px);
              }
              .prob-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
              }
              .prob-header label {
                font-weight: 600;
                color: #333;
                font-size: 15px;
              }
              .prob-percent {
                color: #667eea;
                font-weight: 600;
                font-size: 14px;
              }
              .prob-inputs {
                display: flex;
                gap: 15px;
                align-items: center;
              }
              .range-input {
                flex: 1;
                height: 8px;
                border-radius: 5px;
                background: #ddd;
                outline: none;
                -webkit-appearance: none;
              }
              .range-input::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #667eea;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              }
              .range-input::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #667eea;
                cursor: pointer;
                border: none;
              }
              .number-input {
                width: 80px;
                padding: 8px;
                border: 2px solid #ddd;
                border-radius: 8px;
                text-align: center;
                font-weight: 600;
                font-size: 15px;
              }
              .number-input:focus {
                outline: none;
                border-color: #667eea;
              }
              .button-group {
                display: flex;
                gap: 10px;
                margin-top: 25px;
                flex-wrap: wrap;
              }
              button {
                flex: 1;
                min-width: 150px;
                padding: 14px;
                border: none;
                border-radius: 10px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
              }
              button:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
              }
              .reset-single-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .reset-all-btn {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
              }
              .close-btn {
                background: #e0e0e0;
                color: #333;
              }
              ::-webkit-scrollbar {
                width: 10px;
              }
              ::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
              }
              ::-webkit-scrollbar-thumb {
                background: rgba(102, 126, 234, 0.6);
                border-radius: 10px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>🎰 카드 ${cardId}번 확률 조절</h2>
              <p class="card-type">${card?.isSpecial ? "🌟 특별 카드" : "📇 일반 카드"}</p>
              
              <div id="controls">
                ${weightsHTML}
              </div>

              <div class="button-group">
                <button class="reset-single-btn" onclick="resetSingleCard()">
                  🔄 이 카드만 초기화
                </button>
                <button class="reset-all-btn" onclick="resetAllCards()">
                  🔄 모든 카드 초기화
                </button>
                <button class="close-btn" onclick="window.close()">
                  닫기
                </button>
              </div>
            </div>

            <script>
              let weights = ${JSON.stringify(currentWeights)};
              const messages = ${JSON.stringify(currentMessages.map(m => ({ text: m.text, weight: m.weight })))};
              const cardId = ${cardId};
              const isSpecial = ${card?.isSpecial || false};

              function updateWeight(index, value) {
                weights[index] = parseInt(value) || 0;
                
                // localStorage에 저장
                try {
                  const allWeights = JSON.parse(localStorage.getItem('cardWeights') || '{}');
                  allWeights[cardId] = weights;
                  localStorage.setItem('cardWeights', JSON.stringify(allWeights));
                } catch (error) {
                  console.error('저장 오류:', error);
                }

                // UI 업데이트
                updateUI();
              }

              function updateUI() {
                const total = weights.reduce((a, b) => a + b, 0) || 1;
                const controls = document.querySelectorAll('.prob-control');
                
                controls.forEach((control, i) => {
                  const percent = ((weights[i] / total) * 100).toFixed(1);
                  control.querySelector('.prob-percent').textContent = \`(\${percent}%)\`;
                  
                  const rangeInput = control.querySelector('.range-input');
                  const numberInput = control.querySelector('.number-input');
                  
                  rangeInput.value = weights[i];
                  numberInput.value = weights[i];
                });
              }

              function resetSingleCard() {
                // eslint-disable-next-line no-restricted-globals
                if (window.confirm(\`카드 \${cardId}번의 확률을 초기값으로 복구하시겠습니까?\`)) {
                  weights = messages.map(m => m.weight);
                  
                  try {
                    const allWeights = JSON.parse(localStorage.getItem('cardWeights') || '{}');
                    allWeights[cardId] = weights;
                    localStorage.setItem('cardWeights', JSON.stringify(allWeights));
                    
                    updateUI();
                    alert(\`✅ 카드 \${cardId}번의 확률이 초기값으로 복구되었습니다!\`);
                  } catch (error) {
                    alert('❌ 초기화 실패: ' + error.message);
                  }
                }
              }

              function resetAllCards() {
                // eslint-disable-next-line no-restricted-globals
                if (window.confirm('모든 카드의 확률을 초기값으로 복구하시겠습니까?')) {
                  try {
                    const sigCards = ${JSON.stringify(sigCards.map(c => ({ id: c.id, isSpecial: c.isSpecial })))};
                    const normalMessages = ${JSON.stringify(normalMessages.map(m => m.weight))};
                    const specialMessages = ${JSON.stringify(specialMessages.map(m => m.weight))};
                    
                    const init = {};
                    sigCards.forEach(card => {
                      init[card.id] = card.isSpecial ? specialMessages : normalMessages;
                    });
                    
                    localStorage.setItem('cardWeights', JSON.stringify(init));
                    
                    weights = isSpecial ? specialMessages : normalMessages;
                    updateUI();
                    
                    alert('✅ 모든 카드의 확률이 초기값으로 복구되었습니다!');
                  } catch (error) {
                    alert('❌ 초기화 실패: ' + error.message);
                  }
                }
              }
            </script>
          </body>
          </html>
        `);
        adminWindow.document.close();
      } else {
        alert("팝업 차단이 활성화되어 있습니다. 팝업 허용 후 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("확률 조절 팝업 오류:", error);
    }
  };

  // ✅ 이미지 업로드 버튼 클릭
  const handleUploadClick = (e, id) => {
    try {
      e.stopPropagation();
      e.preventDefault();

      if (fileInputRefs.current[id]) {
        fileInputRefs.current[id].click();
      }

      return false;
    } catch (error) {
      console.error("업로드 버튼 오류:", error);
    }
  };

  // ✅ 이미지 업로드 처리
  const handleImageChange = (e, id) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      
      reader.onload = (ev) => {
        try {
          const url = ev.target?.result;
          if (url) {
            setRandomImages((prev) => {
              const updated = { ...prev, [id]: url };
              return updated;
            });
            
            setFlipped((prev) => ({ ...prev, [id]: false }));
            setLocked((prev) => ({ ...prev, [id]: false }));
          }
        } catch (err) {
          console.error("이미지 로드 오류:", err);
        }
      };
      
      reader.onerror = (error) => {
        console.error("파일 읽기 오류:", error);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("이미지 변경 오류:", error);
    }
  };

  // ✅ 전체 초기화
  const resetAll = () => {
    try {
      // eslint-disable-next-line no-restricted-globals
      if (!window.confirm("모든 데이터를 초기화하시겠습니까?")) return;

      localStorage.clear();
      setFlipped({});
      setLocked({});
      setRevealed({});

      const init = {};
      sigCards.forEach((c) => {
        const imgs = c.frontImages;
        if (imgs && imgs.length > 0) {
          init[c.id] = imgs[Math.floor(Math.random() * imgs.length)];
        }
      });
      setRandomImages(init);

      const initWeights = {};
      sigCards.forEach(card => {
        if (card.isSpecial) {
          initWeights[card.id] = specialMessages.map(m => m.weight);
        } else {
          initWeights[card.id] = normalMessages.map(m => m.weight);
        }
      });
      setCardWeights(initWeights);

      alert("✅ 초기화 완료!");
    } catch (error) {
      console.error("초기화 오류:", error);
    }
  };

  const normalCards = sigCards.filter((c) => !c.isSpecial);
  const specialCard = sigCards.find((c) => c.isSpecial);

  return (
    <div className="natural-container">
      <h2>💖 시그헌터 💖</h2>
      <button className="reset-btn" onClick={resetAll}>
        🔄 전체 초기화
      </button>

      <div className="cards-wrapper">
        {/* 일반 카드 10장 */}
        <div className="card-grid">
          {normalCards.map((c) => {
            const msg = revealed[c.id];
            const glow = msg && ["전설", "레전드"].includes(msg.tier);
            const isLocked = locked[c.id];

            return (
              <div
                key={c.id}
                className={`natural-card ${flipped[c.id] ? "flipped" : ""} ${
                  glow ? "glow" : ""
                } ${isLocked ? "locked" : ""}`}
                onClick={(e) => handleFlip(c, e)}
              >
                <div className="card-inner">
                  {/* 앞면 */}
                  <div className="card-front">
                    <img 
                      src={randomImages[c.id] || "/images/placeholder.png"} 
                      alt={`카드 ${c.id}`}
                      onError={(e) => {
                        e.target.src = "/images/placeholder.png";
                      }}
                    />
                    <button
                      type="button"
                      className="edit-msg-btn"
                      onClick={(e) => handleEditClick(c, e)}
                      title="메시지 수정"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={(e) => handleAdminClick(e, c.id)}
                      title={`카드 ${c.id}번 확률 조절`}
                    >
                      ⚙️
                    </button>
                  </div>

                  {/* 뒷면 */}
                  <div
                    className="card-back"
                    style={
                      msg
                        ? { background: msg.bgColor, color: msg.color }
                        : undefined
                    }
                  >
                    {msg ? (
                      <div
                        className="back-content"
                        onClick={(e) => handleBackClick(c.id, e)}
                      >
                        {isLocked ? (
                          <h1 style={{ fontSize: "4rem", margin: "0px" }}>🔒</h1>
                        ) : (
                          <>
                            <span className={`tier ${msg.tier.toLowerCase()}`}>
                              {msg.tier}
                            </span>
                            <h3>{msg.text}</h3>
                          </>
                        )}
                      </div>
                    ) : (
                      <h3>?</h3>
                    )}

                    <button
                      type="button"
                      className="upload-btn"
                      onClick={(e) => handleUploadClick(e, c.id)}
                      title="이미지 업로드"
                    >
                      🖼️
                    </button>
                    <input
                      ref={(el) => (fileInputRefs.current[c.id] = el)}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageChange(e, c.id)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 특별 카드 1장 */}
        {specialCard && (
          <div className="special-card-container">
            <div
              className={`natural-card special-card ${
                flipped[specialCard.id] ? "flipped" : ""
              } ${locked[specialCard.id] ? "locked" : ""}`}
              onClick={(e) => handleFlip(specialCard, e)}
            >
              <div className="card-inner">
                {/* 앞면 */}
                <div className="card-front">
                  <img
                    src={randomImages[specialCard.id] || "/images/placeholder.png"}
                    alt="특별 카드"
                    onError={(e) => {
                      e.target.src = "/images/placeholder.png";
                    }}
                  />
                  <button
                    type="button"
                    className="edit-msg-btn"
                    onClick={(e) => handleEditClick(specialCard, e)}
                    title="메시지 수정"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={(e) => handleAdminClick(e, specialCard.id)}
                    title={`카드 ${specialCard.id}번 확률 조절`}
                  >
                    ⚙️
                  </button>
                </div>

                {/* 뒷면 */}
                <div
                  className="card-back"
                  style={
                    revealed[specialCard.id]
                      ? {
                          background: revealed[specialCard.id].bgColor,
                          color: revealed[specialCard.id].color,
                        }
                      : undefined
                  }
                >
                  {revealed[specialCard.id] ? (
                    <div
                      className="back-content"
                      onClick={(e) => handleBackClick(specialCard.id, e)}
                    >
                      {locked[specialCard.id] ? (
                        <h1 style={{ fontSize: "6rem", margin: "0px" }}>🔒</h1>
                      ) : (
                        <>
                          <span
                            className={`tier ${revealed[
                              specialCard.id
                            ].tier.toLowerCase()}`}
                          >
                            {revealed[specialCard.id].tier}
                          </span>
                          <h3>{revealed[specialCard.id].text}</h3>
                        </>
                      )}
                    </div>
                  ) : (
                    <h3>?</h3>
                  )}

                  <button
                    type="button"
                    className="upload-btn"
                    onClick={(e) => handleUploadClick(e, specialCard.id)}
                    title="이미지 업로드"
                  >
                    🖼️
                  </button>
                  <input
                    ref={(el) => (fileInputRefs.current[specialCard.id] = el)}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleImageChange(e, specialCard.id)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 전설/레전드 팝업 (메인 화면에만 표시) */}
      {popup && (
        <div className="popup-overlay" onClick={() => setPopup(null)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <h2>{popup.title}</h2>
            <p>🪙 {popup.amount} 하트</p>
            <p>{popup.message}</p>
            <button onClick={() => setPopup(null)}>닫기 ✨</button>
          </div>
        </div>
      )}
    </div>
  );
}