// game.js
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

let team1Score = 0, team1Energy = 0, team1EnergyUsed = 0, team1DoubleUsed = false, team1CallUsed = false, team1NastyCardUsed = false, team1FreezeCardUsed = false, team1WindowCardUsed = false;
let team2Score = 0, team2Energy = 0, team2EnergyUsed = 0, team2DoubleUsed = false, team2CallUsed = false, team2NastyCardUsed = false, team2FreezeCardUsed = false, team2WindowCardUsed = false;
let team1Correct = 0, team1Wrong = 0, team2Correct = 0, team2Wrong = 0;
let team1ConsecutiveCorrect = 0, team2ConsecutiveCorrect = 0;
let team1Rounds = 0, team2Rounds = 0;
let currentTurn = 1, timeLeft = 0, timerInterval, usedQuestions = [], currentQuestionPoints = 0, currentCategory = '', currentQuestion = null;
let freezeActive = false, freezeTeam = 0;
let team1PointIndex = 0, team2PointIndex = 0; // عداد لتتبع ترتيب النقاط لكل فريق

const timerDiv = document.getElementById("timer");
const questionDiv = document.getElementById("question");
const mediaDiv = document.getElementById("media");
const resultDiv = document.getElementById("result");
const team1ScoreDiv = document.getElementById("team1Score");
const team1EnergyDiv = document.getElementById("team1Energy");
const team1DoubleDiv = document.getElementById("team1Double");
const team1CallDiv = document.getElementById("team1Call");
const team1NastyCardDiv = document.getElementById("team1NastyCard");
const team1FreezeCardDiv = document.getElementById("team1FreezeCard");
const team1WindowCardDiv = document.getElementById("team1WindowCard");
const team2ScoreDiv = document.getElementById("team2Score");
const team2EnergyDiv = document.getElementById("team2Energy");
const team2DoubleDiv = document.getElementById("team2Double");
const team2CallDiv = document.getElementById("team2Call");
const team2NastyCardDiv = document.getElementById("team2NastyCard");
const team2FreezeCardDiv = document.getElementById("team2FreezeCard");
const team2WindowCardDiv = document.getElementById("team2WindowCard");
const answerModal = document.getElementById("answerModal");
const answerText = document.getElementById("answerText");
const protectionModal = document.getElementById("protectionModal");
const callFriendModal = document.getElementById("callFriendModal");
const callFriendOptions = document.getElementById("callFriendOptions");
const penaltyModal = document.getElementById("penaltyModal");
const penaltyText = document.getElementById("penaltyText");

document.documentElement.style.setProperty('--team1-color', team1Color);
document.documentElement.style.setProperty('--team2-color', team2Color);

function switchTurn() {
    currentTurn = currentTurn === 1 ? 2 : 1;
    updateTurnDisplay();
}

function updateTurnDisplay() {
    const team1Box = document.getElementById("team1Box");
    const team2Box = document.getElementById("team2Box");
    const currentTurnDiv = document.getElementById("currentTurn");
    currentTurnDiv.textContent = `دور: ${currentTurn === 1 ? team1Name : team2Name}`;
    currentTurnDiv.classList.remove("team1-turn", "team2-turn");
    currentTurnDiv.classList.add(currentTurn === 1 ? "team1-turn" : "team2-turn");
    if (currentTurn === 1) {
        team1Box.classList.add("active-team");
        team2Box.classList.remove("active-team");
    } else {
        team2Box.classList.add("active-team");
        team1Box.classList.remove("active-team");
    }
    const roundsDiv = document.getElementById("rounds");
    roundsDiv.innerHTML = gameMode === "rounds" ? 
        `جولات ${team1Name}: ${team1Rounds} من ${totalRoundsPerTeam} | جولات ${team2Name}: ${team2Rounds} من ${totalRoundsPerTeam}` : 
        `اللعب حتى ${winningScore} نقطة`;
}

function revealAnswer() {
    clearInterval(timerInterval);
    answerText.innerHTML = currentQuestion.a;
    answerModal.style.display = "flex";
}

function teamCorrect() {
    const pointsToAdd = currentQuestionPoints;
    if (currentTurn === 1) {
        team1Score += pointsToAdd;
        team1Energy++;
        team1Correct++;
        team1ConsecutiveCorrect++;
        resultDiv.innerHTML = `مبروك! ${team1Name} أجاب صح وحصل على ${pointsToAdd} نقاط 🎉`;
        team1ScoreDiv.innerHTML = `نقاط: ${team1Score}`;
        team1EnergyDiv.innerHTML = `طاقة الحماية: ${team1Energy} (مستخدم: ${team1EnergyUsed}/2)`;
        updateWindowCardUI(1);
    } else {
        team2Score += pointsToAdd;
        team2Energy++;
        team2Correct++;
        team2ConsecutiveCorrect++;
        resultDiv.innerHTML = `مبروك! ${team2Name} أجاب صح وحصل على ${pointsToAdd} نقاط 🎉`;
        team2ScoreDiv.innerHTML = `نقاط: ${team2Score}`;
        team2EnergyDiv.innerHTML = `طاقة الحماية: ${team2Energy} (مستخدم: ${team2EnergyUsed}/2)`;
        updateWindowCardUI(2);
    }
    resultDiv.style.color = "#2ecc71";
    answerModal.style.display = "none";
    checkGameEnd();
    switchTurn();
    promptNextTurn();
}

function wrongAnswer() {
    if (currentTurn === 1) {
        team1Wrong++;
        team1ConsecutiveCorrect = 0;
        updateWindowCardUI(1);
    } else {
        team2Wrong++;
        team2ConsecutiveCorrect = 0;
        updateWindowCardUI(2);
    }
    resultDiv.innerHTML = `الإجابة خاطئة 😔 ${currentTurn === 1 ? team1Name : team2Name} يخسر ${currentQuestionPoints} نقاط ما لم يستخدم الحماية!`;
    resultDiv.style.color = "#ff6b6b";
    answerModal.style.display = "none";
    if ((currentTurn === 1 && team1Energy > 0 && team1EnergyUsed < 2) || 
        (currentTurn === 2 && team2Energy > 0 && team2EnergyUsed < 2)) {
        protectionModal.style.display = "flex";
    } else {
        losePoints();
    }
}

function losePoints(pointsToLose = currentQuestionPoints) {
    if (currentTurn === 1) {
        team1Score = Math.max(0, team1Score - pointsToLose);
        team1ConsecutiveCorrect = 0;
        resultDiv.innerHTML = `${team1Name} خسر ${pointsToLose} نقاط!`;
        team1ScoreDiv.innerHTML = `نقاط: ${team1Score}`;
        updateWindowCardUI(1);
    } else {
        team2Score = Math.max(0, team2Score - pointsToLose);
        team2ConsecutiveCorrect = 0;
        resultDiv.innerHTML = `${team2Name} خسر ${pointsToLose} نقاط!`;
        team2ScoreDiv.innerHTML = `نقاط: ${team2Score}`;
        updateWindowCardUI(2);
    }
    resultDiv.style.color = "#ff6b6b";
    protectionModal.style.display = "none";
    switchTurn();
    promptNextTurn();
}

function useProtection() {
    if (currentTurn === 1 && team1Energy > 0 && team1EnergyUsed < 2) {
        team1Energy--;
        team1EnergyUsed++;
        team1ConsecutiveCorrect = 0;
        resultDiv.innerHTML = `${team1Name} استخدم الحماية ولم يخسر النقاط!`;
        team1EnergyDiv.innerHTML = `طاقة الحماية: ${team1Energy} (مستخدم: ${team1EnergyUsed}/2)`;
        updateWindowCardUI(1);
    } else if (currentTurn === 2 && team2Energy > 0 && team2EnergyUsed < 2) {
        team2Energy--;
        team2EnergyUsed++;
        team2ConsecutiveCorrect = 0;
        resultDiv.innerHTML = `${team2Name} استخدم الحماية ولم يخسر النقاط!`;
        team2EnergyDiv.innerHTML = `طاقة الحماية: ${team2Energy} (مستخدم: ${team2EnergyUsed}/2)`;
        updateWindowCardUI(2);
    }
    resultDiv.style.color = "#00eaff";
    protectionModal.style.display = "none";
    switchTurn();
    promptNextTurn();
}

function startTimer() {
    timeLeft = difficulty === 'easy' ? 60 : difficulty === 'medium' ? 20 : 15;
    if (freezeActive && freezeTeam === currentTurn) {
        timeLeft = Math.max(1, timeLeft - 10);
        resultDiv.innerHTML = `تم تجميد وقت ${currentTurn === 1 ? team1Name : team2Name}! الوقت المتبقي أقل بـ10 ثوانٍ.`;
        resultDiv.style.color = "#e74c3c";
        freezeActive = false;
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
                team1ConsecutiveCorrect = 0;
                updateWindowCardUI(1);
            } else {
                team2Score = Math.max(0, team2Score - currentQuestionPoints);
                team2ScoreDiv.innerHTML = `ن职工: ${team2Score}`;
                team2ConsecutiveCorrect = 0;
                updateWindowCardUI(2);
            }
            switchTurn();
            promptNextTurn();
        }
    }, 1000);
}

function loadQuestion() {
    resultDiv.innerHTML = "";
    const categories = currentTurn === 1 ? team2Categories : team1Categories;
    const points = currentTurn === 1 ? team2Points : team1Points;

    if (!categories.length || !Object.keys(points).length) {
        resultDiv.innerHTML = "لم يتم اختيار فئات أو نقاط!";
        return;
    }

    // نجمع النقاط ونرتبها من الأقل للأكثر
    const pointValues = Object.values(points).map(p => parseInt(p)).sort((a, b) => a - b);
    if (!pointValues.length) {
        resultDiv.innerHTML = "لا توجد نقاط محددة!";
        return;
    }

    // نختار النقاط بناءً على العداد
    const currentIndex = currentTurn === 1 ? team1PointIndex : team2PointIndex;
    currentQuestionPoints = pointValues[currentIndex % pointValues.length]; // نرجع للأول بعد الأخير

    // نحدث العداد
    if (currentTurn === 1) {
        team1PointIndex = (team1PointIndex + 1) % pointValues.length;
    } else {
        team2PointIndex = (team2PointIndex + 1) % pointValues.length;
    }

    // نجد الفئات اللي عندها النقاط الحالية
    const matchingCategories = categories.filter(cat => parseInt(points[cat]) === currentQuestionPoints);
    if (!matchingCategories.length) {
        resultDiv.innerHTML = "لا توجد فئات مطابقة للنقاط الحالية!";
        return;
    }

    // نختار فئة عشوائية من الفئات المطابقة
    currentCategory = matchingCategories[Math.floor(Math.random() * matchingCategories.length)];

    // نجمع الأسئلة المتاحة من الفئة
    let availableQuestions = questions[currentCategory]?.filter(q => !usedQuestions.includes(q.q)) || [];
    if (!availableQuestions.length) {
        usedQuestions = []; // نرجع نستخدم الأسئلة من جديد لو خلّصت
        availableQuestions = questions[currentCategory] || [];
    }

    // نختار سؤال عشوائي من الفئة
    currentQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    usedQuestions.push(currentQuestion.q);

    questionDiv.innerHTML = `${currentCategory}: ${currentQuestion.q} (${currentQuestionPoints} نقاط)`;
    mediaDiv.innerHTML = currentQuestion.media && currentQuestion.media.type === "image" ? `<img src="${currentQuestion.media.src}" alt="media">` : '';
}

function doubleChallenge() {
    clearInterval(timerInterval);
    if (currentTurn === 1 && !team1DoubleUsed) {
        team1DoubleUsed = true;
        team1DoubleDiv.innerHTML = `تحدي مضاعف: مستخدم`;
        currentQuestionPoints *= 2;
        resultDiv.innerHTML = `${team1Name} فعّل التحدي المضاعف! النقاط الآن ${currentQuestionPoints}.`;
        questionDiv.innerHTML = `${currentCategory}: ${currentQuestion.q} (${currentQuestionPoints} نقاط)`;
        resultDiv.style.color = "#00eaff";
        startTimer();
    } else if (currentTurn === 2 && !team2DoubleUsed) {
        team2DoubleUsed = true;
        team2DoubleDiv.innerHTML = `تحدي مضاعف: مستخدم`;
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
        team1CallDiv.innerHTML = `اتصال بصديق: مستخدم`;
        showCallFriendOptions();
    } else if (currentTurn === 2 && !team2CallUsed) {
        team2CallUsed = true;
        team2CallDiv.innerHTML = `اتصال بصديق: مستخدم`;
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

function useNastyCard(team) {
    if (team === 1 && !team1NastyCardUsed) {
        let stolenPoints = Math.floor(team2Score * 0.2);
        if (stolenPoints > 0) {
            team2Score -= stolenPoints;
            team1Score += stolenPoints;
            team1NastyCardUsed = true;
            resultDiv.innerHTML = `${team1Name} استخدم كرت الباتسي! سرق ${stolenPoints} نقطة (20% من نقاط ${team2Name}).`;
            resultDiv.style.color = team1Color;
            team1NastyCardDiv.innerHTML = `<span>كرت الباتسي (خصم 20%): مستخدم</span><button onclick="useNastyCard(1)" id="nastyCardTeam1Btn" disabled>استخدام</button>`;
        } else {
            resultDiv.innerHTML = `${team2Name} ليس لديه نقاط لسرقتها!`;
            resultDiv.style.color = "#ff6b6b";
            return;
        }
    } else if (team === 2 && !team2NastyCardUsed) {
        let stolenPoints = Math.floor(team1Score * 0.2);
        if (stolenPoints > 0) {
            team1Score -= stolenPoints;
            team2Score += stolenPoints;
            team2NastyCardUsed = true;
            resultDiv.innerHTML = `${team2Name} استخدم كرت الباتسي! سرق ${stolenPoints} نقطة (20% من نقاط ${team1Name}).`;
            resultDiv.style.color = team2Color;
            team2NastyCardDiv.innerHTML = `<span>كرت الباتسي (خصم 20%): مستخدم</span><button onclick="useNastyCard(2)" id="nastyCardTeam2Btn" disabled>استخدام</button>`;
        } else {
            resultDiv.innerHTML = `${team1Name} ليس لديه نقاط لسرقتها!`;
            resultDiv.style.color = "#ff6b6b";
            return;
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

function useFreezeCard(team) {
    if (team === 1 && !team1FreezeCardUsed) {
        team1FreezeCardUsed = true;
        freezeActive = true;
        freezeTeam = 2;
        resultDiv.innerHTML = `${team1Name} استخدم كرت التجميد! وقت ${team2Name} سيقل بـ10 ثوانٍ في الجولة القادمة!`;
        resultDiv.style.color = team1Color;
        team1FreezeCardDiv.innerHTML = `<span>كرت التجميد (10 ثوانٍ): مستخدم</span><button onclick="useFreezeCard(1)" id="freezeCardTeam1Btn" disabled>استخدام</button>`;
    } else if (team === 2 && !team2FreezeCardUsed) {
        team2FreezeCardUsed = true;
        freezeActive = true;
        freezeTeam = 1;
        resultDiv.innerHTML = `${team2Name} استخدم كرت التجميد! وقت ${team1Name} سيقل بـ10 ثوانٍ في الجولة القادمة!`;
        resultDiv.style.color = team2Color;
        team2FreezeCardDiv.innerHTML = `<span>كرت التجميد (10 ثوانٍ): مستخدم</span><button onclick="useFreezeCard(2)" id="freezeCardTeam2Btn" disabled>استخدام</button>`;
    } else {
        resultDiv.innerHTML = "لقد استنفدت فرصة كرت التجميد!";
        resultDiv.style.color = "#ff6b6b";
    }
}

function useWindowCard(team) {
    if (team === 1 && !team1WindowCardUsed && team1ConsecutiveCorrect >= 5) {
        let deductedPoints = Math.floor(team2Score * 0.7);
        team2Score -= deductedPoints;
        team1WindowCardUsed = true;
        resultDiv.innerHTML = `${team1Name} استخدم كرت ارفع الدريشة! تم خصم ${deductedPoints} نقطة (70% من نقاط ${team2Name})!`;
        resultDiv.style.color = team1Color;
        team1WindowCardDiv.innerHTML = `<span>كرت ارفع الدريشة (خصم 70%): مستخدم</span><button onclick="useWindowCard(1)" id="windowCardTeam1Btn" disabled>استخدام</button>`;
        team2ScoreDiv.innerHTML = `نقاط: ${team2Score}`;
        checkGameEnd();
    } else if (team === 2 && !team2WindowCardUsed && team2ConsecutiveCorrect >= 5) {
        let deductedPoints = Math.floor(team1Score * 0.7);
        team1Score -= deductedPoints;
        team2WindowCardUsed = true;
        resultDiv.innerHTML = `${team2Name} استخدم كرت ارفع الدريشة! تم خصم ${deductedPoints} نقطة (70% من نقاط ${team1Name})!`;
        resultDiv.style.color = team2Color;
        team2WindowCardDiv.innerHTML = `<span>كرت ارفع الدريشة (خصم 70%): مستخدم</span><button onclick="useWindowCard(2)" id="windowCardTeam2Btn" disabled>استخدام</button>`;
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

function updateWindowCardUI(team) {
    if (team === 1) {
        team1WindowCardDiv.innerHTML = `<span>كرت ارفع الدريشة (خصم 70%): ${team1WindowCardUsed ? "مستخدم" : team1ConsecutiveCorrect >= 5 ? "متاح" : `${team1ConsecutiveCorrect}/5 إجابات`}</span><button onclick="useWindowCard(1)" id="windowCardTeam1Btn"${team1WindowCardUsed || team1ConsecutiveCorrect < 5 ? " disabled" : ""}>استخدام</button>`;
    } else {
        team2WindowCardDiv.innerHTML = `<span>كرت ارفع الدريشة (خصم 70%): ${team2WindowCardUsed ? "مستخدم" : team2ConsecutiveCorrect >= 5 ? "متاح" : `${team2ConsecutiveCorrect}/5 إجابات`}</span><button onclick="useWindowCard(2)" id="windowCardTeam2Btn"${team2WindowCardUsed || team2ConsecutiveCorrect < 5 ? " disabled" : ""}>استخدام</button>`;
    }
}

function checkGameEnd() {
    const stats = `<div style="font-size: 1.2rem; margin: 10px 0;">إحصائيات ${team1Name}: ${team1Correct} صحيحة، ${team1Wrong} خاطئة</div>` +
                  `<div style="font-size: 1.2rem; margin: 10px 0;">إحصائيات ${team2Name}: ${team2Correct} صحيحة، ${team2Wrong} خاطئة</div>`;
    const scoreDifference = Math.abs(team1Score - team2Score);
    const randomPenalty = getPenalty(scoreDifference);

    if (gameMode === "points" && (team1Score >= winningScore || team2Score >= winningScore)) {
        clearInterval(timerInterval);
        const winner = team1Score >= winningScore ? team1Name : team2Name;
        const loser = team1Score >= winningScore ? team2Name : team1Name;
        const message = `<h3 style="color: #2ecc71;">مبروك! ${winner} فاز باللعبة بـ ${team1Score >= winningScore ? team1Score : team2Score} نقطة!</h3>` +
                        `<div style="font-size: 1.4rem;">${team1Name}: ${team1Score} نقاط</div>` +
                        `<div style="font-size: 1.4rem;">${team2Name}: ${team2Score} نقاط</div>`;
        penaltyText.innerHTML = `${message}${stats}<div style="color: #ff6b6b; margin-top: 15px;">الحكم على ${loser}: ${randomPenalty}</div>`;
        penaltyModal.style.display = "flex";
        document.querySelector(".container").style.display = "none";
    } else if (gameMode === "rounds" && team1Rounds >= totalRoundsPerTeam && team2Rounds >= totalRoundsPerTeam) {
        clearInterval(timerInterval);
        let message;
        if (team1Score > team2Score) {
            message = `<h3 style="color: #2ecc71;">انتهت الجولات (${totalRoundsPerTeam} لكل فريق)! ${team1Name} فاز بـ ${team1Score} نقطة!</h3>` +
                      `<div style="font-size: 1.4rem;">${team1Name}: ${team1Score} نقاط</div>` +
                      `<div style="font-size: 1.4rem;">${team2Name}: ${team2Score} نقاط</div>`;
            penaltyText.innerHTML = `${message}${stats}<div style="color: #ff6b6b; margin-top: 15px;">الحكم على ${team2Name}: ${randomPenalty}</div>`;
        } else if (team2Score > team1Score) {
            message = `<h3 style="color: #2ecc71;">انتهت الجولات (${totalRoundsPerTeam} لكل فريق)! ${team2Name} فاز بـ ${team2Score} نقطة!</h3>` +
                      `<div style="font-size: 1.4rem;">${team1Name}: ${team1Score} نقاط</div>` +
                      `<div style="font-size: 1.4rem;">${team2Name}: ${team2Score} نقاط</div>`;
            penaltyText.innerHTML = `${message}${stats}<div style="color: #ff6b6b; margin-top: 15px;">الحكم على ${team1Name}: ${randomPenalty}</div>`;
        } else {
            message = `<h3 style="color: #feca57;">انتهت الجولات (${totalRoundsPerTeam} لكل فريق)! تعادل بين ${team1Name} و ${team2Name} بـ ${team1Score} نقطة!</h3>` +
                      `<div style="font-size: 1.4rem;">${team1Name}: ${team1Score} نقاط</div>` +
                      `<div style="font-size: 1.4rem;">${team2Name}: ${team2Score} نقاط</div>`;
            penaltyText.innerHTML = `${message}${stats}`;
        }
        penaltyModal.style.display = "flex";
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
    document.getElementById("readyModal").style.display = "flex";
}

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

function initializeGame() {
    document.getElementById("team1Name").innerHTML = team1Name;
    document.getElementById("team2Name").innerHTML = team2Name;
    team1ScoreDiv.innerHTML = `نقاط: 0`;
    team1EnergyDiv.innerHTML = `طاقة الحماية: 0 (مستخدم: 0/2)`;
    team1DoubleDiv.innerHTML = `تحدي مضاعف: متاح`;
    team1CallDiv.innerHTML = `اتصال بصديق: متاح`;
    team1NastyCardDiv.innerHTML = `<span>كرت الباتسي (خصم 20%): متاح</span><button onclick="useNastyCard(1)" id="nastyCardTeam1Btn">استخدام</button>`;
    team1FreezeCardDiv.innerHTML = `<span>كرت التجميد (10 ثوانٍ): متاح</span><button onclick="useFreezeCard(1)" id="freezeCardTeam1Btn">استخدام</button>`;
    updateWindowCardUI(1);
    team2ScoreDiv.innerHTML = `نقاط: 0`;
    team2EnergyDiv.innerHTML = `طاقة الحماية: 0 (مستخدم: 0/2)`;
    team2DoubleDiv.innerHTML = `تحدي مضاعف: متاح`;
    team2CallDiv.innerHTML = `اتصال بصديق: متاح`;
    team2NastyCardDiv.innerHTML = `<span>كرت الباتسي (خصم 20%): متاح</span><button onclick="useNastyCard(2)" id="nastyCardTeam2Btn">استخدام</button>`;
    team2FreezeCardDiv.innerHTML = `<span>كرت التجميد (10 ثوانٍ): متاح</span><button onclick="useFreezeCard(2)" id="freezeCardTeam2Btn">استخدام</button>`;
    updateWindowCardUI(2);
    currentTurn = Math.random() < 0.5 ? 1 : 2;
    team1Rounds = 0;
    team2Rounds = 0;
    updateTurnDisplay();
    promptNextTurn();
}

function restartGame() {
    team1Score = 0; team1Energy = 0; team1EnergyUsed = 0; team1DoubleUsed = false; team1CallUsed = false; team1NastyCardUsed = false; team1FreezeCardUsed = false; team1WindowCardUsed = false;
    team2Score = 0; team2Energy = 0; team2EnergyUsed = 0; team2DoubleUsed = false; team2CallUsed = false; team2NastyCardUsed = false; team2FreezeCardUsed = false; team2WindowCardUsed = false;
    team1Correct = 0; team1Wrong = 0; team2Correct = 0; team2Wrong = 0;
    team1ConsecutiveCorrect = 0; team2ConsecutiveCorrect = 0;
    usedQuestions = [];
    currentQuestion = null;
    team1Rounds = 0;
    team2Rounds = 0;
    freezeActive = false;
    freezeTeam = 0;
    team1PointIndex = 0;
    team2PointIndex = 0;

    team1ScoreDiv.innerHTML = `نقاط: 0`;
    team1EnergyDiv.innerHTML = `طاقة الحماية: 0 (مستخدم: 0/2)`;
    team1DoubleDiv.innerHTML = `تحدي مضاعف: متاح`;
    team1CallDiv.innerHTML = `اتصال بصديق: متاح`;
    team1NastyCardDiv.innerHTML = `<span>كرت الباتسي (خصم 20%): متاح</span><button onclick="useNastyCard(1)" id="nastyCardTeam1Btn">استخدام</button>`;
    team1FreezeCardDiv.innerHTML = `<span>كرت التجميد (10 ثوانٍ): متاح</span><button onclick="useFreezeCard(1)" id="freezeCardTeam1Btn">استخدام</button>`;
    updateWindowCardUI(1);
    team2ScoreDiv.innerHTML = `نقاط: 0`;
    team2EnergyDiv.innerHTML = `طاقة الحماية: 0 (مستخدم: 0/2)`;
    team2DoubleDiv.innerHTML = `تحدي مضاعف: متاح`;
    team2CallDiv.innerHTML = `اتصال بصديق: متاح`;
    team2NastyCardDiv.innerHTML = `<span>كرت الباتسي (خصم 20%): متاح</span><button onclick="useNastyCard(2)" id="nastyCardTeam2Btn">استخدام</button>`;
    team2FreezeCardDiv.innerHTML = `<span>كرت التجميد (10 ثوانٍ): متاح</span><button onclick="useFreezeCard(2)" id="freezeCardTeam2Btn">استخدام</button>`;
    updateWindowCardUI(2);
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

window.onload = function() {
    if (!team1Categories.length || !team2Categories.length || !Object.keys(team1Points).length || !Object.keys(team2Points).length) {
        resultDiv.innerHTML = "يرجى اختيار الفئات وتحديد النقاط أولاً من صفحة النقاط!";
    } else if (typeof questions === "undefined") {
        resultDiv.innerHTML = "خطأ: ملف الأسئلة (questions.js) غير محمل!";
    } else {
        initializeGame();
    }
};