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

// 動態新增成員填寫卡片 (各細項皆改為動態動態列表結構)
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
                
                <div class="sub-section">
                    <label class="section-label">綜合年收入總額 <small>(年度薪資、營利等)</small></label>
                    <div class="list-container" id="income_list_${memberCounter}"></div>
                    <button class="innerAddBtn" onclick="addNestedInput('income_list_${memberCounter}', 'val-income', '年收入金額')">➕ 增加年收入</button>
                </div>

                <div class="sub-section">
                    <label class="section-label">年利息所得 <small>(將依儲金利率回推本金)</small></label>
                    <div class="list-container" id="interest_list_${memberCounter}"></div>
                    <button class="innerAddBtn" onclick="addNestedInput('interest_list_${memberCounter}', 'val-interest', '利息所得')">➕ 增加利息收入</button>
                </div>

                <div class="sub-section">
                    <label class="section-label">競技競賽機會中獎所得</label>
                    <div class="list-container" id="game_list_${memberCounter}"></div>
                    <button class="innerAddBtn" onclick="addNestedInput('game_list_${memberCounter}', 'val-game', '中獎金額')">➕ 增加競技收入</button>
                </div>

                <div class="sub-section">
                    <label class="section-label">存款本金 / 其他動產 <small>(直接加總不回推)</small></label>
                    <div class="list-container" id="other_list_${memberCounter}"></div>
                    <button class="innerAddBtn" onclick="addNestedInput('other_list_${memberCounter}', 'val-other', '其他動產')">➕ 增加其他收入</button>
                </div>
            </div>
            
            <div class="grid-col">
                <h3>不動產現值</h3>
                
                <div class="sub-section">
                    <label class="section-label">土地現值 <small>(公告土地現值)</small></label>
                    <div class="list-container" id="land_list_${memberCounter}"></div>
                    <button class="innerAddBtn" onclick="addNestedInput('land_list_${memberCounter}', 'val-land', '土地現值')">➕ 增加土地</button>
                </div>

                <div class="sub-section">
                    <label class="section-label">房屋現值 <small>(評定現值)</small></label>
                    <div class="list-container" id="house_list_${memberCounter}"></div>
                    <button class="innerAddBtn" onclick="addNestedInput('house_list_${memberCounter}', 'val-house', '房屋現值')">➕ 增加房屋</button>
                </div>
            </div>
        </div>
        
        <div class="member-summary">
            <span class="sub-asset">個人動產小計：0 元</span>
            <span class="sub-property">個人不動產小計：0 元</span>
        </div>
    `;
    
    container.appendChild(card);
    
    // 初始化時，幫每個細項預設各敲出一個輸入框，方便經辦直接填寫
    addNestedInput(`income_list_${memberCounter}`, 'val-income', '年收入金額');
    addNestedInput(`interest_list_${memberCounter}`, 'val-interest', '利息所得');
    addNestedInput(`game_list_${memberCounter}`, 'val-game', '中獎金額');
    addNestedInput(`other_list_${memberCounter}`, 'val-other', '其他動產');
    addNestedInput(`land_list_${memberCounter}`, 'val-land', '土地現值');
    addNestedInput(`house_list_${memberCounter}`, 'val-house', '房屋現值');

    calculateAll();
}

// 卡片內層細項的動態新增函式 (帶有刪除按鈕)
function addNestedInput(listContainerId, className, placeholderText) {
    let listContainer = document.getElementById(listContainerId);
    let div = document.createElement("div");
    div.className = "nested-row";
    div.innerHTML = `
        <input type="number" class="${className}" value="0" min="0" placeholder="${placeholderText}" oninput="validateAndCalculate(this)">
        <button class="innerDelBtn" onclick="removeNestedRow(this)">✕</button>
    `;
    listContainer.appendChild(div);
    calculateAll();
}

// 刪除內部細項欄位
function removeNestedRow(btn) {
    btn.parentElement.remove();
    calculateAll();
}

// 刪除成員大卡片
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

// 重新編排成員順序編號
function reindexMembers() {
    let cards = document.querySelectorAll(".member-card");
    cards.forEach((card, index) => {
        card.querySelector(".member-title span").innerText = `成員 ${index + 1}`;
    });
}

// 介面數值防負數警告連動
function validateAndCalculate(inputEl) {
    let val = Number(inputEl.value);
    if (val < 0) {
        inputEl.classList.add("invalid-negative");
    } else {
        inputEl.classList.remove("invalid-negative");
    }
    calculateAll();
}

// 通用多欄位加總輔助工具 (包含防負數阻斷機制)
function sumNestedFields(cardEl, selector) {
    let sum = 0;
    cardEl.querySelectorAll(selector).forEach(input => {
        let val = Number(input.value) || 0;
        sum += Math.max(0, val); // 負數強制當 0
    });
    return sum;
}

// 核心精算與全戶結果統計
function calculateAll() {
    let city = document.getElementById("city").value;
    
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
        // 利用通用加總函式，分別將各自區塊內「所有新增欄位」進行加總
        let income   = sumNestedFields(card, ".val-income");
        let interest = sumNestedFields(card, ".val-interest");
        let game     = sumNestedFields(card, ".val-game");
        let other    = sumNestedFields(card, ".val-other");
        let land     = sumNestedFields(card, ".val-land");
        let house    = sumNestedFields(card, ".val-house");

        // 精確度計算：所有利息加總後，依儲金利率回推本金
        let principalFromInterest = 0;
        if (interest > 0 && CONFIG.INTEREST_RATE > 0) {
            principalFromInterest = Math.round(interest / CONFIG.INTEREST_RATE);
        }
        
        let personalAsset = principalFromInterest + game + other;
        let personalProperty = land + house;

        // 更新此卡片的個人小計文字
        card.querySelector(".sub-asset").innerText = `個人動產小計：${Math.round(personalAsset).toLocaleString()} 元`;
        card.querySelector(".sub-property").innerText = `個人不動產小計：${Math.round(personalProperty).toLocaleString()} 元`;

        // 彙整到全戶總額中
        totalHouseholdIncome += income;
        totalHouseholdAsset += personalAsset;
        totalHouseholdProperty += personalProperty;
    });

    // 全戶平均每人月收入 = 全戶年所得總額 / 12個月 / 全戶總審查人口數
    let avgMonthlyIncome = Math.round(totalHouseholdIncome / 12 / totalMembers);
    totalHouseholdAsset = Math.round(totalHouseholdAsset);
    totalHouseholdProperty = Math.round(totalHouseholdProperty);

    // 渲染 UI 總統計面板
    updateBoxDisplay("avgIncome", `全戶平均每人月收入：${avgMonthlyIncome.toLocaleString()} 元`, avgMonthlyIncome <= incomeLimit);
    updateBoxDisplay("assetTotal", `全戶動產總額：${totalHouseholdAsset.toLocaleString()} 元`, totalHouseholdAsset <= assetLimit);
    updateBoxDisplay("propertyTotal", `全戶不動產總額：${totalHouseholdProperty.toLocaleString()} 元`, totalHouseholdProperty <= propertyLimit);

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

function showResultText(id, ok, title, limit) {
    document.getElementById(id).innerHTML = ok
        ? `<div class="result pass">✓ ${title} 符合標準</div>`
        : `<div class="result fail">✗ ${title} 超標 (本項法規上限：${limit.toLocaleString()} 元)</div>`;
}

function printPage() {
    window.print();
}

// 網頁開啟初始化
window.onload = function() {
    addMemberCard();
};
