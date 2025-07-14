// 스트리머 닉네임을 기반으로 메모를 저장할 객체
let streamerMemos = {};

// 스트리머 닉네임이 있는 요소의 클래스 이름
const NICKNAME_SELECTOR = '.name_text__yQG50';

// 저장소에서 메모를 불러와 화면에 적용하는 메인 함수
async function main() {
  const result = await browser.storage.local.get('streamerMemos');
  streamerMemos = result.streamerMemos || {};
  
  // 페이지의 모든 방송 목록 아이템을 대상으로 함수 실행
  document.querySelectorAll('li').forEach(applyMemoToStreamer);
}

// 각 방송 아이템에 메모를 적용하는 함수
function applyMemoToStreamer(streamerNode) {
  const nicknameElement = streamerNode.querySelector(NICKNAME_SELECTOR);

  if (!nicknameElement || streamerNode.querySelector('.streamer-memo-container')) {
    return;
  }

  const streamerName = nicknameElement.textContent.trim();
  if (!streamerName) return;

  const memoContainer = document.createElement('span');
  memoContainer.className = 'streamer-memo-container';

  const memoSpan = document.createElement('span');
  memoSpan.className = 'streamer-memo';
  memoSpan.textContent = streamerMemos[streamerName] || '[메모]';
  memoSpan.title = '클릭해서 메모 수정';

  memoContainer.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (memoContainer.querySelector('input')) return;

    const currentMemo = streamerMemos[streamerName] || '';
    
    memoContainer.innerHTML = `<input type="text" value="${currentMemo}" class="memo-input" placeholder="메모를 입력해주세요..">`;
    const input = memoContainer.querySelector('input');
    input.focus();

    const saveAndRestore = async () => {
      await saveMemo(streamerName, input.value, memoContainer);
    };

    input.addEventListener('blur', saveAndRestore);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveAndRestore();
      }
    });
  });
  
  memoContainer.appendChild(memoSpan);
  nicknameElement.insertAdjacentElement('afterend', memoContainer);
}

// 메모를 저장하고 UI를 업데이트하는 함수
async function saveMemo(streamerName, newMemo, container) {
  if (newMemo.trim()) {
    streamerMemos[streamerName] = newMemo.trim();
  } else {
    delete streamerMemos[streamerName];
  }

  await browser.storage.local.set({ streamerMemos });

  // UI를 다시 텍스트 형태로 복원
  const memoSpan = document.createElement('span');
  memoSpan.className = 'streamer-memo';
  memoSpan.textContent = streamerMemos[streamerName] || '[메모]';
  memoSpan.title = '클릭해서 메모 수정';
  
  container.innerHTML = '';
  container.appendChild(memoSpan);
}

// 페이지에 새로운 방송 목록이 추가되는 것을 감지하여 자동으로 메모 적용
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          if (node.matches('li')) {
            applyMemoToStreamer(node);
          }
          node.querySelectorAll('li').forEach(applyMemoToStreamer);
        }
      }
    }
  }
});

// body 전체의 변화를 감시 시작
observer.observe(document.body, { childList: true, subtree: true });

// 스크립트 실행 시작
main();