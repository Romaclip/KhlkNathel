const currentTurnDiv = document.getElementById("currentTurn");
const timerDiv = document.getElementById("timer");
const questionDiv = document.getElementById("question");
const mediaDiv = document.getElementById("media");
const skipBtn = document.getElementById("skipBtn");
const doubleBtn = document.getElementById("doubleBtn");
const callFriendBtn = document.getElementById("callFriendBtn");
const resultDiv = document.getElementById("result");
const team1ScoreDiv = document.getElementById("team1Score");
const team1EnergyDiv = document.getElementById("team1Energy");
const team1SkipDiv = document.getElementById("team1Skip");
const team1DoubleDiv = document.getElementById("team1Double");
const team1CallDiv = document.getElementById("team1Call");
const team2ScoreDiv = document.getElementById("team2Score");
const team2EnergyDiv = document.getElementById("team2Energy");
const team2SkipDiv = document.getElementById("team2Skip");
const team2DoubleDiv = document.getElementById("team2Double");
const team2CallDiv = document.getElementById("team2Call");
const team1NameDiv = document.getElementById("team1Name");
const team2NameDiv = document.getElementById("team2Name");
const answerModal = document.getElementById("answerModal");
const answerText = document.getElementById("answerText");
const protectionModal = document.getElementById("protectionModal");
const readyModal = document.getElementById("readyModal");
const readyText = document.getElementById("readyText");
const callFriendModal = document.getElementById("callFriendModal");
const callFriendOptions = document.getElementById("callFriendOptions");
const penaltyModal = document.getElementById("penaltyModal");
const penaltyText = document.getElementById("penaltyText");

// تطبيق الألوان من localStorage
const team1Color = localStorage.getItem("team1Color") || "#ff6b6b";
const team2Color = localStorage.getItem("team2Color") || "#00eaff";
document.documentElement.style.setProperty('--team1-color', team1Color);
document.documentElement.style.setProperty('--team2-color', team2Color);

function updateTurnDisplay() {
    currentTurnDiv.innerHTML = `دور: ${currentTurn === 1 ? team1Name : team2Name}`;
    currentTurnDiv.classList.remove("team1-turn", "team2-turn");
    currentTurnDiv.classList.add(currentTurn === 1 ? "team1-turn" : "team2-turn");
    team1NameDiv.classList.toggle("active-team", currentTurn === 1);
    team2NameDiv.classList.toggle("active-team", currentTurn === 2);
}

function showCallFriendOptions() {
    if (!currentQuestion.options || currentQuestion.options.length < 4) {
        const dummyAnswers = ["فرنسا", "إيطاليا", "ألمانيا"];
        currentQuestion.options = [currentQuestion.a, ...dummyAnswers].slice(0, 4);
    }
    const options = currentQuestion.options.sort(() => Math.random() - 0.5);
    callFriendOptions.innerHTML = options.map(opt => `<p>${opt}</p>`).join('');
    callFriendModal.style.display = "block";
}

function closeCallFriend() {
    callFriendModal.style.display = "none";
    startTimer();
}

function promptNextTurn() {
    readyText.innerHTML = `جاهزين ${currentTurn === 1 ? team1Name : team2Name}؟`;
    readyModal.style.display = "block";
}

function startNextTurn() {
    readyModal.style.display = "none";
    resultDiv.innerHTML = "";
    loadQuestion();
    startTimer();
}

function restartGame() {
    team1Score = team2Score = 0;
    team1Energy = team2Energy = 0;
    team1EnergyUsed = team2EnergyUsed = 0;
    team1SkipUsed = team2SkipUsed = false;
    team1DoubleUsed = team2DoubleUsed = false;
    team1CallUsed = team2CallUsed = false;
    team1Correct = team1Wrong = team1Skips = 0;
    team2Correct = team2Wrong = team2Skips = 0;
    usedQuestions = [];
    currentTurn = 1;
    team1ScoreDiv.innerHTML = `نقاط: 0`;
    team1EnergyDiv.innerHTML = `طاقة الحماية: 0 (مستخدم: 0/2)`;
    team1SkipDiv.innerHTML = "تخطي: متاح";
    team1DoubleDiv.innerHTML = "تحدي مضاعف: متاح";
    team1CallDiv.innerHTML = "اتصال بصديق: متاح";
    team2ScoreDiv.innerHTML = `نقاط: 0`;
    team2EnergyDiv.innerHTML = `طاقة الحماية: 0 (مستخدم: 0/2)`;
    team2SkipDiv.innerHTML = "تخطي: متاح";
    team2DoubleDiv.innerHTML = "تحدي مضاعف: متاح";
    team2CallDiv.innerHTML = "اتصال بصديق: متاح";
    updateTurnDisplay();
    penaltyModal.style.display = "none";
    document.querySelector(".container").style.display = "block";
    promptNextTurn();
}

// لا تستدعي initializeGame() هنا لأنها في game.js