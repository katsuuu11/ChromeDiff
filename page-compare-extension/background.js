// Background service worker for Manifest V3

const DYNAMIC_RULE_ID = 1001;
const CONTENT_SCRIPT_ID = 'page-compare-content-script';

function toOriginMatchPattern(rawUrl) {
  const parsed = new URL(rawUrl);
  return `${parsed.origin}/*`;
}

function toRequestDomain(rawUrl) {
  const parsed = new URL(rawUrl);
  return parsed.hostname;
}

async function configureComparisonPermissions(url1, url2) {
  const originPatterns = Array.from(new Set([toOriginMatchPattern(url1), toOriginMatchPattern(url2)]));
  const requestDomains = Array.from(new Set([toRequestDomain(url1), toRequestDomain(url2)]));

  await chrome.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] }).catch(() => {});

  await chrome.scripting.registerContentScripts([
    {
      id: CONTENT_SCRIPT_ID,
      js: ['content.js'],
      matches: originPatterns,
      allFrames: true,
      runAt: 'document_start',
      persistAcrossSessions: false
    }
  ]);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [DYNAMIC_RULE_ID],
    addRules: [
      {
        id: DYNAMIC_RULE_ID,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          responseHeaders: [{ header: 'X-Frame-Options', operation: 'remove' }]
        },
        condition: {
          requestDomains,
          resourceTypes: ['sub_frame']
        }
      }
    ]
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'CONFIGURE_COMPARISON') {
    return;
  }

  (async () => {
    try {
      await configureComparisonPermissions(message.url1, message.url2);
      sendResponse({ ok: true });
    } catch (error) {
      console.error('Failed to configure comparison permissions', error);
      sendResponse({ ok: false, error: String(error) });
    }
  })();

  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Page Compare Extension installed');
});
