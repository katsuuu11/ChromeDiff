// Background service worker for Manifest V3
// 今回は特に処理は不要だが、manifest.jsonで指定しているので空ファイルでも必要

chrome.runtime.onInstalled.addListener(() => {
  console.log('Page Compare Extension installed');
});

// 将来的に必要になる可能性のある処理：
// - タブ間の通信中継
// - ストレージの管理
// - 拡張アイコンのバッジ更新など
