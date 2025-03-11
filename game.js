// إعدادات اللعبة من localStorage
const team1Name = localStorage.getItem("team1Name") || "الفريق 1";
const team2Name = localStorage.getItem("team2Name") || "الفريق 2";
const difficulty = localStorage.getItem("difficulty") || "easy";
const team1Categories = JSON.parse(localStorage.getItem("team1Categories")) || [];
const team2Categories = JSON.parse(localStorage.getItem("team2Categories")) || [];
const team1Points = JSON.parse(localStorage.getItem("team1Points")) || {};
const team2Points = JSON.parse(localStorage.getItem("team2Points")) || {};
const gameMode = localStorage.getItem("gameMode") || "points";
const winningScore = parseInt(localStorage.getItem("winningScore")) || 2000;
const totalRoundsPerTeam = parseInt(localStorage.getItem("totalRounds")) || 10;
const team1Color = localStorage.getItem("team1Color") || "#ff6b6b";
const team2Color = localStorage.getItem("team2Color") || "#00eaff";

// متغيرات حالة اللعبة
let team1Score = 0, team1Energy = 0, team1EnergyUsed = 0, team1DoubleUsed = false, team1CallUsed = false, team1NastyCardUsed = false, team1FreezeCardUsed = false, team1WindowCardUsed = false;
let team2Score = 0, team2Energy = 0, team2EnergyUsed = 0, team2DoubleUsed = false, team2CallUsed = false, team2NastyCardUsed = false, team2FreezeCardUsed = false, team2WindowCardUsed = false;
let team1Correct = 0, team1Wrong = 0, team2Correct = 0, team2Wrong = 0;
let team1ConsecutiveCorrect = 0, team2ConsecutiveCorrect = 0; // تتبع الإجابات الصحيحة المتتالية
let team1Rounds = 0, team2Rounds = 0;
let currentTurn = 1, timeLeft = 0, timerInterval, usedQuestions = [], currentQuestionPoints = 0, currentCategory = '', currentQuestion = null;
let freezeActive = false, freezeTeam = 0; // لتتبع حالة التجميد والفريق المجمد

// عناصر DOM من game.html
const timerDiv = document.getElementById("timer");
const questionDiv = document.getElementById("question");
const mediaDiv = document.getElementById("media");
const resultDiv = document.getElementById("result");
const team1ScoreDiv = document.getElementById("team1Score");
const team1EnergyDiv = document.getElementById("team1Energy");
const team1DoubleDiv = document.getElementById("team1Double");
const team1CallDiv = document.getElementById("team1Call");
const team1NastyCardDiv = document.getElementById("team1NastyCard");
const team1FreezeCardDiv = document.createElement("div"); // كرت التجميد للفريق 1
const team1WindowCardDiv = document.createElement("div"); // كرت ارفع الدريشة للفريق 1
const team2ScoreDiv = document.getElementById("team2Score");
const team2EnergyDiv = document.getElementById("team2Energy");
const team2DoubleDiv = document.getElementById("team2Double");
const team2CallDiv = document.getElementById("team2Call");
const team2NastyCardDiv = document.getElementById("team2NastyCard");
const team2FreezeCardDiv = document.createElement("div"); // كرت التجميد للفريق 2
const team2WindowCardDiv = document.createElement("div"); // كرت ارفع الدريشة للفريق 2
const answerModal = document.getElementById("answerModal");
const answerText = document.getElementById("answerText");
const protectionModal = document.getElementById("protectionModal");
const callFriendModal = document.getElementById("callFriendModal");
const callFriendOptions = document.getElementById("callFriendOptions");
const penaltyModal = document.getElementById("penaltyModal");
const penaltyText = document.getElementById("penaltyText");

// إضافة كروت الباتسي إلى DOM
team1FreezeCardDiv.id = "team1FreezeCard";
team1FreezeCardDiv.className = "energy-text";
document.getElementById("team1Box").appendChild(team1FreezeCardDiv);
team2FreezeCardDiv.id = "team2FreezeCard";
team2FreezeCardDiv.className = "energy-text";
document.getElementById("team2Box").appendChild(team2FreezeCardDiv);
team1WindowCardDiv.id = "team1WindowCard";
team1WindowCardDiv.className = "energy-text";
document.getElementById("team1Box").appendChild(team1WindowCardDiv);
team2WindowCardDiv.id = "team2WindowCard";
team2WindowCardDiv.className = "energy-text";
document.getElementById("team2Box").appendChild(team2WindowCardDiv);

// تطبيق الألوان
document.documentElement.style.setProperty('--team1-color', team1Color);
document.documentElement.style.setProperty('--team2-color', team2Color);

// بدء المؤقت
function startTimer() {
    timeLeft = difficulty === 'easy' ? 60 : difficulty === 'medium' ? 20 : 15;
    if (freezeActive && freezeTeam === currentTurn) {
        timeLeft = Math.max(1, timeLeft - 10); // تقليل الوقت بـ10 ثوانٍ بسبب التجميد
        resultDiv.innerHTML = `تم تجميد وقت ${currentTurn === 1 ? team1Name : team2Name}! الوقت المتبقي أقل بـ10 ثوانٍ.`;
        resultDiv.style.color = "#e74c3c";
        freezeActive = false; // إلغاء التجميد بعد الاستخدام
    }
    timerDiv.innerHTML = `الوقت المتبقي: ${timeLeft}`;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDiv.innerHTML = `الوقت المتبقي: ${timeLeft}`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            resultDiv.innerHTML = `انتهى الوقت! ${currentTurn === 1 ? team1Name : team2Name} خسر ${currentQuestionPoints} نقاط.`;
            resultDiv.style.color = "#ff6b6b";
            if (currentTurn === 1) {
                team1Score = Math.max(0, team1Score - currentQuestionPoints);
                team1ScoreDiv.innerHTML = `نقاط: ${team1Score}`;
                team1ConsecutiveCorrect = 0; // إعادة تعيين الإجابات المتتالية
                updateWindowCardUI(1);
            } else {
                team2Score = Math.max(0, team2Score - currentQuestionPoints);
                team2ScoreDiv.innerHTML = `نقاط: ${team2Score}`;
                team2ConsecutiveCorrect = 0; // إعادة تعيين الإجابات المتتالية
                updateWindowCardUI(2);
            }
            switchTurn();
            promptNextTurn();
        }
    }, 1000);
}

// تبديل الدور
function switchTurn() {
    currentTurn = currentTurn === 1 ? 2 : 1;
    updateTurnDisplay();
    document.dispatchEvent(new Event('turnChanged'));
}

// تحديث عرض الدور والجولات
function updateTurnDisplay() {
    const currentTurnDiv = document.getElementById("currentTurn");
    currentTurnDiv.textContent = `دور: ${currentTurn === 1 ? team1Name : team2Name}`;
    currentTurnDiv.classList.remove("team1-turn", "team2-turn");
    currentTurnDiv.classList.add(currentTurn === 1 ? "team1-turn" : "team2-turn");
    const roundsDiv = document.getElementById("rounds");
    roundsDiv.innerHTML = gameMode === "rounds" ? 
        `جولات ${team1Name}: ${team1Rounds} من ${totalRoundsPerTeam} | جولات ${team2Name}: ${team2Rounds} من ${totalRoundsPerTeam}` : 
        `اللعب حتى ${winningScore} نقطة`;
}

// كشف الإجابة
function revealAnswer() {
    clearInterval(timerInterval);
    answerText.innerHTML = currentQuestion.a;
    answerModal.style.display = "flex";
}

// الإجابة الصحيحة
function teamCorrect() {
    const pointsToAdd = currentQuestionPoints;
    if (currentTurn === 1) {
        team1Score += pointsToAdd;
        team1Energy++;
        team1Correct++;
        team1ConsecutiveCorrect++; // زيادة عدد الإجابات المتتالية
        resultDiv.innerHTML = `مبروك! ${team1Name} أجاب صح وحصل على ${pointsToAdd} نقاط 🎉`;
        team1ScoreDiv.innerHTML = `نقاط: ${team1Score}`;
        team1EnergyDiv.innerHTML = `طاقة الحماية: ${team1Energy} (مستخدم: ${team1EnergyUsed}/2)`;
        updateWindowCardUI(1); // تحديث واجهة كرت ارفع الدريشة
    } else {
        team2Score += pointsToAdd;
        team2Energy++;
        team2Correct++;
        team2ConsecutiveCorrect++; // زيادة عدد الإجابات المتتالية
        resultDiv.innerHTML = `مبروك! ${team2Name} أجاب صح وحصل على ${pointsToAdd} نقاط 🎉`;
        team2ScoreDiv.innerHTML = `نقاط: ${team2Score}`;
        team2EnergyDiv.innerHTML = `طاقة الحماية: ${team2Energy} (مستخدم: ${team2EnergyUsed}/2)`;
        updateWindowCardUI(2); // تحديث واجهة كرت ارفع الدريشة
    }
    resultDiv.style.color = "#2ecc71";
    answerModal.style.display = "none";
    checkGameEnd();
    switchTurn();
    promptNextTurn();
}

// الإجابة الخاطئة
function wrongAnswer() {
    if (currentTurn === 1) {
        team1Wrong++;
        team1ConsecutiveCorrect = 0; // إعادة تعيين الإجابات المتتالية
        updateWindowCardUI(1);
    } else {
        team2Wrong++;
        team2ConsecutiveCorrect = 0; // إعادة تعيين الإجابات المتتالية
        updateWindowCardUI(2);
    }
    const halfPointsToLose = Math.floor(currentQuestionPoints / 2);
    resultDiv.innerHTML = `الإجابة خاطئة 😔 ${currentTurn === 1 ? team1Name : team2Name} يخسر ${halfPointsToLose} نقاط ما لم يستخدم الحماية!`;
    resultDiv.style.color = "#ff6b6b";
    answerModal.style.display = "none";
    if ((currentTurn === 1 && team1Energy > 0 && team1EnergyUsed < 2) ||
        (currentTurn === 2 && team2Energy > 0 && team2EnergyUsed < 2)) {
        protectionModal.style.display = "flex";
    } else {
        losePoints(halfPointsToLose);
    }
}

// استخدام الحماية
function useProtection() {
    if (currentTurn === 1 && team1Energy > 0 && team1EnergyUsed < 2) {
        team1Energy--;
        team1EnergyUsed++;
        team1ConsecutiveCorrect = 0; // إعادة تعيين الإجابات المتتالية
        resultDiv.innerHTML = `${team1Name} استخدم الحماية ولم يخسر النقاط!`;
        team1EnergyDiv.innerHTML = `طاقة الحماية: ${team1Energy} (مستخدم: ${team1EnergyUsed}/2)`;
        updateWindowCardUI(1);
    } else if (currentTurn === 2 && team2Energy > 0 && team2EnergyUsed < 2) {
        team2Energy--;
        team2EnergyUsed++;
        team2ConsecutiveCorrect = 0; // إعادة تعيين الإجابات المتتالية
        resultDiv.innerHTML = `${team2Name} استخدم الحماية ولم يخسر النقاط!`;
        team2EnergyDiv.innerHTML = `طاقة الحماية: ${team2Energy} (مستخدم: ${team2EnergyUsed}/2)`;
        updateWindowCardUI(2);
    }
    resultDiv.style.color = "#00eaff";
    protectionModal.style.display = "none";
    switchTurn();
    promptNextTurn();
}

// خسارة النقاط
function losePoints(pointsToLose) {
    pointsToLose = pointsToLose || currentQuestionPoints;
    if (currentTurn === 1) {
        team1Score = Math.max(0, team1Score - pointsToLose);
        team1ConsecutiveCorrect = 0; // إعادة تعيين الإجابات المتتالية
        resultDiv.innerHTML = `${team1Name} خسر ${pointsToLose} نقاط!`;
        team1ScoreDiv.innerHTML = `نقاط: ${team1Score}`;
        updateWindowCardUI(1);
    } else {
        team2Score = Math.max(0, team2Score - pointsToLose);
        team2ConsecutiveCorrect = 0; // إعادة تعيين الإجابات المتتالية
        resultDiv.innerHTML = `${team2Name} خسر ${pointsToLose} نقاط!`;
        team2ScoreDiv.innerHTML = `نقاط: ${team2Score}`;
        updateWindowCardUI(2);
    }
    resultDiv.style.color = "#ff6b6b";
    protectionModal.style.display = "none";
    switchTurn();
    promptNextTurn();
}

// تحميل سؤال
function loadQuestion() {
    resultDiv.innerHTML = "";
    const categories = currentTurn === 1 ? team2Categories : team1Categories;
    const points = currentTurn === 1 ? team2Points : team1Points;
    if (!categories.length || !Object.keys(points).length) {
        resultDiv.innerHTML = "لم يتم اختيار فئات أو نقاط!";
        return;
    }
    const availableCategories = categories.filter(cat => questions[cat]?.some(q => !usedQuestions.includes(q.q)));
    if (!availableCategories.length) {
        usedQuestions = [];
        resultDiv.innerHTML = "نفدت الأسئلة! إعادة تعيين الأسئلة لمواصلة اللعب.";
        return loadQuestion();
    }
    currentCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    const availableQuestions = questions[currentCategory].filter(q => !usedQuestions.includes(q.q));
    if (!availableQuestions.length) {
        resultDiv.innerHTML = `لا توجد أسئلة متبقية في فئة ${currentCategory}!`;
        switchTurn();
        promptNextTurn();
        return;
    }
    currentQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    usedQuestions.push(currentQuestion.q);
    currentQuestionPoints = parseInt(points[currentCategory]) || 100;
    questionDiv.innerHTML = `${currentCategory}: ${currentQuestion.q} (${currentQuestionPoints} نقاط)`;
    mediaDiv.innerHTML = currentQuestion.media && currentQuestion.media.type === "image" ? `<img src="${currentQuestion.media.src}" alt="media">` : '';
}

// التحدي المضاعف
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

// الاتصال بصديق
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
    let optionsToShow = currentQuestion.options && currentQuestion.options.length >= 4 ?
        currentQuestion.options.slice().sort(() => 0.5 - Math.random()) :
        [currentQuestion.a, "خيار خاطئ 1", "خيار خاطئ 2", "خيار خاطئ 3"].sort(() => 0.5 - Math.random());
    callFriendOptions.innerHTML = optionsToShow.map(opt => `<p>${opt}</p>`).join("");
    callFriendModal.style.display = "flex";
}

function closeCallFriend() {
    callFriendModal.style.display = "none";
    startTimer();
}

// استخدام كرت الباتسي (سرقة النقاط)
function useNastyCard(team) {
    if (team === 1 && !team1NastyCardUsed) {
        let stolenPoints = Math.floor(team2Score * 0.2);
        if (stolenPoints > 0) {
            team2Score -= stolenPoints;
            team1Score += stolenPoints;
            team1NastyCardUsed = true;
            resultDiv.innerHTML = `${team1Name} استخدم كرت الباتسي! سرق ${stolenPoints} نقطة (20% من نقاط ${team2Name}).`;
            resultDiv.style.color = team1Color;
            team1NastyCardDiv.innerHTML = `كرت الباتسي (خصم 20%): مستخدم<button onclick="useNastyCard(1)" id="nastyCardTeam1Btn" disabled>استخدام</button>`;
        } else {
            resultDiv.innerHTML = `${team2Name} ليس لديه نقاط لسرقتها!`;
            resultDiv.style.color = "#ff6b6b";
        }
    } else if (team === 2 && !team2NastyCardUsed) {
        let stolenPoints = Math.floor(team1Score * 0.2);
        if (stolenPoints > 0) {
            team1Score -= stolenPoints;
            team2Score += stolenPoints;
            team2NastyCardUsed = true;
            resultDiv.innerHTML = `${team2Name} استخدم كرت الباتسي! سرق ${stolenPoints} نقطة (20% من نقاط ${team1Name}).`;
            resultDiv.style.color = team2Color;
            team2NastyCardDiv.innerHTML = `كرت الباتسي (خصم 20%): مستخدم<button onclick="useNastyCard(2)" id="nastyCardTeam2Btn" disabled>استخدام</button>`;
        } else {
            resultDiv.innerHTML = `${team1Name} ليس لديه نقاط لسرقتها!`;
            resultDiv.style.color = "#ff6b6b";
        }
    } else {
        resultDiv.innerHTML = "لقد استنفدت فرصة كرت الباتسي!";
        resultDiv.style.color = "#ff6b6b";
        return;
    }
    team1ScoreDiv.innerHTML = `نقاط: ${team1Score}`;
    team2ScoreDiv.innerHTML = `نقاط: ${team2Score}`;
    checkGameEnd();
}

// استخدام كرت التجميد
function useFreezeCard(team) {
    if (team === 1 && !team1FreezeCardUsed) {
        team1FreezeCardUsed = true;
        freezeActive = true;
        freezeTeam = 2; // تجميد الفريق 2 في الجولة التالية
        resultDiv.innerHTML = `${team1Name} استخدم كرت التجميد! وقت ${team2Name} سيقل بـ10 ثوانٍ في الجولة القادمة!`;
        resultDiv.style.color = team1Color;
        team1FreezeCardDiv.innerHTML = `كرت التجميد (10 ثوانٍ): مستخدم<button onclick="useFreezeCard(1)" id="freezeCardTeam1Btn" disabled>استخدام</button>`;
    } else if (team === 2 && !team2FreezeCardUsed) {
        team2FreezeCardUsed = true;
        freezeActive = true;
        freezeTeam = 1; // تجميد الفريق 1 في الجولة التالية
        resultDiv.innerHTML = `${team2Name} استخدم كرت التجميد! وقت ${team1Name} سيقل بـ10 ثوانٍ في الجولة القادمة!`;
        resultDiv.style.color = team2Color;
        team2FreezeCardDiv.innerHTML = `كرت التجميد (10 ثوانٍ): مستخدم<button onclick="useFreezeCard(2)" id="freezeCardTeam2Btn" disabled>استخدام</button>`;
    } else {
        resultDiv.innerHTML = "لقد استنفدت فرصة كرت التجميد!";
        resultDiv.style.color = "#ff6b6b";
    }
}

// استخدام كرت ارفع الدريشة (خصم 70% من نقاط الخصم)
function useWindowCard(team) {
    if (team === 1 && !team1WindowCardUsed && team1ConsecutiveCorrect >= 5) {
        let deductedPoints = Math.floor(team2Score * 0.7);
        team2Score -= deductedPoints;
        team1WindowCardUsed = true;
        resultDiv.innerHTML = `${team1Name} استخدم كرت ارفع الدريشة! تم خصم ${deductedPoints} نقطة (70% من نقاط ${team2Name})!`;
        resultDiv.style.color = team1Color;
        team1WindowCardDiv.innerHTML = `كرت ارفع الدريشة (خصم 70%): مستخدم<button onclick="useWindowCard(1)" id="windowCardTeam1Btn" disabled>استخدام</button>`;
        team2ScoreDiv.innerHTML = `نقاط: ${team2Score}`;
        checkGameEnd();
    } else if (team === 2 && !team2WindowCardUsed && team2ConsecutiveCorrect >= 5) {
        let deductedPoints = Math.floor(team1Score * 0.7);
        team1Score -= deductedPoints;
        team2WindowCardUsed = true;
        resultDiv.innerHTML = `${team2Name} استخدم كرت ارفع الدريشة! تم خصم ${deductedPoints} نقطة (70% من نقاط ${team1Name})!`;
        resultDiv.style.color = team2Color;
        team2WindowCardDiv.innerHTML = `كرت ارفع الدريشة (خصم 70%): مستخدم<button onclick="useWindowCard(2)" id="windowCardTeam2Btn" disabled>استخدام</button>`;
        team1ScoreDiv.innerHTML = `نقاط: ${team1Score}`;
        checkGameEnd();
    } else if ((team === 1 && team1ConsecutiveCorrect < 5) || (team === 2 && team2ConsecutiveCorrect < 5)) {
        resultDiv.innerHTML = "تحتاج إلى 5 إجابات صحيحة متتالية لاستخدام كرت ارفع الدريشة!";
        resultDiv.style.color = "#ff6b6b";
    } else {
        resultDiv.innerHTML = "لقد استنفدت فرصة كرت ارفع الدريشة!";
        resultDiv.style.color = "#ff6b6b";
    }
}

// تحديث واجهة كرت ارفع الدريشة
function updateWindowCardUI(team) {
    if (team === 1) {
        team1WindowCardDiv.innerHTML = `كرت ارفع الدريشة (خصم 70%): ${team1WindowCardUsed ? "مستخدم" : team1ConsecutiveCorrect >= 5 ? "متاح" : `${team1ConsecutiveCorrect}/5 إجابات`}<button onclick="useWindowCard(1)" id="windowCardTeam1Btn"${team1WindowCardUsed || team1ConsecutiveCorrect < 5 ? " disabled" : ""}>استخدام</button>`;
    } else {
        team2WindowCardDiv.innerHTML = `كرت ارفع الدريشة (خصم 70%): ${team2WindowCardUsed ? "مستخدم" : team2ConsecutiveCorrect >= 5 ? "متاح" : `${team2ConsecutiveCorrect}/5 إجابات`}<button onclick="useWindowCard(2)" id="windowCardTeam2Btn"${team2WindowCardUsed || team2ConsecutiveCorrect < 5 ? " disabled" : ""}>استخدام</button>`;
    }
}

// التحقق من نهاية اللعبة
function checkGameEnd() {
    const stats = `إحصائيات ${team1Name}: ${team1Correct} صحيحة، ${team1Wrong} خاطئة<br>` +
                  `إحصائيات ${team2Name}: ${team2Correct} صحيحة، ${team2Wrong} خاطئة`;
    const scoreDifference = Math.abs(team1Score - team2Score);
    const randomPenalty = getPenalty(scoreDifference);

    if (gameMode === "points" && (team1Score >= winningScore || team2Score >= winningScore)) {
        clearInterval(timerInterval);
        const winner = team1Score >= winningScore ? team1Name : team2Name;
        const loser = team1Score >= winningScore ? team2Name : team1Name;
        const message = `مبروك! ${winner} فاز باللعبة بـ ${team1Score >= winningScore ? team1Score : team2Score} نقطة!<br>` +
                        `${team1Name}: ${team1Score} نقاط<br>${team2Name}: ${team2Score} نقاط<br>`;
        penaltyText.innerHTML = `${message}${stats}<br>الحكم على ${loser}: ${randomPenalty}<br><button onclick='restartGame()'>إعادة اللعبة</button>`;
        penaltyModal.style.display = "flex";
        document.querySelector(".container").style.display = "none";
    } else if (gameMode === "rounds" && team1Rounds >= totalRoundsPerTeam && team2Rounds >= totalRoundsPerTeam) {
        clearInterval(timerInterval);
        let message;
        if (team1Score > team2Score) {
            message = `انتهت الجولات (${totalRoundsPerTeam} لكل فريق)! ${team1Name} فاز بـ ${team1Score} نقطة!<br>` +
                      `${team1Name}: ${team1Score} نقاط<br>${team2Name}: ${team2Score} نقاط<br>`;
            penaltyText.innerHTML = `${message}${stats}<br>الحكم على ${team2Name}: ${randomPenalty}<br><button onclick='restartGame()'>إعادة اللعبة</button>`;
        } else if (team2Score > team1Score) {
            message = `انتهت الجولات (${totalRoundsPerTeam} لكل فريق)! ${team2Name} فاز بـ ${team2Score} نقطة!<br>` +
                      `${team1Name}: ${team1Score} نقاط<br>${team2Name}: ${team2Score} نقاط<br>`;
            penaltyText.innerHTML = `${message}${stats}<br>الحكم على ${team1Name}: ${randomPenalty}<br><button onclick='restartGame()'>إعادة اللعبة</button>`;
        } else {
            message = `انتهت الجولات (${totalRoundsPerTeam} لكل فريق)! تعادل بين ${team1Name} و ${team2Name} بـ ${team1Score} نقطة!<br>` +
                      `${team1Name}: ${team1Score} نقاط<br>${team2Name}: ${team2Score} نقاط<br>`;
            penaltyText.innerHTML = `${message}${stats}<br><button onclick='restartGame()'>إعادة اللعبة</button>`;
        }
        penaltyModal.style.display = "flex";
        document.querySelector(".container").style.display = "none";
    }
}

// الحصول على عقوبة عشوائية
function getPenalty(difference) {
    const penalties = [
        "ارقص رقصة مضحكة لمدة 30 ثانية!",
        "غني أغنية بصوت عالٍ!",
        "قل نكتة سيئة أمام الجميع!",
        "اشرب كوب ماء دفعة واحدة!"
    ];
    return penalties[Math.floor(Math.random() * penalties.length)];
}

// طلب الجولة التالية
function promptNextTurn() {
    document.getElementById("readyText").innerHTML = `جاهزين؟ دور ${currentTurn === 1 ? team1Name : team2Name}`;
    document.getElementById("readyModal").style.display = "flex";
}

// بدء الجولة التالية
function startNextTurn() {
    document.getElementById("readyModal").style.display = "none";
    resultDiv.innerHTML = "";
    if (gameMode === "rounds") {
        if (currentTurn === 1 && team1Rounds < totalRoundsPerTeam) team1Rounds++;
        else if (currentTurn === 2 && team2Rounds < totalRoundsPerTeam) team2Rounds++;
    }
    loadQuestion();
    updateTurnDisplay();
    startTimer();
}

// تهيئة اللعبة
function initializeGame() {
    document.getElementById("team1Name").innerHTML = team1Name;
    document.getElementById("team2Name").innerHTML = team2Name;
    team1ScoreDiv.innerHTML = `نقاط: 0`;
    team1EnergyDiv.innerHTML = `طاقة الحماية: 0 (مستخدم: 0/2)`;
    team1DoubleDiv.innerHTML = "تحدي مضاعف: متاح";
    team1CallDiv.innerHTML = "اتصال بصديق: متاح";
    team1NastyCardDiv.innerHTML = `كرت الباتسي (خصم 20%): متاح<button onclick="useNastyCard(1)" id="nastyCardTeam1Btn">استخدام</button>`;
    team1FreezeCardDiv.innerHTML = `كرت التجميد (10 ثوانٍ): متاح<button onclick="useFreezeCard(1)" id="freezeCardTeam1Btn">استخدام</button>`;
    updateWindowCardUI(1); // تهيئة كرت ارفع الدريشة للفريق 1
    team2ScoreDiv.innerHTML = `نقاط: 0`;
    team2EnergyDiv.innerHTML = `طاقة الحماية: 0 (مستخدم: 0/2)`;
    team2DoubleDiv.innerHTML = "تحدي مضاعف: متاح";
    team2CallDiv.innerHTML = "اتصال بصديق: متاح";
    team2NastyCardDiv.innerHTML = `كرت الباتسي (خصم 20%): متاح<button onclick="useNastyCard(2)" id="nastyCardTeam2Btn">استخدام</button>`;
    team2FreezeCardDiv.innerHTML = `كرت التجميد (10 ثوانٍ): متاح<button onclick="useFreezeCard(2)" id="freezeCardTeam2Btn">استخدام</button>`;
    updateWindowCardUI(2); // تهيئة كرت ارفع الدريشة للفريق 2
    currentTurn = Math.random() < 0.5 ? 1 : 2;
    team1Rounds = 0;
    team2Rounds = 0;
    updateTurnDisplay();
    promptNextTurn();
}

// إعادة تشغيل اللعبة
function restartGame() {
    team1Score = 0; team1Energy = 0; team1EnergyUsed = 0; team1DoubleUsed = false; team1CallUsed = false; team1NastyCardUsed = false; team1FreezeCardUsed = false; team1WindowCardUsed = false;
    team2Score = 0; team2Energy = 0; team2EnergyUsed = 0; team2DoubleUsed = false; team2CallUsed = false; team2NastyCardUsed = false; team2FreezeCardUsed = false; team2WindowCardUsed = false;
    team1Correct = 0; team1Wrong = 0; team2Correct = 0; team2Wrong = 0;
    team1ConsecutiveCorrect = 0; team2ConsecutiveCorrect = 0; // إعادة تعيين الإجابات المتتالية
    usedQuestions = [];
    currentQuestion = null;
    team1Rounds = 0;
    team2Rounds = 0;
    freezeActive = false;
    freezeTeam = 0;

    team1ScoreDiv.innerHTML = `نقاط: 0`;
    team1EnergyDiv.innerHTML = `طاقة الحماية: 0 (مستخدم: 0/2)`;
    team1DoubleDiv.innerHTML = "تحدي مضاعف: متاح";
    team1CallDiv.innerHTML = "اتصال بصديق: متاح";
    team1NastyCardDiv.innerHTML = `كرت الباتسي (خصم 20%): متاح<button onclick="useNastyCard(1)" id="nastyCardTeam1Btn">استخدام</button>`;
    team1FreezeCardDiv.innerHTML = `كرت التجميد (10 ثوانٍ): متاح<button onclick="useFreezeCard(1)" id="freezeCardTeam1Btn">استخدام</button>`;
    updateWindowCardUI(1); // إعادة تهيئة كرت ارفع الدريشة
    team2ScoreDiv.innerHTML = `نقاط: 0`;
    team2EnergyDiv.innerHTML = `طاقة الحماية: 0 (مستخدم: 0/2)`;
    team2DoubleDiv.innerHTML = "تحدي مضاعف: متاح";
    team2CallDiv.innerHTML = "اتصال بصديق: متاح";
    team2NastyCardDiv.innerHTML = `كرت الباتسي (خصم 20%): متاح<button onclick="useNastyCard(2)" id="nastyCardTeam2Btn">استخدام</button>`;
    team2FreezeCardDiv.innerHTML = `كرت التجميد (10 ثوانٍ): متاح<button onclick="useFreezeCard(2)" id="freezeCardTeam2Btn">استخدام</button>`;
    updateWindowCardUI(2); // إعادة تهيئة كرت ارفع الدريشة
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

// التحقق عند تحميل الصفحة
window.onload = function() {
    console.log("تحميل الصفحة...", { team1Categories, team2Categories, team1Points, team2Points, gameMode, winningScore, totalRoundsPerTeam });
    if (!team1Categories.length || !team2Categories.length || !Object.keys(team1Points).length || !Object.keys(team2Points).length) {
        resultDiv.innerHTML = "يرجى اختيار الفئات وتحديد النقاط أولاً من صفحة النقاط!";
    } else if (typeof questions === "undefined") {
        resultDiv.innerHTML = "خطأ: ملف الأسئلة (questions.js) غير محمل!";
    } else {
        initializeGame();
    }
};