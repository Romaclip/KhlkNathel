const team1Name = localStorage.getItem("team1Name") || "الفريق 1";
const team2Name = localStorage.getItem("team2Name") || "الفريق 2";
const difficulty = localStorage.getItem("difficulty") || "easy";
const team1Categories = JSON.parse(localStorage.getItem("team1Categories")) || [];
const team2Categories = JSON.parse(localStorage.getItem("team2Categories")) || [];
const team1Points = JSON.parse(localStorage.getItem("team1Points")) || {};
const team2Points = JSON.parse(localStorage.getItem("team2Points")) || {};

let team1Score = 0, team1Energy = 0, team1EnergyUsed = 0, team1SkipUsed = false, team1DoubleUsed = false, team1CallUsed = false, team1NastyCardUsed = false;
let team2Score = 0, team2Energy = 0, team2EnergyUsed = 0, team2SkipUsed = false, team2DoubleUsed = false, team2CallUsed = false, team2NastyCardUsed = false;
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
    timeLeft = difficulty === 'easy' ? 60 : difficulty === 'medium' ? 20 : 15;
    timerDiv.innerHTML = `الوقت المتبقي: ${timeLeft}`;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDiv.innerHTML = `الوقت المتبقي: ${timeLeft}`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            resultDiv.innerHTML = `انتهى الوقت! ${currentTurn === 1 ? team1Name : team2Name} خسر ${currentQuestionPoints} نقاط.`;
            resultDiv.style.color = "#ff6b6b";
            // خصم النقاط كاملة عند انتهاء الوقت
            if (currentTurn === 1) {
                team1Score = Math.max(0, team1Score - currentQuestionPoints);
                team1ScoreDiv.innerHTML = `نقاط: ${team1Score}`;
            } else {
                team2Score = Math.max(0, team2Score - currentQuestionPoints);
                team2ScoreDiv.innerHTML = `نقاط: ${team2Score}`;
            }
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
        const pointsToLose = currentQuestionPoints; // خسارة النقاط كاملة إذا كان السؤال مطروحًا بعد التخطي
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
        const halfPointsToLose = Math.floor(currentQuestionPoints / 2); // خصم نصف النقاط فقط
        resultDiv.innerHTML = `الإجابة خاطئة 😔 ${currentTurn === 1 ? team1Name : team2Name} يخسر ${halfPointsToLose} نقاط ما لم يستخدم الحماية!`;
        resultDiv.style.color = "#ff6b6b";
        answerModal.style.display = "none";
        if ((currentTurn === 1 && team1Energy > 0 && team1EnergyUsed < 2) ||
            (currentTurn === 2 && team2Energy > 0 && team2EnergyUsed < 2)) {
            protectionModal.style.display = "block";
        } else {
            losePoints(halfPointsToLose); // تمرير نصف النقاط إلى دالة losePoints
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

function losePoints(pointsToLose) {
    // استخدام نصف النقاط كقيمة افتراضية إذا لم يتم تمرير قيمة
    pointsToLose = pointsToLose || currentQuestionPoints;
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
        currentQuestionPoints = Math.floor(currentQuestionPoints / 2);
        resultDiv.innerHTML = `${team1Name} تخطى السؤال، الآن دور ${team2Name} بنفس السؤال (${currentQuestionPoints} نقاط)!`;
        switchTurn();
        promptNextTurn();
    } else if (currentTurn === 2 && !team2SkipUsed) {
        team2SkipUsed = true;
        team2Skips++;
        team2SkipDiv.innerHTML = "تخطي: مستخدم";
        skippedQuestion = currentQuestion;
        currentQuestionPoints = Math.floor(currentQuestionPoints / 2);
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
    console.log("تحميل سؤال...");
    if (skippedQuestion) {
        currentQuestion = skippedQuestion;
        questionDiv.innerHTML = `${currentCategory}: ${currentQuestion.q} (${currentQuestionPoints} نقاط)`;
        mediaDiv.innerHTML = currentQuestion.media && currentQuestion.media.type === "image" ? `<img src="${currentQuestion.media.src}" alt="media" style="max-width: 320px;">` : '';
        skippedQuestion = null;
    } else {
        const categories = currentTurn === 1 ? team2Categories : team1Categories;
        const points = currentTurn === 1 ? team2Points : team1Points;
        if (!categories || categories.length === 0 || !points || Object.keys(points).length === 0) {
            resultDiv.innerHTML = "لم يتم اختيار فئات أو نقاط!";
            console.log("خطأ: لا فئات أو نقاط!");
            return;
        }

        // تصفية الفئات التي تحتوي على أسئلة متبقية
        const availableCategories = categories.filter(cat => {
            if (!questions[cat]) return false;
            const availableQs = questions[cat].filter(q => !usedQuestions.includes(q.q));
            console.log(`الفئة ${cat}: ${availableQs.length} أسئلة متبقية`);
            return availableQs.length > 0;
        });

        if (availableCategories.length === 0) {
            console.log("نفدت الأسئلة في جميع الفئات المختارة، إعادة تعيين usedQuestions...");
            usedQuestions = []; // إعادة تعيين الأسئلة المستخدمة
            resultDiv.innerHTML = "نفدت الأسئلة! إعادة تعيين الأسئلة لمواصلة اللعب.";
            return loadQuestion(); // إعادة استدعاء الدالة بعد إعادة التعيين
        }

        currentCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        const availableQuestions = questions[currentCategory].filter(q => !usedQuestions.includes(q.q));
        if (availableQuestions.length === 0) {
            resultDiv.innerHTML = `لا توجد أسئلة متبقية في فئة ${currentCategory}!`;
            console.log(`خطأ: لا أسئلة متبقية في ${currentCategory}!`);
            switchTurn();
            promptNextTurn();
            return;
        }

        currentQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        usedQuestions.push(currentQuestion.q);
        currentQuestionPoints = parseInt(points[currentCategory]) || 100;
        questionDiv.innerHTML = `${currentCategory}: ${currentQuestion.q} (${currentQuestionPoints} نقاط)`;
        mediaDiv.innerHTML = currentQuestion.media && currentQuestion.media.type === "image" ? `<img src="${currentQuestion.media.src}" alt="media" style="max-width: 320px;">` : '';
    }
    if (!questionDiv.innerHTML) {
        console.error("فشل تحميل السؤال!");
        resultDiv.innerHTML = "خطأ في تحميل السؤال!";
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

// ميزة كرت النذالة مع شرح بسيط
function useNastyCard(team) {
    if (team === 1 && !team1NastyCardUsed) {
        let stolenPoints = Math.floor(team2Score * 0.2); // خصم 20%
        if (stolenPoints > 0) {
            team2Score -= stolenPoints;
            team1Score += stolenPoints;
            team1NastyCardUsed = true;
            document.getElementById("nastyCardTeam1Btn").disabled = true;
            resultDiv.innerHTML = `${team1Name} استخدم كرت النذالة! سرق ${stolenPoints} نقطة (20% من نقاط ${team2Name}).`;
            resultDiv.style.color = "var(--team1-color)";
        } else {
            resultDiv.innerHTML = `${team2Name} ليس لديه نقاط لسرقتها!`;
            resultDiv.style.color = "#ff6b6b";
        }
    } else if (team === 2 && !team2NastyCardUsed) {
        let stolenPoints = Math.floor(team1Score * 0.2); // خصم 20%
        if (stolenPoints > 0) {
            team1Score -= stolenPoints;
            team2Score += stolenPoints;
            team2NastyCardUsed = true;
            document.getElementById("nastyCardTeam2Btn").disabled = true;
            resultDiv.innerHTML = `${team2Name} استخدم كرت النذالة! سرق ${stolenPoints} نقطة (20% من نقاط ${team1Name}).`;
            resultDiv.style.color = "var(--team2-color)";
        } else {
            resultDiv.innerHTML = `${team1Name} ليس لديه نقاط لسرقتها!`;
            resultDiv.style.color = "#ff6b6b";
        }
    } else {
        resultDiv.innerHTML = "لقد استنفدت فرصة كرت النذالة!";
        resultDiv.style.color = "#ff6b6b";
        return;
    }
    team1ScoreDiv.innerHTML = `نقاط: ${team1Score}`;
    team2ScoreDiv.innerHTML = `نقاط: ${team2Score}`;
    updateNastyCardUI();
    checkGameEnd();
}

function updateNastyCardUI() {
    const team1NastyCardDiv = document.getElementById("team1NastyCard");
    const team2NastyCardDiv = document.getElementById("team2NastyCard");
    team1NastyCardDiv.innerHTML = `كرت النذالة (خصم 20%): ${team1NastyCardUsed ? "مستخدم" : "متاح"}<button onclick="useNastyCard(1)" id="nastyCardTeam1Btn"${team1NastyCardUsed ? " disabled" : ""}>استخدام</button>`;
    team2NastyCardDiv.innerHTML = `كرت النذالة (خصم 20%): ${team2NastyCardUsed ? "مستخدم" : "متاح"}<button onclick="useNastyCard(2)" id="nastyCardTeam2Btn"${team2NastyCardUsed ? " disabled" : ""}>استخدام</button>`;
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

function getPenalty(difference) {
    const penalties = [
        "ارقص رقصة مضحكة لمدة 30 ثانية!",
        "غني أغنية بصوت عالٍ!",
        "قل نكتة سيئة أمام الجميع!",
        "اشرب كوب ماء دفعة واحدة!"
    ];
    return penalties[Math.floor(Math.random() * penalties.length)];
}

function promptNextTurn() {
    document.getElementById("readyText").innerHTML = `جاهزين؟ دور ${currentTurn === 1 ? team1Name : team2Name}`;
    document.getElementById("readyModal").style.display = "block";
}

function startNextTurn() {
    document.getElementById("readyModal").style.display = "none";
    resultDiv.innerHTML = "";
    loadQuestion();
    if (!questionDiv.innerHTML) {
        console.log("فشل تحميل السؤال، إعادة المحاولة...");
        loadQuestion();
    }
    startTimer();
}

function initializeGame() {
    document.getElementById("team1Name").innerHTML = team1Name;
    document.getElementById("team2Name").innerHTML = team2Name;
    team1ScoreDiv.innerHTML = `نقاط: 0`;
    team1EnergyDiv.innerHTML = `طاقة الحماية: ${team1Energy} (مستخدم: ${team1EnergyUsed}/2)`;
    team1SkipDiv.innerHTML = `تخطي: متاح`;
    team1DoubleDiv.innerHTML = `تحدي مضاعف: متاح`;
    team1CallDiv.innerHTML = `اتصال بصديق: متاح`;
    team2ScoreDiv.innerHTML = `نقاط: 0`;
    team2EnergyDiv.innerHTML = `طاقة الحماية: ${team2Energy} (مستخدم: ${team2EnergyUsed}/2)`;
    team2SkipDiv.innerHTML = `تخطي: متاح`;
    team2DoubleDiv.innerHTML = `تحدي مضاعف: متاح`;
    team2CallDiv.innerHTML = `اتصال بصديق: متاح`;
    updateNastyCardUI();
    currentTurn = Math.random() < 0.5 ? 1 : 2;
    updateTurnDisplay();
    promptNextTurn();
}

function restartGame() {
    team1Score = 0;
    team1Energy = 0;
    team1EnergyUsed = 0;
    team1SkipUsed = false;
    team1DoubleUsed = false;
    team1CallUsed = false;
    team1NastyCardUsed = false;
    team2Score = 0;
    team2Energy = 0;
    team2EnergyUsed = 0;
    team2SkipUsed = false;
    team2DoubleUsed = false;
    team2CallUsed = false;
    team2NastyCardUsed = false;
    team1Correct = 0;
    team1Wrong = 0;
    team1Skips = 0;
    team2Correct = 0;
    team2Wrong = 0;
    team2Skips = 0;
    usedQuestions = [];
    currentQuestion = null;
    skippedQuestion = null;

    team1ScoreDiv.innerHTML = `نقاط: 0`;
    team1EnergyDiv.innerHTML = `طاقة الحماية: 0 (مستخدم: 0/2)`;
    team1SkipDiv.innerHTML = `تخطي: متاح`;
    team1DoubleDiv.innerHTML = `تحدي مضاعف: متاح`;
    team1CallDiv.innerHTML = `اتصال بصديق: متاح`;
    team2ScoreDiv.innerHTML = `نقاط: 0`;
    team2EnergyDiv.innerHTML = `طاقة الحماية: 0 (مستخدم: 0/2)`;
    team2SkipDiv.innerHTML = `تخطي: متاح`;
    team2DoubleDiv.innerHTML = `تحدي مضاعف: متاح`;
    team2CallDiv.innerHTML = `اتصال بصديق: متاح`;
    updateNastyCardUI();
    resultDiv.innerHTML = "";
    questionDiv.innerHTML = "";
    mediaDiv.innerHTML = "";
    timerDiv.innerHTML = "";

    penaltyModal.style.display = "none";
    document.querySelector(".container").style.display = "block";

    currentTurn = Math.random() < 0.5 ? 1 : 2;
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
    console.log("تحميل الصفحة...");
    console.log("الفئات للفريق 1:", team1Categories);
    console.log("الفئات للفريق 2:", team2Categories);
    console.log("نقاط الفريق 1:", team1Points);
    console.log("نقاط الفريق 2:", team2Points);
    if (!team1Categories.length || !team2Categories.length || !Object.keys(team1Points).length || !Object.keys(team2Points).length) {
        resultDiv.innerHTML = "يرجى اختيار الفئات وتحديد النقاط أولاً من صفحة النقاط!";
    } else if (typeof questions === "undefined") {
        resultDiv.innerHTML = "خطأ: ملف الأسئلة (questions.js) غير محمل!";
    } else {
        initializeGame();
    }
};
