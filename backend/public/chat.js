// chat.js - Doppelganger AI Assistant Floating Widget

(function () {
  let chatHistory = [];

  function createChatWidget() {
    if (document.getElementById('aiChatWidget')) return;

    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'aiChatWidget';
    widgetContainer.className = 'ai-chat-widget';

    widgetContainer.innerHTML = `
      <!-- Floating Toggle Trigger -->
      <button id="aiChatToggleBtn" class="ai-chat-toggle-btn" type="button" aria-label="Open AI Assistant">
        <div class="ai-btn-logo">
          <img src="logo-dark.png" alt="AI Logo" class="logo-dark" width="28" height="28" />
          <img src="logo-light.png" alt="AI Logo" class="logo-light" width="28" height="28" />
        </div>
        <span class="ai-badge">AI Assistant</span>
      </button>

      <!-- Expandable Chat Panel -->
      <div id="aiChatPanel" class="ai-chat-panel spotlight-card" style="display: none;">
        <div class="ai-chat-header">
          <div class="ai-header-title">
            <div class="ai-logo-icon">
              <img src="logo-dark.png" alt="Doppelganger AI Logo" class="logo-dark" width="36" height="36" />
              <img src="logo-light.png" alt="Doppelganger AI Logo" class="logo-light" width="36" height="36" />
            </div>
            <div>
              <h3 style="font-size: 15px; font-weight: 700; margin: 0; color: var(--text-main);">Doppelganger AI</h3>
              <div class="ai-status-indicator">
                <span class="ai-status-dot"></span> Online • Platform & Science Guide
              </div>
            </div>
          </div>
          <div class="ai-header-actions">
            <button id="aiToggleSizeBtn" class="ai-icon-btn" type="button" title="Toggle Compact Mode" aria-label="Toggle Sizing">
              <svg class="ai-icon-shrink" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"></path>
              </svg>
              <svg class="ai-icon-expand" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
              </svg>
            </button>
            <button id="aiResetBtn" class="ai-icon-btn" type="button" title="Clear Chat History" aria-label="Reset Chat">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
            </button>
            <button id="aiChatCloseBtn" class="ai-close-btn" type="button" aria-label="Close Assistant">&times;</button>
          </div>
        </div>

        <div id="aiChatFeed" class="ai-chat-feed">
          <div class="ai-msg assistant">
            <div class="ai-avatar">
              <img src="logo-dark.webp" alt="AI Avatar" class="logo-dark" width="26" height="26" />
              <img src="logo-light.webp" alt="AI Avatar" class="logo-light" width="26" height="26" />
            </div>
            <div class="ai-msg-body">
              👋 Welcome! I am your <strong>Doppelganger AI Assistant</strong>.<br/><br/>
              Ask me anything about uploading portraits, setting bounty rewards, finding look-alikes, or exploring the science & history of twin strangers!
            </div>
          </div>

          <div class="ai-suggestions-title">Quick Questions</div>
          <div class="ai-suggestions" id="aiSuggestions">
            <button type="button" class="ai-chip" data-prompt="How do I upload my photo and set a bounty reward?">
              <span>📸</span> How to upload photo & set bounty?
            </button>
            <button type="button" class="ai-chip" data-prompt="How are look-alike bounties verified and claimed?">
              <span>💰</span> How to claim look-alike rewards?
            </button>
            <button type="button" class="ai-chip" data-prompt="What is the scientific explanation for non-related twin strangers and DNA?">
              <span>🧬</span> What causes twin strangers & DNA matches?
            </button>
            <button type="button" class="ai-chip" data-prompt="Tell me famous historical stories of doppelgängers and folklore myths.">
              <span>📜</span> Famous historical doppelgänger stories
            </button>
          </div>
        </div>

        <form id="aiChatForm" class="ai-chat-form">
          <input id="aiChatInput" type="text" placeholder="Ask about platform or doppelgangers..." autocomplete="off" required />
          <button type="submit" id="aiChatSendBtn" class="ai-send-btn" aria-label="Send message">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(widgetContainer);

    const toggleBtn = document.getElementById('aiChatToggleBtn');
    const closeBtn = document.getElementById('aiChatCloseBtn');
    const resetBtn = document.getElementById('aiResetBtn');
    const toggleSizeBtn = document.getElementById('aiToggleSizeBtn');
    const chatPanel = document.getElementById('aiChatPanel');
    const chatForm = document.getElementById('aiChatForm');
    const chatInput = document.getElementById('aiChatInput');
    const sendBtn = document.getElementById('aiChatSendBtn');
    const chatFeed = document.getElementById('aiChatFeed');
    const suggestions = document.getElementById('aiSuggestions');

    // Sizing Preference
    if (localStorage.getItem('aiChatSizePreference') === 'small') {
      chatPanel.classList.add('ai-chat-small');
    }

    toggleBtn.addEventListener('click', () => {
      const isVisible = chatPanel.style.display !== 'none';
      chatPanel.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        chatInput.focus();
        scrollToBottom();
      }
    });

    toggleSizeBtn.addEventListener('click', () => {
      chatPanel.classList.toggle('ai-chat-small');
      const isSmall = chatPanel.classList.contains('ai-chat-small');
      localStorage.setItem('aiChatSizePreference', isSmall ? 'small' : 'normal');
      scrollToBottom();
    });

    closeBtn.addEventListener('click', () => {
      chatPanel.style.display = 'none';
    });

    resetBtn.addEventListener('click', () => {
      chatHistory = [];
      chatFeed.innerHTML = `
        <div class="ai-msg assistant">
          <div class="ai-avatar">
            <img src="logo-dark.png" alt="AI Avatar" class="logo-dark" width="26" height="26" />
            <img src="logo-light.png" alt="AI Avatar" class="logo-light" width="26" height="26" />
          </div>
          <div class="ai-msg-body">
            🔄 Conversation reset! Ask me anything about Doppelganger platform features, bounty rewards, or look-alike science.
          </div>
        </div>

        <div class="ai-suggestions-title">Quick Questions</div>
        <div class="ai-suggestions" id="aiSuggestions">
          <button type="button" class="ai-chip" data-prompt="How do I upload my photo and set a bounty reward?">
            <span>📸</span> How to upload photo & set bounty?
          </button>
          <button type="button" class="ai-chip" data-prompt="How are look-alike bounties verified and claimed?">
            <span>💰</span> How to claim look-alike rewards?
          </button>
          <button type="button" class="ai-chip" data-prompt="What is the scientific explanation for non-related twin strangers and DNA?">
            <span>🧬</span> What causes twin strangers & DNA matches?
          </button>
          <button type="button" class="ai-chip" data-prompt="Tell me famous historical stories of doppelgängers and folklore myths.">
            <span>📜</span> Famous historical doppelgänger stories
          </button>
        </div>
      `;
      bindSuggestions();
      scrollToBottom();
    });

    function bindSuggestions() {
      const currentSuggestions = document.getElementById('aiSuggestions');
      if (currentSuggestions) {
        currentSuggestions.addEventListener('click', (e) => {
          const chip = e.target.closest('.ai-chip');
          if (chip) {
            const prompt = chip.getAttribute('data-prompt');
            if (prompt) sendMessage(prompt);
          }
        });
      }
    }

    bindSuggestions();

    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = chatInput.value.trim();
      if (query) {
        sendMessage(query);
        chatInput.value = '';
      }
    });

    async function sendMessage(text) {
      appendMessage('user', text);
      chatHistory.push({ role: 'user', content: text });
      
      chatInput.disabled = true;
      sendBtn.disabled = true;

      const typingEl = appendTypingIndicator();
      scrollToBottom();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history: chatHistory })
        });

        const data = await res.json();
        typingEl.remove();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to get response');
        }

        appendMessage('assistant', data.reply);
        chatHistory.push({ role: 'assistant', content: data.reply });
      } catch (err) {
        if (typingEl) typingEl.remove();
        appendMessage('assistant', '⚠️ Assistant Error: ' + err.message);
      } finally {
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
        scrollToBottom();
      }
    }

    function appendMessage(sender, text) {
      const msgDiv = document.createElement('div');
      msgDiv.className = `ai-msg ${sender}`;

      const formattedHtml = formatMarkdown(text);

      if (sender === 'assistant') {
        msgDiv.innerHTML = `
          <div class="ai-avatar">
            <img src="logo-dark.png" alt="AI Avatar" class="logo-dark" width="26" height="26" />
            <img src="logo-light.png" alt="AI Avatar" class="logo-light" width="26" height="26" />
          </div>
          <div class="ai-msg-body">${formattedHtml}</div>`;
      } else {
        msgDiv.innerHTML = `<div class="ai-msg-body">${formattedHtml}</div>`;
      }

      chatFeed.appendChild(msgDiv);
      scrollToBottom();
    }

    function appendTypingIndicator() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'ai-msg assistant typing';
      typingDiv.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
      chatFeed.appendChild(typingDiv);
      return typingDiv;
    }

    function scrollToBottom() {
      setTimeout(() => {
        chatFeed.scrollTo({
          top: chatFeed.scrollHeight,
          behavior: 'smooth'
        });
      }, 50);
    }

    function formatMarkdown(text) {
      if (!text) return '';
      let str = escapeHtml(text);

      // Code blocks `code`
      str = str.replace(/`([^`]+)`/g, '<code>$1</code>');

      // Bold text **bold**
      str = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // Headings ### Title
      str = str.replace(/^### (.*$)/gim, '<strong style="display:block; font-size:15px; margin-top:6px; color:var(--text-main);">$1</strong>');
      str = str.replace(/^## (.*$)/gim, '<strong style="display:block; font-size:16px; margin-top:8px; color:var(--text-main);">$1</strong>');

      // Bullet items starting with - or *
      let lines = str.split('\n');
      let inList = false;
      let resultLines = [];

      for (let line of lines) {
        let trimmed = line.trim();
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          if (!inList) {
            inList = true;
            resultLines.push('<ul>');
          }
          resultLines.push(`<li>${trimmed.substring(2)}</li>`);
        } else if (/^\d+\.\s/.test(trimmed)) {
          if (!inList) {
            inList = true;
            resultLines.push('<ol>');
          }
          resultLines.push(`<li>${trimmed.replace(/^\d+\.\s/, '')}</li>`);
        } else {
          if (inList) {
            inList = false;
            resultLines.push('</ul>');
          }
          resultLines.push(line);
        }
      }
      if (inList) resultLines.push('</ul>');

      str = resultLines.join('\n');

      // Paragraph / line break formatting
      str = str.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');

      // URLs to clickable links
      str = str.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');

      return str;
    }

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[m]));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createChatWidget);
  } else {
    createChatWidget();
  }
})();

