document.addEventListener('DOMContentLoaded', loadBoards);
window.onbeforeunload = saveBoards;

let currentBoard = null;

function addBoard() {
    const container = document.querySelector('.kanban-board-container');
    const newBoard = document.createElement('div');
    newBoard.className = 'kanban-board';
    newBoard.onclick = () => openModal(newBoard);
    newBoard.innerHTML = `
        <button class="delete-board" onclick="event.stopPropagation(); deleteBoard(this)">X</button>
        <div class="board-content">
            <div class="board-placeholder">클릭하여 내용을 추가하세요</div>
            <div class="theme-display" style="display: none;"></div>
            <div class="place-display" style="display: none;"></div>
            <div class="date-display" style="display: none;"></div>
            <div class="people-display" style="display: none;"></div>
            <ul class="members-list" style="display: none;"></ul>
        </div>
    `;
    container.insertBefore(newBoard, container.querySelector('.add-board'));
    saveBoards();
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
    document.getElementById('modal-theme').value = board.querySelector('.theme-display').innerText || '';
    document.getElementById('modal-theme').placeholder = "예) 엔제리오";
    document.getElementById('modal-place').value = board.querySelector('.place-display').innerText.replace('장소: ', '') || '';
    document.getElementById('modal-place').placeholder = "예) 강남/키이스케이프 더오름";
    document.getElementById('modal-date').value = board.querySelector('.date-display').innerText.replace('예상 일정: ', '') || new Date().toISOString().split('T')[0];
    document.getElementById('modal-people').value = board.querySelector('.people-display').dataset.value || '4';

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
    const theme = document.getElementById('modal-theme').value;
    const place = document.getElementById('modal-place').value;
    const date = document.getElementById('modal-date').value;
    const people = document.getElementById('modal-people').value;
    const membersList = document.getElementById('modal-members-list');

    currentBoard.querySelector('.theme-display').innerText = theme;
    currentBoard.querySelector('.place-display').innerText = `장소: ${place}`;
    currentBoard.querySelector('.date-display').innerText = `예상 일정: ${date}`;
    currentBoard.querySelector('.people-display').innerText = `신청가능인원: ${people}`;
    currentBoard.querySelector('.people-display').dataset.value = people;

    const membersDisplayList = currentBoard.querySelector('.members-list');
    membersDisplayList.innerHTML = '';
    for (const memberInput of membersList.children) {
        const memberDisplay = document.createElement('li');
        memberDisplay.className = 'member-display';
        memberDisplay.innerText = memberInput.querySelector('input').value;
        membersDisplayList.appendChild(memberDisplay);
    }

    updateBoardStyle(currentBoard);

    saveBoards();

    closeModal();
}

function updateBoardStyle(board) {
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
    const peopleCount = parseInt(document.getElementById('modal-people').value);
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
        const theme = board.querySelector('.theme-display').innerText;
        const place = board.querySelector('.place-display').innerText.replace('장소: ', '');
        const date = board.querySelector('.date-display').innerText.replace('예상 일정: ', '');
        const people = board.querySelector('.people-display').dataset.value;
        const members = Array.from(board.querySelectorAll('.members-list .member-display')).map(member => member.innerText);

        boards.push({ theme, place, date, people, members });
    });

    localStorage.setItem('kanbanBoards', JSON.stringify(boards));
}

function loadBoards() {
    const boards = JSON.parse(localStorage.getItem('kanbanBoards')) || [];

    boards.forEach(boardData => {
        const container = document.querySelector('.kanban-board-container');
        const newBoard = document.createElement('div');
        newBoard.className = 'kanban-board';
        newBoard.onclick = () => openModal(newBoard);
        newBoard.innerHTML = `
            <button class="delete-board" onclick="event.stopPropagation(); deleteBoard(this)">X</button>
            <div class="board-content">
                <div class="board-placeholder">클릭하여 내용을 추가하세요</div>
                <div class="theme-display">${boardData.theme}</div>
                <div class="place-display">장소: ${boardData.place}</div>
                <div class="date-display">예상 일정: ${boardData.date}</div>
                <div class="people-display" data-value="${boardData.people}">신청가능인원: ${boardData.people}</div>
                <ul class="members-list">
                    ${boardData.members.map(member => `<li class="member-display">${member}</li>`).join('')}
                </ul>
            </div>
        `;

        container.insertBefore(newBoard, container.querySelector('.add-board'));
        updateBoardStyle(newBoard);
    });
}
