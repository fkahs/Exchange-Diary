const DEVELOPER_ACCOUNT = {
    username: 'alswl100409',
    password: 'fkahs100409@'
};

const LOGIN_KEY = 'diary_logged_in_user';
const REMEMBER_LOGIN_KEY = 'diary_remember_login';
const USERS_KEY = 'diary_users';
const DIARIES_KEY = 'diaries';
const DAILY_LIMIT_KEY = 'diary_daily_limit';
const INQUIRIES_KEY = 'diary_inquiries';

let selectedImage = '';
let editingDiaryId = null;
let loggedInUser = localStorage.getItem(LOGIN_KEY) || '';
let rememberLogin = localStorage.getItem(REMEMBER_LOGIN_KEY) !== 'false';

function getTodayKey() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getUsers() {
    const savedUsers = localStorage.getItem(USERS_KEY);
    return savedUsers ? JSON.parse(savedUsers) : {};
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function ensureDeveloperAccount() {
    const users = getUsers();
    if (!users[DEVELOPER_ACCOUNT.username]) {
        users[DEVELOPER_ACCOUNT.username] = DEVELOPER_ACCOUNT.password;
        saveUsers(users);
    }
}

function updateBottomNav(activeKey = 'diary') {
    const bottomNav = document.getElementById('bottom-nav');
    if (!bottomNav) return;

    if (!loggedInUser) {
        bottomNav.classList.add('hidden');
        return;
    }

    bottomNav.classList.remove('hidden');

    const navButtons = bottomNav.querySelectorAll('.nav-btn');
    navButtons.forEach((button) => {
        const isActive = button.dataset.nav === activeKey;
        button.classList.toggle('is-active', isActive);
    });

    if (loggedInUser !== DEVELOPER_ACCOUNT.username) {
        const adminButton = Array.from(navButtons).find((button) => button.dataset.nav === 'admin');
        if (adminButton) {
            adminButton.disabled = true;
            adminButton.title = '개발자 전용';
            adminButton.style.opacity = '0.55';
        }
    } else {
        navButtons.forEach((button) => {
            if (button.dataset.nav === 'admin') {
                button.disabled = false;
                button.title = '';
                button.style.opacity = '1';
            }
        });
    }
}

function updateLoginUI() {
    const loginPanel = document.getElementById('login-panel');
    const developerPanel = document.getElementById('developer-panel');
    const diaryPanel = document.getElementById('diary-panel');
    const inquiryPanel = document.getElementById('inquiry-panel');
    const loggedUserLabel = document.getElementById('logged-user-label');
    const writerInput = document.getElementById('writer');
    const rememberLoginCheckbox = document.getElementById('remember-login');

    if (rememberLoginCheckbox) {
        rememberLoginCheckbox.checked = rememberLogin;
    }

    if (!loggedInUser) {
        loginPanel.classList.remove('hidden');
        developerPanel.classList.add('hidden');
        diaryPanel.classList.add('hidden');
        inquiryPanel.classList.add('hidden');
        writerInput.value = '';
        updateBottomNav();
        return;
    }

    loginPanel.classList.add('hidden');
    loggedUserLabel.textContent = `${loggedInUser}님 로그인 중 (${rememberLogin ? '로그인 유지' : '비로그인 상태'})`;
    diaryPanel.classList.remove('hidden');
    inquiryPanel.classList.remove('hidden');
    writerInput.value = loggedInUser;
    writerInput.readOnly = true;

    if (loggedInUser === DEVELOPER_ACCOUNT.username) {
        developerPanel.classList.remove('hidden');
    } else {
        developerPanel.classList.add('hidden');
    }

    updateBottomNav('diary');
}

function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const users = getUsers();
    const rememberInput = document.getElementById('remember-login');

    if (!username || !password) {
        alert('아이디와 비밀번호를 입력해 주세요.');
        return;
    }

    if (users[username] && users[username] === password) {
        loggedInUser = username;
        rememberLogin = !!rememberInput.checked;
        localStorage.setItem(REMEMBER_LOGIN_KEY, String(rememberLogin));

        if (rememberLogin) {
            localStorage.setItem(LOGIN_KEY, username);
        } else {
            localStorage.removeItem(LOGIN_KEY);
        }

        document.getElementById('login-password').value = '';
        updateLoginUI();
        renderDiaries();
        return;
    }

    alert('아이디 또는 비밀번호가 올바르지 않습니다.');
}

function logout() {
    const confirmed = confirm('로그아웃하시겠습니까?');
    if (!confirmed) {
        return;
    }

    loggedInUser = '';
    rememberLogin = false;
    localStorage.removeItem(LOGIN_KEY);
    localStorage.setItem(REMEMBER_LOGIN_KEY, 'false');
    closeAdminPage();
    resetForm();
    updateLoginUI();
    renderInquiries();
}

function openAdminPage() {
    if (loggedInUser !== DEVELOPER_ACCOUNT.username) {
        alert('개발자만 관리자 페이지에 접근할 수 있습니다.');
        return;
    }

    document.getElementById('admin-page').classList.remove('hidden');
    renderAdminUsers();
    renderAdminDiaries();
}

function closeAdminPage() {
    document.getElementById('admin-page').classList.add('hidden');
}

function addUserAccount() {
    if (loggedInUser !== DEVELOPER_ACCOUNT.username) {
        alert('개발자만 사용자 계정을 추가할 수 있습니다.');
        return;
    }

    const newUserId = document.getElementById('new-user-id').value.trim();
    const newUserPassword = document.getElementById('new-user-password').value;

    if (!newUserId || !newUserPassword) {
        alert('추가할 아이디와 비밀번호를 입력해 주세요.');
        return;
    }

    const users = getUsers();
    if (users[newUserId]) {
        alert('이미 등록된 아이디입니다.');
        return;
    }

    users[newUserId] = newUserPassword;
    saveUsers(users);
    document.getElementById('new-user-id').value = '';
    document.getElementById('new-user-password').value = '';
    alert('사용자 계정이 추가되었습니다.');
}

function handleImageSelect(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('image-preview');

    if (!file) {
        selectedImage = '';
        preview.innerHTML = '';
        return;
    }

    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 선택할 수 있습니다.');
        event.target.value = '';
        selectedImage = '';
        preview.innerHTML = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        selectedImage = e.target.result;
        preview.innerHTML = `<img src="${selectedImage}" alt="업로드 미리보기">`;
        document.getElementById('remove-image-btn').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function resetForm() {
    editingDiaryId = null;
    selectedImage = '';
    document.getElementById('writer').value = '';
    document.getElementById('title').value = '';
    document.getElementById('content').value = '';
    document.getElementById('image').value = '';
    document.getElementById('image-preview').innerHTML = '';
    document.getElementById('save-diary-btn').textContent = '일기 저장하기';
    document.getElementById('remove-image-btn').classList.add('hidden');
}

function removeSelectedImage() {
    selectedImage = '';
    document.getElementById('image').value = '';
    document.getElementById('image-preview').innerHTML = '';
    document.getElementById('remove-image-btn').classList.add('hidden');
}

function hasWrittenToday(username) {
    const dailyLimit = JSON.parse(localStorage.getItem(DAILY_LIMIT_KEY) || '{}');
    const today = getTodayKey();
    return !!dailyLimit[username]?.[today];
}

function markWrittenToday(username) {
    const dailyLimit = JSON.parse(localStorage.getItem(DAILY_LIMIT_KEY) || '{}');
    const today = getTodayKey();

    if (!dailyLimit[username]) {
        dailyLimit[username] = {};
    }

    dailyLimit[username][today] = true;
    localStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(dailyLimit));
}

function saveDiary() {
    if (!loggedInUser) {
        alert('로그인 후 작성할 수 있습니다.');
        return;
    }

    const writer = document.getElementById('writer').value.trim();
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();

    if (!writer || !title || !content) {
        alert('작성자, 제목, 내용을 모두 입력해 주세요.');
        return;
    }

    if (writer !== loggedInUser && loggedInUser !== DEVELOPER_ACCOUNT.username) {
        alert('로그인한 사용자와 작성자 이름이 다릅니다.');
        return;
    }

    const diaries = JSON.parse(localStorage.getItem(DIARIES_KEY) || '[]');

    if (!editingDiaryId && hasWrittenToday(writer)) {
        alert('오늘은 이미 작성하셨습니다. 하루에 한 번만 작성할 수 있습니다.');
        return;
    }

    if (editingDiaryId) {
        const diaryIndex = diaries.findIndex((diary) => diary.id === editingDiaryId);
        if (diaryIndex >= 0) {
            diaries[diaryIndex] = {
                ...diaries[diaryIndex],
                title: title,
                content: content,
                image: selectedImage || diaries[diaryIndex].image || ''
            };
        }
    } else {
        const diary = {
            id: Date.now(),
            writer: writer,
            title: title,
            content: content,
            image: selectedImage,
            date: new Date().toLocaleDateString('ko-KR')
        };
        diaries.unshift(diary);
        markWrittenToday(writer);
    }

    localStorage.setItem(DIARIES_KEY, JSON.stringify(diaries));
    resetForm();
    renderDiaries();
}

function deleteDiary(diaryId) {
    const diaries = JSON.parse(localStorage.getItem(DIARIES_KEY) || '[]');
    const diaryToDelete = diaries.find((diary) => diary.id === diaryId);

    if (!diaryToDelete) {
        return;
    }

    const canManageDiary = diaryToDelete.writer === loggedInUser || loggedInUser === DEVELOPER_ACCOUNT.username;
    if (!canManageDiary) {
        alert('본인이 작성한 글만 삭제할 수 있습니다.');
        return;
    }

    const confirmed = confirm('정말 이 일기를 삭제할까요?');
    if (!confirmed) {
        return;
    }

    const updatedDiaries = diaries.filter((diary) => diary.id !== diaryId);
    localStorage.setItem(DIARIES_KEY, JSON.stringify(updatedDiaries));

    const dailyLimit = JSON.parse(localStorage.getItem(DAILY_LIMIT_KEY) || '{}');
    const today = getTodayKey();

    if (dailyLimit[diaryToDelete.writer] && dailyLimit[diaryToDelete.writer][today]) {
        delete dailyLimit[diaryToDelete.writer][today];
        localStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(dailyLimit));
    }

    renderDiaries();
}

function editDiary(diaryId) {
    const diaries = JSON.parse(localStorage.getItem(DIARIES_KEY) || '[]');
    const diary = diaries.find((item) => item.id === diaryId);

    if (!diary) {
        return;
    }

    const canManageDiary = diary.writer === loggedInUser || loggedInUser === DEVELOPER_ACCOUNT.username;
    if (!canManageDiary) {
        alert('본인이 작성한 글만 수정할 수 있습니다.');
        return;
    }

    editingDiaryId = diaryId;
    selectedImage = diary.image || '';
    document.getElementById('writer').value = diary.writer;
    document.getElementById('title').value = diary.title;
    document.getElementById('content').value = diary.content;
    document.getElementById('save-diary-btn').textContent = '수정 완료';

    const preview = document.getElementById('image-preview');
    if (diary.image) {
        preview.innerHTML = `<img src="${diary.image}" alt="기존 이미지 미리보기">`;
        document.getElementById('remove-image-btn').classList.remove('hidden');
    } else {
        preview.innerHTML = '';
        document.getElementById('remove-image-btn').classList.add('hidden');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleDiaryAction(event) {
    const target = event.target;
    const deleteId = Number(target.dataset.deleteId);
    const editId = Number(target.dataset.editId);

    if (deleteId) {
        deleteDiary(deleteId);
    }

    if (editId) {
        editDiary(editId);
    }
}

function getVisibleDiaries() {
    if (!loggedInUser) {
        return [];
    }

    return JSON.parse(localStorage.getItem(DIARIES_KEY) || '[]');
}

function toggleInquiryPanel() {
    const inquiryPanel = document.getElementById('inquiry-panel');
    const inquiryBody = inquiryPanel.querySelector('.inquiry-body');
    const toggleButton = inquiryPanel.querySelector('.inquiry-header button');
    const isHidden = inquiryBody.classList.contains('hidden');

    inquiryBody.classList.toggle('hidden', !isHidden);
    toggleButton.textContent = isHidden ? '접기' : '열기';
}

function handleBottomNavClick(event) {
    const button = event.target.closest('.nav-btn');
    if (!button) return;

    const navKey = button.dataset.nav;

    if (navKey === 'logout') {
        logout();
        return;
    }

    if (navKey === 'diary') {
        document.getElementById('diary-panel').classList.remove('hidden');
        document.getElementById('inquiry-panel').classList.add('hidden');
        document.getElementById('admin-page').classList.add('hidden');
        updateBottomNav('diary');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    if (navKey === 'inquiry') {
        document.getElementById('inquiry-panel').classList.remove('hidden');
        const inquiryBody = document.querySelector('#inquiry-panel .inquiry-body');
        const toggleButton = document.querySelector('#inquiry-panel .inquiry-header button');

        if (inquiryBody.classList.contains('hidden')) {
            inquiryBody.classList.remove('hidden');
            toggleButton.textContent = '접기';
        }

        updateBottomNav('inquiry');
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        return;
    }

    if (navKey === 'admin') {
        if (loggedInUser !== DEVELOPER_ACCOUNT.username) {
            alert('개발자만 관리자 페이지에 접근할 수 있습니다.');
            return;
        }

        document.getElementById('admin-page').classList.remove('hidden');
        document.getElementById('diary-panel').classList.add('hidden');
        document.getElementById('inquiry-panel').classList.add('hidden');
        updateBottomNav('admin');
        openAdminPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function sendInquiry() {
    if (!loggedInUser) {
        alert('로그인 후 문의를 보낼 수 있습니다.');
        return;
    }

    const title = document.getElementById('inquiry-title').value.trim();
    const content = document.getElementById('inquiry-content').value.trim();

    if (!title || !content) {
        alert('문의 제목과 내용을 모두 입력해 주세요.');
        return;
    }

    const inquiries = JSON.parse(localStorage.getItem(INQUIRIES_KEY) || '[]');
    inquiries.unshift({
        id: Date.now(),
        user: loggedInUser,
        title: title,
        content: content,
        date: new Date().toLocaleString('ko-KR')
    });
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(inquiries));

    document.getElementById('inquiry-title').value = '';
    document.getElementById('inquiry-content').value = '';
    renderInquiries();
}

function renderInquiries() {
    const inquiryList = document.getElementById('inquiry-list');
    if (!inquiryList) return;

    const inquiries = JSON.parse(localStorage.getItem(INQUIRIES_KEY) || '[]');
    inquiryList.innerHTML = '';

    if (inquiries.length === 0) {
        inquiryList.innerHTML = '<p class="no-data">등록된 문의가 없습니다.</p>';
        return;
    }

    inquiries.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'inquiry-item';
        row.innerHTML = `
            <strong>${item.title}</strong>
            <div>작성자: ${item.user}</div>
            <div>시간: ${item.date}</div>
            <p>${item.content}</p>
        `;
        inquiryList.appendChild(row);
    });
}

function deleteUserAccount(usernameToDelete) {
    if (loggedInUser !== DEVELOPER_ACCOUNT.username) {
        alert('개발자만 계정을 삭제할 수 있습니다.');
        return;
    }

    if (usernameToDelete === DEVELOPER_ACCOUNT.username) {
        alert('개발자 계정은 삭제할 수 없습니다.');
        return;
    }

    const confirmed = confirm(`${usernameToDelete} 계정을 정말 삭제할까요?`);
    if (!confirmed) {
        return;
    }

    const users = getUsers();
    delete users[usernameToDelete];
    saveUsers(users);

    const diaries = JSON.parse(localStorage.getItem(DIARIES_KEY) || '[]');
    const filteredDiaries = diaries.filter((diary) => diary.writer !== usernameToDelete);
    localStorage.setItem(DIARIES_KEY, JSON.stringify(filteredDiaries));

    const dailyLimit = JSON.parse(localStorage.getItem(DAILY_LIMIT_KEY) || '{}');
    delete dailyLimit[usernameToDelete];
    localStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(dailyLimit));

    const inquiries = JSON.parse(localStorage.getItem(INQUIRIES_KEY) || '[]');
    const filteredInquiries = inquiries.filter((inquiry) => inquiry.user !== usernameToDelete);
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(filteredInquiries));

    if (loggedInUser === usernameToDelete) {
        loggedInUser = '';
        localStorage.removeItem(LOGIN_KEY);
    }

    renderAdminUsers();
    renderAdminDiaries();
    renderDiaries();
    renderInquiries();
    updateLoginUI();
    alert('계정이 삭제되었습니다.');
}

function renderAdminUsers() {
    const usersList = document.getElementById('admin-user-list');
    const users = getUsers();
    const diaryEntries = JSON.parse(localStorage.getItem(DIARIES_KEY) || '[]');

    usersList.innerHTML = '';

    Object.keys(users).forEach((username) => {
        const count = diaryEntries.filter((diary) => diary.writer === username).length;
        const li = document.createElement('li');
        li.textContent = `${username} - 작성글 ${count}개`;

        if (username !== DEVELOPER_ACCOUNT.username) {
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'danger-btn';
            deleteButton.textContent = '계정 삭제';
            deleteButton.style.marginLeft = '10px';
            deleteButton.onclick = () => deleteUserAccount(username);
            li.appendChild(deleteButton);
        }

        usersList.appendChild(li);
    });
}

function renderAdminDiaries() {
    const adminDiaryList = document.getElementById('admin-diary-list');
    const diaries = JSON.parse(localStorage.getItem(DIARIES_KEY) || '[]');

    adminDiaryList.innerHTML = '';

    if (diaries.length === 0) {
        adminDiaryList.innerHTML = '<p class="no-data">아직 작성된 일기가 없습니다.</p>';
        return;
    }

    diaries.forEach((diary) => {
        const card = document.createElement('div');
        card.className = 'diary-card';

        const title = document.createElement('h3');
        title.textContent = diary.title;

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = `작성자: ${diary.writer} | 날짜: ${diary.date}`;

        const content = document.createElement('p');
        content.textContent = diary.content;

        card.appendChild(title);
        card.appendChild(meta);

        if (diary.image) {
            const image = document.createElement('img');
            image.src = diary.image;
            image.alt = `${diary.title} 사진`;
            card.appendChild(image);
        }

        card.appendChild(content);
        adminDiaryList.appendChild(card);
    });
}

function renderDiaries() {
    const listContainer = document.getElementById('diary-list');
    listContainer.innerHTML = '';

    const diaries = getVisibleDiaries();

    if (diaries.length === 0) {
        const emptyMessage = '아직 작성된 일기가 없습니다.';
        listContainer.innerHTML = `<p class="no-data">${emptyMessage}</p>`;
        return;
    }

    diaries.forEach((diary) => {
        const card = document.createElement('div');
        card.className = 'diary-card';

        const title = document.createElement('h3');
        title.textContent = diary.title;

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = `작성자: ${diary.writer} | 날짜: ${diary.date}`;

        const content = document.createElement('p');
        content.textContent = diary.content;

        card.appendChild(title);
        card.appendChild(meta);

        if (diary.image) {
            const image = document.createElement('img');
            image.src = diary.image;
            image.alt = `${diary.title} 사진`;
            card.appendChild(image);
        }

        card.appendChild(content);

        const canManageDiary = diary.writer === loggedInUser || loggedInUser === DEVELOPER_ACCOUNT.username;

        if (canManageDiary) {
            const buttons = document.createElement('div');
            buttons.className = 'card-actions';

            const editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.className = 'secondary-btn';
            editButton.textContent = '수정';
            editButton.dataset.editId = diary.id;

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'danger-btn';
            deleteButton.textContent = '삭제';
            deleteButton.dataset.deleteId = diary.id;

            buttons.appendChild(editButton);
            buttons.appendChild(deleteButton);
            card.appendChild(buttons);
        }

        listContainer.appendChild(card);
    });
}

window.onload = function () {
    ensureDeveloperAccount();

    const savedRememberLogin = localStorage.getItem(REMEMBER_LOGIN_KEY);
    rememberLogin = savedRememberLogin !== 'false';

    if (rememberLogin) {
        loggedInUser = localStorage.getItem(LOGIN_KEY) || '';
    } else {
        loggedInUser = '';
        localStorage.removeItem(LOGIN_KEY);
    }

    updateLoginUI();
    renderDiaries();
    renderInquiries();
    renderAdminUsers();
    renderAdminDiaries();
    document.getElementById('image').addEventListener('change', handleImageSelect);
    document.getElementById('diary-list').addEventListener('click', handleDiaryAction);
    document.getElementById('bottom-nav').addEventListener('click', handleBottomNavClick);
    if (!loggedInUser) {
        document.getElementById('writer').value = '';
    }
};