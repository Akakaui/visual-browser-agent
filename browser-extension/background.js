// Visual Browser Agent - Chrome Extension Bridge
// Connects to the local MCP server via WebSocket

const MCP_PORT = 9333;
let ws = null;
let connected = false;

function connectToAgent() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  ws = new WebSocket(`ws://localhost:${MCP_PORT}`);

  ws.onopen = () => {
    connected = true;
    console.log('[VBA] Connected to Visual Browser Agent');
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  };

  ws.onmessage = async (event) => {
    try {
      const request = JSON.parse(event.data);
      const response = await handleCommand(request);
      ws.send(JSON.stringify(response));
    } catch (e) {
      console.error('[VBA] Command error:', e);
    }
  };

  ws.onclose = () => {
    connected = false;
    chrome.action.setBadgeText({ text: '' });
    console.log('[VBA] Disconnected from agent');
    // Reconnect after 2 seconds
    setTimeout(connectToAgent, 2000);
  };

  ws.onerror = (err) => {
    console.error('[VBA] WebSocket error:', err);
  };
}

async function handleCommand(request) {
  const { id, method, params } = request;

  switch (method) {
    case 'browser_status': {
      const tabs = await chrome.tabs.query({});
      const active = tabs.find(t => t.active);
      return {
        id,
        result: {
          connected: true,
          mode: 'extension',
          activeTab: active ? { url: active.url, title: active.title } : undefined,
          tabCount: tabs.length
        }
      };
    }

    case 'navigate': {
      const tab = await getActiveTab();
      await chrome.tabs.update(tab.id, { url: params.url });
      return { id, result: { success: true, url: params.url } };
    }

    case 'inspect_page': {
      const tab = await getActiveTab();
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            url: location.href,
            title: document.title,
            bodyText: document.body?.innerText?.substring(0, 5000) || '',
            links: Array.from(document.querySelectorAll('a[href]')).slice(0, 50).map(a => ({
              text: a.textContent?.trim(),
              href: a.href
            })),
            images: Array.from(document.querySelectorAll('img')).slice(0, 20).map(img => ({
              src: img.src,
              alt: img.alt,
              width: img.width,
              height: img.height
            })),
            forms: Array.from(document.querySelectorAll('form')).map(f => ({
              action: f.action,
              method: f.method,
              inputs: Array.from(f.querySelectorAll('input,textarea,select')).map(i => ({
                type: i.type,
                name: i.name,
                placeholder: i.placeholder,
                value: i.value
              }))
            }))
          };
        }
      });
      return { id, result: results[0]?.result || {} };
    }

    case 'capture_screenshot': {
      const tab = await getActiveTab();
      const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
      return { id, result: { screenshot: dataUrl, tabId: tab.id } };
    }

    case 'click': {
      const tab = await getActiveTab();
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (selector) => {
          const el = document.querySelector(selector);
          if (el) el.click();
          return !!el;
        },
        args: [params.selector]
      });
      return { id, result: { success: true } };
    }

    case 'fill': {
      const tab = await getActiveTab();
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (selector, value) => {
          const el = document.querySelector(selector);
          if (el) {
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
          return !!el;
        },
        args: [params.selector, params.value]
      });
      return { id, result: { success: true } };
    }

    default:
      return { id, error: `Unknown method: ${method}` };
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Auto-connect on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('[VBA] Extension installed, connecting...');
  connectToAgent();
});

// Reconnect on browser start
chrome.runtime.onStartup.addListener(() => {
  connectToAgent();
});

// Try connecting immediately
connectToAgent();