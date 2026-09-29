// iframe内で動作するスクリプト
// overlay.jsからのpostMessageを受け取ってスクロールを実行

let pendingDeltaX = 0;
let pendingDeltaY = 0;
let scrollFrameId = null;

window.addEventListener('message', (event) => {
  // セキュリティチェック（拡張からのメッセージのみ受け入れ）
  if (event.data && event.data.type === 'SCROLL_DELTA') {
    pendingDeltaX += event.data.deltaX;
    pendingDeltaY += event.data.deltaY;

    if (scrollFrameId !== null) return;

    scrollFrameId = requestAnimationFrame(() => {
      const deltaX = pendingDeltaX;
      const deltaY = pendingDeltaY;

      pendingDeltaX = 0;
      pendingDeltaY = 0;
      scrollFrameId = null;

      window.scrollBy({
        left: deltaX,
        top: deltaY,
        // auto はページ側の scroll-behavior: smooth に従うため、
        // 比較用の同期スクロールは必ず即時反映する。
        behavior: 'instant'
      });
    });
  }
});

// 拡張が読み込まれたことを確認するためのログ（開発用、本番では削除可）
console.log('Page Compare Extension: Content script loaded');
