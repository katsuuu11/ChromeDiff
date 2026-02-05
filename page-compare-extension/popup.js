document.getElementById('openCompare').addEventListener('click', () => {
  const url1 = document.getElementById('url1').value.trim();
  const url2 = document.getElementById('url2').value.trim();
  
  if (!url1 || !url2) {
    alert('両方のURLを入力してください');
    return;
  }
  
  // URLの検証（簡易）
  try {
    new URL(url1);
    new URL(url2);
  } catch (e) {
    alert('有効なURLを入力してください（https://で始まる完全なURL）');
    return;
  }
  
  // URLをstorageに保存してから比較ページを開く
  chrome.storage.local.set({ 
    compareUrl1: url1, 
    compareUrl2: url2 
  }, () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('overlay.html')
    });
  });
});

// 前回の値を復元
chrome.storage.local.get(['compareUrl1', 'compareUrl2'], (result) => {
  if (result.compareUrl1) {
    document.getElementById('url1').value = result.compareUrl1;
  }
  if (result.compareUrl2) {
    document.getElementById('url2').value = result.compareUrl2;
  }
});
