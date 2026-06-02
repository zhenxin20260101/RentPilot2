// ==========================================================================
// ⚙️ 審查標準外部化設定區 (未來法規異動時，同仁只需在此處修改即可)
// ==========================================================================
const CONFIG = {
    // 當前郵政儲金一年期定期儲蓄存款機動利率 (回推本金分母)
    INTEREST_RATE: 0.01035, 
    
    // 各縣市法定審查上限金額設定
    STANDARDS: {
        "桃園市": { incomeLimit: 58688, assetLimit: 4790000, propertyLimit: 6630000 },
        "南投縣": { incomeLimit: 54303, assetLimit: 3330000, propertyLimit: 5600000 },
        "彰化縣": { incomeLimit: 54303, assetLimit: 3330000, propertyLimit: 5600000 }
    }
};

// 初始化今日日期
document.getElementById("today").innerText = new Date().toLocaleDateString("zh-TW");

let memberCounter = 0;

// 動態新增成員填寫卡片 (電腦版自動橫式並排)
function addMemberCard() {
    memberCounter++;
    let container = document.getElementById("membersContainer");
    let card = document.createElement("div");
    card.className = "member-card";
    card.id = `member_${memberCounter}`;
    
    card.innerHTML = `
        <div class="member-header">
            <div class="member-title">
                👤 <span>成員 ${memberCounter}</span>
                <input type="text" placeholder="姓名 (選填)" oninput="calculateAll()">
            </div>
            <button class="deleteCardBtn" onclick="removeMemberCard('${card.id}')">❌ 刪除此成員</button>
        </div>
        
        <div class="grid-container">
            <div class="grid-col">
                <h3>動產與所得</h3>
                <div class="form-group">
                    <label>年收入總額<small>(年度綜合所得)</small></label>
                    <input type="number" class="val-income" value="0" min="0" oninput="validateAndCalculate(this)">
                </div>
                <div class="form-group">
                    <label>年利息所得<small>(稅籍清單利息)</small></label>
                    <input type="number" class="val-interest" value="0" min="0" oninput="validateAndCalculate(this)">
                </div>
                <div class="form-group">
                    <label>競技中獎所得<small>(機會中獎稅額)</small></label>
                    <input type="number" class="val-game" value="0" min="0" oninput="validateAndCalculate(this)">
                </div>
                <div class="form-group">
                    <label>存款本金 / 其他<small>(直接加總不回推)</small></label>
                    <input type="number" class="val-other" value="0" min="0" oninput="validateAndCalculate(this)">
                </div>
            </div>
            
            <div class="grid-col">
                <h3>不動產現值</h3>
                <div class="form-group">
                    <label>土地現值<small>(公告土地現值)</small></label>
                    <input type="number" class="val-land" value="0" min="0" oninput="validateAndCalculate(this)">
                </div>
                <div class="form-group">
                    <label>房屋現值<small>(評定現值)</small></label>
                    <input type="number" class="val-house" value="0" min="0" oninput="validateAndCalculate(this)">
                </div>
            </div>
        </div>
        
        <div class="member-summary">
            <span class="sub-asset">個人動產小計：0 元</span>
            <span class="sub-property">個人不動產小計：0 元</span>
        </div>
    `;
    
    container.appendChild(card);
    calculateAll();
}

// 刪除成員卡片
function removeMemberCard(cardId) {
    let cards = document.querySelectorAll(".member-card");
    if (cards.length <= 1) {
        alert("審查系統必須保留至少一位審查成員（主申請人）。");
        return;
    }
    document.getElementById(cardId).remove();
    reindexMembers();
    calculateAll();
}

// 重新編排成員順序
function reindexMembers() {
    let cards = document.querySelectorAll(".member-card");
    cards.forEach((card, index) => {
        card.querySelector(".member-title span").innerText = `成員 ${index + 1}`;
    });
}

// 介面值防負數與即時連動機制
function validateAndCalculate(inputEl) {
    let val = Number(inputEl.value);
    
    // 防負數：如果輸入負數，即時加上警告紅框樣式
    if (val < 0) {
        inputEl.classList.add("invalid-negative");
    } else {
        inputEl.classList.remove("invalid-negative");
    }
    
    calculateAll();
}

// 核心精算與全戶結果統計
function calculateAll() {
    let city = document.getElementById("city").value;
    
    // 讀取外部化標準物件
    let currentStandard = CONFIG.STANDARDS[city] || CONFIG.STANDARDS["桃園市"];
    let incomeLimit = currentStandard.incomeLimit;
    let assetLimit = currentStandard.assetLimit;
    let propertyLimit = currentStandard.propertyLimit;

    let cards = document.querySelectorAll(".member-card");
    let totalMembers = cards.length || 1;

    let totalHouseholdIncome = 0;
    let totalHouseholdAsset = 0;
    let totalHouseholdProperty = 0;

    cards.forEach(card => {
        // 利用 Math.max(0, ...) 強制阻斷負數參與運算，確保公式精確度
        let income   = Math.max(0, Number(card.querySelector(".val-income").value) || 0);
        let interest = Math.max(0, Number(card.querySelector(".val-interest").value) || 0);
        let game     = Math.max(0, Number(card.querySelector(".val-game").value) || 0);
        let other    = Math.max(0, Number(card.querySelector(".val-other").value) || 0);
        let land     = Math.max(0, Number(card.querySelector(".val-land").value) || 0);
        let house    = Math.max(0, Number(card.querySelector(".val-house").value) || 0);

        // 精確度計算：利息回推本金，避免因浮點數失真，回推結果取四捨五入整數
        let principalFromInterest = 0;
        if (interest > 0 && CONFIG.INTEREST_RATE > 0) {
            principalFromInterest = Math.round(interest / CONFIG.INTEREST_RATE);
        }
        
        let personalAsset = principalFromInterest + game + other;
        let personalProperty = land + house;

        // 更新卡片小計
        card.querySelector(".sub-asset").innerText = `個人動產小計：${Math.round(personalAsset).toLocaleString()} 元`;
        card.querySelector(".sub-property").innerText = `個人不動產小計：${Math.round(personalProperty).toLocaleString()} 元`;

        // 彙整全戶總額
        totalHouseholdIncome += income;
        totalHouseholdAsset += personalAsset;
        totalHouseholdProperty += personalProperty;
    });

    // 全戶平均每人月收入 = 全戶年所得總額 / 12個月 / 全戶總審查人口數
    let avgMonthlyIncome = totalHouseholdIncome / 12 / totalMembers;

    // 四捨五入處理，排除浮點數小數點漏洞
    avgMonthlyIncome = Math.round(avgMonthlyIncome);
    totalHouseholdAsset = Math.round(totalHouseholdAsset);
    totalHouseholdProperty = Math.round(totalHouseholdProperty);

    // 渲染 UI 統計面板
    updateBoxDisplay("avgIncome", `全戶平均每人月收入：${avgMonthlyIncome.toLocaleString()} 元`, avgMonthlyIncome <= incomeLimit);
    updateBoxDisplay("assetTotal", `全戶動產總額：${totalHouseholdAsset.toLocaleString()} 元`, totalHouseholdAsset <= assetLimit);
    updateBoxDisplay("propertyTotal", `全戶不動產總額：${totalHouseholdProperty.toLocaleString()} 元`, totalHouseholdProperty <= propertyLimit);

    // 核對資格狀態
    let incomeOK = avgMonthlyIncome <= incomeLimit;
    let assetOK = totalHouseholdAsset <= assetLimit;
    let propertyOK = totalHouseholdProperty <= propertyLimit;

    showResultText("incomeResult", incomeOK, "平均每人月收入", incomeLimit);
    showResultText("assetResult", assetOK, "全戶動產總額", assetLimit);
    showResultText("propertyResult", propertyOK, "全戶不動產總額", propertyLimit);

    // 資格印章控制
    let stamp = document.getElementById("stamp");
    if (incomeOK && assetOK && propertyOK) {
        stamp.style.display = "block";
        stamp.className = "stamp pass";
        stamp.innerText = "符合資格";
    } else {
        stamp.style.display = "block";
        stamp.className = "stamp fail";
        stamp.innerText = "不符資格";
    }
}

function updateBoxDisplay(id, text, isOK) {
    let el = document.getElementById(id);
    el.innerText = text;
    el.className = "totalBox " + (isOK ? "green" : "red");
}

// 顯示上限提醒文字
function showResultText(id, ok, title, limit) {
    document.getElementById(id).innerHTML = ok
        ? `<div class="result pass">✓ ${title} 符合標準</div>`
        : `<div class="result fail">✗ ${title} 超標 (本項法規上限：${limit.toLocaleString()} 元)</div>`;
}

function printPage() {
    window.print();
}

// 開啟網頁時自動建置第 1 位審查人
window.onload = function() {
    addMemberCard();
};