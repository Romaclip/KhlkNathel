const team1Name = localStorage.getItem("team1Name") || "الفريق 1";
const team2Name = localStorage.getItem("team2Name") || "الفريق 2";
const difficulty = localStorage.getItem("difficulty") || "easy";
const team1Categories = JSON.parse(localStorage.getItem("team1Categories")) || [];
const team2Categories = JSON.parse(localStorage.getItem("team2Categories")) || [];
const team1Points = JSON.parse(localStorage.getItem("team1Points")) || {};
const team2Points = JSON.parse(localStorage.getItem("team2Points")) || {};

let team1Score = 0, team1Energy = 0, team1EnergyUsed = 0, team1SkipUsed = false, team1DoubleUsed = false, team1CallUsed = false;
let team2Score = 0, team2Energy = 0, team2EnergyUsed = 0, team2SkipUsed = false, team2DoubleUsed = false, team2CallUsed = false;
let team1Correct = 0, team1Wrong = 0, team1Skips = 0, team2Correct = 0, team2Wrong = 0, team2Skips = 0;
let currentTurn = 1, timeLeft = 0, timerInterval, usedQuestions = [], currentQuestionPoints = 0, currentCategory = '', skippedQuestion = null, currentQuestion = null;

const timerDiv = document.getElementById("timer");
const questionDiv = document.getElementById("question");
const mediaDiv = document.getElementById("media");
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
const answerModal = document.getElementById("answerModal");
const answerText = document.getElementById("answerText");
const protectionModal = document.getElementById("protectionModal");
const callFriendModal = document.getElementById("callFriendModal");
const callFriendOptions = document.getElementById("callFriendOptions");
const penaltyModal = document.getElementById("penaltyModal");
const penaltyText = document.getElementById("penaltyText");

function startTimer() {
    timeLeft = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 10;
    timerDiv.innerHTML = `الوقت المتبقي: ${timeLeft}`;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDiv.innerHTML = `الوقت المتبقي: ${timeLeft}`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            resultDiv.innerHTML = "انتهى الوقت! دور الفريق التالي.";
            resultDiv.style.color = "#00eaff";
            switchTurn();
            promptNextTurn();
        }
    }, 1000);
}

function switchTurn() {
    currentTurn = currentTurn === 1 ? 2 : 1;
    updateTurnDisplay();
}

function updateTurnDisplay() {
    const currentTurnDiv = document.getElementById("currentTurn");
    currentTurnDiv.textContent = `دور: ${currentTurn === 1 ? team1Name : team2Name}`;
    currentTurnDiv.classList.remove("team1-turn", "team2-turn");
    currentTurnDiv.classList.add(currentTurn === 1 ? "team1-turn" : "team2-turn");
}



function revealAnswer() {
    clearInterval(timerInterval);
    answerText.innerHTML = currentQuestion.a;
    answerModal.style.display = "block";
}

function teamCorrect(team) {
    const pointsToAdd = currentQuestionPoints;
    if (team === 1) {
        team1Score += pointsToAdd;
        team1Energy++;
        team1Correct++;
        resultDiv.innerHTML = `مبروك! ${team1Name} أجاب صح وحصل على ${pointsToAdd} نقاط 🎉`;
        team1ScoreDiv.innerHTML = `نقاط: ${team1Score}`;
        team1EnergyDiv.innerHTML = `طاقة الحماية: ${team1Energy} (مستخدم: ${team1EnergyUsed}/2)`;
    } else {
        team2Score += pointsToAdd;
        team2Energy++;
        team2Correct++;
        resultDiv.innerHTML = `مبروك! ${team2Name} أجاب صح وحصل على ${pointsToAdd} نقاط 🎉`;
        team2ScoreDiv.innerHTML = `نقاط: ${team2Score}`;
        team2EnergyDiv.innerHTML = `طاقة الحماية: ${team2Energy} (مستخدم: ${team2EnergyUsed}/2)`;
    }
    resultDiv.style.color = "#2ecc71";
    answerModal.style.display = "none";
    skippedQuestion = null;
    checkGameEnd();
    switchTurn();
    promptNextTurn();
}

function wrongAnswer() {
    if (skippedQuestion) {
        const pointsToLose = currentQuestionPoints;
        if (currentTurn === 1) {
            team1Score = Math.max(0, team1Score - pointsToLose);
            team1Wrong++;
            resultDiv.innerHTML = `${team1Name} أخطأ وخسر ${pointsToLose} نقاط!`;
            team1ScoreDiv.innerHTML = `نقاط: ${team1Score}`;
        } else {
            team2Score = Math.max(0, team2Score - pointsToLose);
            team2Wrong++;
            resultDiv.innerHTML = `${team2Name} أخطأ وخسر ${pointsToLose} نقاط!`;
            team2ScoreDiv.innerHTML = `نقاط: ${team2Score}`;
        }
        resultDiv.style.color = "#ff6b6b";
        answerModal.style.display = "none";
        skippedQuestion = null;
        switchTurn();
        promptNextTurn();
    } else {
        if (currentTurn === 1) team1Wrong++;
        else team2Wrong++;
        resultDiv.innerHTML = `الإجابة خاطئة 😔 ${currentTurn === 1 ? team1Name : team2Name} يخسر ${currentQuestionPoints} نقاط ما لم يستخدم الحماية!`;
        resultDiv.style.color = "#ff6b6b";
        answerModal.style.display = "none";
        if ((currentTurn === 1 && team1Energy > 0 && team1EnergyUsed < 2) ||
            (currentTurn === 2 && team2Energy > 0 && team2EnergyUsed < 2)) {
            protectionModal.style.display = "block";
        } else {
            losePoints();
        }
    }
}

function useProtection() {
    if (currentTurn === 1 && team1Energy > 0 && team1EnergyUsed < 2) {
        team1Energy--;
        team1EnergyUsed++;
        resultDiv.innerHTML = `${team1Name} استخدم الحماية ولم يخسر النقاط!`;
        team1EnergyDiv.innerHTML = `طاقة الحماية: ${team1Energy} (مستخدم: ${team1EnergyUsed}/2)`;
    } else if (currentTurn === 2 && team2Energy > 0 && team2EnergyUsed < 2) {
        team2Energy--;
        team2EnergyUsed++;
        resultDiv.innerHTML = `${team2Name} استخدم الحماية ولم يخسر النقاط!`;
        team2EnergyDiv.innerHTML = `طاقة الحماية: ${team2Energy} (مستخدم: ${team2EnergyUsed}/2)`;
    }
    resultDiv.style.color = "#00eaff";
    protectionModal.style.display = "none";
    switchTurn();
    promptNextTurn();
}

function losePoints() {
    const pointsToLose = currentQuestionPoints;
    if (currentTurn === 1) {
        team1Score = Math.max(0, team1Score - pointsToLose);
        resultDiv.innerHTML = `${team1Name} خسر ${pointsToLose} نقاط!`;
        team1ScoreDiv.innerHTML = `نقاط: ${team1Score}`;
    } else {
        team2Score = Math.max(0, team2Score - pointsToLose);
        resultDiv.innerHTML = `${team2Name} خسر ${pointsToLose} نقاط!`;
        team2ScoreDiv.innerHTML = `نقاط: ${team2Score}`;
    }
    resultDiv.style.color = "#ff6b6b";
    protectionModal.style.display = "none";
    switchTurn();
    promptNextTurn();
}

function skipQuestion() {
    clearInterval(timerInterval);
    if (currentTurn === 1 && !team1SkipUsed) {
        team1SkipUsed = true;
        team1Skips++;
        team1SkipDiv.innerHTML = "تخطي: مستخدم";
        skippedQuestion = currentQuestion;
        currentQuestionPoints = Math.floor(currentQuestionPoints / 2); // تقليص النقاط للنصف مرة واحدة
        resultDiv.innerHTML = `${team1Name} تخطى السؤال، الآن دور ${team2Name} بنفس السؤال (${currentQuestionPoints} نقاط)!`;
        switchTurn();
        promptNextTurn();
    } else if (currentTurn === 2 && !team2SkipUsed) {
        team2SkipUsed = true;
        team2Skips++;
        team2SkipDiv.innerHTML = "تخطي: مستخدم";
        skippedQuestion = currentQuestion;
        currentQuestionPoints = Math.floor(currentQuestionPoints / 2); // تقليص النقاط للنصف مرة واحدة
        resultDiv.innerHTML = `${team2Name} تخطى السؤال، الآن دور ${team1Name} بنفس السؤال (${currentQuestionPoints} نقاط)!`;
        switchTurn();
        promptNextTurn();
    } else {
        resultDiv.innerHTML = "لقد استنفدت فرصة التخطي!";
        resultDiv.style.color = "#ff6b6b";
        startTimer();
    }
}

function loadQuestion() {
    resultDiv.innerHTML = "";
    if (skippedQuestion) {
        currentQuestion = skippedQuestion;
        // لا نعدل currentQuestionPoints هنا، نستخدم القيمة كما هي بعد التقليص في skipQuestion
        questionDiv.innerHTML = `${currentCategory}: ${currentQuestion.q} (${currentQuestionPoints} نقاط)`;
        mediaDiv.innerHTML = currentQuestion.media ? `<img src="${currentQuestion.media.src}" alt="media">` : '';
        skippedQuestion = null;
    } else {
        const categories = currentTurn === 1 ? team2Categories : team1Categories;
        const points = currentTurn === 1 ? team2Points : team1Points;
        if (!categories || categories.length === 0) {
            resultDiv.innerHTML = "لم يتم اختيار فئات!";
            return;
        }
        currentCategory = categories[Math.floor(Math.random() * categories.length)];
        if (!questions[currentCategory]) {
            resultDiv.innerHTML = `لا توجد أسئلة لفئة ${currentCategory}!`;
            return;
        }
        const availableQuestions = questions[currentCategory].filter(q => !usedQuestions.includes(q.q));
        if (availableQuestions.length === 0) {
            resultDiv.innerHTML = `لا توجد أسئلة متبقية في فئة ${currentCategory}!`;
            switchTurn();
            promptNextTurn();
            return;
        }
        currentQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        usedQuestions.push(currentQuestion.q);
        currentQuestionPoints = parseInt(points[currentCategory]) || 100;
        questionDiv.innerHTML = `${currentCategory}: ${currentQuestion.q} (${currentQuestionPoints} نقاط)`;
        mediaDiv.innerHTML = currentQuestion.media ? `<img src="${currentQuestion.media.src}" alt="media">` : '';
    }
}

function doubleChallenge() {
    clearInterval(timerInterval);
    if (currentTurn === 1 && !team1DoubleUsed) {
        team1DoubleUsed = true;
        team1DoubleDiv.innerHTML = "تحدي مضاعف: مستخدم";
        currentQuestionPoints *= 2;
        resultDiv.innerHTML = `${team1Name} فعّل التحدي المضاعف! النقاط الآن ${currentQuestionPoints}.`;
        questionDiv.innerHTML = `${currentCategory}: ${currentQuestion.q} (${currentQuestionPoints} نقاط)`;
        resultDiv.style.color = "#00eaff";
        startTimer();
    } else if (currentTurn === 2 && !team2DoubleUsed) {
        team2DoubleUsed = true;
        team2DoubleDiv.innerHTML = "تحدي مضاعف: مستخدم";
        currentQuestionPoints *= 2;
        resultDiv.innerHTML = `${team2Name} فعّل التحدي المضاعف! النقاط الآن ${currentQuestionPoints}.`;
        questionDiv.innerHTML = `${currentCategory}: ${currentQuestion.q} (${currentQuestionPoints} نقاط)`;
        resultDiv.style.color = "#00eaff";
        startTimer();
    } else {
        resultDiv.innerHTML = "لقد استنفدت فرصة التحدي المضاعف!";
        resultDiv.style.color = "#ff6b6b";
        startTimer();
    }
}

function callFriend() {
    clearInterval(timerInterval);
    if (currentTurn === 1 && !team1CallUsed) {
        team1CallUsed = true;
        team1CallDiv.innerHTML = "اتصال بصديق: مستخدم";
        showCallFriendOptions();
    } else if (currentTurn === 2 && !team2CallUsed) {
        team2CallUsed = true;
        team2CallDiv.innerHTML = "اتصال بصديق: مستخدم";
        showCallFriendOptions();
    } else {
        resultDiv.innerHTML = "لقد استنفدت فرصة الاتصال بصديق!";
        resultDiv.style.color = "#ff6b6b";
        startTimer();
    }
}

function showCallFriendOptions() {
    let optionsToShow;
    if (currentQuestion.options && currentQuestion.options.length >= 4) {
        optionsToShow = currentQuestion.options.slice().sort(() => 0.5 - Math.random());
    } else {
        optionsToShow = [
            currentQuestion.a,
            "خيار خاطئ 1",
            "خيار خاطئ 2",
            "خيار خاطئ 3"
        ].sort(() => 0.5 - Math.random());
    }
    callFriendOptions.innerHTML = optionsToShow.map(opt => `<p>${opt}</p>`).join("");
    callFriendModal.style.display = "block";
}

function closeCallFriend() {
    callFriendModal.style.display = "none";
    startTimer();
}

function checkGameEnd() {
    if (team1Score >= 2000 || team2Score >= 2000) {
        clearInterval(timerInterval);
        let winner = team1Score >= 2000 ? team1Name : team2Name;
        let loser = team1Score >= 2000 ? team2Name : team1Name;
        let stats = `إحصائيات ${team1Name}: ${team1Correct} صحيحة، ${team1Wrong} خاطئة، ${team1Skips} تخطي<br>` +
                    `إحصائيات ${team2Name}: ${team2Correct} صحيحة، ${team2Wrong} خاطئة، ${team2Skips} تخطي`;
        const scoreDifference = Math.abs(team1Score - team2Score);
        const randomPenalty = getPenalty(scoreDifference);
        penaltyText.innerHTML = `مبروك! ${winner} فاز باللعبة!<br>` +
                               `${team1Name}: ${team1Score} نقاط<br>` +
                               `${team2Name}: ${team2Score} نقاط<br>` +
                               `${stats}<br>` +
                               `الحكم على ${loser}: ${randomPenalty}`;
        penaltyModal.style.display = "block";
        document.querySelector(".container").style.display = "none";
    }
}

function promptNextTurn() {
    document.getElementById("readyText").innerHTML = `جاهزين؟ دور ${currentTurn === 1 ? team1Name : team2Name}`;
    document.getElementById("readyModal").style.display = "block";
}

function startNextTurn() {
    document.getElementById("readyModal").style.display = "none";
    resultDiv.innerHTML = "";
    loadQuestion();
    startTimer();
}

function initializeGame() {
    document.getElementById("team1Name").innerHTML = team1Name;
    document.getElementById("team2Name").innerHTML = team2Name;
    team1ScoreDiv.innerHTML = `نقاط: 0`;
    team1EnergyDiv.innerHTML = `طاقة الحماية: ${team1Energy} (مستخدم: ${team1EnergyUsed}/2)`;
    team1DoubleDiv.innerHTML = `تحدي مضاعف: متاح`;
    team1CallDiv.innerHTML = `اتصال بصديق: متاح`;
    team2ScoreDiv.innerHTML = `نقاط: 0`;
    team2EnergyDiv.innerHTML = `طاقة الحماية: ${team2Energy} (مستخدم: ${team2EnergyUsed}/2)`;
    team2DoubleDiv.innerHTML = `تحدي مضاعف: متاح`;
    team2CallDiv.innerHTML = `اتصال بصديق: متاح`;
    updateTurnDisplay();
    promptNextTurn();
}

// تطبيق الألوان من localStorage
const team1Color = localStorage.getItem("team1Color") || "#ff6b6b";
const team2Color = localStorage.getItem("team2Color") || "#00eaff";
document.documentElement.style.setProperty('--team1-color', team1Color);
document.documentElement.style.setProperty('--team2-color', team2Color);

// بدء اللعبة
window.onload = function() {
    if (!team1Categories.length || !team2Categories.length) {
        resultDiv.innerHTML = "يرجى اختيار الفئات أولاً من صفحة الفئات!";
    } else if (typeof questions === "undefined") {
        resultDiv.innerHTML = "خطأ: ملف الأسئلة (questions.js) غير محمل!";
    } else {
        initializeGame();
    }
};