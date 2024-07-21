let db;
const request = indexedDB.open('kanbanImages', 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;
    console.log('IndexedDB 연결 성공');
    loadBoards();
};

request.onerror = function(event) {
    console.error('IndexedDB 연결 오류:', event);
};

function saveImageToIndexedDB(imageData, callback) {
    if (!db) {
        console.error('IndexedDB 연결 오류: db 객체가 초기화되지 않았습니다.');
        return;
    }
    const transaction = db.transaction(['images'], 'readwrite');
    const objectStore = transaction.objectStore('images');
    const request = objectStore.add({ image: imageData });

    request.onsuccess = function(event) {
        callback(event.target.result); // 이미지 ID 반환
    };

    request.onerror = function(event) {
        console.error('IndexedDB에 이미지 저장 오류:', event);
    };
}

function loadImageFromIndexedDB(imageId, callback) {
    if (!db) {
        console.error('IndexedDB 연결 오류: db 객체가 초기화되지 않았습니다.');
        return;
    }
    const transaction = db.transaction(['images'], 'readonly');
    const objectStore = transaction.objectStore('images');
    const request = objectStore.get(imageId);

    request.onsuccess = function(event) {
        callback(event.target.result.image);
    };

    request.onerror = function(event) {
        console.error('IndexedDB에서 이미지 로드 오류:', event);
    };
}

function removeImageFromIndexedDB(imageId, callback) {
    if (!db) {
        console.error('IndexedDB 연결 오류: db 객체가 초기화되지 않았습니다.');
        return;
    }
    const transaction = db.transaction(['images'], 'readwrite');
    const objectStore = transaction.objectStore('images');
    const request = objectStore.delete(Number(imageId));

    request.onsuccess = function() {
        callback();
    };

    request.onerror = function(event) {
        console.error('IndexedDB에서 이미지 삭제 오류:', event);
    };
}

document.getElementById('modal-photo-input').addEventListener('change', function(event) {
    const files = event.target.files;
    const photosList = document.getElementById('modal-photos-list');

    for (const file of files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            saveImageToIndexedDB(e.target.result, function(imageId) {
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item';
                photoItem.dataset.imageId = imageId;
                photoItem.innerHTML = `
                    <img src="${e.target.result}" alt="photo">
                    <button class="remove-photo" onclick="removeModalPhoto(this)">X</button>
                `;
                photosList.appendChild(photoItem);
            });
        }
        reader.readAsDataURL(file);
    }
});

function removeModalPhoto(button) {
    const photoItem = button.parentElement;
    const imageId = photoItem.dataset.imageId;
    removeImageFromIndexedDB(imageId, function() {
        photoItem.remove();
    });
}

function saveBoard() {
    const isSpecial = currentBoard.classList.contains('special-board');
    const theme = isSpecial ? '랜덤 그룹' : document.getElementById('modal-theme').value;
    const place = isSpecial ? '' : document.getElementById('modal-place-input').value;
    const date = isSpecial ? '' : document.getElementById('modal-date').value;
    const people = isSpecial ? '무제한' : document.getElementById('modal-people').value;
    const membersList = document.getElementById('modal-members-list');
    const photosList = document.getElementById('modal-photos-list');

    currentBoard.querySelector('.theme-display').innerText = theme;
    if (!isSpecial) {
        currentBoard.querySelector('.place-display').innerText = `장소: ${place}`;
        currentBoard.querySelector('.date-display').innerText = `예상 일정: ${date}`;
        currentBoard.querySelector('.people-display').innerText = `신청가능인원: ${people}`;
        currentBoard.querySelector('.people-display').dataset.value = people;
    }

    const membersDisplayList = currentBoard.querySelector('.members-list');
    membersDisplayList.innerHTML = '';
    for (const memberInput of membersList.children) {
        const memberDisplay = document.createElement('li');
        memberDisplay.className = 'member-display';
        memberDisplay.innerText = memberInput.querySelector('input').value;
        membersDisplayList.appendChild(memberDisplay);
    }

    let photosDisplayList = currentBoard.querySelector('.photos-list');
    if (!photosDisplayList) {
        photosDisplayList = document.createElement('div');
        photosDisplayList.className = 'photos-list';
        photosDisplayList.style.display = 'none';
        currentBoard.querySelector('.board-content').appendChild(photosDisplayList);
    }
    photosDisplayList.innerHTML = '';
    const photoIds = [];
    for (const photoItem of photosList.children) {
        const photoDisplay = document.createElement('img');
        const imageId = photoItem.dataset.imageId;
        photoDisplay.src = photoItem.querySelector('img').src;
        photoDisplay.dataset.imageId = imageId;
        photosDisplayList.appendChild(photoDisplay);
        photoIds.push(imageId);
    }

    updateBoardStyle(currentBoard);

    const boards = JSON.parse(localStorage.getItem('kanbanBoards')) || [];
    const boardData = {
        theme,
        place,
        date,
        people,
        members: Array.from(membersList.children).map(member => member.querySelector('input').value),
        photos: photoIds,
        isSpecial
    };
    const boardIndex = Array.from(document.querySelectorAll('.kanban-board')).indexOf(currentBoard);
    if (boardIndex >= 0) {
        boards[boardIndex] = boardData;
    } else {
        boards.push(boardData);
    }

    try {
        localStorage.setItem('kanbanBoards', JSON.stringify(boards));
        console.log('Board saved:', boardData);
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }

    closeModal();
}

function loadBoards() {
    if (!db) {
        console.error('IndexedDB 연결 오류: db 객체가 초기화되지 않았습니다.');
        return;
    }
    
    const boards = JSON.parse(localStorage.getItem('kanbanBoards')) || [];

    document.querySelectorAll('.kanban-board').forEach(board => board.remove());

    boards.forEach(boardData => {
        const container = document.querySelector('.kanban-board-container');
        const newBoard = document.createElement('div');
        newBoard.className = `kanban-board${boardData.isSpecial ? ' special-board' : ''}`;
        newBoard.onclick = boardData.isSpecial ? () => openSpecialBoardModal(newBoard) : () => openModal(newBoard);
        newBoard.innerHTML = `
            <button class="delete-board" onclick="event.stopPropagation(); deleteBoard(this)" style="display: ${boardData.isSpecial && isAdmin ? 'block' : 'none'};">X</button>
            <div class="board-content">
                <div class="board-placeholder" style="display: none;">클릭하여 내용을 추가하세요</div>
                <div class="theme-display">${boardData.theme}</div>
                <div class="place-display" style="display: ${boardData.place ? 'block' : 'none'};">장소: ${boardData.place}</div>
                <div class="date-display" style="display: ${boardData.date ? 'block' : 'none'};">예상 일정: ${boardData.date}</div>
                <div class="people-display" data-value="${boardData.people}" style="display: ${boardData.people ? 'block' : 'none'};">신청가능인원: ${boardData.people}</div>
                <ul class="members-list">
                    ${boardData.members.map(member => `<li class="member-display">${member}</li>`).join('')}
                </ul>
                <div class="photos-list" style="display: none;"></div>
            </div>
        `;
        if (!boardData.isSpecial) {
            newBoard.onmouseover = () => newBoard.querySelector('.delete-board').style.display = 'block';
            newBoard.onmouseout = () => newBoard.querySelector('.delete-board').style.display = 'none';
        }
        container.insertBefore(newBoard, container.querySelector('.add-board'));
        updateBoardStyle(newBoard);

        const photosList = newBoard.querySelector('.photos-list');
        boardData.photos.forEach(imageId => {
            loadImageFromIndexedDB(Number(imageId), function(imageData) {
                const photoDisplay = document.createElement('img');
                photoDisplay.src = imageData;
                photoDisplay.dataset.imageId = imageId;
                photosList.appendChild(photoDisplay);
            });
        });
    });

    console.log('Boards loaded:', boards);
}

function addBoard() {
    const container = document.querySelector('.kanban-board-container');
    const newBoard = document.createElement('div');
    newBoard.className = 'kanban-board';
    newBoard.onclick = () => openModal(newBoard);
    newBoard.innerHTML = `
        <button class="delete-board" onclick="event.stopPropagation(); deleteBoard(this)" style="display: none;">X</button>
        <div class="board-content">
            <div class="board-placeholder">클릭하여 내용을 추가하세요</div>
            <div class="theme-display" style="display: none;"></div>
            <div class="place-display" style="display: none;"></div>
            <div class="date-display" style="display: none;"></div>
            <div class="people-display" style="display: none;"></div>
            <ul class="members-list" style="display: none;"></ul>
        </div>
    `;
    newBoard.onmouseover = () => newBoard.querySelector('.delete-board').style.display = 'block';
    newBoard.onmouseout = () => newBoard.querySelector('.delete-board').style.display = 'none';
    container.insertBefore(newBoard, container.querySelector('.add-board'));
    saveBoards();
}

function openModal(board) {
    currentBoard = board;
    const isSpecial = board.classList.contains('special-board');
    
    document.getElementById('modal-theme').value = isSpecial ? '랜덤 그룹' : board.querySelector('.theme-display').innerText || '';
    document.getElementById('modal-theme').disabled = isSpecial;
    
    if (!isSpecial) {
        document.getElementById('modal-place-input').value = board.querySelector('.place-display').innerText.replace('장소: ', '') || '';
        document.getElementById('modal-place').style.display = 'block';
        document.getElementById('modal-date-label').style.display = 'block';
        document.getElementById('modal-people-label').style.display = 'block';
        document.getElementById('modal-date').value = board.querySelector('.date-display').innerText.replace('예상 일정: ', '') || new Date().toISOString().split('T')[0];
        document.getElementById('modal-people').value = board.querySelector('.people-display').dataset.value || '4';
    } else {
        document.getElementById('modal-place').style.display = 'none';
        document.getElementById('modal-date-label').style.display = 'none';
        document.getElementById('modal-people-label').style.display = 'none';
    }

    const membersList = board.querySelector('.members-list');
    document.getElementById('modal-members-list').innerHTML = '';
    for (const member of membersList.children) {
        const memberInput = document.createElement('div');
        memberInput.className = 'member-input';
        memberInput.innerHTML = `
            <input type="text" value="${member.innerText}">
            <button class="remove-member" onclick="removeModalMember(this)">X</button>
        `;
        document.getElementById('modal-members-list').appendChild(memberInput);
    }

    const photosList = board.querySelector('.photos-list');
    document.getElementById('modal-photos-list').innerHTML = '';
    if (photosList) {
        for (const photo of photosList.children) {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.dataset.imageId = photo.dataset.imageId;
            photoItem.innerHTML = `
                <img src="${photo.src}" alt="photo">
                <button class="remove-photo" onclick="removeModalPhoto(this)">X</button>
            `;
            document.getElementById('modal-photos-list').appendChild(photoItem);
        }
    }
    
    document.getElementById('modal').style.display = "block";
}

function closeModal() {
    document.getElementById('modal').style.display = "none";
}

function addModalMember() {
    const membersList = document.getElementById('modal-members-list');
    const isSpecial = currentBoard.classList.contains('special-board');
    const peopleCount = isSpecial ? Infinity : parseInt(document.getElementById('modal-people').value);

    if (membersList.children.length < peopleCount) {
        const memberInput = document.createElement('div');
        memberInput.className = 'member-input';
        memberInput.innerHTML = `
            <input type="text" placeholder="그룹원 이름">
            <button class="remove-member" onclick="removeModalMember(this)">X</button>
        `;
        membersList.appendChild(memberInput);
    } else {
        alert(`최대 ${peopleCount}명까지 추가할 수 있습니다.`);
    }
}

function removeModalMember(button) {
    button.parentElement.remove();
}

function saveBoards() {
    const boards = [];
    document.querySelectorAll('.kanban-board').forEach(board => {
        const isSpecial = board.classList.contains('special-board');
        const theme = board.querySelector('.theme-display').innerText;
        const place = board.querySelector('.place-display') ? board.querySelector('.place-display').innerText.replace('장소: ', '') : '';
        const date = board.querySelector('.date-display') ? board.querySelector('.date-display').innerText.replace('예상 일정: ', '') : '';
        const people = board.querySelector('.people-display') ? board.querySelector('.people-display').dataset.value : '';
        const members = Array.from(board.querySelectorAll('.members-list .member-display')).map(member => member.innerText);
        const photos = Array.from(board.querySelectorAll('.photos-list img')).map(photo => photo.dataset.imageId);

        boards.push({ theme, place, date, people, members, photos, isSpecial });
    });

    try {
        localStorage.setItem('kanbanBoards', JSON.stringify(boards));
        console.log('Boards saved:', boards);
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

function updateBoardStyle(board) {
    const isSpecial = board.classList.contains('special-board');
    if (isSpecial) {
        board.classList.add('special-board');
        board.querySelector('.board-placeholder').style.display = 'none';
        board.querySelector('.theme-display').style.display = 'block';
        board.querySelector('.members-list').style.display = 'block';
        return;
    }
    
    const peopleCount = parseInt(board.querySelector('.people-display').dataset.value);
    const membersCount = board.querySelector('.members-list').children.length;
    
    if (membersCount >= peopleCount) {
        board.classList.add('full-board');
        board.classList.remove('partial-board');
    } else {
        board.classList.add('partial-board');
        board.classList.remove('full-board');
    }

    const theme = board.querySelector('.theme-display').innerText;
    const place = board.querySelector('.place-display').innerText;
    const date = board.querySelector('.date-display').innerText;
    const people = board.querySelector('.people-display').innerText;

    if (theme && place && date && people) {
        board.querySelector('.board-placeholder').style.display = 'none';
        board.querySelector('.theme-display').style.display = 'block';
        board.querySelector('.place-display').style.display = 'block';
        board.querySelector('.date-display').style.display = 'block';
        board.querySelector('.people-display').style.display = 'block';
        board.querySelector('.members-list').style.display = 'block';
    } else {
        board.querySelector('.board-placeholder').style.display = 'flex';
        board.querySelector('.theme-display').style.display = 'none';
        board.querySelector('.place-display').style.display = 'none';
        board.querySelector('.date-display').style.display = 'none';
        board.querySelector('.people-display').style.display = 'none';
        board.querySelector('.members-list').style.display = 'none';
    }
}

function openAdminLogin() {
    document.getElementById('admin-login-modal').style.display = 'block';
}

function closeAdminLogin() {
    document.getElementById('admin-login-modal').style.display = 'none';
}

function adminLogin() {
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;

    if (username === 'cjone' && password === 'cjone1!') {
        isAdmin = true;
        document.getElementById('admin-functions').style.display = 'block';
        document.querySelectorAll('.kanban-board.special-board .delete-board').forEach(button => {
            button.style.display = 'block';
        });
        closeAdminLogin();
    } else {
        alert('로그인 실패: 아이디 또는 비밀번호가 잘못되었습니다.');
    }
}

function deleteBoard(button) {
    if (confirm('정말 삭제하시겠습니까?')) {
        const board = button.parentElement;
        board.remove();
        saveBoards();
    }
}

function deleteAllBoards() {
    if (isAdmin) {
        if (confirm('정말 모든 칸반을 삭제하시겠습니까?')) {
            const boards = document.querySelectorAll('.kanban-board');
            boards.forEach(board => board.remove());
            localStorage.removeItem('kanbanBoards');
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('IndexedDB 연결 성공');
        loadBoards();
    };
    request.onerror = function(event) {
        console.error('IndexedDB 연결 오류:', event);
    };
});

window.onbeforeunload = saveBoards;

let currentBoard = null;
let isAdmin = false;

function addSpecialBoard() {
    const container = document.querySelector('.kanban-board-container');
    const newBoard = document.createElement('div');
    newBoard.className = 'kanban-board special-board';
    newBoard.onclick = () => openSpecialBoardModal(newBoard);
    newBoard.innerHTML = `
        <button class="delete-board" onclick="event.stopPropagation(); deleteBoard(this)" style="display: none;">X</button>
        <div class="board-content">
            <div class="board-placeholder" style="display: none;">클릭하여 내용을 추가하세요</div>
            <div class="theme-display">랜덤 그룹</div>
            <ul class="members-list"></ul>
        </div>
    `;
    container.insertBefore(newBoard, container.querySelector('.add-board'));
    saveBoards();
}

function openSpecialBoardModal(board) {
    currentBoard = board;
    document.getElementById('modal-theme').value = '랜덤 그룹';
    document.getElementById('modal-theme').disabled = true;
    document.getElementById('modal-place').style.display = 'none';
    document.getElementById('modal-date-label').style.display = 'none';
    document.getElementById('modal-people-label').style.display = 'none';

    const membersList = board.querySelector('.members-list');
    document.getElementById('modal-members-list').innerHTML = '';
    for (const member of membersList.children) {
        const memberInput = document.createElement('div');
        memberInput.className = 'member-input';
        memberInput.innerHTML = `
            <input type="text" value="${member.innerText}">
            <button class="remove-member" onclick="removeModalMember(this)">X</button>
        `;
        document.getElementById('modal-members-list').appendChild(memberInput);
    }

    document.getElementById('modal-photos-list').innerHTML = '';
    document.getElementById('modal').style.display = "block";
}
