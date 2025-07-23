
let currentUser = null;

// تسجيل الدخول
async function login() {
    const username = document.getElementById('username').value;
    const discordCode = document.getElementById('discordCode').value;
    
    if (!username || !discordCode) {
        alert('يرجى ملء جميع الحقول!');
        return;
    }
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: username,
                code: discordCode
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user_data;
            currentUser.id = data.user_id;
            
            // إخفاء صفحة تسجيل الدخول وإظهار الصفحة الرئيسية
            document.getElementById('loginPage').classList.remove('active');
            document.getElementById('mainPage').classList.add('active');
            
            // تحديث بيانات المستخدم
            updateUserProfile();
            loadLeaderboard();
            
            // بدء تتبع الوقت
            startTimeTracking();
        } else {
            alert('كود غير صحيح! تأكد من كتابة الكود الصحيح من Discord.');
        }
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        alert('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    }
}

// تحديث ملف المستخدم
function updateUserProfile() {
    if (!currentUser) return;
    
    // تحديث الهيدر
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userVex').textContent = currentUser.vex;
    
    // إزالة التحديث المكرر للصفحة الرئيسية
    
    // تحديث صورة المستخدم من Discord
    updateUserAvatar();
    
    // تحديث مستوى المستخدم
    const levels = [
        { name: "「👤」Demon Member", xp: 0 },
        { name: "「👥」Demon Beginner", xp: 30 },
        { name: "「🔥」Demon Advanced", xp: 100 },
        { name: "「⚡」Demon Expert", xp: 210 },
        { name: "「📢」Demon Leader", xp: 350 },
        { name: "「🕹️」Demon Commander", xp: 600 },
        { name: "「🎖️」Demon Colonel", xp: 3000 }
    ];
    
    const currentLevel = levels[currentUser.level];
    const nextLevel = levels[currentUser.level + 1];
    
    // تحديث الهيدر
    document.getElementById('currentLevel').textContent = currentLevel.name;
    
    if (nextLevel) {
        const currentXP = currentUser.xp - currentLevel.xp;
        const requiredXP = nextLevel.xp - currentLevel.xp;
        const progress = (currentXP / requiredXP) * 100;
        
        // تحديث الهيدر
        document.getElementById('levelProgress').textContent = `${currentXP}/${requiredXP} XP`;
        document.getElementById('progressFill').style.width = `${progress}%`;
    } else {
        // تحديث الهيدر
        document.getElementById('levelProgress').textContent = 'المستوى الأقصى';
        document.getElementById('progressFill').style.width = '100%';
    }
}

// تحديث صورة المستخدم من Discord
async function updateUserAvatar() {
    if (!currentUser || !currentUser.id) return;
    
    try {
        // جلب بيانات المستخدم من Discord API
        const response = await fetch(`/discord_avatar/${currentUser.id}`);
        if (response.ok) {
            const data = await response.json();
            if (data.avatar_url) {
                document.getElementById('userAvatar').src = data.avatar_url;
            }
        }
    } catch (error) {
        console.log('لم يتم العثور على صورة Discord، سيتم استخدام الصورة الافتراضية');
        // استخدام صورة افتراضية بدلاً من placeholder
        const defaultAvatar = `https://cdn.discordapp.com/embed/avatars/${currentUser.id % 5}.png`;
        document.getElementById('userAvatar').src = defaultAvatar;
    }
}

// تحميل لوحة المتصدرين
async function loadLeaderboard() {
    try {
        const response = await fetch('/leaderboard');
        const data = await response.json();
        
        // لوحة متصدري الڤكس
        loadVexLeaderboard(data.vex_leaders);
        
        // لوحة متصدري المستوى
        loadLevelLeaderboard(data.level_leaders);
        
        // لوحة متصدري التفاعل
        loadChatLeaderboard(data.chat_leaders);
        
    } catch (error) {
        console.error('خطأ في تحميل لوحة المتصدرين:', error);
    }
}

// تحميل لوحة متصدري الڤكس
function loadVexLeaderboard(leaders) {
    const container = document.getElementById('vexLeaderboard');
    container.innerHTML = '';
    
    leaders.slice(0, 5).forEach((user, index) => {
        const userDiv = document.createElement('div');
        userDiv.className = 'leaderboard-item';
        
        const rank = index + 1;
        const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
        
        userDiv.innerHTML = `
            <span class="leaderboard-rank">${rankIcon}</span>
            <span class="leaderboard-name">${user[1].name || 'مجهول'}</span>
            <span class="leaderboard-value">${user[1].vex} ڤكس</span>
        `;
        
        container.appendChild(userDiv);
    });
}

// تحميل لوحة متصدري المستوى
function loadLevelLeaderboard(leaders) {
    const container = document.getElementById('levelLeaderboard');
    container.innerHTML = '';
    
    leaders.slice(0, 5).forEach((user, index) => {
        const userDiv = document.createElement('div');
        userDiv.className = 'leaderboard-item';
        
        const rank = index + 1;
        const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
        
        const levels = [
            "「👤」Demon Member",
            "「👥」Demon Beginner", 
            "「🔥」Demon Advanced",
            "「⚡」Demon Expert",
            "「📢」Demon Leader",
            "「🕹️」Demon Commander",
            "「🎖️」Demon Colonel"
        ];
        
        userDiv.innerHTML = `
            <span class="leaderboard-rank">${rankIcon}</span>
            <span class="leaderboard-name">${user[1].name || 'مجهول'}</span>
            <span class="leaderboard-value level">${levels[user[1].level] || levels[0]}</span>
        `;
        
        container.appendChild(userDiv);
    });
}

// تحميل لوحة متصدري التفاعل
function loadChatLeaderboard(leaders) {
    const container = document.getElementById('chatLeaderboard');
    container.innerHTML = '';
    
    leaders.slice(0, 5).forEach((user, index) => {
        const userDiv = document.createElement('div');
        userDiv.className = 'leaderboard-item';
        
        const rank = index + 1;
        const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
        
        userDiv.innerHTML = `
            <span class="leaderboard-rank">${rankIcon}</span>
            <span class="leaderboard-name">${user[1].name || 'مجهول'}</span>
            <span class="leaderboard-value chat">${user[1].messages_count || 0} رسالة</span>
        `;
        
        container.appendChild(userDiv);
    });
}

// إظهار الصفحات المختلفة
function showPage(pageId) {
    // إخفاء جميع الصفحات
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(section => section.classList.remove('active'));
    
    // إظهار الصفحة المطلوبة
    const targetSection = document.getElementById(pageId + 'Content');
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// تتبع الوقت المقضي في الموقع
let timeSpent = 0;
let timeTracker = null;

function startTimeTracking() {
    timeTracker = setInterval(() => {
        timeSpent += 1; // ثانية واحدة
        
        // تحديث مهمة الوقت اليومية (10 دقائق = 600 ثانية)
        if (timeSpent >= 600 && !isTaskCompleted('daily_time')) {
            completeTask('daily_time', 30);
        }
        
        // تحديث مهمة الوقت الأسبوعية (ساعة = 3600 ثانية)
        if (timeSpent >= 3600 && !isTaskCompleted('weekly_time')) {
            completeTask('weekly_time', 300, 50);
        }
    }, 1000);
}

// فحص إذا كانت المهمة مكتملة
function isTaskCompleted(taskId) {
    if (!currentUser) return false;
    return currentUser.tasks && currentUser.tasks[taskId];
}

// إكمال مهمة
function completeTask(taskId, vexReward, xpReward = 0) {
    if (!currentUser) return;
    
    if (!currentUser.tasks) {
        currentUser.tasks = {};
    }
    
    currentUser.tasks[taskId] = true;
    currentUser.vex += vexReward;
    currentUser.xp += xpReward;
    
    // إظهار رسالة نجاح
    showNotification(`تم إكمال المهمة! حصلت على ${vexReward} ڤكس${xpReward > 0 ? ` و ${xpReward} XP` : ''}`, 'success');
    
    // تحديث واجهة المستخدم
    updateUserProfile();
}

// إظهار الإشعارات
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? 'linear-gradient(45deg, #00ff00, #008800)' : 'linear-gradient(45deg, #8B0000, #660000)'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 10000;
        font-weight: bold;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        animation: slideDown 0.5s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // إزالة الإشعار بعد 3 ثوان
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.5s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// إضافة الأنيميشن للإشعارات
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, -100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// فتح الصندوق بالڤكس
function openBoxWithVex() {
    if (!currentUser) return;
    
    if (currentUser.vex < 100) {
        showNotification('ليس لديك ڤكس كافي! تحتاج 100 ڤكس لفتح الصندوق.', 'error');
        return;
    }
    
    currentUser.vex -= 100;
    openBox();
}

// فتح الصندوق بمشاهدة الإعلان
function openBoxWithAd() {
    // في التطبيق الحقيقي، هنا سيكون إعلان Google AdSense
    showNotification('تم تشغيل الإعلان! جاري فتح الصندوق...', 'info');
    
    setTimeout(() => {
        openBox();
    }, 3000); // محاكاة وقت الإعلان
}

// فتح الصندوق
function openBox() {
    const rewards = [
        { type: 'vex', amount: 50, chance: 50 },
        { type: 'vex', amount: 200, chance: 30 },
        { type: 'vex', amount: 500, chance: 10 },
        { type: 'xp', amount: 300, chance: 7 },
        { type: 'level', amount: 1, chance: 3 }
    ];
    
    const random = Math.random() * 100;
    let cumulativeChance = 0;
    
    for (const reward of rewards) {
        cumulativeChance += reward.chance;
        if (random <= cumulativeChance) {
            applyReward(reward);
            break;
        }
    }
    
    updateUserProfile();
}

// تطبيق المكافأة
function applyReward(reward) {
    if (!currentUser) return;
    
    switch (reward.type) {
        case 'vex':
            currentUser.vex += reward.amount;
            showNotification(`مبروك! حصلت على ${reward.amount} ڤكس من الصندوق! 🎉`, 'success');
            break;
        case 'xp':
            currentUser.xp += reward.amount;
            showNotification(`مبروك! حصلت على ${reward.amount} XP من الصندوق! 🎉`, 'success');
            break;
        case 'level':
            if (currentUser.level < 6) { // أقصى مستوى
                currentUser.level += reward.amount;
                showNotification(`مبروك! تم ترقيتك إلى مستوى جديد! 🎉`, 'success');
            } else {
                currentUser.vex += 1000; // تعويض إذا كان في أقصى مستوى
                showNotification(`مبروك! حصلت على 1000 ڤكس بدلاً من الترقية! 🎉`, 'success');
            }
            break;
    }
}

// إضافة أحداث للأزرار
document.addEventListener('DOMContentLoaded', function() {
    // إضافة حدث Enter لتسجيل الدخول
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && document.getElementById('loginPage').classList.contains('active')) {
            login();
        }
    });
    
    // تحميل Google AdSense بشكل آمن
    loadGoogleAds();
    
    // عرض إعلان الترحيب عند تحميل الصفحة (بعد تسجيل الدخول)
    setTimeout(() => {
        if (currentUser) {
            showWelcomeAd();
        }
    }, 3000);
    
    // بدء تايمر الإعلانات المتكررة
    startPeriodicAds();
    
    // إغلاق القائمة الجانبية عند الضغط خارجها
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.querySelector('.menu-toggle');
        
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('show');
            document.querySelector('.main-content').classList.remove('sidebar-open');
        }
    });
});

// تحميل Google AdSense بشكل آمن
function loadGoogleAds() {
    try {
        if (typeof adsbygoogle !== 'undefined') {
            return;
        }
        
        // إنشاء متغير adsbygoogle إذا لم يكن موجوداً
        window.adsbygoogle = window.adsbygoogle || [];
    } catch (error) {
        console.log('خطأ في تحميل الإعلانات:', error);
    }
}

// عرض إعلان الترحيب
function showWelcomeAd() {
    try {
        const welcomeAd = document.getElementById('welcomeAd');
        welcomeAd.style.display = 'flex';
        
        // تشغيل الإعلان
        setTimeout(() => {
            if (window.adsbygoogle) {
                (adsbygoogle = window.adsbygoogle || []).push({});
            }
        }, 500);
    } catch (error) {
        console.log('خطأ في عرض إعلان الترحيب:', error);
    }
}

// تحديث البيانات دورياً
setInterval(() => {
    if (currentUser) {
        loadLeaderboard();
    }
}, 30000); // كل 30 ثانية

// تبديل إظهار/إخفاء القائمة الجانبية
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebar.classList.contains('show')) {
        sidebar.classList.remove('show');
        mainContent.classList.remove('sidebar-open');
    } else {
        sidebar.classList.add('show');
        mainContent.classList.add('sidebar-open');
    }
}

// إغلاق إعلان الترحيب
function closeWelcomeAd() {
    const welcomeAd = document.getElementById('welcomeAd');
    welcomeAd.style.display = 'none';
}

// إغلاق الإعلان المتكرر
function closePeriodicAd() {
    const periodicAd = document.getElementById('periodicAd');
    periodicAd.style.display = 'none';
}

// عرض الإعلان المتكرر
function showPeriodicAd() {
    if (!currentUser) return;
    
    try {
        const periodicAd = document.getElementById('periodicAd');
        periodicAd.style.display = 'flex';
        
        // تشغيل الإعلان
        setTimeout(() => {
            if (window.adsbygoogle) {
                (adsbygoogle = window.adsbygoogle || []).push({});
            }
        }, 500);
        
        // إخفاء الإعلان تلقائياً بعد 15 ثانية
        setTimeout(() => {
            closePeriodicAd();
        }, 15000);
    } catch (error) {
        console.log('خطأ في عرض الإعلان المتكرر:', error);
    }
}

// بدء تايمر الإعلانات المتكررة (كل 5 دقائق)
function startPeriodicAds() {
    setInterval(() => {
        if (currentUser) {
            showPeriodicAd();
        }
    }, 300000); // 5 دقائق = 300000 ميلي ثانية
}

// فتح الصندوق بمشاهدة الإعلان (محدث)
function openBoxWithAd() {
    // عرض إعلان خاص بالصندوق
    const adModal = document.createElement('div');
    adModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    adModal.innerHTML = `
        <div style="background: rgba(139, 0, 0, 0.9); padding: 30px; border-radius: 15px; border: 2px solid #8B0000; position: relative; max-width: 600px; width: 90%; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-1404937854433871"
                 data-ad-slot="9045724658"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            <div style="text-align: center; margin-top: 20px;">
                <p style="color: white; margin-bottom: 15px;">سيتم فتح الصندوق بعد انتهاء الإعلان...</p>
                <button onclick="closeAdAndOpenBox()" style="background: linear-gradient(45deg, #8B0000, #660000); border: none; border-radius: 10px; color: white; padding: 10px 20px; cursor: pointer; font-weight: bold;">
                    إغلاق الإعلان وفتح الصندوق
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(adModal);
    
    // تشغيل إعلان Google AdSense
    (adsbygoogle = window.adsbygoogle || []).push({});
    
    // إضافة الوظيفة لإغلاق الإعلان وفتح الصندوق
    window.closeAdAndOpenBox = function() {
        document.body.removeChild(adModal);
        openBox();
        showNotification('مبروك! تم فتح الصندوق مجاناً بعد مشاهدة الإعلان! 🎉', 'success');
        delete window.closeAdAndOpenBox;
    };
    
    // إغلاق تلقائي بعد 15 ثانية
    setTimeout(() => {
        if (document.body.contains(adModal)) {
            window.closeAdAndOpenBox();
        }
    }, 15000);
}

// إيقاف تتبع الوقت عند إغلاق الصفحة
window.addEventListener('beforeunload', function() {
    if (timeTracker) {
        clearInterval(timeTracker);
    }
});
