let syncScrollEnabled = true;

// URLをstorageから取得してiframeにセット
chrome.storage.local.get(['compareUrl1', 'compareUrl2'], (result) => {
  if (result.compareUrl1 && result.compareUrl2) {
    document.getElementById('iframe1').src = result.compareUrl1;
    document.getElementById('iframe2').src = result.compareUrl2;
  } else {
    alert('URLが設定されていません。拡張のポップアップから開いてください。');
  }
});

// 透過度コントロール
const opacitySlider = document.getElementById('opacity');
const opacityValue = document.getElementById('opacityValue');
const iframe2 = document.getElementById('iframe2');

opacitySlider.addEventListener('input', (e) => {
  const value = e.target.value;
  iframe2.style.opacity = value / 100;
  opacityValue.textContent = value + '%';
});

// ブレンドモード
document.getElementById('blendMode').addEventListener('change', (e) => {
  iframe2.style.mixBlendMode = e.target.value;
});

// X/Y オフセット
const offsetXSlider = document.getElementById('offsetX');
const offsetXValue = document.getElementById('offsetXValue');
const offsetYSlider = document.getElementById('offsetY');
const offsetYValue = document.getElementById('offsetYValue');

function updateTransform() {
  const x = offsetXSlider.value;
  const y = offsetYSlider.value;
  iframe2.style.transform = `translate(${x}px, ${y}px)`;
  offsetXValue.textContent = x;
  offsetYValue.textContent = y;
}

offsetXSlider.addEventListener('input', updateTransform);
offsetYSlider.addEventListener('input', updateTransform);

// iframe要素の取得
const iframe1 = document.getElementById('iframe1');

// スクロール同期トグル
const syncScrollBtn = document.getElementById('syncScroll');

syncScrollBtn.addEventListener('click', () => {
  syncScrollEnabled = !syncScrollEnabled;
  syncScrollBtn.textContent = syncScrollEnabled ? 'Sync Scroll: ON' : 'Sync Scroll: OFF';
  syncScrollBtn.style.background = syncScrollEnabled ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';
});

// スクロール同期（wheelイベント）
let scrollTimeout;
const container = document.getElementById('container');

container.addEventListener('wheel', (e) => {
  if (!syncScrollEnabled) return;
  
  e.preventDefault();
  
  const deltaX = e.deltaX;
  const deltaY = e.deltaY;
  
  // 両方のiframeにスクロールメッセージを送る
  sendScrollToIframe(iframe1, deltaX, deltaY);
  sendScrollToIframe(iframe2, deltaX, deltaY);
}, { passive: false });

function sendScrollToIframe(iframe, deltaX, deltaY) {
  try {
    // content scriptにメッセージを送る
    chrome.tabs.query({}, (tabs) => {
      // iframe内のタブを特定するのは難しいので、
      // 代わりにpostMessageを使う（content scriptが受け取る）
      iframe.contentWindow.postMessage({
        type: 'SCROLL_DELTA',
        deltaX: deltaX,
        deltaY: deltaY
      }, '*');
    });
  } catch (e) {
    // クロスオリジンの場合は失敗するが、content scriptが処理する
  }
}

// 初期状態設定
iframe2.style.opacity = 0.5;
iframe2.style.mixBlendMode = 'normal';

// キーボードショートカット
document.addEventListener('keydown', (e) => {
  // S キーでスクロール同期トグル
  if (e.code === 'KeyS' && !e.target.matches('input, select')) {
    e.preventDefault();
    syncScrollBtn.click();
  }
  
  // 矢印キーで微調整
  if (e.code.startsWith('Arrow') && !e.target.matches('input, select')) {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    
    if (e.code === 'ArrowLeft') {
      offsetXSlider.value = parseInt(offsetXSlider.value) - step;
    } else if (e.code === 'ArrowRight') {
      offsetXSlider.value = parseInt(offsetXSlider.value) + step;
    } else if (e.code === 'ArrowUp') {
      offsetYSlider.value = parseInt(offsetYSlider.value) - step;
    } else if (e.code === 'ArrowDown') {
      offsetYSlider.value = parseInt(offsetYSlider.value) + step;
    }
    updateTransform();
  }
});
