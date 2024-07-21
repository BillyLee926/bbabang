document.addEventListener('DOMContentLoaded', loadBoards);
window.onbeforeunload = saveBoards;

let currentBoard = null;
let isAdmin = false;

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

function addSpecialBoard() {
    if (isAdmin) {
        const container = document.querySelector('.kanban-board-container');
        const newBoard = document.createElement('div');
        newBoard.className = 'kanban-board special-board';
        newBoard.onclick = () => openSpecialBoardModal(newBoard);
        newBoard.innerHTML = `
            <button class="delete-board" onclick="event.stopPropagation(); deleteBoard(this)" style="display: ${isAdmin ? 'block' : 'none'};">X</button>
            <div class="board-content">
                <div class="theme-display">랜덤 그룹</div>
                <ul class="members-list" style="display: none;"></ul>
            </div>
        `;
        container.insertBefore(newBoard, container.querySelector('.add-board'));
        saveBoards();
    }
}

function deleteBoard(button) {
    if (confirm('정말 삭제하시겠습니까?')) {
        const board = button.parentElement;
        board.remove();
        saveBoards();
    }
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
            photoItem.innerHTML = `
                <img src="${photo.src}" alt="photo">
                <button class="remove-photo" onclick="removeModalPhoto(this)">X</button>
            `;
            document.getElementById('modal-photos-list').appendChild(photoItem);
        }
    }
    
    document.getElementById('modal').style.display = "block";
}

function openSpecialBoardModal(board) {
    currentBoard = board;
    document.getElementById('modal-theme').value = "랜덤 그룹";
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

    document.getElementById('modal').style.display = "block";
}

function closeModal() {
    document.getElementById('modal').style.display = "none";
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
        photosDisplayList.style.display = 'none';  // 메인 화면에서는 숨김
        currentBoard.querySelector('.board-content').appendChild(photosDisplayList);
    }
    photosDisplayList.innerHTML = '';
    const photoUrls = [];
    for (const photoItem of photosList.children) {
        const photoDisplay = document.createElement('img');
        const src = photoItem.querySelector('img').src;
        photoDisplay.src = src;
        photosDisplayList.appendChild(photoDisplay);
        photoUrls.push(src);  // Save each photo URL to an array
    }

    updateBoardStyle(currentBoard);

    // 현재 보드 데이터를 업데이트
    const boards = JSON.parse(localStorage.getItem('kanbanBoards')) || [];
    const boardData = {
        theme,
        place,
        date,
        people,
        members: Array.from(membersList.children).map(member => member.querySelector('input').value),
        photos: photoUrls,  // Include photo URLs
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

    // 모달 창 닫기
    closeModal();
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

function removeModalPhoto(button) {
    button.parentElement.remove();
}

document.getElementById('modal-photo-input').addEventListener('change', function(event) {
    const files = event.target.files;
    const photosList = document.getElementById('modal-photos-list');

    for (const file of files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `
                <img src="${e.target.result}" alt="photo">
                <button class="remove-photo" onclick="removeModalPhoto(this)">X</button>
            `;
            photosList.appendChild(photoItem);
        }
        reader.readAsDataURL(file);
    }
});

function saveBoards() {
    const boards = [];
    document.querySelectorAll('.kanban-board').forEach(board => {
        const isSpecial = board.classList.contains('special-board');
        const theme = board.querySelector('.theme-display').innerText;
        const place = board.querySelector('.place-display') ? board.querySelector('.place-display').innerText.replace('장소: ', '') : '';
        const date = board.querySelector('.date-display') ? board.querySelector('.date-display').innerText.replace('예상 일정: ', '') : '';
        const people = board.querySelector('.people-display') ? board.querySelector('.people-display').dataset.value : '';
        const members = Array.from(board.querySelectorAll('.members-list .member-display')).map(member => member.innerText);
        const photos = Array.from(board.querySelectorAll('.photos-list img')).map(photo => photo.src);

        boards.push({ theme, place, date, people, members, photos, isSpecial });
    });

    try {
        localStorage.setItem('kanbanBoards', JSON.stringify(boards));
        console.log('Boards saved:', boards);
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

function loadBoards() {
    const boards = JSON.parse(localStorage.getItem('kanbanBoards')) || [];

    boards.forEach(boardData => {
        const container = document.querySelector('.kanban-board-container');
        const newBoard = document.createElement('div');
        newBoard.className = `kanban-board${boardData.isSpecial ? ' special-board' : ''}`;
        newBoard.onclick = boardData.isSpecial ? () => openSpecialBoardModal(newBoard) : () => openModal(newBoard);
        newBoard.innerHTML = `
            <button class="delete-board" onclick="event.stopPropagation(); deleteBoard(this)" style="display: none;">X</button>
            <div class="board-content">
                <div class="board-placeholder" style="display: none;">클릭하여 내용을 추가하세요</div>
                <div class="theme-display">${boardData.theme}</div>
                <div class="place-display" style="display: ${boardData.place ? 'block' : 'none'};">장소: ${boardData.place}</div>
                <div class="date-display" style="display: ${boardData.date ? 'block' : 'none'};">예상 일정: ${boardData.date}</div>
                <div class="people-display" data-value="${boardData.people}" style="display: ${boardData.people ? 'block' : 'none'};">신청가능인원: ${boardData.people}</div>
                <ul class="members-list">
                    ${boardData.members.map(member => `<li class="member-display">${member}</li>`).join('')}
                </ul>
                <div class="photos-list" style="display: none;">
                    ${boardData.photos.map(photo => `<img src="${photo}" alt="photo">`).join('')}
                </div>
            </div>
        `;
        if (!boardData.isSpecial) {
            newBoard.onmouseover = () => newBoard.querySelector('.delete-board').style.display = 'block';
            newBoard.onmouseout = () => newBoard.querySelector('.delete-board').style.display = 'none';
        }
        container.insertBefore(newBoard, container.querySelector('.add-board'));
        updateBoardStyle(newBoard);
    });

    console.log('Boards loaded:', boards);
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

function deleteAllBoards() {
    if (isAdmin) {
        if (confirm('정말 모든 칸반을 삭제하시겠습니까?')) {
            const boards = document.querySelectorAll('.kanban-board');
            boards.forEach(board => board.remove());
            localStorage.removeItem('kanbanBoards'); // 로컬 스토리지에서 삭제
        }
    }
}

function openBannerModal() {
    if (isAdmin) {
        document.getElementById('banner-modal').style.display = 'block';
    }
}

function closeBannerModal() {
    document.getElementById('banner-modal').style.display = 'none';
}

function addBannerImage() {
    const bannerImageInput = document.getElementById('banner-image');
    const bannerImagesContainer = document.getElementById('banner-images');
    const banner = document.getElementById('banner');

    if (bannerImageInput.files && bannerImageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '200px';
            img.style.maxHeight = '200px';
            img.style.margin = '5px';
            img.onclick = () => removeBannerImage(img);
            bannerImagesContainer.appendChild(img);
            
            // 배너에 추가
            const bannerImg = document.createElement('img');
            bannerImg.src = e.target.result;
            bannerImg.style.maxWidth = '200px';
            bannerImg.style.maxHeight = '200px';
            bannerImg.style.margin = '5px';
            bannerImg.onclick = () => showBannerPopup(e.target.result);
            banner.appendChild(bannerImg);

            // 로컬 스토리지에 저장
            saveBannerImages();
        }
        reader.readAsDataURL(bannerImageInput.files[0]);
    }
}

function removeBannerImage(img) {
    img.remove();
    saveBannerImages();
}

function deleteAllBannerImages() {
    if (isAdmin && confirm('정말 모든 배너 이미지를 삭제하시겠습니까?')) {
        const banner = document.getElementById('banner');
        banner.innerHTML = '';
        saveBannerImages();
    }
}

function saveBannerImages() {
    const bannerImages = document.querySelectorAll('#banner img');
    const bannerImageSrcs = Array.from(bannerImages).map(img => img.src);
    localStorage.setItem('bannerImages', JSON.stringify(bannerImageSrcs));
}

function loadBannerImages() {
    const bannerImageSrcs = JSON.parse(localStorage.getItem('bannerImages')) || [];
    const banner = document.getElementById('banner');
    banner.innerHTML = ''; // Clear existing images to avoid duplicates
    bannerImageSrcs.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.style.maxWidth = '200px'; /* 원하는 크기로 변경 */
        img.style.maxHeight = '200px'; /* 원하는 크기로 변경 */
        img.style.margin = '5px';
        img.onclick = () => showBannerPopup(src);
        banner.appendChild(img);
    });
}

function showBannerPopup(src) {
    const popup = document.createElement('div');
    popup.className = 'banner-popup';
    popup.style.position = 'fixed';
    popup.style.top = '0';
    popup.style.left = '0';
    popup.style.width = '100%';
    popup.style.height = '100%';
    popup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    popup.style.display = 'flex';
    popup.style.justifyContent = 'center';
    popup.style.alignItems = 'center';
    popup.onclick = () => popup.remove();

    const img = document.createElement('img');
    img.src = src;
    img.style.maxWidth = '80%';
    img.style.maxHeight = '80%';
    img.style.boxShadow = '0 0 10px white';

    popup.appendChild(img);
    document.body.appendChild(popup);
}

// 초기 로드 시 배너 이미지 로드
loadBannerImages();