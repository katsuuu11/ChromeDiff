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
const blendToggleBtn = document.getElementById('blendToggle');
let blendMode = 'difference';

function updateBlendMode() {
  iframe2.style.mixBlendMode = blendMode;
  blendToggleBtn.textContent = blendMode === 'difference' ? 'Difference' : 'Normal';
}

blendToggleBtn.addEventListener('click', () => {
  blendMode = blendMode === 'difference' ? 'normal' : 'difference';
  updateBlendMode();
});

// X/Y オフセット
const offsetXSlider = document.getElementById('offsetX');
const offsetXValue = document.getElementById('offsetXValue');
const offsetYSlider = document.getElementById('offsetY');
const offsetYValue = document.getElementById('offsetYValue');
const offsetXDecBtn = document.getElementById('offsetXDec');
const offsetXIncBtn = document.getElementById('offsetXInc');
const offsetYDecBtn = document.getElementById('offsetYDec');
const offsetYIncBtn = document.getElementById('offsetYInc');

function updateTransform() {
  const x = offsetXSlider.value;
  const y = offsetYSlider.value;
  iframe2.style.transform = `translate(${x}px, ${y}px)`;
  offsetXValue.textContent = x;
  offsetYValue.textContent = y;
}

offsetXSlider.addEventListener('input', updateTransform);
offsetYSlider.addEventListener('input', updateTransform);

function clampOffset(value, slider) {
  const min = parseInt(slider.min, 10);
  const max = parseInt(slider.max, 10);
  return Math.max(min, Math.min(max, value));
}

function adjustOffset(slider, delta) {
  const nextValue = clampOffset(parseInt(slider.value, 10) + delta, slider);
  slider.value = nextValue;
  updateTransform();
}

offsetXDecBtn.addEventListener('click', () => adjustOffset(offsetXSlider, -1));
offsetXIncBtn.addEventListener('click', () => adjustOffset(offsetXSlider, 1));
offsetYDecBtn.addEventListener('click', () => adjustOffset(offsetYSlider, -1));
offsetYIncBtn.addEventListener('click', () => adjustOffset(offsetYSlider, 1));

// iframe要素の取得
const iframe1 = document.getElementById('iframe1');

function updateInteractionMode() {
  iframe2.style.pointerEvents = syncScrollEnabled ? 'none' : 'auto';
}

// スクロール同期トグル
const syncScrollBtn = document.getElementById('syncScroll');

syncScrollBtn.addEventListener('click', () => {
  syncScrollEnabled = !syncScrollEnabled;
  syncScrollBtn.textContent = syncScrollEnabled ? 'Fix: ON' : 'Fix: OFF';
  syncScrollBtn.style.background = syncScrollEnabled ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)';

  if (!syncScrollEnabled && scrollFrameId !== null) {
    cancelAnimationFrame(scrollFrameId);
    scrollFrameId = null;
    pendingDeltaX = 0;
    pendingDeltaY = 0;
  }

  updateInteractionMode();
});

// スクロール同期（wheelイベント）
const container = document.getElementById('container');
let pendingDeltaX = 0;
let pendingDeltaY = 0;
let scrollFrameId = null;

container.addEventListener('wheel', (e) => {
  if (!syncScrollEnabled) return;

  e.preventDefault();

  // スクロール量を捨てずに合算し、1フレームに1回だけ同期する
  pendingDeltaX += e.deltaX;
  pendingDeltaY += e.deltaY;

  if (scrollFrameId !== null) return;

  scrollFrameId = requestAnimationFrame(() => {
    const deltaX = pendingDeltaX;
    const deltaY = pendingDeltaY;

    pendingDeltaX = 0;
    pendingDeltaY = 0;
    scrollFrameId = null;

    if (!syncScrollEnabled) return;

    // 両方のiframeに同じスクロール量を送る
    sendScrollToIframe(iframe1, deltaX, deltaY);
    sendScrollToIframe(iframe2, deltaX, deltaY);
  });
}, { passive: false });

function sendScrollToIframe(iframe, deltaX, deltaY) {
  try {
    if (!iframe.contentWindow) return;

    iframe.contentWindow.postMessage({
      type: 'SCROLL_DELTA',
      deltaX: deltaX,
      deltaY: deltaY
    }, '*');
  } catch (e) {
    // クロスオリジンの場合は失敗するが、content scriptが処理する
  }
}

// 初期状態設定
iframe2.style.opacity = 0.5;
blendMode = 'difference';
updateBlendMode();

// キーボードショートカット
document.addEventListener('keydown', (e) => {
  // S キーでスクロール同期トグル
  if (e.code === 'KeyS' && !e.target.matches('input, select')) {
    e.preventDefault();
    syncScrollBtn.click();
  }
  
  // 矢印キーで微調整
  if (e.code.startsWith('Arrow') && !e.target.matches('input, select, button')) {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;

    if (e.code === 'ArrowLeft') {
      adjustOffset(offsetXSlider, -step);
    } else if (e.code === 'ArrowRight') {
      adjustOffset(offsetXSlider, step);
    } else if (e.code === 'ArrowUp') {
      adjustOffset(offsetYSlider, -step);
    } else if (e.code === 'ArrowDown') {
      adjustOffset(offsetYSlider, step);
    }
  }
});

updateInteractionMode();
