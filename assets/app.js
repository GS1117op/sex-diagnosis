const choiceOptions = [
  { label: "強くそう思う", value: 3, size: 56, tone: "#ff4d8d" },
  { label: "そう思う", value: 2, size: 48, tone: "#ff78aa" },
  { label: "ややそう思う", value: 1, size: 40, tone: "#ff9fc2" },
  { label: "どちらでもない", value: 0, size: 34, tone: "#b09fc8" },
  { label: "あまりそう思わない", value: -1, size: 40, tone: "#9ad5ff" },
  { label: "そう思わない", value: -2, size: 48, tone: "#7ac7ff" },
  { label: "全くそう思わない", value: -3, size: 56, tone: "#60b4ff" }
];

const questionsPerPage = 5;
const axisMaxScore = 15;
let currentPage = 0;
let answers = Array(questions.length).fill(null);

const topPages = [...document.querySelectorAll(".top-page")];
const home = document.getElementById("home");
const quizPanel = document.getElementById("quizPanel");
const result = document.getElementById("result");
const questionList = document.getElementById("questionList");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const backButton = document.getElementById("backButton");
const nextButton = document.getElementById("nextButton");
const homeButton = document.getElementById("homeButton");

function renderTypeCards() {
  document.getElementById("typesGrid").innerHTML = Object.entries(typeProfiles)
    .map(([code, profile]) => `
      <article class="type-card">
        <span class="type-code">${code}</span>
        <strong>${profile.name}</strong>
        <span>${profile.summary}</span>
      </article>
    `)
    .join("");
}

function showPage(page) {
  topPages.forEach((section) => section.classList.toggle("is-hidden", page !== "home"));
  quizPanel.classList.toggle("active", page === "quiz");
  result.classList.toggle("active", page === "result");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startQuiz() {
  currentPage = 0;
  answers = Array(questions.length).fill(null);
  showPage("quiz");
  renderQuestionPage();
}

function renderQuestionPage() {
  const start = currentPage * questionsPerPage;
  const pageQuestions = questions.slice(start, start + questionsPerPage);
  const answeredCount = answers.filter((answer) => answer !== null).length;

  progressText.textContent = `${answeredCount} / ${questions.length} 回答済み`;
  progressFill.style.width = `${(answeredCount / questions.length) * 100}%`;
  backButton.disabled = currentPage === 0;

  questionList.innerHTML = pageQuestions.map((question, index) => {
    const questionIndex = start + index;
    return `
      <div class="question-item">
        <div class="question-title">Q${questionIndex + 1}. ${question.text}</div>
        <div class="scale" role="radiogroup" aria-label="Q${questionIndex + 1}の回答">
          <span class="scale-end agree">そう思う</span>
          <div class="scale-options">
            ${choiceOptions.map((option) => `
              <button class="choice ${answers[questionIndex] === option.value ? "active" : ""}" style="--size:${option.size}px;--tone:${option.tone}" type="button" data-question="${questionIndex}" data-value="${option.value}" aria-label="${option.label}" title="${option.label}">${option.label}</button>
            `).join("")}
          </div>
          <span class="scale-end disagree">そう思わない</span>
        </div>
      </div>
    `;
  }).join("");

  questionList.querySelectorAll(".choice").forEach((button) => {
    button.addEventListener("click", () => {
      answers[Number(button.dataset.question)] = Number(button.dataset.value);
      renderQuestionPage();
    });
  });

  nextButton.disabled = !pageQuestions.every((_, index) => answers[start + index] !== null);
  nextButton.textContent = currentPage === Math.ceil(questions.length / questionsPerPage) - 1 ? "結果を見る" : "次へ";
}

function calculateResult() {
  const sums = { lead: 0, value: 0, explore: 0, desire: 0 };
  questions.forEach((question, index) => {
    sums[question.axis] += answers[index] || 0;
  });

  const code = [
    sums.lead >= 0 ? axes.lead.left : axes.lead.right,
    sums.value >= 0 ? axes.value.left : axes.value.right,
    sums.explore >= 0 ? axes.explore.left : axes.explore.right,
    sums.desire >= 0 ? axes.desire.left : axes.desire.right
  ].join("-");

  return { code, sums };
}

function renderTraitBars(sums) {
  return Object.entries(axes).map(([key, axis]) => {
    const score = sums[key];
    const leftPercent = Math.round(((score + axisMaxScore) / (axisMaxScore * 2)) * 100);
    const rightPercent = 100 - leftPercent;
    const dominantName = score >= 0 ? axis.leftName : axis.rightName;
    const dominantPercent = Math.max(leftPercent, rightPercent);

    return `
      <div class="trait-bar-card">
        <div class="trait-bar-head">
          <strong>${axis.label}</strong>
          <span>${dominantName} ${dominantPercent}%</span>
        </div>
        <div class="trait-scale-labels"><span>${axis.left} ${axis.leftName}</span><span>${axis.rightName} ${axis.right}</span></div>
        <div class="trait-meter" aria-label="${axis.label}: ${dominantName} ${dominantPercent}%">
          <div class="trait-meter-fill" style="width:${leftPercent}%"></div>
          <div class="trait-meter-marker" style="left:${leftPercent}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function getCompatibilityRanking(code) {
  const [lead, value, explore, desire] = code.split("-");

  return Object.entries(typeProfiles)
    .filter(([typeCode]) => typeCode !== code)
    .map(([typeCode, profile]) => {
      const [typeLead, typeValue, typeExplore, typeDesire] = typeCode.split("-");
      let score = 0;
      const reasons = [];

      if (typeLead !== lead) {
        score += 4;
        reasons.push("主導と受け身のバランスが取りやすい");
      } else {
        score += 1;
      }

      if (typeValue === value) {
        score += 4;
        reasons.push("大事にしたい満足感が近い");
      }

      if (typeExplore === explore) {
        score += 3;
        reasons.push("安心感と刺激のペースが合いやすい");
      }

      if (typeDesire === desire) {
        score += 3;
        reasons.push("欲求の温度感が近い");
      }

      return { code: typeCode, profile, score, reasons: reasons.slice(0, 2) };
    })
    .sort((a, b) => b.score - a.score || a.code.localeCompare(b.code))
    .slice(0, 3);
}

function renderCompatibilityRanking(code) {
  return getCompatibilityRanking(code).map((item, index) => `
    <article class="compatibility-card">
      <div class="compatibility-rank">No.${index + 1}</div>
      <div>
        <span class="type-code">${item.code}</span>
        <strong>${item.profile.name}</strong>
        <p>${item.profile.summary}</p>
        <ul>
          ${item.reasons.map((reason) => `<li>${reason}</li>`).join("")}
        </ul>
      </div>
    </article>
  `).join("");
}

function showResult() {
  const { code, sums } = calculateResult();
  const profile = typeProfiles[code];
  const shareText = `私のSEX 16タイプ診断は「${code} ${profile.name}」でした。`;
  const shareUrl = location.href.split("#")[0];

  result.innerHTML = `
    <div class="result-mbti-hero">
      <div>
        <div class="eyebrow">Your Type</div>
        <h2 class="result-title">${profile.name}</h2>
        <div class="result-code">${code}</div>
        <p class="result-summary">${profile.summary}</p>
      </div>
      <div class="result-type-badge" aria-hidden="true">${profile.name}</div>
    </div>

    <section class="result-section">
      <div class="section-heading">
        <span class="eyebrow">Compatibility</span>
        <h3>相性のよい16タイプ TOP3</h3>
      </div>
      <div class="compatibility-ranking">${renderCompatibilityRanking(code)}</div>
    </section>

    <section class="result-section">
      <div class="section-heading">
        <span class="eyebrow">Traits</span>
        <h3>あなたの4つの指標</h3>
      </div>
      <div class="trait-bars">${renderTraitBars(sums)}</div>
    </section>

    <section class="result-section">
      <div class="section-heading">
        <span class="eyebrow">Profile</span>
        <h3>${profile.name}の特徴</h3>
      </div>
      <p class="result-description">${profile.description}</p>
    </section>

    <section class="profile-grid result-section">
      <div class="trait-box">
        <h3>強み</h3>
        <ul class="trait-list strong">${profile.strengths.map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>
      <div class="trait-box">
        <h3>弱み</h3>
        <ul class="trait-list weak">${profile.weaknesses.map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>
    </section>

    <p class="result-note">この結果は、いまの気分や相手との関係性でも変わります。自分を決めつけるためではなく、会話の入口として使ってください。</p>
    <div class="actions">
      <button id="retryButton" class="primary" type="button">もう一度診断する</button>
      <button id="resultHomeButton" class="secondary" type="button">トップへ戻る</button>
      <button id="copyResultButton" class="secondary" type="button">結果をコピー</button>
      <a class="button-link secondary" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener noreferrer">Xでシェア</a>
    </div>
  `;

  showPage("result");
  document.getElementById("retryButton").addEventListener("click", startQuiz);
  document.getElementById("resultHomeButton").addEventListener("click", () => showPage("home"));
  document.getElementById("copyResultButton").addEventListener("click", async (event) => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      event.currentTarget.textContent = "コピーしました";
    } catch {
      event.currentTarget.textContent = "コピーできませんでした";
    }
  });
}

document.getElementById("startButtonTop").addEventListener("click", startQuiz);
document.getElementById("startButtonBottom").addEventListener("click", startQuiz);
homeButton.addEventListener("click", () => showPage("home"));
backButton.addEventListener("click", () => {
  if (currentPage > 0) {
    currentPage -= 1;
    renderQuestionPage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});
nextButton.addEventListener("click", () => {
  if (currentPage === Math.ceil(questions.length / questionsPerPage) - 1) {
    showResult();
  } else {
    currentPage += 1;
    renderQuestionPage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

renderTypeCards();
