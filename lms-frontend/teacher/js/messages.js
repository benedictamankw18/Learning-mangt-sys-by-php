/* ============================================
   Messages Management Page Logic
   Room-based chat experience (direct + group)
============================================ */
(function () {
  'use strict';

  const STATE = {
    currentUser: null,
    users: [],
    rooms: [],
    selectedRoom: null,
    messages: [],
    pendingAttachments: [],
    unreadCount: 0,
    roomFilter: 'all',
    search: '',
    selectedGroupMemberIds: new Set(),
    replyContext: null,
    editContext: null,
    loading: false,
    sending: false,
    pollTimerId: null,
    pollInFlight: false,
    pollEnabled: false,
    composeFilters: {
      classFilter: '',
      programFilter: '',
      role: '',
    },
  };

  const DOM = {};
  const STYLE_ID = 'admMessagesChatStyles';
  let activeAudioButton = null;
  let activeAudioTimeline = null;
  let sharedAudioPlayer = null;
  let actionDialogResolver = null;

  document.addEventListener('page:loaded', function (event) {
    if (event?.detail?.page === 'messages') {
      initIfVisible();
    }
  });

  document.addEventListener('DOMContentLoaded', bootIfVisible);
  window.addEventListener('hashchange', bootIfVisible);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      STATE.pollEnabled = false;
    } else {
      STATE.pollEnabled = true;
      if (STATE.pollTimerId !== null && !STATE.loading && !STATE.sending) {
        window.setTimeout(pollTick, 0);
      }
    }
  });
  bootIfVisible();
  scheduleBootRetries();

  function bootIfVisible() {
    const currentHash = String(window.location.hash || '').replace(/^#/, '').trim();
    if (currentHash === 'messages' || document.getElementById('admMessagesRoot')) {
      initIfVisible();
    } else {
      stopPolling();
    }
  }

  function scheduleBootRetries() {
    let attempts = 0;
    const maxAttempts = 30;

    function retry() {
      attempts += 1;

      const root = document.getElementById('admMessagesRoot');
      if (root && root.dataset.bound === '1') return;

      bootIfVisible();
      if (attempts < maxAttempts) {
        window.setTimeout(retry, 200);
      }
    }

    retry();
  }

  function initIfVisible() {
    const root = document.getElementById('admMessagesRoot');
    if (!root || root.dataset.bound === '1') return;
    if (typeof Auth !== 'undefined' && !Auth.requireAuth([USER_ROLES.TEACHER])) return;

    root.dataset.bound = '1';
    injectStyles();
    renderShell();
    cacheDom();
    bindEvents();
    loadData();
  }

  function stopPolling() {
    if (STATE.pollTimerId !== null) {
      window.clearInterval(STATE.pollTimerId);
      STATE.pollTimerId = null;
    }
    STATE.pollEnabled = false;
  }

  function startPolling() {
    stopPolling();
    STATE.pollEnabled = !document.hidden;
    STATE.pollTimerId = window.setInterval(pollTick, 3000);
  }

  async function pollTick() {
    if (STATE.pollInFlight || !STATE.pollEnabled || STATE.loading || STATE.sending) return;

    STATE.pollInFlight = true;
    try {
      const roomsResponse = await ChatAPI.getRooms().catch(function () { return null; });
      const newRooms = extractRooms(roomsResponse);
      const newUnreadCount = Number(roomsResponse?.data?.unread_count ?? roomsResponse?.unread_count ?? 0);

      const roomsChanged = JSON.stringify(STATE.rooms) !== JSON.stringify(newRooms) || STATE.unreadCount !== newUnreadCount;
      if (roomsChanged) {
        STATE.rooms = newRooms;
        STATE.unreadCount = newUnreadCount;

        const selectedUuid = String(STATE.selectedRoom?.uuid || '');
        const updatedRoom = STATE.rooms.find(function (room) {
          return String(room?.uuid || '') === selectedUuid;
        }) || null;
        if (updatedRoom) {
          STATE.selectedRoom = updatedRoom;
        }

        updateStats();
        renderRooms();
        if (STATE.selectedRoom?.uuid) {
          renderThreadHeader(STATE.selectedRoom);
        }
      }

      if (STATE.selectedRoom?.uuid) {
        const messagesResponse = await ChatAPI.getMessages(STATE.selectedRoom.uuid, { limit: 100 }).catch(function () { return null; });
        const newMessages = extractMessages(messagesResponse);
        const messagesChanged = JSON.stringify(STATE.messages) !== JSON.stringify(newMessages);
        if (messagesChanged) {
          STATE.messages = newMessages;
          renderMessages();
        }
      }
    } catch (error) {
      console.warn('Poll tick error:', error);
    } finally {
      STATE.pollInFlight = false;
    }
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .messages-page-shell { display: grid; gap: 1rem; }
      .messages-topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
      .messages-topbar h2 { margin: 0; font-size: 1.45rem; color: #0f172a; }
      .messages-topbar p { margin: 0.2rem 0 0; color: #64748b; font-size: 0.88rem; }
      .messages-top-actions { display: flex; gap: .5rem; flex-wrap: wrap; }
      .messages-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
      @media (max-width: 1024px) { .messages-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 640px) { .messages-stats { grid-template-columns: 1fr; } }
      .messages-stat-card, .messages-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 3px rgba(15,23,42,.06); }
      .messages-stat-card { display: flex; align-items: center; gap: .85rem; padding: 1rem 1.1rem; }
      .messages-stat-icon { width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; color: #fff; flex-shrink: 0; }
      .messages-stat-info h3 { margin: 0; font-size: 1.45rem; color: #0f172a; }
      .messages-stat-info p { margin: .15rem 0 0; color: #64748b; font-size: .78rem; }
      .messages-workbench { display: grid; grid-template-columns: 380px minmax(0, 1fr); gap: 1rem; min-height: 72vh; }
      @media (max-width: 1180px) { .messages-workbench { grid-template-columns: 1fr; } }
      .messages-panel-head { padding: 1rem; border-bottom: 1px solid #eef2f7; background: linear-gradient(180deg,#f8fafc,#fff); }
      .messages-panel-head h3 { margin: 0; font-size: 1rem; color: #0f172a; }
      .messages-panel-head p { margin: .2rem 0 0; color: #64748b; font-size: .8rem; }
      .messages-toolbar { display: flex; gap: .5rem; flex-wrap: wrap; margin-top: .85rem; }
      .messages-search, .messages-select, .messages-input, .messages-textarea { width: 100%; border: 1px solid #dbe3ea; border-radius: 10px; background: #fff; color: #0f172a; outline: none; box-sizing: border-box; }
      .messages-search, .messages-select { padding: .58rem .75rem; font-size: .875rem; }
      .messages-search:focus, .messages-select:focus, .messages-input:focus, .messages-textarea:focus { border-color: #006a3f; box-shadow: 0 0 0 3px rgba(0,106,63,.08); }
      .messages-room-list { height: 58vh; overflow: auto; }
      .messages-room-item { display: flex; gap: .85rem; align-items: flex-start; padding: 1rem; border-bottom: 1px solid #eef2f7; cursor: pointer; transition: background .15s ease; }
      .messages-room-item:hover { background: #f8fafc; }
      .messages-room-item.active { background: #f0fdf4; }
      .messages-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg,#0f766e,#006a3f); color: #fff; display: grid; place-items: center; flex-shrink: 0; font-weight: 700; overflow: hidden; }
      .messages-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .messages-room-main { min-width: 0; flex: 1; }
      .messages-room-top { display:flex; justify-content:space-between; gap:.5rem; }
      .messages-room-title { margin:0; font-weight:700; color:#0f172a; font-size:.93rem; }
      .messages-room-meta { margin:.2rem 0 0; color:#64748b; font-size:.8rem; }
      .messages-room-preview { margin:.25rem 0 0; color:#334155; font-size:.84rem; line-height:1.45; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .messages-badge { background:#dcfce7; color:#166534; padding:.2rem .55rem; border-radius:999px; font-size:.72rem; font-weight:700; }
      .messages-badge.unread { background:#dbeafe; color:#1d4ed8; }
      .messages-thread { display:grid; grid-template-rows:auto auto 1fr auto; min-height:72vh; }
      .messages-thread-header { padding:1rem; border-bottom:1px solid #eef2f7; display:flex; justify-content:space-between; gap:1rem; align-items:flex-start; flex-wrap:wrap; }
      .messages-thread-header h3 { margin:0; font-size:1rem; color:#0f172a; }
      .messages-thread-header p { margin:.2rem 0 0; color:#64748b; font-size:.8rem; }
      .messages-thread-actions { display:flex; gap:.45rem; flex-wrap:wrap; position: relative; }
      .messages-load-more-btn { display: none; position: absolute; top: .7rem; margin-left: auto; margin-right: 1rem; width: 50px; height: 50px; text-align: center; align-items: center; justify-content: center; border: 1px solid #dbe3ea; border-radius: 50px; z-index: 66; }
      // .messages-message-list {  }
      .messages-message-viewer { padding:1rem; overflow:auto; background: linear-gradient(180deg,#f8fafc,#fff); height: 58vh; }
      .messages-message-item { max-width:min(720px, 92%); border-radius:16px; padding:.85rem 1rem; margin-bottom:.75rem; border:1px solid #e2e8f0; background:#fff; }
      .messages-message-item.outbound { margin-left:auto; background:#f0fdf4; border-color:rgba(0,106,63,.18); }
      .messages-message-item.inbound { margin-right:auto; }
      .messages-message-head { display:flex; justify-content:space-between; gap:1rem; margin-bottom:.35rem; }
      .messages-message-head strong { color:#0f172a; font-size:.88rem; }
      .messages-message-meta { display:inline-flex; align-items:center; gap:.35rem; }
      .messages-edit-status { font-size:.7rem; font-weight:700; padding:.16rem .42rem; border-radius:999px; text-transform:uppercase; letter-spacing:.02em; }
      .messages-edit-status.sent { background:#e2e8f0; color:#334155; }
      .messages-edit-status.edited { background:#fef3c7; color:#92400e; }
      .messages-reply-preview { margin: 0 0 .45rem; padding: .5rem .65rem; border-left: 3px solid #94a3b8; border-radius: 10px; background: #f8fafc; color:#475569; font-size:.8rem; line-height:1.45; }
      .messages-reply-preview.clickable { cursor: pointer; }
      .messages-reply-preview.clickable:hover { background:#f1f5f9; border-left-color:#64748b; }
      .messages-reply-preview strong { display:block; color:#334155; font-size:.76rem; font-weight:700; margin-bottom:.15rem; text-transform: uppercase; letter-spacing: .02em; }
      .messages-reply-preview span { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .messages-message-body { color:#334155; white-space:pre-wrap; line-height:1.55; font-size:.92rem; overflow-wrap: break-word; }
      .messages-message-item.reply-target-highlight { box-shadow: 0 0 0 3px rgba(2,132,199,.24); border-color: rgba(2,132,199,.55); transition: box-shadow .2s ease, border-color .2s ease; }
      .messages-unread-divider { display:flex; align-items:center; gap:.65rem; margin:.35rem 0 .8rem; }
      .messages-unread-divider::before,
      .messages-unread-divider::after { content:''; height:1px; background:#cbd5e1; flex:1; }
      .messages-unread-badge { background:#dbeafe; color:#1d4ed8; font-size:.72rem; font-weight:700; border-radius:999px; padding:.2rem .55rem; white-space:nowrap; }
      .messages-message-actions { display:flex; align-items:center; justify-content:flex-end; gap:.25rem; margin-top:.55rem; }
      .messages-msg-action-btn { border:1px solid #dbe3ea; background:#fff; color:#475569; width:28px; height:28px; border-radius:8px; cursor:pointer; display:grid; place-items:center; }
      .messages-msg-action-btn:hover { background:#f8fafc; color:#0f172a; }
      .messages-message-item.outbound .messages-msg-action-btn { background:#f0fdf4; }
      .messages-empty, .messages-thread-empty { padding: 2rem 1rem; text-align:center; color:#64748b; align-self: center; display: flex; flex-direction: column; align-items: center; gap: .75rem; justify-content: center; height: 100%; }
      .messages-empty i, .messages-thread-empty i { font-size: 3rem; }
      .messages-composer { display: grid; border-top: 1px solid #eef2f7; padding: 1rem; grid-template-columns: minmax(auto, 2.5fr) minmax(0, 0.5fr); background: #fff; grid-auto-flow: column; align-content: center; column-gap: 10px;}
      .messages-actions-row { display:flex; justify-content:flex-end; gap:.5rem; flex-wrap:wrap; margin-top:.85rem; }
      .messages-actions-chat-button  { display: flex; justify-content: flex-end; gap: .5rem; flex-wrap: nowrap; margin-top: .85rem; align-items: flex-end;}
      .messages-reply-composer { display:flex; align-items:flex-start; justify-content:space-between; gap:.6rem; padding:.55rem .65rem; border-left:3px solid #006a3f; border-radius:10px; background:#f0fdf4; margin-bottom:.65rem; }
      .messages-reply-composer strong { display:block; font-size:.75rem; color:#166534; text-transform:uppercase; letter-spacing:.02em; margin-bottom:.12rem; }
      .messages-reply-composer p { margin:0; color:#14532d; font-size:.82rem; line-height:1.4; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .messages-reply-clear { border:1px solid #bbf7d0; background:#fff; color:#166534; width:26px; height:26px; border-radius:8px; cursor:pointer; flex-shrink:0; }
      .messages-reply-clear:hover { background:#dcfce7; }
      .messages-edit-composer { display:flex; align-items:flex-start; justify-content:space-between; gap:.6rem; padding:.55rem .65rem; border-left:3px solid #f59e0b; border-radius:10px; background:#fffbeb; margin-bottom:.65rem; }
      .messages-edit-composer strong { display:block; font-size:.75rem; color:#92400e; text-transform:uppercase; letter-spacing:.02em; margin-bottom:.12rem; }
      .messages-edit-composer p { margin:0; color:#78350f; font-size:.82rem; line-height:1.4; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .messages-edit-clear { border:1px solid #fde68a; background:#fff; color:#92400e; width:26px; height:26px; border-radius:8px; cursor:pointer; flex-shrink:0; }
      .messages-edit-clear:hover { background:#fef3c7; }
      .messages-attachment-note { display:flex; align-items:center; justify-content:space-between; gap:.75rem; padding:.75rem .85rem; border:2px dashed #dbe3ea; border-radius:12px; background:#f8fafc; color:#475569; font-size:.83rem; margin-bottom: .75rem; }
      .messages-attachment-note strong { color:#0f172a; }
      .messages-attachment-preview { display:grid; gap:.5rem; margin-bottom:.75rem; }
      .messages-attachment-preview-item { display:flex; align-items:center; gap:.7rem; padding:.6rem .7rem; border:1px solid #dbe3ea; border-radius:12px; background:#fff; }
      .messages-attachment-preview-thumb { width:42px; height:42px; border-radius:10px; background:#f1f5f9; overflow:hidden; flex-shrink:0; display:grid; place-items:center; color:#64748b; font-size:1rem; }
      .messages-attachment-preview-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
      .messages-attachment-preview-thumb button { width:100%; height:100%; border:none; background:transparent; color:#0f172a; cursor:pointer; display:grid; place-items:center; }
      .messages-attachment-preview-thumb button:hover { background: rgba(0,0,0,.04); }
      .messages-attachment-preview-body { min-width:0; flex:1; }
      .messages-attachment-preview-body strong { display:block; color:#0f172a; font-size:.88rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .messages-attachment-preview-meta { color:#64748b; font-size:.74rem; margin-top:.15rem; }
      .messages-attachment-list { display:grid; gap:.4rem; margin-top:.55rem; overflow: auto;}
      .messages-attachment-item { display:flex; align-items:center; gap:.5rem; padding:.55rem .7rem; border:1px solid #dbe3ea; border-radius:10px; background:#f8fafc; color:#334155; }
      .messages-attachment-item i { color:#006a3f; }
      .messages-attachment-item a { color:#0f172a; text-decoration:none; font-weight:600; }
      .messages-attachment-item a:hover { text-decoration:underline; }
      .messages-attachment-clickable { cursor: pointer; }
      .messages-message-attachment-preview { width: 44px; height: 44px; border-radius: 10px; overflow: hidden; background: #eef2f7; display: grid; place-items: center; color: #64748b; margin-bottom: .45rem; }
      .messages-message-attachment-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .messages-message-attachment-preview button { width: 100%; height: 100%; border: none; background: transparent; color: #0f172a; cursor: pointer; display: grid; place-items: center; }
      .messages-message-attachment-preview button:hover { background: rgba(0,0,0,.04); }
      .messages-message-attachment-preview .messages-audio-play { font-size: 1.1rem; }
      .messages-audio-timeline { display:grid; grid-template-columns:auto 1fr auto; gap:.45rem; align-items:center; margin-top:.35rem; }
      .messages-audio-range { width:100%; accent-color:#006a3f; }
      .messages-audio-current, .messages-audio-duration { font-size:.72rem; color:#64748b; min-width:36px; text-align:center; }
      .messages-attachment-meta { color:#64748b; font-size:.75rem; }
      .messages-modal { position: fixed; inset: 0; background: rgba(15,23,42,.56); display:none; align-items:center; justify-content:center; z-index:9999; padding:1rem; }
      .messages-modal.open { display:flex; }
      .messages-modal-card { width:min(820px,100%); max-height:92vh; overflow:auto; background:#fff; border-radius:18px; border:1px solid #e2e8f0; box-shadow:0 20px 60px rgba(15,23,42,.25); }
      .messages-modal-head { padding:1rem; border-bottom:1px solid #eef2f7; display:flex; justify-content:space-between; gap:1rem; align-items:flex-start; }
      .messages-modal-head h3 { margin:0; color:#0f172a; }
      .messages-modal-head p { margin:.2rem 0 0; color:#64748b; font-size:.8rem; }
      .messages-modal-body { padding:1rem; display:grid; gap:1rem; }
      .messages-modal-tabs { display:flex; gap:.45rem; flex-wrap:wrap; }
      .messages-tab { border:1px solid #dbe3ea; background:#fff; color:#334155; border-radius:999px; padding:.42rem .8rem; cursor:pointer; font-size:.82rem; font-weight:700; }
      .messages-tab.active { background:#006a3f; border-color:#006a3f; color:#fff; }
      .messages-user-grid { display:block; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:.65rem; max-height: 240px; overflow:auto; padding-right:.25rem; }
      @media (max-width: 720px) { .messages-user-grid { grid-template-columns: 1fr; } }
      .messages-user-chip { display:flex; align-items:center; gap:.55rem; padding:.65rem .75rem; border:1px solid #e2e8f0; border-radius:12px; cursor:pointer; }
      .messages-user-chip.selected { border-color:#006a3f; background:#f0fdf4; }
      .messages-user-chip input { margin:0; }
      .messages-user-chip small { color:#64748b; display:block; }
      .messages-note { border-radius:12px; border:1px dashed #cbd5e1; background:#f8fafc; color:#475569; padding:.8rem .9rem; font-size:.83rem; }
      .messages-hidden { display:none !important; }
      .messages-hambger-three-dot{ position: relative; padding: .25rem; border-radius: 6px; cursor: pointer; }
      .hambger-three-dot {cursor: pointer; border: none; background: transparent; color: #334155; font-size: 1.1rem; display: grid; place-items: center; }
      .hambger-three-dot:hover { background: rgba(0,0,0,.05); }
      .messages-thread-action-menu.messages-hidden{ display: none !important; }
      .messages-thread-action-menu { position: absolute; top: calc(100% + 6px); right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 12px rgba(15,23,42,.15); z-index: 1000; min-width: 180px; }
      .messages-thread-action-btn { width: 100%; padding: .65rem 1rem; background: transparent; border: none; text-align: left; color: #334155; font-size: .875rem; cursor: pointer; }
      .messages-thread-action-btn:hover { background: rgba(0,0,0,.05); }
      .messages-thread-action-btn i { margin-right: .5rem; color: #64748b; }
      .send-btn, .attach-btn {align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; padding: 0; }
      .messages-viewer-modal { position: fixed; inset: 0; display:none; align-items:center; justify-content:center; padding:1rem; background: rgba(2,6,23,.75); z-index: 10000; }
      .messages-viewer-modal.open { display:flex; }
      .messages-viewer-card { width:min(1100px, 100%); max-height: 92vh; background:#0f172a; border:1px solid rgba(255,255,255,.12); border-radius:18px; box-shadow:0 30px 80px rgba(15,23,42,.45); overflow:hidden; display:grid; grid-template-rows:auto 1fr; }
      .messages-viewer-head { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding: .9rem 1rem; background: rgba(15,23,42,.96); color:#e2e8f0; }
      .messages-viewer-head h3 { margin:0; font-size: .98rem; color:#fff; }
      .messages-viewer-head p { margin:.15rem 0 0; font-size:.78rem; color:#94a3b8; }
      .messages-viewer-close { border:none; background:rgba(255,255,255,.08); color:#fff; width:40px; height:40px; border-radius:10px; cursor:pointer; }
      .messages-viewer-close:hover { background: rgba(255,255,255,.14); }
      .messages-viewer-body { background:#020617; display:grid; place-items:center; min-height: 80vh; }
      .messages-viewer-body img, .messages-viewer-body video, .messages-viewer-body iframe, .messages-viewer-body audio { max-width:100%; width:100%; height:100%; border:0; background:#000; }
      .messages-viewer-body img { object-fit: contain; }
      .messages-viewer-body video { max-height: 84vh; }
      .messages-viewer-body audio { width: 100%; height: auto; }
      .messages-viewer-frame { width: 100%; height: min(84vh, 900px); }
      .messages-viewer-placeholder { color:#cbd5e1; padding:2rem; text-align:center; }
      .messages-action-modal { position: fixed; inset: 0; display:none; align-items:center; justify-content:center; padding:1rem; background: rgba(15,23,42,.56); z-index: 10001;}
      .messages-action-modal.open { display:flex; }
      .messages-action-card { width:min(520px, 100%); background:#fff; border:1px solid #e2e8f0; border-radius:14px; box-shadow:0 20px 50px rgba(15,23,42,.24); overflow:auto; height: auto; max-height: 90vh; display:grid; grid-template-rows:auto 1fr auto; }
      .messages-action-head { padding: .95rem 1rem; border-bottom: 1px solid #eef2f7; }
      .messages-action-head h3 { margin:0; color:#0f172a; font-size:1rem; }
      .messages-action-body { padding: 1rem; display:grid; gap:.75rem; }
      .messages-action-body p { margin:0; color:#475569; }
      .messages-action-input { width:100%; border:1px solid #dbe3ea; border-radius:10px; padding:.62rem .72rem; font-size:.92rem; color:#0f172a; box-sizing:border-box; }
      .messages-action-select { width:100%; border:1px solid #dbe3ea; border-radius:10px; padding:.62rem .72rem; font-size:.92rem; color:#0f172a; box-sizing:border-box; background:#fff; }
      .messages-action-search { width:100%; border:1px solid #dbe3ea; border-radius:10px; padding:.58rem .75rem; font-size:.875rem; color:#0f172a; box-sizing:border-box; }
      .messages-action-options { grid-template-columns: 1fr; max-height: 240px; overflow: auto; }
      .messages-action-option { display:flex; align-items:flex-start; gap:.55rem; padding:.65rem .75rem; border:1px solid #e2e8f0; border-radius:12px; cursor:pointer; }
      .messages-action-option.selected { border-color:#006a3f; background:#f0fdf4; }
      .messages-action-option input { margin-top:.2rem; }
      .messages-action-option small { color:#64748b; display:block; margin-top:.12rem; }
      .messages-action-option .messages-avatar { width:36px; height:36px; font-size:.82rem; flex-shrink:0; }
      .messages-chat-info-card { display:flex; gap:.75rem; align-items:center; padding:.75rem; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc; }
      .messages-chat-info-card .messages-avatar { width:42px; height:42px; font-size:.92rem; }
      .messages-chat-info-name { margin:0; color:#0f172a; font-weight:700; font-size:.92rem; }
      .messages-chat-info-email { margin:.15rem 0 0; color:#64748b; font-size:.82rem; }
      .messages-chat-info-meta { margin:.55rem 0 0; color:#475569; font-size:.82rem; }
      .messages-group-member-list { display:grid; gap:.5rem; max-height: 260px; overflow:auto; margin-top:.85rem; }
      .messages-action-input:focus { border-color:#006a3f; box-shadow: 0 0 0 3px rgba(0,106,63,.08); outline:none; }
      .messages-action-select:focus { border-color:#006a3f; box-shadow: 0 0 0 3px rgba(0,106,63,.08); outline:none; }
      .messages-action-search:focus { border-color:#006a3f; box-shadow: 0 0 0 3px rgba(0,106,63,.08); outline:none; }
      .messages-action-footer { padding: 0 1rem 1rem; display:flex; justify-content:flex-end; gap:.5rem; }
    `;
    document.head.appendChild(style);
  }

  function renderShell() {
    const root = document.getElementById('admMessagesRoot');
    if (!root) return;

    root.innerHTML = `
      <div class="messages-page-shell">
        <div class="messages-topbar">
          <div>
            <h2>Messages</h2>
            <p>Room-based chat for direct conversations and group chats across the LMS.</p>
          </div>
          <div class="messages-top-actions">
            <button class="btn-secondary" type="button" id="admMessagesRefreshBtn"><i class="fas fa-rotate"></i> Refresh</button>
            <button class="btn-primary" type="button" id="admMessagesComposeBtn"><i class="fas fa-pen-to-square"></i> New chat</button>
          </div>
        </div>

        <div class="messages-stats">
          <div class="messages-stat-card"><div class="messages-stat-icon" style="background:linear-gradient(135deg,#2563eb,#1d4ed8)"><i class="fas fa-comments"></i></div><div class="messages-stat-info"><h3 id="admMessagesRoomCount">0</h3><p>Rooms</p></div></div>
          <div class="messages-stat-card"><div class="messages-stat-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706)"><i class="fas fa-envelope-open"></i></div><div class="messages-stat-info"><h3 id="admMessagesUnreadCount">0</h3><p>Unread</p></div></div>
          <div class="messages-stat-card"><div class="messages-stat-icon" style="background:linear-gradient(135deg,#0f766e,#115e59)"><i class="fas fa-user-group"></i></div><div class="messages-stat-info"><h3 id="admMessagesDirectCount">0</h3><p>Direct</p></div></div>
          <div class="messages-stat-card"><div class="messages-stat-icon" style="background:linear-gradient(135deg,#7c3aed,#5b21b6)"><i class="fas fa-people-group"></i></div><div class="messages-stat-info"><h3 id="admMessagesGroupCount">0</h3><p>Groups</p></div></div>
        </div>

        <div class="messages-workbench">
          <div class="messages-panel">
            <div class="messages-panel-head">
              <div>
                <h3>Chats</h3>
                <p>Search conversations and switch between direct and group rooms.</p>
                <div class="messages-toolbar">
                  <select class="messages-select" id="admMessagesRoomFilter" style="min-width: 160px">
                    <option value="all">All rooms</option>
                    <option value="direct">Direct chats</option>
                    <option value="group">Group chats</option>
                  </select>
                </div>
              </div>
            </div>
            <div style="padding:1rem 1rem 0">
              <div class="messages-toolbar">
                <input class="messages-search" id="admMessagesSearch" type="search" placeholder="Search rooms, users, or preview"/>
              </div>
            </div>
            <div class="messages-room-list" id="admMessagesRoomList">
              <div class="messages-empty">Loading chats...</div>
            </div>
            <button class="btn-primary" type="button" id="admMessagesComposefloatBtn" style="position: relative; float: right; bottom: 4.5rem; right: 1.5rem; border-radius: 50%; width: 48px; height: 48px; display: grid; place-items: center; padding: 0; z-index: 1000; box-shadow: 0 4px 12px rgba(15,23,42,.15);"><i class="fa-solid fa-plus"></i></button>

          </div>

          <div class="messages-panel messages-thread">
            <div class="messages-thread-header" id="admMessagesThreadHeader">
              <div>
                <h3 id="admMessagesThreadTitle">No chat selected</h3>
                <p id="admMessagesThreadSubtitle">Select a room to open the conversation.</p>
              </div>
              
              <div class="messages-thread-actions messages-hidden" id="admMessagesThreadActions">
                <diV class="messages-hambger-three-dot">
                  <button class="hambger-three-dot">
                    <i class="fa-solid fa-ellipsis-vertical"></i> 
                  </button>
                </div>
                <div id="admMessagesThreadActionMenu" class="messages-thread-action-menu messages-hidden">
                  <button class="messages-thread-action-btn" id="admMessagesMarkReadBtn"><i class="fa-solid fa-check"></i> Mark as read</button>
                  <button class="messages-thread-action-btn" id="admMessagesDeleteBtn"><i class="fa-solid fa-trash"></i> Leave chat</button>
                  <button class="messages-thread-action-btn" id="admMessagesCloseBtn"><i class="fa-solid fa-times"></i> Close chat</button>
                  <button class="messages-thread-action-btn" id="admMessagesInfoBtn"><i class="fa-solid fa-info-circle"></i> Chat Information</button>
                </div>
              </div>
            </div>

             <div class="messages-message-viewer" id="admMessagesMessagesviewer" style="position: relative;"> 
              <div class="messages-message-list" id="admMessagesMessagesList">
                <div class="messages-thread-empty">Conversation will appear here.</div>
              </div>
              <div class="messages-float-load-more" style="display: flex; justify-content: right; margin-top: .75rem; position: sticky; bottom: 90px; z-index: 66; float: right; background-color: #0909e552; width: 100%; padding-right: 0px;">
                <button class="btn-secondary messages-load-more-btn" type="button" id="admMessagesLoadMoreBtn"><i class="fa-solid fa-chevron-down"></i></button>
              </div>
             </div> 
            <div class="messages-composer" id="admMessagesComposer">
              <div class="messages-actions-row">
              <div id="admMessagesReplyPreview" class="messages-reply-composer messages-hidden">
                <div>
                  <strong id="admMessagesReplyLabel">Replying</strong>
                  <p id="admMessagesReplyText"></p>
                </div>
                <button id="admMessagesReplyClearBtn" class="messages-reply-clear" type="button" aria-label="Cancel reply"><i class="fas fa-times"></i></button>
              </div>
              <div id="admMessagesEditPreview" class="messages-edit-composer messages-hidden">
                <div>
                  <strong id="admMessagesEditLabel">Editing message</strong>
                  <p id="admMessagesEditText"></p>
                </div>
                <button id="admMessagesEditClearBtn" class="messages-edit-clear" type="button" aria-label="Cancel edit"><i class="fas fa-times"></i></button>
              </div>
              <div id="admMessagesAttachmentSummary" class="messages-attachment-note messages-hidden"></div>
              <div id="admMessagesAttachmentPreview" class="messages-attachment-preview messages-hidden"></div>
                <textarea id="admMessagesBody" class="messages-textarea" placeholder="Write a message..." style="min-height:50px; width:100%; resize: vertical; min-height: 50px;"></textarea>
              </div>
              <input id="admMessagesAttachmentInput" class="messages-hidden" type="file" />
              <div class=" messages-actions-chat-button">
                <button class="btn-secondary attach-btn" type="button" id="admMessagesAttachBtn"><i class="fa fa-paperclip" aria-hidden="true"></i></button>
                <button class="btn-primary send-btn" type="button" id="admMessagesSendBtn"><i class="fas fa-paper-plane"></i></button>
              </div>
            </div>
          </div>
        </div>

        <div class="messages-modal" id="admMessagesComposeModal" aria-hidden="true">
          <div class="messages-modal-card" role="dialog" aria-modal="true" aria-labelledby="admMessagesComposeTitle">
            <div class="messages-modal-head">
              <div>
                <h3 id="admMessagesComposeTitle">Start a chat</h3>
                <p>Open a direct chat or create a group room.</p>
              </div>
              <button class="btn-secondary" type="button" id="admMessagesCloseComposeBtn"><i class="fas fa-times"></i></button>
            </div>
            <div class="messages-modal-body">
              <div class="messages-modal-tabs">
                <button class="messages-tab active" type="button" data-compose-tab="direct">Direct</button>
                <button class="messages-tab" type="button" data-compose-tab="group">Group</button>
              </div>

              <div class="messages-compose-section" data-compose-section="direct">
                <div class="messages-compose-row">
                  <label>Search user</label>
                  <input id="admMessagesUserSearch" class="messages-input" type="search" placeholder="Search by name, email, or role" style="padding: 10px; margin-bottom: 10px;"/>
                </div>
                <div class="messages-compose-row" style="margin-top:.5rem">
                  <label>Filter users (optional)</label>
                  <div class="messages-toolbar" style="margin-top:.5rem">
                    <input id="admMessagesComposeClassFilter" class="messages-input" type="text" placeholder="Class name or code" />
                    <input id="admMessagesComposeProgramFilter" class="messages-input" type="text" placeholder="Program name or code" />
                    <select id="admMessagesComposeRoleFilter" class="messages-select" style="min-width: 170px">
                      <option value="">Any role</option>
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="parent">Parent</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div class="messages-user-grid" id="admMessagesUserGrid"></div>
              </div>

              <div class="messages-compose-section messages-hidden" data-compose-section="group">
                <div class="messages-compose-row">
                  <label>Group name</label>
                  <input id="admMessagesGroupName" class="messages-input" type="text" maxlength="200" placeholder="e.g. SHS 1 Science A" />
                </div>
                <div class="messages-compose-row" style="margin-top:.9rem">
                  <label>Select members</label>
                  <input id="admMessagesGroupMemberSearch" class="messages-input" type="search" placeholder="Search members to include" style="padding: 10px; margin-bottom: 10px;"/>
                </div>
                <div class="messages-user-grid" id="admMessagesGroupMemberGrid"></div>
                <div class="messages-note" id="admMessagesGroupSummary">Select members to preview the room recipients.</div>
              </div>

              <div class="messages-compose-row">
                <label>Initial message</label>
                <textarea id="admMessagesComposeBody" class="messages-textarea" placeholder="Type the first message for this room..."></textarea>
              </div>
            </div>
            <div class="messages-actions-row" style="padding:0 1rem 1rem">
              <button class="btn-secondary" type="button" id="admMessagesCancelComposeBtn">Cancel</button>
              <button class="btn-primary" type="button" id="admMessagesCreateRoomBtn"><i class="fas fa-paper-plane"></i> Start chat</button>
            </div>
          </div>
        </div>

        <div class="messages-viewer-modal" id="admMessagesViewerModal" aria-hidden="true">
          <div class="messages-viewer-card" role="dialog" aria-modal="true" aria-labelledby="admMessagesViewerTitle">
            <div class="messages-viewer-head">
              <div>
                <h3 id="admMessagesViewerTitle">Attachment preview</h3>
                <p id="admMessagesViewerMeta">View images, videos, and PDFs in place.</p>
              </div>
              <button class="messages-viewer-close" type="button" id="admMessagesViewerCloseBtn" aria-label="Close preview"><i class="fas fa-times"></i></button>
            </div>
            <div class="messages-viewer-body" id="admMessagesViewerBody">
              <div class="messages-viewer-placeholder">Select an attachment to preview it here.</div>
            </div>
          </div>
        </div>

        <div class="messages-action-modal" id="admMessagesActionModal" aria-hidden="true">
          <div class="messages-action-card" role="dialog" aria-modal="true" aria-labelledby="admMessagesActionTitle">
            <div class="messages-action-head">
              <h3 id="admMessagesActionTitle">Action</h3>
            </div>
            <div class="messages-action-body">
              <p id="admMessagesActionMessage"></p>
              <input id="admMessagesActionInput" class="messages-action-input messages-hidden" type="text" />
              <select id="admMessagesActionSelect" class="messages-action-select messages-hidden"></select>
              <input id="admMessagesActionSearch" class="messages-action-search messages-hidden" type="search" placeholder="Search chats..." />
              <div id="admMessagesActionOptions" class="messages-user-grid messages-action-options messages-hidden"></div>
            </div>
            <div class="messages-action-footer">
              <button class="btn-secondary" type="button" id="admMessagesActionCancelBtn">Cancel</button>
              <button class="btn-primary" type="button" id="admMessagesActionOkBtn">Confirm</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function cacheDom() {
    DOM.root = document.getElementById('admMessagesRoot');
    DOM.refreshBtn = document.getElementById('admMessagesRefreshBtn');
    DOM.composeBtn = document.getElementById('admMessagesComposeBtn');
    DOM.composefloatBtn = document.getElementById('admMessagesComposefloatBtn');
    DOM.threadActions = document.getElementById('admMessagesThreadActions');
    DOM.attachBtn = document.getElementById('admMessagesAttachBtn');
    DOM.attachmentInput = document.getElementById('admMessagesAttachmentInput');
    DOM.replyPreview = document.getElementById('admMessagesReplyPreview');
    DOM.replyLabel = document.getElementById('admMessagesReplyLabel');
    DOM.replyText = document.getElementById('admMessagesReplyText');
    DOM.replyClearBtn = document.getElementById('admMessagesReplyClearBtn');
    DOM.editPreview = document.getElementById('admMessagesEditPreview');
    DOM.editLabel = document.getElementById('admMessagesEditLabel');
    DOM.editText = document.getElementById('admMessagesEditText');
    DOM.editClearBtn = document.getElementById('admMessagesEditClearBtn');
    DOM.attachmentSummary = document.getElementById('admMessagesAttachmentSummary');
    DOM.attachmentPreview = document.getElementById('admMessagesAttachmentPreview');
    DOM.viewerModal = document.getElementById('admMessagesViewerModal');
    DOM.viewerBody = document.getElementById('admMessagesViewerBody');
    DOM.viewerTitle = document.getElementById('admMessagesViewerTitle');
    DOM.viewerMeta = document.getElementById('admMessagesViewerMeta');
    DOM.viewerCloseBtn = document.getElementById('admMessagesViewerCloseBtn');
    DOM.actionModal = document.getElementById('admMessagesActionModal');
    DOM.actionTitle = document.getElementById('admMessagesActionTitle');
    DOM.actionMessage = document.getElementById('admMessagesActionMessage');
    DOM.actionInput = document.getElementById('admMessagesActionInput');
    DOM.actionSelect = document.getElementById('admMessagesActionSelect');
    DOM.actionSearch = document.getElementById('admMessagesActionSearch');
    DOM.actionOptions = document.getElementById('admMessagesActionOptions');
    DOM.actionCancelBtn = document.getElementById('admMessagesActionCancelBtn');
    DOM.actionOkBtn = document.getElementById('admMessagesActionOkBtn');
    DOM.threadActionMenu = document.getElementById('admMessagesThreadActionMenu');
    DOM.roomFilter = document.getElementById('admMessagesRoomFilter');
    DOM.search = document.getElementById('admMessagesSearch');
    DOM.roomList = document.getElementById('admMessagesRoomList');
    DOM.threadHeader = document.getElementById('admMessagesThreadHeader');
    DOM.loadMoreBtn = document.getElementById('admMessagesLoadMoreBtn');
    DOM.messagesList = document.getElementById('admMessagesMessagesList');
    DOM.messagesViewer = document.getElementById('admMessagesMessagesviewer');
    DOM.unreadCount = document.getElementById('admMessagesUnreadCount');
    DOM.roomCount = document.getElementById('admMessagesRoomCount');
    DOM.directCount = document.getElementById('admMessagesDirectCount');
    DOM.groupCount = document.getElementById('admMessagesGroupCount');
    DOM.markReadBtn = document.getElementById('admMessagesMarkReadBtn');
    DOM.deleteBtn = document.getElementById('admMessagesDeleteBtn');
    DOM.closeBtn = document.getElementById('admMessagesCloseBtn');
    DOM.infoBtn = document.getElementById('admMessagesInfoBtn');
    DOM.sendBtn = document.getElementById('admMessagesSendBtn');
    DOM.composer = document.getElementById('admMessagesComposer');
    DOM.body = document.getElementById('admMessagesBody');
    DOM.composeBody = document.getElementById('admMessagesComposeBody');

    DOM.composeModal = document.getElementById('admMessagesComposeModal');
    DOM.closeComposeBtn = document.getElementById('admMessagesCloseComposeBtn');
    DOM.cancelComposeBtn = document.getElementById('admMessagesCancelComposeBtn');
    DOM.createRoomBtn = document.getElementById('admMessagesCreateRoomBtn');
    DOM.userSearch = document.getElementById('admMessagesUserSearch');
    DOM.composeClassFilter = document.getElementById('admMessagesComposeClassFilter');
    DOM.composeProgramFilter = document.getElementById('admMessagesComposeProgramFilter');
    DOM.composeRoleFilter = document.getElementById('admMessagesComposeRoleFilter');
    DOM.userGrid = document.getElementById('admMessagesUserGrid');
    DOM.groupName = document.getElementById('admMessagesGroupName');
    DOM.groupMemberSearch = document.getElementById('admMessagesGroupMemberSearch');
    DOM.groupMemberGrid = document.getElementById('admMessagesGroupMemberGrid');
    DOM.groupSummary = document.getElementById('admMessagesGroupSummary');
  }

  function bindEvents() {
    DOM.refreshBtn?.addEventListener('click', loadData);
    DOM.composeBtn?.addEventListener('click', openComposeModal);
    DOM.composefloatBtn?.addEventListener('click', openComposeModal);
    DOM.roomFilter?.addEventListener('change', function (event) {
      STATE.roomFilter = String(event.target.value || 'all');
      renderRooms();
    });
    DOM.threadHeader?.addEventListener('click', function (event) {
      if (event.target.closest('.messages-hambger-three-dot')) {
        DOM.threadActionMenu?.classList.toggle('messages-hidden');
      }
    });
    DOM.search?.addEventListener('input', function (event) {
      STATE.search = String(event.target.value || '').trim().toLowerCase();
      renderRooms();
    });
    DOM.roomList?.addEventListener('click', function (event) {
      const card = event.target.closest('[data-room-uuid]');
      if (!card) return;
      selectRoom(String(card.getAttribute('data-room-uuid') || ''));
    });
    DOM.sendBtn?.addEventListener('click', sendMessage);
    DOM.markReadBtn?.addEventListener('click', markSelectedRoomRead);
    DOM.deleteBtn?.addEventListener('click', deleteSelectedRoom);
    DOM.closeBtn?.addEventListener('click', closeSelectedRoom);
    DOM.infoBtn?.addEventListener('click', showSelectedRoomInfo);

    DOM.closeComposeBtn?.addEventListener('click', closeComposeModal);
    DOM.cancelComposeBtn?.addEventListener('click', closeComposeModal);
    DOM.composeModal?.addEventListener('click', function (event) {
      if (event.target === DOM.composeModal) closeComposeModal();
    });

    DOM.attachBtn?.addEventListener('click', openAttachmentPicker);
    DOM.attachmentInput?.addEventListener('change', handleAttachmentSelection);
    DOM.replyClearBtn?.addEventListener('click', clearReplyContext);
    DOM.editClearBtn?.addEventListener('click', clearEditContext);
    DOM.viewerCloseBtn?.addEventListener('click', closeAttachmentViewer);
    DOM.viewerModal?.addEventListener('click', function (event) {
      if (event.target === DOM.viewerModal) closeAttachmentViewer();
    });
    DOM.actionCancelBtn?.addEventListener('click', function () { closeActionDialog(null); });
    DOM.actionOkBtn?.addEventListener('click', function () {
      if (DOM.actionInput && !DOM.actionInput.classList.contains('messages-hidden')) {
        closeActionDialog(String(DOM.actionInput.value || ''));
      } else if (DOM.actionSelect && !DOM.actionSelect.classList.contains('messages-hidden')) {
        closeActionDialog(String(DOM.actionSelect.value || ''));
      } else if (DOM.actionOptions && !DOM.actionOptions.classList.contains('messages-hidden')) {
        const allowMultiple = DOM.actionOptions.getAttribute('data-allow-multiple') !== '0';
        const selectedValues = Array.from(DOM.actionOptions.querySelectorAll('input[name="action-option"]:checked')).map(function (input) {
          return String(input.value || '').trim();
        }).filter(Boolean);
        closeActionDialog(allowMultiple ? selectedValues : (selectedValues[0] || ''));
      } else {
        closeActionDialog(true);
      }
    });
    DOM.actionModal?.addEventListener('click', function (event) {
      if (event.target === DOM.actionModal) {
        closeActionDialog(null);
      }
    });

    DOM.userSearch?.addEventListener('input', renderDirectUsers);
    DOM.groupMemberSearch?.addEventListener('input', renderGroupMembers);
    DOM.createRoomBtn?.addEventListener('click', createRoomAndSendFirstMessage);
    const onComposeFilterChange = function () {
      if (!DOM.composeModal?.classList.contains('open')) return;
      loadComposeUsersWithFilters();
    };
    DOM.composeClassFilter?.addEventListener('input', onComposeFilterChange);
    DOM.composeProgramFilter?.addEventListener('input', onComposeFilterChange);
    DOM.composeRoleFilter?.addEventListener('change', onComposeFilterChange);

    DOM.attachmentPreview?.addEventListener('click', handleAttachmentPreviewClick);
    DOM.messagesList?.addEventListener('click', handleMessageAttachmentClick);
    DOM.messagesList?.addEventListener('click', handleMessageActionClick);
    DOM.messagesList?.addEventListener('click', handleReplyPreviewClick);
    DOM.attachmentPreview?.addEventListener('input', handleAudioTimelineSeek);
    DOM.messagesList?.addEventListener('input', handleAudioTimelineSeek);
    DOM.messagesViewer?.addEventListener('scroll', syncLoadMoreButtonVisibility);
    DOM.loadMoreBtn?.addEventListener('click', handleLoadMoreButtonClick);

    DOM.composeModal?.addEventListener('change', function (event) {
      if (event.target.matches('input[name="direct-user"]')) highlightDirectSelection();
      if (event.target.matches('input[name="group-member"]')) {
        const memberId = Number(event.target.value || 0);
        if (memberId > 0) {
          if (event.target.checked) {
            STATE.selectedGroupMemberIds.add(memberId);
          } else {
            STATE.selectedGroupMemberIds.delete(memberId);
          }
        }

        const chip = event.target.closest('.messages-user-chip');
        if (chip) {
          chip.classList.toggle('selected', Boolean(event.target.checked));
        }

        renderGroupSummary();
      }
    });

    document.addEventListener('click', function (event) {
      if (DOM.threadActionMenu && !DOM.threadActionMenu.classList.contains('messages-hidden')) {
        const clickedMenuTrigger = event.target.closest('.messages-hambger-three-dot');
        const clickedMenuPanel = event.target.closest('#admMessagesThreadActionMenu');
        if (!clickedMenuTrigger && !clickedMenuPanel) {
          DOM.threadActionMenu.classList.add('messages-hidden');
        }
      }

      const tab = event.target.closest('[data-compose-tab]');
      if (tab && DOM.composeModal?.classList.contains('open')) {
        Array.from(DOM.composeModal.querySelectorAll('[data-compose-tab]')).forEach(function (button) {
          button.classList.toggle('active', button === tab);
        });
        Array.from(DOM.composeModal.querySelectorAll('[data-compose-section]')).forEach(function (section) {
          section.classList.toggle('messages-hidden', section.getAttribute('data-compose-section') !== tab.getAttribute('data-compose-tab'));
        });
      }
    });
  }

  async function loadData() {
    if (STATE.loading) return;
    STATE.loading = true;

    try {
      STATE.currentUser = typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
      const usersPromise = loadAllUsers().catch(function (error) {
        console.warn('Unable to preload users for compose modal:', error);
        return [];
      });
      const roomsResponse = await ChatAPI.getRooms().catch(function () { return null; });

      STATE.users = [];
      STATE.rooms = extractRooms(roomsResponse);
      STATE.unreadCount = Number(roomsResponse?.data?.unread_count ?? roomsResponse?.unread_count ?? 0);

      const selectedUuid = String(STATE.selectedRoom?.uuid || '');
      const selectedRoom = STATE.rooms.find(function (room) {
        return String(room?.uuid || '') === selectedUuid;
      }) || null;

      STATE.selectedRoom = selectedRoom;

      updateStats();
      renderDirectUsers();
      renderGroupMembers();
      renderRooms();

      if (STATE.selectedRoom?.uuid) {
        await selectRoom(STATE.selectedRoom.uuid, true);
      } else {
        renderThreadPlaceholder('Select a room to open the conversation.', { resetHeader: true });
      }

      usersPromise.then(function (users) {
        STATE.users = Array.isArray(users) ? users : [];
        renderDirectUsers();
        renderGroupMembers();
      });
    } catch (error) {
      console.error('Messages load error:', error);
      renderRoomPlaceholder('Failed to load chats. Please refresh and try again.');
      renderThreadPlaceholder('Failed to load conversation.');
      showToastIfAvailable('Failed to load chats.', 'error');
    } finally {
      STATE.loading = false;
      startPolling();
    }
  }

  async function loadAllUsers(filters = {}) {
    const rows = [];
    let page = 1;
    const limit = 100;
    const seenUserIds = new Set();
    const currentUserId = Number(STATE.currentUser?.user_id || 0);

    while (page <= 50) {
      const response = await UserAPI.getAll(Object.assign({ page: page, limit: limit, for_chat: 1 }, filters)).catch(function () { return null; });
      const batch = extractUsers(response);
      const pagination = extractPagination(response);
      const startCount = rows.length;

      batch.forEach(function (user) {
        const userId = Number(user?.user_id || 0);
        const dedupeKey = userId > 0 ? String(userId) : String(user?.uuid || user?.email || '');
        if (!dedupeKey || seenUserIds.has(dedupeKey)) return;
        seenUserIds.add(dedupeKey);
        rows.push(user);
      });

      if (!batch.length) break;
      if (pagination.total && rows.length >= Number(pagination.total)) break;
      if (rows.length === startCount) break;
      page += 1;
    }

    return rows.filter(function (user) {
      return Number(user?.user_id || 0) !== currentUserId;
    });
  }

  function extractUsers(response) {
    const payload = response?.data ?? response;
    const list = payload?.data || payload?.users || payload?.items || payload;
    return Array.isArray(list) ? list : [];
  }

  function extractRooms(response) {
    const payload = response?.data ?? response;
    const list = payload?.rooms || payload?.data || payload?.items || payload;
    return Array.isArray(list) ? list : [];
  }

  function extractMessages(response) {
    const payload = response?.data ?? response;
    const list = payload?.messages || payload?.data || payload?.items || payload;
    return Array.isArray(list) ? list : [];
  }

  function extractPagination(response) {
    const payload = response?.data ?? response;
    return payload?.pagination || response?.pagination || {};
  }

  function updateStats() {
    setText('admMessagesRoomCount', String(STATE.rooms.length));
    setText('admMessagesUnreadCount', String(STATE.unreadCount));
    setText('admMessagesDirectCount', String(STATE.rooms.filter(function (room) { return String(room.room_type || '') === 'direct'; }).length));
    setText('admMessagesGroupCount', String(STATE.rooms.filter(function (room) { return String(room.room_type || '') !== 'direct'; }).length));
  }

  function getComposeFilterParams() {
    const classFilterRaw = String(DOM.composeClassFilter?.value || '').trim();
    const programFilterRaw = String(DOM.composeProgramFilter?.value || '').trim();
    const roleRaw = String(DOM.composeRoleFilter?.value || '').trim().toLowerCase();

    STATE.composeFilters = {
      classFilter: classFilterRaw,
      programFilter: programFilterRaw,
      role: roleRaw,
    };

    const params = {};
    if (classFilterRaw) params.class = classFilterRaw;
    if (programFilterRaw) params.program = programFilterRaw;
    if (roleRaw) params.role = roleRaw;

    return params;
  }

  async function loadComposeUsersWithFilters() {
    const users = await loadAllUsers(getComposeFilterParams()).catch(function (error) {
      console.warn('Unable to load filtered users for compose modal:', error);
      return [];
    });

    STATE.users = Array.isArray(users) ? users : [];
    renderDirectUsers();
    renderGroupMembers();
  }

  function renderRooms() {
    if (!DOM.roomList) return;

    const rooms = STATE.rooms.filter(function (room) {
      const type = String(room.room_type || 'group');
      if (STATE.roomFilter !== 'all' && type !== STATE.roomFilter) return false;
      if (!STATE.search) return true;
      const haystack = [room.display_name, room.room_name, room.category_label, room.last_message_text, room.last_message_sender_name].join(' ').toLowerCase();
      return haystack.indexOf(STATE.search) !== -1;
    });

    if (!rooms.length) {
      DOM.roomList.innerHTML = '<div class="messages-empty">No chats found.</div>';
      return;
    }

    DOM.roomList.innerHTML = rooms.map(function (room) {
      const active = STATE.selectedRoom?.uuid === room.uuid ? 'active' : '';
      const unread = Number(room.unread_count || 0);
      const badge = unread > 0 ? '<span class="messages-badge unread">' + unread + '</span>' : '';
      const initial = String(room.display_name || room.room_name || 'Chat').trim().charAt(0).toUpperCase() || 'C';
      const avatarUrl = buildUploadUrl(room.display_avatar || room.room_avatar || '');
      const avatarMarkup = avatarUrl
        ? '<img src="' + esc(avatarUrl) + '" alt="' + esc(room.display_name || room.room_name || 'Chat') + '" />'
        : esc(initial);
      const preview = String(room.last_message_text || 'No messages yet').trim().slice(0, 100);
      const meta = [room.room_type === 'direct' ? 'Direct' : 'Group', room.last_message_created_at ? fmtDateTime(room.last_message_created_at) : 'New room'].filter(Boolean).join(' • ');

      return '<div class="messages-room-item ' + active + '" data-room-uuid="' + esc(room.uuid || '') + '">'
        + '<div class="messages-avatar">' + avatarMarkup + '</div>'
        + '<div class="messages-room-main">'
        + '<div class="messages-room-top"><h4 class="messages-room-title">' + esc(room.display_name || room.room_name || 'Chat') + '</h4>' + badge + '</div>'
        + '<p class="messages-room-meta">' + esc(meta) + '</p>'
        + '<p class="messages-room-preview">' + esc(preview) + '</p>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  async function selectRoom(uuid, silent) {
    if (!uuid) return;
    const currentRoomUuid = String(STATE.selectedRoom?.uuid || '');
    if (currentRoomUuid && currentRoomUuid !== uuid) {
      clearReplyContext();
      clearEditContext();
    }

    const room = STATE.rooms.find(function (item) { return String(item.uuid || '') === uuid; }) || null;
    if (!room) return;

    STATE.selectedRoom = room;
    renderRooms();
    renderThreadHeader(room);

    const response = await ChatAPI.getMessages(uuid, { limit: 100 }).catch(function () { return null; });
    STATE.messages = extractMessages(response);
    renderMessages();

    window.setTimeout(function () {
      scrollToReadPosition(room);
    }, 0);
  }

  function renderThreadHeader(room) {
    if (!DOM.threadHeader || !room) return;

    const memberCount = Number(room.member_count || 0);
    setText('admMessagesThreadTitle', String(room.display_name || room.room_name || 'Conversation'));
    setText('admMessagesThreadSubtitle', (room.room_type === 'direct' ? 'Direct chat' : 'Group chat') + ' • ' + memberCount + ' members');
    DOM.threadActions?.classList.remove('messages-hidden');

    if (DOM.body && !DOM.body.value) {
      DOM.body.placeholder = room.room_type === 'direct' ? 'Write a direct message...' : 'Write a message to the group...';
    }

    setButtonsEnabled(true);
  }

  function renderMessages() {
    if (!DOM.messagesList) return;
    if (!STATE.selectedRoom) {
      renderThreadPlaceholder('Select a room to open the conversation.', { resetHeader: true });
      return;
    }

    if (!STATE.messages.length) {
      renderThreadPlaceholder('No messages yet. Send the first message.');
      return;
    }

    const currentUserId = Number(STATE.currentUser?.user_id || 0);
    const lastReadMessageId = Number(STATE.selectedRoom?.last_read_message_id || 0);
    let unreadDividerInserted = false;

    DOM.messagesList.innerHTML = STATE.messages.map(function (message) {
      const outbound = Number(message.sender_id || 0) === currentUserId;
      const messageId = Number(message.chat_message_id || 0);
      const displayTime = getMessageDisplayTime(message);
      const isEdited = Number(message?.is_edited || 0) === 1;
      const editStatusHtml = isEdited ? '<span class="messages-edit-status edited">Edited</span>' : '';
      const replyPreviewHtml = renderReplyPreview(message);
      const attachmentsHtml = renderMessageAttachments(message.attachments || []);
      const actionsHtml = renderMessageActions(message, outbound);
      const isUnreadByCurrentUser = !outbound && (
        lastReadMessageId > 0 ? messageId > lastReadMessageId : true
      );

      let unreadDividerHtml = '';
      if (!unreadDividerInserted && isUnreadByCurrentUser) {
        unreadDividerInserted = true;
        unreadDividerHtml = '<div class="messages-unread-divider"><span class="messages-unread-badge">Unread messages</span></div>';
      }

      return unreadDividerHtml + '<div class="messages-message-item ' + (outbound ? 'outbound' : 'inbound') + '" data-chat-message-id="' + Number(message.chat_message_id || 0) + '" data-chat-message-uuid="' + esc(message.uuid || '') + '">'
        + '<div class="messages-message-head"><strong>' + esc(outbound ? 'You' : (message.sender_name || 'Member')) + '</strong><span class="messages-message-meta"><span class="messages-room-meta">' + esc(fmtDateTime(displayTime)) + '</span>' + editStatusHtml + '</span></div>'
        + '<div class="messages-message-body">' + replyPreviewHtml + formatMessageBody(message.message_text || '') + attachmentsHtml + actionsHtml + '</div>'
        + '</div>';
    }).join('');

      syncLoadMoreButtonVisibility();
  }

  function scrollToReadPosition(room) {
    if (!DOM.messagesList || !DOM.messagesViewer) return;

    const lastReadMessageId = Number(room?.last_read_message_id || 0);
    const lastReadAtRaw = String(room?.last_read_at || room?.member_last_read_at || room?.last_read_message_at || '').trim();
    let target = lastReadMessageId > 0
      ? DOM.messagesList.querySelector('[data-chat-message-id="' + lastReadMessageId + '"]')
      : null;

    if (!target && lastReadAtRaw) {
      const lastReadAtMs = new Date(lastReadAtRaw).getTime();
      if (Number.isFinite(lastReadAtMs)) {
        let fallbackMessageId = 0;
        let fallbackMessageTime = -Infinity;

        STATE.messages.forEach(function (message) {
          const messageId = Number(message?.chat_message_id || 0);
          const messageTimeRaw = message?.created_at || message?.sent_at || message?.edited_at || null;
          const messageTimeMs = messageTimeRaw ? new Date(messageTimeRaw).getTime() : NaN;
          if (!messageId || !Number.isFinite(messageTimeMs)) return;

          if (messageTimeMs <= lastReadAtMs && messageTimeMs >= fallbackMessageTime) {
            fallbackMessageId = messageId;
            fallbackMessageTime = messageTimeMs;
          }
        });

        if (fallbackMessageId > 0) {
          target = DOM.messagesList.querySelector('[data-chat-message-id="' + fallbackMessageId + '"]');
        }
      }
    }

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    DOM.messagesViewer.scrollTop = DOM.messagesViewer.scrollHeight;
  }

  function getMessageDisplayTime(message) {
    const isEdited = Number(message?.is_edited || 0) === 1;
    if (isEdited && message?.edited_at) {
      return message.edited_at;
    }

    return message?.created_at || message?.sent_at || message?.edited_at || '';
  }

  function renderReplyPreview(message) {
    const replyId = Number(message?.reply_to_message_id || 0);
    if (replyId <= 0) return '';

    let previewText = String(message?.reply_to_text || '').trim();
    if (!previewText) {
      const referencedMessage = STATE.messages.find(function (row) {
        return Number(row?.chat_message_id || 0) === replyId;
      });
      previewText = String(referencedMessage?.message_text || '').trim();
    }

    if (!previewText) {
      previewText = 'Original message is unavailable.';
    }

    return '<div class="messages-reply-preview clickable" data-reply-message-id="' + replyId + '"><strong>Replying to</strong><span>' + esc(previewText) + '</span></div>';
  }

  function handleReplyPreviewClick(event) {
    const preview = event.target.closest('.messages-reply-preview[data-reply-message-id]');
    if (!preview || !DOM.messagesList) return;

    const replyId = Number(preview.getAttribute('data-reply-message-id') || 0);
    if (replyId <= 0) return;

    const target = DOM.messagesList.querySelector('.messages-message-item[data-chat-message-id="' + replyId + '"]');
    if (!target) {
      showToastIfAvailable('Original replied message is not in the current loaded list.', 'info');
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('reply-target-highlight');
    window.setTimeout(function () {
      target.classList.remove('reply-target-highlight');
    }, 1400);
  }

  function renderMessageActions(message, outbound) {
    const uuid = String(message?.uuid || '').trim();
    if (!uuid) return '';

    const hasAttachments = Array.isArray(message?.attachments) && message.attachments.length > 0;
    return '<div class="messages-message-actions" data-message-uuid="' + esc(uuid) + '">'
      + (hasAttachments ? '<button class="messages-msg-action-btn" type="button" data-message-action="download" title="Download attachment" download><i class="fa-solid fa-download"></i></button>' : '')
      + '<button class="messages-msg-action-btn" type="button" data-message-action="reply" title="Reply"><i class="fa-solid fa-reply"></i></button>'
      + '<button class="messages-msg-action-btn" type="button" data-message-action="forward" title="Forward"><i class="fa-solid fa-share"></i></button>'
      + (outbound ? '<button class="messages-msg-action-btn" type="button" data-message-action="edit" title="Edit"><i class="fa-solid fa-pen"></i></button>' : '')
      + (outbound ? '<button class="messages-msg-action-btn" type="button" data-message-action="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>' : '')
      + '</div>';
  }

  function openAttachmentPicker() {
    if (!DOM.attachmentInput) return;
    DOM.attachmentInput.value = '';
    DOM.attachmentInput.multiple = true;
    DOM.attachmentInput.click();
  }

  async function handleAttachmentSelection(event) {
    try {
      const files = Array.from(event?.target?.files || []);
      if (!files.length) return;

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'chat-attachments');

        const uploadResponse = await FileAPI.upload(formData);
        const uploadData = uploadResponse?.data || uploadResponse || {};
        const filePath = String(uploadData.path || '').trim();

        if (!filePath) {
          throw new Error('Upload completed, but no file path was returned.');
        }

        STATE.pendingAttachments.push({
          file_name: String(uploadData.original_name || file.name || 'attachment').trim(),
          file_path: filePath,
          mime_type: String(uploadData.type || file.type || ''),
          file_size: Number(uploadData.size || file.size || 0),
        });
      }

      syncAttachmentSummary();
      showToastIfAvailable('Attachment(s) ready to send.', 'success');
    } catch (error) {
      console.error('Attachment upload error:', error);
      showToastIfAvailable(error?.message || 'Failed to upload attachment.', 'error');
    } finally {
      event.target.value = '';
    }
  }

  function formatMessageBody(value) {
    const text = String(value || '');
    if (!text) return '';

    const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/gi;
    let output = '';
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text))) {
      if (match.index > lastIndex) {
        output += esc(text.slice(lastIndex, match.index));
      }

      if (match[1] && match[2]) {
        output += '<a href="' + esc(match[2]) + '" target="_blank" rel="noreferrer noopener">' + esc(match[1]) + '</a>';
      } else if (match[3]) {
        output += '<a href="' + esc(match[3]) + '" target="_blank" rel="noreferrer noopener">' + esc(match[3]) + '</a>';
      }

      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
      output += esc(text.slice(lastIndex));
    }

    return output;
  }

  function renderMessageAttachments(attachments) {
    if (!Array.isArray(attachments) || !attachments.length) {
      return '';
    }

    return '<div class="messages-attachment-list">' + attachments.map(function (attachment) {
      const fileName = String(attachment.file_name || attachment.original_name || 'Attachment');
      const href = buildAttachmentUrl(attachment.file_path || attachment.path || attachment.url || '');
      const size = formatFileSize(Number(attachment.file_size || attachment.size || 0));
      const mimeType = String(attachment.mime_type || '').toLowerCase();
      const isImage = mimeType.indexOf('image/') === 0;
      const isViewable = isImage || mimeType.indexOf('video/') === 0 || mimeType.indexOf('audio/') === 0 || mimeType.indexOf('application/pdf') === 0;
      const previewMarkup = isImage && href
        ? '<img src="' + esc(href) + '" alt="' + esc(fileName) + ' preview" />'
        : (mimeType.indexOf('audio/') === 0
          ? '<button type="button" class="messages-audio-play" data-audio-name="' + esc(fileName) + '" aria-label="Play ' + esc(fileName) + '"><i class="fa-solid fa-play"></i></button>'
          : '<i class="fa-solid ' + (mimeType.indexOf('video/') === 0 ? 'fa-film' : mimeType.indexOf('application/pdf') === 0 ? 'fa-file-pdf' : 'fa-file-lines') + '"></i>');
      const audioTimeline = mimeType.indexOf('audio/') === 0
        ? '<div class="messages-audio-timeline messages-hidden">'
          + '<span class="messages-audio-current">0:00</span>'
          + '<input class="messages-audio-range" type="range" min="0" max="0" step="0.1" value="0" />'
          + '<span class="messages-audio-duration">0:00</span>'
          + '</div>'
        : '';
      return '<div class="messages-attachment-item ' + (isViewable ? 'messages-attachment-clickable' : '') + '" data-attachment-url="' + esc(href) + '" data-attachment-name="' + esc(fileName) + '" data-attachment-type="' + esc(mimeType) + '">'
        + '<i class="fa-solid fa-paperclip"></i>'
        + '<div style="min-width:0">'
        + '<div class="messages-message-attachment-preview">'
        + previewMarkup
        + '</div>'
        + (isViewable && href ? '<span>' + esc(fileName) + '</span>' : (href ? '<a href="' + esc(href) + '" target="_blank" rel="noreferrer noopener">' + esc(fileName) + '</a>' : '<strong>' + esc(fileName) + '</strong>'))
        + audioTimeline
        + '<div class="messages-attachment-meta">' + esc(size) + '</div>'
        + '</div>'
        + '</div>';
    }).join('') + '</div>';
  }

  function buildAttachmentUrl(filePath) {
    const normalizedPath = String(filePath || '').trim();
    if (!normalizedPath) return '';
    if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;

    const strippedPath = normalizedPath.replace(/^\/+/, '');
    if (!strippedPath) return '';

    const normalizedUploadPath = strippedPath.indexOf('uploads/') === 0
      ? strippedPath.slice('uploads/'.length)
      : strippedPath;
    if (!normalizedUploadPath) return '';

    const baseUrl = typeof API_BASE_URL !== 'undefined' ? String(API_BASE_URL).replace(/\/$/, '') : '';
    return baseUrl + '/uploads/' + normalizedUploadPath;
  }

  function buildUploadUrl(filePath) {
    return buildAttachmentUrl(filePath);
  }

  function formatFileSize(bytes) {
    const size = Number(bytes || 0);
    if (!size) return 'File attached';
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function syncAttachmentSummary() {
    if (!DOM.attachmentSummary) return;

    const attachments = STATE.pendingAttachments || [];
    if (!attachments.length) {
      DOM.attachmentSummary.classList.add('messages-hidden');
      DOM.attachmentSummary.textContent = '';
      if (DOM.attachmentPreview) {
        DOM.attachmentPreview.classList.add('messages-hidden');
        DOM.attachmentPreview.innerHTML = '';
      }
      return;
    }

    const names = attachments.map(function (attachment) {
      return String(attachment.file_name || 'attachment');
    });
    const details = attachments.slice(0, 3).map(function (attachment) {
      const name = String(attachment.file_name || 'attachment');
      const size = formatFileSize(Number(attachment.file_size || 0));
      return name + ' (' + size + ')';
    }).join(', ');

    DOM.attachmentSummary.textContent = attachments.length + ' attachment' + (attachments.length === 1 ? '' : 's') + ' ready: ' + details + (names.length > 3 ? ' ...' : '');
    DOM.attachmentSummary.classList.remove('messages-hidden');

    if (DOM.attachmentPreview) {
      DOM.attachmentPreview.innerHTML = attachments.map(function (attachment) {
        const fileName = String(attachment.file_name || 'attachment');
        const fileSize = formatFileSize(Number(attachment.file_size || 0));
        const mimeType = String(attachment.mime_type || '').toLowerCase();
        const href = buildAttachmentUrl(attachment.file_path || '');
        const isViewable = mimeType.indexOf('image/') === 0 || mimeType.indexOf('video/') === 0 || mimeType.indexOf('audio/') === 0 || mimeType.indexOf('application/pdf') === 0;
        const thumb = mimeType.indexOf('image/') === 0 && href
          ? '<img src="' + esc(href) + '" alt="' + esc(fileName) + ' preview" />'
          : (mimeType.indexOf('audio/') === 0
            ? '<button type="button" class="messages-audio-play" data-audio-name="' + esc(fileName) + '" aria-label="Play ' + esc(fileName) + '"><i class="fa-solid fa-play"></i></button>'
            : '<i class="fa-solid ' + (mimeType.indexOf('video/') === 0 ? 'fa-film' : mimeType.indexOf('application/pdf') === 0 ? 'fa-file-pdf' : 'fa-file-lines') + '"></i>');
        const audioTimeline = mimeType.indexOf('audio/') === 0
          ? '<div class="messages-audio-timeline messages-hidden">'
            + '<span class="messages-audio-current">0:00</span>'
            + '<input class="messages-audio-range" type="range" min="0" max="0" step="0.1" value="0" />'
            + '<span class="messages-audio-duration">0:00</span>'
            + '</div>'
          : '';

        return '<div class="messages-attachment-preview-item messages-attachment-clickable" data-attachment-url="' + esc(href) + '" data-attachment-name="' + esc(fileName) + '" data-attachment-type="' + esc(mimeType) + '">'
          + '<div class="messages-attachment-preview-thumb">' + thumb + '</div>'
          + '<div class="messages-attachment-preview-body">'
          + '<strong title="' + esc(fileName) + '">' + esc(fileName) + '</strong>'
          + '<div class="messages-attachment-preview-meta">' + esc(fileSize) + (mimeType ? ' • ' + esc(mimeType) : '') + '</div>'
          + audioTimeline
          + '</div>'
          + '</div>';
      }).join('');
      DOM.attachmentPreview.classList.remove('messages-hidden');
    }
  }

  function handleAttachmentPreviewClick(event) {
    if (handleAudioButtonClick(event)) return;

    const item = event.target.closest('[data-attachment-url]');
    if (!item) return;
    const url = String(item.getAttribute('data-attachment-url') || '').trim();
    const name = String(item.getAttribute('data-attachment-name') || 'Attachment');
    const type = String(item.getAttribute('data-attachment-type') || '').toLowerCase();
    if (type.indexOf('audio/') === 0) return;
    if (!url || !isPreviewableAttachment(type)) return;
    openAttachmentViewer({ url: url, name: name, type: type });
  }

  function handleMessageAttachmentClick(event) {
    if (handleAudioButtonClick(event)) return;

    const item = event.target.closest('.messages-attachment-item[data-attachment-url]');
    if (!item) return;
    const url = String(item.getAttribute('data-attachment-url') || '').trim();
    const name = String(item.getAttribute('data-attachment-name') || 'Attachment');
    const type = String(item.getAttribute('data-attachment-type') || '').toLowerCase();
    if (type.indexOf('audio/') === 0) return;
    if (!url || !isPreviewableAttachment(type)) return;
    event.preventDefault();
    openAttachmentViewer({ url: url, name: name, type: type });
  }

  function handleAudioButtonClick(event) {
    const button = event.target.closest('.messages-audio-play');
    if (!button) return false;

    event.preventDefault();
    event.stopPropagation();

    const item = button.closest('[data-attachment-url]');
    const url = String(item?.getAttribute('data-attachment-url') || '').trim();
    const type = String(item?.getAttribute('data-attachment-type') || '').toLowerCase();
    const name = String(item?.getAttribute('data-attachment-name') || button.getAttribute('data-audio-name') || 'audio').trim();
    if (!url || type.indexOf('audio/') !== 0) return true;

    toggleAudioPlayback(button, url, name);
    return true;
  }

  async function handleMessageActionClick(event) {
    const button = event.target.closest('.messages-msg-action-btn[data-message-action]');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();

    const action = String(button.getAttribute('data-message-action') || '').trim();
    const container = button.closest('[data-message-uuid]');
    const messageUuid = String(container?.getAttribute('data-message-uuid') || '').trim();
    if (!action || !messageUuid) return;

    const message = STATE.messages.find(function (row) {
      return String(row?.uuid || '') === messageUuid;
    });
    if (!message) return;

    if (action === 'download') {
      downloadMessageAttachments(message);
      return;
    }

    if (action === 'reply') {
      if (!STATE.selectedRoom?.uuid) {
        showToastIfAvailable('Select a chat room first.', 'error');
        return;
      }

      clearEditContext();
      setReplyContext(message);
      DOM.body?.focus();
      return;
    }

    if (action === 'forward') {
      const chatOptions = (STATE.rooms || []).map(function (room) {
        const roomName = String(room?.display_name || room?.room_name || 'Chat').trim() || 'Chat';
        const roomType = String(room?.room_type || 'group') === 'direct' ? 'Direct' : 'Group';
        const roomUuid = String(room?.uuid || '').trim();
        const subtitle = room.last_message_created_at
          ? 'Last message ' + fmtDateTime(room.last_message_created_at)
          : 'No messages yet';
        const avatarInitial = roomName.charAt(0).toUpperCase() || 'C';
        return {
          value: roomUuid,
          label: roomName,
          meta: roomType + ' • ' + subtitle,
          avatar_initial: avatarInitial,
          avatar_url: String(room?.avatar_url || ''),
        };
      }).filter(function (option) {
        return Boolean(option.value);
      });

      if (!chatOptions.length) {
        showToastIfAvailable('No chats available to forward this message.', 'info');
        return;
      }

      const targetRoomUuids = await openActionDialog({
        title: 'Forward to Chats',
        message: 'Select one or more chats:',
        mode: 'options',
        confirmText: 'Forward',
        options: chatOptions,
        initialValue: '',
      });

      if (targetRoomUuids === null) return;

      const selectedTargets = Array.isArray(targetRoomUuids)
        ? targetRoomUuids
        : [targetRoomUuids];
      const currentRoomUuid = String(STATE.selectedRoom?.uuid || '').trim();
      const uniqueTargets = Array.from(new Set(selectedTargets.map(function (value) {
        return String(value || '').trim();
      }).filter(Boolean)));

      if (!uniqueTargets.length) {
        showToastIfAvailable('Select at least one chat before forwarding.', 'error');
        return;
      }

      const forwardTargets = uniqueTargets.filter(function (targetUuid) {
        return targetUuid !== currentRoomUuid;
      });
      const skippedSelf = uniqueTargets.length - forwardTargets.length;

      if (!forwardTargets.length) {
        showToastIfAvailable('Select at least one different chat to forward this message.', 'error');
        return;
      }

      let failedCount = 0;
      for (const targetUuid of forwardTargets) {
        const response = await ChatAPI.forwardMessage(messageUuid, {
          target_room_uuid: targetUuid,
        }).catch(function () { return null; });
        if (!response?.success) {
          failedCount += 1;
        }
      }

      if (failedCount === forwardTargets.length) {
        showToastIfAvailable('Failed to forward message.', 'error');
        return;
      }

      if (failedCount > 0) {
        showToastIfAvailable('Message forwarded to ' + (forwardTargets.length - failedCount) + ' chat(s); ' + failedCount + ' failed.' + (skippedSelf > 0 ? ' Current chat was skipped.' : ''), 'info');
      } else {
        showToastIfAvailable('Message forwarded to ' + forwardTargets.length + ' chat(s).' + (skippedSelf > 0 ? ' Current chat was skipped.' : ''), 'success');
      }

      await loadData();
      if (STATE.selectedRoom?.uuid) {
        await selectRoom(STATE.selectedRoom.uuid, true);
      }
      return;
    }

    if (action === 'edit') {
      if (!STATE.selectedRoom?.uuid) {
        showToastIfAvailable('Select a chat room first.', 'error');
        return;
      }

      clearReplyContext();
      setEditContext(message);
      DOM.body?.focus();
      return;
    }

    if (action === 'delete') {
      const ok = await openActionDialog({
        title: 'Delete Message',
        message: 'Delete this message?',
        mode: 'confirm',
        confirmText: 'Delete',
      });
      if (!ok) return;

      const response = await ChatAPI.deleteMessage(messageUuid).catch(function () { return null; });
      if (!response?.success) {
        showToastIfAvailable(response?.message || 'Failed to delete message.', 'error');
        return;
      }

      await selectRoom(STATE.selectedRoom?.uuid || '', true);
      await loadData();
      showToastIfAvailable('Message deleted.', 'success');
    }
  }

  function downloadMessageAttachments(message) {
    const attachments = Array.isArray(message?.attachments) ? message.attachments : [];
    if (!attachments.length) {
      showToastIfAvailable('No attachment to download.', 'info');
      return;
    }
    attachments.forEach(function (attachment) {
      const href = buildAttachmentUrl(attachment.file_path || attachment.path || attachment.url || '');
      if (!href) return;

      const link = document.createElement('a');
      link.href = href;
      link.download = String(attachment.file_name || attachment.original_name || 'attachment');
      link.target = '_blank';
      link.rel = 'noreferrer noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });

    showToastIfAvailable('Attachment download started.', 'success');
  }

  function handleAudioTimelineSeek(event) {
    const range = event.target.closest('.messages-audio-range');
    if (!range || !activeAudioTimeline) return;
    const value = Number(range.value || 0);
    const player = getSharedAudioPlayer();
    if (!Number.isFinite(value)) return;
    player.currentTime = Math.max(0, value);
    syncActiveAudioTimeline();
  }

  function getSharedAudioPlayer() {
    if (sharedAudioPlayer) return sharedAudioPlayer;

    sharedAudioPlayer = new Audio();
    sharedAudioPlayer.preload = 'none';
    sharedAudioPlayer.addEventListener('timeupdate', syncActiveAudioTimeline);
    sharedAudioPlayer.addEventListener('loadedmetadata', syncActiveAudioTimeline);
    sharedAudioPlayer.addEventListener('ended', function () {
      resetActiveAudioButton();
      clearActiveAudioTimeline();
    });
    return sharedAudioPlayer;
  }

  function toggleAudioPlayback(button, url, name) {
    const player = getSharedAudioPlayer();
    const wasSameButtonPlaying = activeAudioButton === button && !player.paused;
    const item = button.closest('[data-attachment-url]');

    if (wasSameButtonPlaying) {
      player.pause();
      setAudioButtonState(button, false);
      return;
    }

    if (activeAudioButton && activeAudioButton !== button) {
      setAudioButtonState(activeAudioButton, false);
    }

    activeAudioButton = button;
    setAudioButtonState(button, true);
    setActiveAudioTimeline(item);

    if (player.src !== url) {
      player.src = url;
    }

    player.play().catch(function () {
      setAudioButtonState(button, false);
      activeAudioButton = null;
      showToastIfAvailable('Unable to play this audio file.', 'error');
    });
  }

  function setAudioButtonState(button, isPlaying) {
    if (!button) return;
    const icon = button.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-play', !isPlaying);
      icon.classList.toggle('fa-pause', isPlaying);
    }

    const name = String(button.getAttribute('data-audio-name') || 'audio');
    button.setAttribute('aria-label', (isPlaying ? 'Pause ' : 'Play ') + name);
  }

  function resetActiveAudioButton() {
    if (!activeAudioButton) return;
    setAudioButtonState(activeAudioButton, false);
    activeAudioButton = null;
  }

  function setActiveAudioTimeline(item) {
    const timeline = item?.querySelector('.messages-audio-timeline');
    if (!timeline) {
      clearActiveAudioTimeline();
      return;
    }

    if (activeAudioTimeline?.container && activeAudioTimeline.container !== timeline) {
      activeAudioTimeline.container.classList.add('messages-hidden');
    }

    timeline.classList.remove('messages-hidden');
    activeAudioTimeline = {
      container: timeline,
      current: timeline.querySelector('.messages-audio-current'),
      range: timeline.querySelector('.messages-audio-range'),
      duration: timeline.querySelector('.messages-audio-duration'),
    };
    syncActiveAudioTimeline();
  }

  function clearActiveAudioTimeline() {
    if (!activeAudioTimeline?.container) {
      activeAudioTimeline = null;
      return;
    }

    activeAudioTimeline.container.classList.add('messages-hidden');
    if (activeAudioTimeline.current) activeAudioTimeline.current.textContent = '0:00';
    if (activeAudioTimeline.duration) activeAudioTimeline.duration.textContent = '0:00';
    if (activeAudioTimeline.range) {
      activeAudioTimeline.range.max = '0';
      activeAudioTimeline.range.value = '0';
    }
    activeAudioTimeline = null;
  }

  function syncActiveAudioTimeline() {
    if (!activeAudioTimeline) return;

    const player = getSharedAudioPlayer();
    const duration = Number.isFinite(player.duration) ? player.duration : 0;
    const current = Number.isFinite(player.currentTime) ? player.currentTime : 0;

    if (activeAudioTimeline.current) activeAudioTimeline.current.textContent = formatAudioTime(current);
    if (activeAudioTimeline.duration) activeAudioTimeline.duration.textContent = formatAudioTime(duration);
    if (activeAudioTimeline.range) {
      activeAudioTimeline.range.max = String(duration || 0);
      activeAudioTimeline.range.value = String(Math.min(current, duration || current || 0));
    }
  }

  function formatAudioTime(seconds) {
    const totalSeconds = Math.max(0, Math.floor(Number(seconds || 0)));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return mins + ':' + String(secs).padStart(2, '0');
  }

  function isPreviewableAttachment(type) {
    const mimeType = String(type || '').toLowerCase();
    return mimeType.indexOf('image/') === 0 || mimeType.indexOf('video/') === 0 || mimeType.indexOf('application/pdf') === 0;
  }

  function openAttachmentViewer(attachment) {
    if (!DOM.viewerModal || !DOM.viewerBody) return;

    const url = String(attachment?.url || '').trim();
    const name = String(attachment?.name || 'Attachment');
    const type = String(attachment?.type || '').toLowerCase();
    if (!url || !isPreviewableAttachment(type)) return;

    if (DOM.viewerTitle) DOM.viewerTitle.textContent = name;
    if (DOM.viewerMeta) DOM.viewerMeta.textContent = type || 'Preview attachment';

    if (type.indexOf('image/') === 0) {
      DOM.viewerBody.innerHTML = '<img src="' + esc(url) + '" alt="' + esc(name) + '" />';
    } else if (type.indexOf('video/') === 0) {
      DOM.viewerBody.innerHTML = '<video controls autoplay playsinline src="' + esc(url) + '"></video>';
    } else if (type.indexOf('audio/') === 0) {
      DOM.viewerBody.innerHTML = '<audio controls autoplay src="' + esc(url) + '"></audio>';
    } else if (type.indexOf('application/pdf') === 0) {
      DOM.viewerBody.innerHTML = '<iframe class="messages-viewer-frame" src="' + esc(url) + '" title="' + esc(name) + '"></iframe>';
    } else {
      DOM.viewerBody.innerHTML = '<div class="messages-viewer-placeholder">This file type cannot be previewed.</div>';
      return;
    }

    DOM.viewerModal.classList.add('open');
    DOM.viewerModal.setAttribute('aria-hidden', 'false');
  }

  function closeAttachmentViewer() {
    if (!DOM.viewerModal || !DOM.viewerBody) return;
    DOM.viewerModal.classList.remove('open');
    DOM.viewerModal.setAttribute('aria-hidden', 'true');
    DOM.viewerBody.innerHTML = '<div class="messages-viewer-placeholder">Select an attachment to preview it here.</div>';
  }

  function renderThreadPlaceholder(message, options) {
    if (DOM.messagesList) {
      DOM.messagesList.innerHTML = '<div class="messages-thread-empty"> <i class="fa-regular fa-folder-open"></i> ' + esc(message) + '</div>';
    }

    syncLoadMoreButtonVisibility();

    if (options?.resetHeader) {
      setText('admMessagesThreadTitle', 'No chat selected');
      setText('admMessagesThreadSubtitle', 'Select a room to open the conversation.');
      DOM.threadActions?.classList.add('messages-hidden');
      DOM.threadActionMenu?.classList.add('messages-hidden');
    }

    setButtonsEnabled(Boolean(STATE.selectedRoom));
  }

  function renderRoomPlaceholder(message) {
    if (DOM.roomList) {
      DOM.roomList.innerHTML = '<div class="messages-empty"> <i class="fa-regular fa-folder-open"></i> ' + esc(message) + '</div>';
    }
  }

  function setButtonsEnabled(enabled) {
    if (DOM.markReadBtn) DOM.markReadBtn.disabled = !enabled;
    if (DOM.deleteBtn) DOM.deleteBtn.disabled = !enabled;
    if (DOM.sendBtn) DOM.sendBtn.disabled = !enabled;
    if (DOM.attachBtn) DOM.attachBtn.disabled = !enabled;
    if (DOM.body) DOM.body.disabled = !enabled;
    if (DOM.composer) DOM.composer.classList.toggle('messages-hidden', !enabled);
  }

  function syncLoadMoreButtonVisibility() {
    if (!DOM.loadMoreBtn || !DOM.messagesViewer) return;
    const hasScrollableContent = DOM.messagesViewer.scrollHeight > DOM.messagesViewer.clientHeight + 8;
    const nearTop = DOM.messagesViewer.scrollTop <= 8;
    const isScrolledToBottom =
      Math.round(DOM.messagesViewer.scrollTop + DOM.messagesViewer.clientHeight) >=
      DOM.messagesViewer.scrollHeight;
    DOM.loadMoreBtn.style.display = hasScrollableContent && !isScrolledToBottom ? 'flex' : 'none';
  }

  function handleLoadMoreButtonClick() {
    if (!DOM.messagesViewer) return;
    const step = Math.max(220, Math.floor(DOM.messagesViewer.clientHeight * 0.85));
    DOM.messagesViewer.scrollBy({ top: DOM.messagesViewer.scrollHeight, behavior: 'smooth' });
  }

  async function sendMessage() {
    if (STATE.sending || !STATE.selectedRoom) return;
    const isEditMode = Boolean(STATE.editContext?.messageUuid);
    const body = String(DOM.body?.value || '').trim();
    const attachments = Array.isArray(STATE.pendingAttachments) ? STATE.pendingAttachments.slice() : [];
    if (isEditMode && attachments.length) {
      showToastIfAvailable('Attachments are not supported while editing a message.', 'error');
      return;
    }
    if (!body && !attachments.length) {
      showToastIfAvailable(isEditMode ? 'Message text is required for update.' : 'Write a message first.', 'error');
      return;
    }

    STATE.sending = true;
    try {
      let response;
      if (isEditMode) {
        response = await ChatAPI.editMessage(String(STATE.editContext.messageUuid), {
          message_text: body,
        });
      } else {
        response = await ChatAPI.sendMessage(STATE.selectedRoom.uuid, {
          message_type: attachments.length ? (body ? 'mixed' : 'attachment') : 'text',
          message_text: body || null,
          attachments: attachments,
          reply_to_message_id: Number(STATE.replyContext?.messageId || 0) || null,
        });
      }

      if (!response?.success) {
        showToastIfAvailable(response?.message || (isEditMode ? 'Failed to update message.' : 'Failed to send message.'), 'error');
        return;
      }

      DOM.body.value = '';
      STATE.pendingAttachments = [];
      clearReplyContext();
      clearEditContext();
      syncAttachmentSummary();
      await markSelectedRoomRead();
      await selectRoom(STATE.selectedRoom.uuid, true);
      await loadData();
      showToastIfAvailable(isEditMode ? 'Message updated.' : 'Message sent successfully.', 'success');
    } catch (error) {
      console.error('Send message error:', error);
      showToastIfAvailable(isEditMode ? 'Failed to update message.' : 'Failed to send message.', 'error');
    } finally {
      STATE.sending = false;
      handleLoadMoreButtonClick();
    }
  }

  async function markSelectedRoomRead() {
    if (!STATE.selectedRoom) return;
    DOM.threadActionMenu?.classList.add('messages-hidden');
    const lastMessage = STATE.messages[STATE.messages.length - 1];
    if (!lastMessage) {
      return;
    }

    await ChatAPI.markAsRead(lastMessage.uuid).catch(function () { return null; });
    await loadData();
    if (STATE.selectedRoom?.uuid) {
      await selectRoom(STATE.selectedRoom.uuid, true);
    }
  }

  async function deleteSelectedRoom() {
    if (!STATE.selectedRoom) return;
    DOM.threadActionMenu?.classList.add('messages-hidden');
    const ok = await openActionDialog({
      title: 'Leave Chat',
      message: 'Leave this chat?',
      mode: 'confirm',
      confirmText: 'Leave',
    });
    if (!ok) return;

    const roomUuid = String(STATE.selectedRoom?.uuid || '').trim();
    const currentUserId = Number(STATE.currentUser?.user_id || 0);
    if (!roomUuid || currentUserId <= 0) {
      showToastIfAvailable('Unable to leave chat right now.', 'error');
      return;
    }

    const response = await ChatAPI.removeMember(roomUuid, currentUserId).catch(function () { return null; });
    if (!response?.success) {
      showToastIfAvailable(response?.message || 'Failed to leave chat.', 'error');
      return;
    }

    clearReplyContext();
    clearEditContext();
    STATE.selectedRoom = null;
    STATE.messages = [];
    renderThreadPlaceholder('Select a room to open the conversation.', { resetHeader: true });
    await loadData();
    showToastIfAvailable('Left chat successfully.', 'success');
  }

  function closeSelectedRoom() {
    DOM.threadActionMenu?.classList.add('messages-hidden');
    if (!STATE.selectedRoom) return;

    clearReplyContext();
    clearEditContext();
    STATE.selectedRoom = null;
    STATE.messages = [];
    renderRooms();
    renderThreadPlaceholder('Select a room to open the conversation.', { resetHeader: true });
  }

  async function showSelectedRoomInfo() {
    DOM.threadActionMenu?.classList.add('messages-hidden');
    const room = STATE.selectedRoom;
    if (!room) return;

    if (String(room.room_type || '') === 'direct') {
      await showDirectRoomInfo(room);
      return;
    }

    await showGroupRoomInfo(room);
  }

  async function showGroupRoomInfo(room) {
    const currentUserId = Number(STATE.currentUser?.user_id || 0);
    const roomUuid = String(room?.uuid || '').trim();
    if (!roomUuid || currentUserId <= 0) {
      showToastIfAvailable('Unable to load group chat information.', 'error');
      return;
    }

    while (true) {
      const roomResponse = await ChatAPI.getRoom(roomUuid).catch(function () { return null; });
      const roomDetails = roomResponse?.data?.room || roomResponse?.room || room || null;
      const members = Array.isArray(roomDetails?.members) ? roomDetails.members : [];
      const memberRole = String(members.find(function (member) {
        return Number(member?.user_id || 0) === currentUserId;
      })?.member_role || '').trim().toLowerCase();
      const canManage = memberRole === 'admin';
      const roomName = String(roomDetails?.display_name || roomDetails?.room_name || 'Group chat').trim() || 'Group chat';
      const roomDescription = String(roomDetails?.room_description || 'No description yet.').trim() || 'No description yet.';
      const roomAvatar = buildUploadUrl(roomDetails?.display_avatar || roomDetails?.room_avatar || '');
      const avatarInitial = roomName.charAt(0).toUpperCase() || 'G';
      const lastActivity = roomDetails?.last_message_created_at ? fmtDateTime(roomDetails.last_message_created_at) : 'No messages yet';
      const memberSearchId = 'admMessagesGroupMemberSearchField';
      const memberListId = 'admMessagesGroupMemberList';
      const groupActionsHtml = canManage
        ? '<div class="messages-actions-row" style="justify-content:flex-start; margin-top:.85rem">'
          + '<button type="button" class="btn-secondary" data-group-action="change-avatar">Change group avatar</button>'
          + '<button type="button" class="btn-secondary" data-group-action="edit-group">Edit group details</button>'
          + '<button type="button" class="btn-secondary" data-group-action="add-members">Add members</button>'
          + '<button type="button" class="btn-secondary" data-group-action="remove-members">Remove members</button>'
          + '<button type="button" class="btn-secondary" data-group-action="make-admin">Make admin</button>'
          + '<button type="button" class="btn-secondary" data-group-action="remove-admin">Remove admin</button>'
          + '</div>'
        : '';

      const selectedAction = await openActionDialog({
        title: 'Chat Information',
        messageHtml: buildGroupInfoHtml({
          name: roomName,
          description: roomDescription,
          avatarUrl: roomAvatar,
          avatarInitial: avatarInitial,
          roomType: 'Group',
          lastActivity: lastActivity,
          members: members,
          canManage: canManage,
          memberSearchId: memberSearchId,
          memberListId: memberListId,
          groupActionsHtml: groupActionsHtml,
        }),
        mode: 'confirm',
        confirmText: 'Close',
        onOpen: function () {
          const modal = DOM.actionModal;
          const searchInput = modal?.querySelector('#' + memberSearchId);
          const memberList = modal?.querySelector('#' + memberListId);

          if (searchInput && memberList) {
            searchInput.addEventListener('input', function () {
              renderGroupMemberRows(memberList, members, String(searchInput.value || ''));
            });
            renderGroupMemberRows(memberList, members, '');
          }

          modal?.querySelectorAll('[data-group-main-action]').forEach(function (button) {
            button.addEventListener('click', function () {
              const action = String(button.getAttribute('data-group-main-action') || '').trim();
              closeActionDialog(action);
            });
          });

          modal?.querySelectorAll('[data-group-action]').forEach(function (button) {
            button.addEventListener('click', function () {
              const action = String(button.getAttribute('data-group-action') || '').trim();
              closeActionDialog(action);
            });
          });
        },
      });

      if (!selectedAction || selectedAction === true) {
        return;
      }

      const roomInfo = {
        uuid: roomUuid,
        room_id: Number(roomDetails?.room_id || room.room_id || 0),
        name: roomName,
        description: roomDescription,
        avatar: roomDetails?.room_avatar || roomDetails?.display_avatar || '',
        members: members,
      };

      if (selectedAction === 'view-media') {
        await viewSelectedRoomMedia();
        continue;
      }

      if (selectedAction === 'report-group') {
        await reportGroupToInstitutionAdmins(roomDetails);
        continue;
      }

      if (selectedAction === 'edit-group') {
        await handleEditGroupDetails(roomInfo);
        continue;
      }

      if (selectedAction === 'change-avatar') {
        await handleChangeGroupAvatar(roomInfo);
        continue;
      }

      if (selectedAction === 'add-members') {
        await handleAddGroupMembers(roomInfo);
        continue;
      }

      if (selectedAction === 'remove-members') {
        await handleRemoveGroupMembers(roomInfo);
        continue;
      }

      if (selectedAction === 'make-admin') {
        await handlePromoteGroupMembers(roomInfo);
        continue;
      }

      if (selectedAction === 'remove-admin') {
        await handleDemoteGroupAdmins(roomInfo);
        continue;
      }

      return;
    }
  }


  function buildGroupInfoHtml(data) {
    const name = String(data?.name || 'Group chat').trim() || 'Group chat';
    const description = String(data?.description || 'No description yet.').trim() || 'No description yet.';
    const avatarUrl = String(data?.avatarUrl || '').trim();
    const avatarInitial = String(data?.avatarInitial || name.charAt(0) || 'G').trim().charAt(0).toUpperCase() || 'G';
    const roomType = String(data?.roomType || 'Group').trim() || 'Group';
    const lastActivity = String(data?.lastActivity || 'No messages yet').trim() || 'No messages yet';
    const members = Array.isArray(data?.members) ? data.members : [];
    const totalMembers = members.length;
    const adminCount = members.filter(function (member) {
      return String(member?.member_role || '').trim().toLowerCase() === 'admin';
    }).length;
    const avatarMarkup = avatarUrl
      ? '<img src="' + esc(avatarUrl) + '" alt="' + esc(name) + '" />'
      : esc(avatarInitial);

    return '<div class="messages-chat-info-card" style="align-items:flex-start">'
      + '<div class="messages-avatar">' + avatarMarkup + '</div>'
      + '<div style="min-width:0; flex:1">'
      + '<p class="messages-chat-info-name">' + esc(name) + '</p>'
      + '<p class="messages-chat-info-email">Chat type: ' + esc(roomType) + '</p>'
      + '<p class="messages-chat-info-meta">' + esc(description) + '</p>'
      + '<p class="messages-chat-info-meta">Members: ' + totalMembers + ' • Admins: ' + adminCount + ' • Last activity: ' + esc(lastActivity) + '</p>'
      + '<div class="messages-actions-row" style="justify-content:flex-start; margin-top:.65rem">'
      + '<button type="button" class="btn-secondary" data-group-main-action="view-media">View Group Media</button>'
      + '<button type="button" class="btn-secondary" data-group-main-action="report-group">Report Group</button>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '<div class="messages-compose-row" style="margin-top:1rem">'
      + '<label>Search members</label>'
      + '<input id="' + esc(data?.memberSearchId || '') + '" class="messages-input" type="search" placeholder="Search by name or email" style="padding:10px" />'
      + '</div>'
      + '<div id="' + esc(data?.memberListId || '') + '" class="messages-group-member-list"></div>'
      + data?.groupActionsHtml 
      + (data?.canManage ? '<div class="messages-note" style="margin-top:.85rem">Admins can rename the group, edit the description, add members, remove members, and promote another member to admin.</div>' : '');
  }

  function renderGroupMemberRows(container, members, query) {
    if (!container) return;
    const search = String(query || '').trim().toLowerCase();
    const filtered = (Array.isArray(members) ? members : []).filter(function (member) {
      if (!search) return true;
      const text = [displayName(member), member?.email, member?.member_role].join(' ').toLowerCase();
      return text.indexOf(search) !== -1;
    });

    if (!filtered.length) {
      container.innerHTML = '<div class="messages-empty">No group members found.</div>';
      return;
    }

    container.innerHTML = filtered.map(function (member) {
      const avatarUrl = buildUploadUrl(member?.profile_photo || member?.avatar_url || '');
      const name = displayName(member);
      const email = String(member?.email || '').trim() || 'Unavailable';
      const role = String(member?.member_role || 'member').trim().toLowerCase();
      const tag = role === 'admin' ? '<span class="messages-badge unread" style="margin-left:.5rem">Admin</span>' : '';
      const avatarMarkup = avatarUrl
        ? '<img src="' + esc(avatarUrl) + '" alt="' + esc(name) + '" />'
        : esc(name.charAt(0).toUpperCase() || 'M');

      return '<div class="messages-room-item" style="border-radius:12px; margin-bottom:.5rem; border:1px solid #e2e8f0">'
        + '<div class="messages-avatar">' + avatarMarkup + '</div>'
        + '<div class="messages-room-main">'
        + '<div class="messages-room-top"><h4 class="messages-room-title">' + esc(name) + '</h4>' + tag + '</div>'
        + '<p class="messages-room-meta">' + esc(email) + '</p>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  async function handleEditGroupDetails(roomInfo) {
    if (!roomInfo?.uuid) return;

    const currentName = String(roomInfo.name || '').trim();
    const currentDescription = String(roomInfo.description || '').trim();
    const nameValue = await openActionDialog({
      title: 'Edit Group Name',
      message: 'Update the group name:',
      mode: 'input',
      initialValue: currentName,
      confirmText: 'Next',
    });
    if (nameValue === null) return;

    const descriptionValue = await openActionDialog({
      title: 'Edit Group Description',
      message: 'Update the group description:',
      mode: 'input',
      initialValue: currentDescription,
      confirmText: 'Save',
    });
    if (descriptionValue === null) return;

    const response = await ChatAPI.updateRoom(roomInfo.uuid, {
      room_name: String(nameValue || '').trim(),
      room_description: String(descriptionValue || '').trim(),
    }).catch(function () { return null; });

    if (!response?.success) {
      showToastIfAvailable(response?.message || 'Failed to update group details.', 'error');
      return;
    }

    showToastIfAvailable('Group details updated.', 'success');
    await loadData();
    if (STATE.selectedRoom?.uuid) {
      await selectRoom(STATE.selectedRoom.uuid, true);
    }
  }

  async function handleChangeGroupAvatar(roomInfo) {
    if (!roomInfo?.uuid) return;

    const file = await pickImageFile();
    if (!file) return;

    if (!String(file.type || '').toLowerCase().startsWith('image/')) {
      showToastIfAvailable('Please select an image file.', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'chat-avatars');

      const uploadResponse = await FileAPI.upload(formData).catch(function () { return null; });
      const uploadData = uploadResponse?.data || uploadResponse || {};
      const filePath = String(uploadData.path || '').trim();
      if (!filePath) {
        showToastIfAvailable('Avatar upload completed, but no file path was returned.', 'error');
        return;
      }

      const response = await ChatAPI.updateRoom(roomInfo.uuid, {
        room_avatar: filePath,
      }).catch(function () { return null; });

      if (!response?.success) {
        showToastIfAvailable(response?.message || 'Failed to update group avatar.', 'error');
        return;
      }

      await loadData();
      if (STATE.selectedRoom?.uuid) {
        await selectRoom(STATE.selectedRoom.uuid, true);
      }
      showToastIfAvailable('Group avatar updated.', 'success');
    } catch (error) {
      console.error('Group avatar update error:', error);
      showToastIfAvailable('Failed to update group avatar.', 'error');
    }
  }

  async function handleAddGroupMembers(roomInfo) {
    if (!roomInfo?.uuid) return;
    const users = STATE.users.filter(function (user) {
      return Number(user?.user_id || 0) !== Number(STATE.currentUser?.user_id || 0);
    });
    const selectedIds = await openSelectionDialog('Add Members', 'Select users to add:', users, true);
    if (!selectedIds || !selectedIds.length) return;

    const response = await ChatAPI.addMembers(roomInfo.uuid, {
      member_ids: selectedIds,
      member_role: 'member',
    }).catch(function () { return null; });

    if (!response?.success) {
      showToastIfAvailable(response?.message || 'Failed to add members.', 'error');
      return;
    }

    showToastIfAvailable('Members added to group.', 'success');
    await loadData();
    if (STATE.selectedRoom?.uuid) await selectRoom(STATE.selectedRoom.uuid, true);
  }

  async function handleRemoveGroupMembers(roomInfo) {
    if (!roomInfo?.uuid) return;
    const currentUserId = Number(STATE.currentUser?.user_id || 0);
    const members = (Array.isArray(roomInfo.members) ? roomInfo.members : []).filter(function (member) {
      return Number(member?.user_id || 0) !== currentUserId;
    });
    const selectedIds = await openSelectionDialog('Remove Members', 'Select members to remove:', members, true, true);
    if (!selectedIds || !selectedIds.length) return;

    let removed = 0;
    for (const memberId of selectedIds) {
      const response = await ChatAPI.removeMember(roomInfo.uuid, memberId).catch(function () { return null; });
      if (response?.success) removed += 1;
    }

    if (!removed) {
      showToastIfAvailable('Failed to remove selected members.', 'error');
      return;
    }

    showToastIfAvailable('Members removed from group.', 'success');
    await loadData();
    if (STATE.selectedRoom?.uuid) await selectRoom(STATE.selectedRoom.uuid, true);
  }

  async function handlePromoteGroupMembers(roomInfo) {
    if (!roomInfo?.uuid) return;
    const currentUserId = Number(STATE.currentUser?.user_id || 0);
    const members = (Array.isArray(roomInfo.members) ? roomInfo.members : []).filter(function (member) {
      return Number(member?.user_id || 0) !== currentUserId;
    });
    const selectedIds = await openSelectionDialog('Make Admin', 'Select members to promote:', members, true);
    if (!selectedIds || !selectedIds.length) return;

    const response = await ChatAPI.addMembers(roomInfo.uuid, {
      member_ids: selectedIds,
      member_role: 'admin',
    }).catch(function () { return null; });

    if (!response?.success) {
      showToastIfAvailable(response?.message || 'Failed to promote selected members.', 'error');
      return;
    }

    showToastIfAvailable('Member promoted to admin.', 'success');
    await loadData();
    if (STATE.selectedRoom?.uuid) await selectRoom(STATE.selectedRoom.uuid, true);
  }

  async function handleDemoteGroupAdmins(roomInfo) {
    if (!roomInfo?.uuid) return;

    const currentUserId = Number(STATE.currentUser?.user_id || 0);
    const admins = (Array.isArray(roomInfo.members) ? roomInfo.members : []).filter(function (member) {
      const memberId = Number(member?.user_id || 0);
      const role = String(member?.member_role || '').trim().toLowerCase();
      return memberId > 0 && memberId !== currentUserId && role === 'admin';
    });

    if (!admins.length) {
      showToastIfAvailable('No other admins available to remove.', 'info');
      return;
    }

    const selectedIds = await openSelectionDialog('Remove Admin', 'Select admins to demote to member:', admins, true);
    if (!selectedIds || !selectedIds.length) return;

    const response = await ChatAPI.addMembers(roomInfo.uuid, {
      member_ids: selectedIds,
      member_role: 'member',
    }).catch(function () { return null; });

    if (!response?.success) {
      showToastIfAvailable(response?.message || 'Failed to remove admin role.', 'error');
      return;
    }

    showToastIfAvailable('Admin role removed.', 'success');
    await loadData();
    if (STATE.selectedRoom?.uuid) await selectRoom(STATE.selectedRoom.uuid, true);
  }

  async function reportGroupToInstitutionAdmins(roomDetails) {
    const admins = (STATE.users || []).filter(function (user) {
      if (Number(user?.user_id || 0) === Number(STATE.currentUser?.user_id || 0)) return false;
      return isAdminLikeUser(user);
    });

    if (!admins.length) {
      showToastIfAvailable('No institution admins available to receive this report.', 'info');
      return;
    }

    const ok = await openActionDialog({
      title: 'Report Group',
      message: 'Send this group report to institution admins?',
      mode: 'confirm',
      confirmText: 'Report',
    });
    if (!ok) return;

    const groupName = String(roomDetails?.display_name || roomDetails?.room_name || 'Group chat').trim() || 'Group chat';
    const reportMessage = 'Group chat report: ' + groupName + ' (ID: ' + String(roomDetails?.room_id || '') + ').';
    let delivered = 0;

    for (const admin of admins) {
      const response = await createNotification({
        user_id: Number(admin?.user_id || 0),
        title: 'Reported group chat',
        message: reportMessage,
        notification_type: 'Chat report',
        target_role: 'admin',
      }).catch(function () { return null; });

      if (response?.success) delivered += 1;
    }

    if (!delivered) {
      showToastIfAvailable('Failed to send group report.', 'error');
      return;
    }

    showToastIfAvailable('Group report sent to ' + delivered + ' institution admin(s).', 'success');
  }

  async function openSelectionDialog(title, message, rows, allowMultiple, useMemberRole) {
    const options = Array.isArray(rows) ? rows.map(function (row) {
      const value = String(row?.user_id || row?.value || '').trim();
      const label = displayName(row);
      const meta = String(row?.email || row?.member_role || '').trim();
      return {
        value: value,
        label: label,
        meta: meta,
        avatar_url: buildUploadUrl(row?.profile_photo || row?.avatar_url || ''),
        avatar_initial: label.charAt(0).toUpperCase() || 'U',
      };
    }) : [];

    const selected = await openActionDialog({
      title: title,
      message: message,
      mode: 'options',
      confirmText: allowMultiple ? 'Continue' : 'Continue',
      allowMultiple: allowMultiple !== false,
      searchPlaceholder: 'Search users...',
      options: options,
    });

    if (!selected) return null;
    const ids = Array.isArray(selected) ? selected.map(function (value) { return Number(value || 0); }).filter(Boolean) : [Number(selected || 0)].filter(Boolean);
    return ids;
  }

  async function showDirectRoomInfo(room) {
    const currentUserId = Number(STATE.currentUser?.user_id || 0);
    const roomUuid = String(room?.uuid || '').trim();
    if (!roomUuid || currentUserId <= 0) {
      showToastIfAvailable('Unable to load direct chat information.', 'error');
      return;
    }

    const roomResponse = await ChatAPI.getRoom(roomUuid).catch(function () { return null; });
    const roomDetails = roomResponse?.data?.room || roomResponse?.room || null;
    const members = Array.isArray(roomDetails?.members) ? roomDetails.members : [];
    const peer = members.find(function (member) {
      return Number(member?.user_id || 0) !== currentUserId;
    }) || findDirectPeerFromState(room, currentUserId);

    const peerUserId = Number(peer?.user_id || 0);
    const peerName = String(displayName(peer) || room.display_name || 'User').trim();
    const peerEmail = String(peer?.email || '').trim() || 'Unavailable';
    const avatarUrl = buildUploadUrl(peer?.profile_photo || room.display_avatar || room.room_avatar || '');
    const lastActivity = room.last_message_created_at ? fmtDateTime(room.last_message_created_at) : 'No messages yet';

    while (true) {
      const selectedAction = await openActionDialog({
        title: 'Chat Information',
        messageHtml: buildDirectInfoHtml({
          name: peerName,
          email: peerEmail,
          avatarUrl: avatarUrl,
          avatarInitial: peerName.charAt(0).toUpperCase() || 'U',
          lastActivity: lastActivity,
        }),
        mode: 'options',
        allowMultiple: false,
        confirmText: 'Open',
        searchPlaceholder: 'Search actions...',
        options: [
          { value: 'view_media', label: 'View Chat Media', meta: 'Open shared attachments in this chat' },
          { value: 'create_group', label: 'Create Group with ' + peerName, meta: 'Start a new group chat with this user' },
          { value: 'report_user', label: 'Report ' + peerName, meta: 'Send report notification to institution admins' },
        ],
      });

      if (!selectedAction) {
        return;
      }

      if (selectedAction === 'view_media') {
        await viewSelectedRoomMedia();
        continue;
      }

      if (selectedAction === 'report_user') {
        await reportDirectUserToInstitutionAdmins(peerUserId, peerName, room);
        continue;
      }

      if (selectedAction === 'create_group') {
        const groupResult = await createGroupWithDirectUser(peerUserId, peerName);
        if (groupResult === 'cancelled') {
          continue;
        }
        return;
      }
    }
  }

  function buildDirectInfoHtml(data) {
    const name = String(data?.name || 'User').trim() || 'User';
    const email = String(data?.email || 'Unavailable').trim() || 'Unavailable';
    const avatarUrl = String(data?.avatarUrl || '').trim();
    const avatarInitial = String(data?.avatarInitial || name.charAt(0) || 'U').trim().charAt(0).toUpperCase() || 'U';
    const lastActivity = String(data?.lastActivity || 'No messages yet').trim() || 'No messages yet';
    const avatarMarkup = avatarUrl
      ? '<img src="' + esc(avatarUrl) + '" alt="' + esc(name) + '" />'
      : esc(avatarInitial);

    return '<div class="messages-chat-info-card">'
      + '<div class="messages-avatar">' + avatarMarkup + '</div>'
      + '<div>'
      + '<p class="messages-chat-info-name">' + esc(name) + '</p>'
      + '<p class="messages-chat-info-email">' + esc(email) + '</p>'
      + '<p class="messages-chat-info-meta">Last activity: ' + esc(lastActivity) + '</p>'
      + '</div>'
      + '</div>';
  }

  function findDirectPeerFromState(room, currentUserId) {
    const first = Number(room?.direct_user_1 || 0);
    const second = Number(room?.direct_user_2 || 0);
    const peerUserId = first === currentUserId ? second : first;
    if (peerUserId <= 0) return null;

    return STATE.users.find(function (user) {
      return Number(user?.user_id || 0) === peerUserId;
    }) || null;
  }

  async function viewSelectedRoomMedia() {
    const mediaItems = collectRoomMediaItems();
    if (!mediaItems.length) {
      showToastIfAvailable('No shared media in this chat yet.', 'info');
      return;
    }

    const selectedIndex = await openActionDialog({
      title: 'View Chat Media',
      message: 'Select a media item to open:',
      mode: 'options',
      allowMultiple: false,
      confirmText: 'Open',
      searchPlaceholder: 'Search media...',
      options: mediaItems.map(function (item, index) {
        return {
          value: String(index),
          label: item.fileName,
          meta: item.meta,
          avatar_initial: item.icon,
        };
      }),
    });

    if (selectedIndex === null || selectedIndex === '') return;

    const item = mediaItems[Number(selectedIndex)];
    if (!item?.url) return;

    if (isPreviewableAttachment(item.type)) {
      openAttachmentViewer({
        url: item.url,
        name: item.fileName,
        type: item.type,
      });
      await waitForAttachmentViewerClose();
      return;
    }

    window.open(item.url, '_blank', 'noopener,noreferrer');
  }

  function waitForAttachmentViewerClose() {
    return new Promise(function (resolve) {
      const modal = DOM.viewerModal;
      if (!modal || !modal.classList.contains('open')) {
        resolve();
        return;
      }

      const observer = new MutationObserver(function () {
        const stillOpen = modal.classList.contains('open') && modal.getAttribute('aria-hidden') !== 'true';
        if (!stillOpen) {
          observer.disconnect();
          resolve();
        }
      });

      observer.observe(modal, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });
    });
  }

  function collectRoomMediaItems() {
    const rows = Array.isArray(STATE.messages) ? STATE.messages : [];
    const media = [];

    rows.forEach(function (message) {
      const attachments = Array.isArray(message?.attachments) ? message.attachments : [];
      attachments.forEach(function (attachment) {
        const type = String(attachment?.mime_type || '').toLowerCase();
        const isMedia = type.indexOf('image/') === 0
          || type.indexOf('video/') === 0
          || type.indexOf('audio/') === 0
          || type.indexOf('application/pdf') === 0;
        if (!isMedia) return;

        const url = buildAttachmentUrl(attachment?.file_path || attachment?.path || attachment?.url || '');
        if (!url) return;

        const fileName = String(attachment?.file_name || attachment?.original_name || 'Media file').trim() || 'Media file';
        const sender = String(message?.sender_name || 'Member').trim() || 'Member';
        const createdAt = message?.created_at ? fmtDateTime(message.created_at) : 'Unknown time';
        media.push({
          url: url,
          type: type,
          fileName: fileName,
          icon: type.indexOf('image/') === 0 ? 'I' : (type.indexOf('video/') === 0 ? 'V' : (type.indexOf('audio/') === 0 ? 'A' : 'P')),
          meta: sender + ' • ' + createdAt,
        });
      });
    });

    return media;
  }

  async function createGroupWithDirectUser(peerUserId, peerName) {
    const memberUserId = Number(peerUserId || 0);
    if (memberUserId <= 0) {
      showToastIfAvailable('Unable to identify this user for group creation.', 'error');
      return 'error';
    }

    const defaultName = String(peerName || 'New Group').trim() || 'New Group';
    const groupNameInput = await openActionDialog({
      title: 'Create Group with ' + peerName,
      message: 'Enter group name:',
      mode: 'input',
      initialValue: defaultName,
      confirmText: 'Create',
    });

    if (groupNameInput === null) return 'cancelled';

    const groupName = String(groupNameInput || '').trim();
    if (!groupName) {
      showToastIfAvailable('Group name is required.', 'error');
      return 'invalid';
    }

    const response = await ChatAPI.createRoom({
      room_type: 'group',
      room_name: groupName,
      category_type: 'custom',
      member_ids: [memberUserId],
    }).catch(function () { return null; });

    if (!response?.success) {
      showToastIfAvailable(response?.message || 'Failed to create group chat.', 'error');
      return 'error';
    }

    await loadData();
    const createdRoom = pickCreatedGroupRoom(response, groupName);
    if (createdRoom?.uuid) {
      await selectRoom(String(createdRoom.uuid), true);
    }
    showToastIfAvailable('Group chat created successfully.', 'success');
    return 'created';
  }

  async function reportDirectUserToInstitutionAdmins(peerUserId, peerName, room) {
    const reportedUserId = Number(peerUserId || 0);
    if (reportedUserId <= 0) {
      showToastIfAvailable('Unable to report this user right now.', 'error');
      return;
    }

    const currentUserId = Number(STATE.currentUser?.user_id || 0);
    const institutionId = Number(STATE.currentUser?.institution_id || 0);
    const admins = (STATE.users || []).filter(function (user) {
      const candidateId = Number(user?.user_id || 0);
      if (candidateId <= 0 || candidateId === currentUserId) return false;
      if (institutionId > 0 && Number(user?.institution_id || 0) !== institutionId) return false;
      return isAdminLikeUser(user);
    });

    if (!admins.length) {
      showToastIfAvailable('No institution admins available to receive this report.', 'info');
      return;
    }

    const ok = await openActionDialog({
      title: 'Report ' + peerName,
      message: 'Send this user report to institution admins?',
      mode: 'confirm',
      confirmText: 'Report',
    });
    if (!ok) return;

    const reporterName = String(displayName(STATE.currentUser) || 'Admin').trim() || 'Admin';
    const chatName = String(room?.display_name || room?.room_name || 'Direct chat').trim() || 'Direct chat';
    const reportMessage = reporterName + ' reported user ' + String(peerName || 'User') + ' from chat "' + chatName + '".';

    let delivered = 0;
    for (const admin of admins) {
      const adminUserId = Number(admin?.user_id || 0);
      if (adminUserId <= 0) continue;

      const response = await createNotification({
        user_id: adminUserId,
        title: 'Reported user in chat',
        message: reportMessage,
        notification_type: 'Chat report',
        target_role: 'admin',
      }).catch(function () { return null; });

      if (response?.success) {
        delivered += 1;
      }
    }

    if (!delivered) {
      showToastIfAvailable('Failed to send report to institution admins.', 'error');
      return;
    }

    showToastIfAvailable('Report sent to ' + delivered + ' institution admin(s).', 'success');
  }

  function createNotification(payload) {
    if (typeof NotificationAPI !== 'undefined' && NotificationAPI && typeof NotificationAPI.create === 'function') {
      return NotificationAPI.create(payload);
    }

    if (typeof API !== 'undefined' && API && typeof API.post === 'function') {
      return API.post('/api/notifications', payload);
    }

    return Promise.resolve(null);
  }

  function isAdminLikeUser(user) {
    const roleName = String(user?.role || '').trim().toLowerCase();
    const rolesValue = user?.roles;
    const roleBlob = Array.isArray(rolesValue)
      ? rolesValue.join(' ').toLowerCase()
      : String(rolesValue || '').toLowerCase();

    if (roleName === 'admin' || roleName === 'super_admin' || roleName === 'superadmin') {
      return true;
    }

    if (roleBlob.indexOf('admin') !== -1) {
      return true;
    }

    if (Number(user?.role_id || 0) === 1) {
      return true;
    }

    return Number(user?.is_super_admin || 0) === 1;
  }

  function openActionDialog(options) {
    return new Promise(function (resolve) {
      if (!DOM.actionModal || !DOM.actionTitle || !DOM.actionMessage || !DOM.actionInput || !DOM.actionSelect || !DOM.actionSearch || !DOM.actionOptions || !DOM.actionOkBtn) {
        resolve(null);
        return;
      }

      actionDialogResolver = resolve;
      DOM.actionTitle.textContent = String(options?.title || 'Action');
      if (typeof options?.messageHtml === 'string' && options.messageHtml.trim()) {
        DOM.actionMessage.innerHTML = options.messageHtml;
      } else {
        DOM.actionMessage.textContent = String(options?.message || '');
      }
      DOM.actionOkBtn.textContent = String(options?.confirmText || 'Confirm');

      const isInput = String(options?.mode || 'confirm') === 'input';
      const isSelect = String(options?.mode || 'confirm') === 'select';
      const isOptions = String(options?.mode || 'confirm') === 'options';
      DOM.actionInput.classList.toggle('messages-hidden', !isInput);
      DOM.actionSelect.classList.toggle('messages-hidden', !isSelect);
      DOM.actionSearch.classList.toggle('messages-hidden', !isOptions);
      DOM.actionOptions.classList.toggle('messages-hidden', !isOptions);
      if (isInput) {
        DOM.actionInput.value = String(options?.initialValue || '');
        window.setTimeout(function () {
          DOM.actionInput.focus();
          DOM.actionInput.select();
        }, 0);
      }

      if (isSelect) {
        const rows = Array.isArray(options?.options) ? options.options : [];
        DOM.actionSelect.innerHTML = rows.map(function (row) {
          const value = String(row?.value || '').trim();
          const label = String(row?.label || value || 'Option').trim();
          return '<option value="' + esc(value) + '">' + esc(label) + '</option>';
        }).join('');

        const initialValue = String(options?.initialValue || '').trim();
        if (initialValue) {
          DOM.actionSelect.value = initialValue;
        }

        window.setTimeout(function () {
          DOM.actionSelect.focus();
        }, 0);
      } else {
        DOM.actionSelect.innerHTML = '';
      }

      if (isOptions) {
        const rows = Array.isArray(options?.options) ? options.options : [];
        const initialValue = String(options?.initialValue || '').trim();
        const allowMultiple = options?.allowMultiple !== false;
        DOM.actionSearch.value = '';
        DOM.actionSearch.placeholder = String(options?.searchPlaceholder || 'Search options...');
        DOM.actionOptions.setAttribute('data-allow-multiple', allowMultiple ? '1' : '0');
        DOM.actionOptions.innerHTML = rows.map(function (row, index) {
          const value = String(row?.value || '').trim();
          const label = String(row?.label || value || 'Option').trim();
          const meta = String(row?.meta || '').trim();
          const avatarInitial = String(row?.avatar_initial || label.charAt(0) || 'C').trim().charAt(0).toUpperCase() || 'C';
          const avatarUrl = String(row?.avatar_url || '').trim();
          const checked = value && value === initialValue;
          const searchText = (label + ' ' + meta).toLowerCase();
          const avatarHtml = avatarUrl
            ? '<img src="' + esc(avatarUrl) + '" alt="' + esc(label) + '" />'
            : esc(avatarInitial);
          return '<label class="messages-action-option ' + (checked ? 'selected' : '') + '">'
            + '<input type="' + (allowMultiple ? 'checkbox' : 'radio') + '" name="action-option" value="' + esc(value) + '" ' + (checked ? 'checked' : '') + ' />'
            + '<div class="messages-avatar">' + avatarHtml + '</div>'
            + '<div><strong>' + esc(label) + '</strong>' + (meta ? '<small>' + esc(meta) + '</small>' : '') + '</div>'
            + '<input type="hidden" value="' + esc(searchText) + '" data-action-option-search="1" />'
            + '</label>';
        }).join('');

        Array.from(DOM.actionOptions.querySelectorAll('input[name="action-option"]')).forEach(function (input) {
          input.addEventListener('change', function () {
            if (!allowMultiple && input.checked) {
              Array.from(DOM.actionOptions.querySelectorAll('input[name="action-option"]')).forEach(function (other) {
                if (other !== input) other.checked = false;
              });
            }

            Array.from(DOM.actionOptions.querySelectorAll('.messages-action-option')).forEach(function (chip) {
              const checkbox = chip.querySelector('input[name="action-option"]');
              chip.classList.toggle('selected', Boolean(checkbox?.checked));
            });
          });
        });

        DOM.actionSearch.oninput = function () {
          const query = String(DOM.actionSearch.value || '').trim().toLowerCase();
          Array.from(DOM.actionOptions.querySelectorAll('.messages-action-option')).forEach(function (chip) {
            const marker = chip.querySelector('[data-action-option-search="1"]');
            const searchText = String(marker?.value || '').toLowerCase();
            chip.style.display = !query || searchText.indexOf(query) !== -1 ? '' : 'none';
          });
        };

        window.setTimeout(function () {
          const selectedInput = DOM.actionOptions.querySelector('input[name="action-option"]:checked') || DOM.actionOptions.querySelector('input[name="action-option"]');
          selectedInput?.focus();
        }, 0);
      } else {
        DOM.actionSearch.value = '';
        DOM.actionSearch.placeholder = 'Search options...';
        DOM.actionSearch.oninput = null;
        DOM.actionOptions.removeAttribute('data-allow-multiple');
        DOM.actionOptions.innerHTML = '';
      }

      DOM.actionModal.classList.add('open');
      DOM.actionModal.setAttribute('aria-hidden', 'false');
      if (typeof options?.onOpen === 'function') {
        window.setTimeout(function () {
          try {
            options.onOpen();
          } catch (error) {
            console.error('Action dialog onOpen error:', error);
          }
        }, 0);
      }
    });
  }

  function closeActionDialog(value) {
    if (!DOM.actionModal) return;
    DOM.actionModal.classList.remove('open');
    DOM.actionModal.setAttribute('aria-hidden', 'true');
    if (actionDialogResolver) {
      const resolve = actionDialogResolver;
      actionDialogResolver = null;
      resolve(value);
    }
  }

  function setReplyContext(message) {
    const messageId = Number(message?.chat_message_id || 0);
    if (messageId <= 0) {
      showToastIfAvailable('Unable to reply to this message.', 'error');
      return;
    }

    STATE.replyContext = {
      messageId: messageId,
      messageUuid: String(message?.uuid || '').trim(),
      senderName: String(message?.sender_name || 'Member').trim(),
      previewText: resolveReplyPreviewText(message),
    };

    syncReplyComposerPreview();
  }

  function clearReplyContext() {
    STATE.replyContext = null;
    syncReplyComposerPreview();
  }

  function setEditContext(message) {
    const messageUuid = String(message?.uuid || '').trim();
    if (!messageUuid) {
      showToastIfAvailable('Unable to edit this message.', 'error');
      return;
    }

    STATE.editContext = {
      messageUuid: messageUuid,
      previewText: resolveReplyPreviewText(message),
    };

    if (DOM.body) {
      DOM.body.value = String(message?.message_text || '').trim();
      DOM.body.placeholder = 'Edit message...';
    }

    STATE.pendingAttachments = [];
    syncAttachmentSummary();
    syncEditComposerPreview();
  }

  function clearEditContext() {
    STATE.editContext = null;
    if (DOM.body && STATE.selectedRoom && !DOM.body.value) {
      DOM.body.placeholder = STATE.selectedRoom.room_type === 'direct' ? 'Write a direct message...' : 'Write a message to the group...';
    }
    syncEditComposerPreview();
  }

  function syncReplyComposerPreview() {
    if (!DOM.replyPreview || !DOM.replyLabel || !DOM.replyText) return;

    if (!STATE.replyContext) {
      DOM.replyPreview.classList.add('messages-hidden');
      DOM.replyLabel.textContent = 'Replying';
      DOM.replyText.textContent = '';
      return;
    }

    DOM.replyLabel.textContent = 'Replying to ' + String(STATE.replyContext.senderName || 'Member');
    DOM.replyText.textContent = String(STATE.replyContext.previewText || 'Original message is unavailable.');
    DOM.replyPreview.classList.remove('messages-hidden');
  }

  function syncEditComposerPreview() {
    if (!DOM.editPreview || !DOM.editLabel || !DOM.editText) return;

    if (!STATE.editContext) {
      DOM.editPreview.classList.add('messages-hidden');
      DOM.editLabel.textContent = 'Editing message';
      DOM.editText.textContent = '';
      return;
    }

    DOM.editLabel.textContent = 'Editing message';
    DOM.editText.textContent = String(STATE.editContext.previewText || 'Original message is unavailable.');
    DOM.editPreview.classList.remove('messages-hidden');
  }

  function resolveReplyPreviewText(message) {
    const direct = String(message?.message_text || '').trim();
    if (direct) return direct;
    const hasAttachments = Array.isArray(message?.attachments) && message.attachments.length > 0;
    if (hasAttachments) return 'Attachment message';
    return 'Original message is unavailable.';
  }

  async function openComposeModal() {
    resetComposeState();
    DOM.composeModal?.classList.add('open');
    DOM.composeModal?.setAttribute('aria-hidden', 'false');
    await loadComposeUsersWithFilters();
  }

  function closeComposeModal() {
    DOM.composeModal?.classList.remove('open');
    DOM.composeModal?.setAttribute('aria-hidden', 'true');
  }

  function renderDirectUsers() {
    if (!DOM.userGrid) return;
    const query = String(DOM.userSearch?.value || '').trim().toLowerCase();
    const currentUserId = Number(STATE.currentUser?.user_id || 0);
    const users = STATE.users.filter(function (user) {
      if (Number(user.user_id || 0) === currentUserId) return false;
      if (!query) return true;
      return [user.first_name, user.last_name, user.email, user.username, user.role, user.roles].join(' ').toLowerCase().indexOf(query) !== -1;
    });

    if (!users.length) {
      DOM.userGrid.innerHTML = '<div class="messages-empty">No users found.</div>';
      return;
    }

    DOM.userGrid.innerHTML = users.map(function (user) {
      const id = Number(user.user_id || 0);
      return '<label class="messages-user-chip">'
        + '<input type="radio" name="direct-user" value="' + id + '" />'
        + '<div><strong>' + esc(displayName(user)) + '</strong><small>' + esc(displayUserMeta(user)) + '</small></div>'
        + '</label>';
    }).join('');
  }

  function renderGroupMembers() {
    if (!DOM.groupMemberGrid) return;
    rememberVisibleGroupSelections();

    const query = String(DOM.groupMemberSearch?.value || '').trim().toLowerCase();
    const currentUserId = Number(STATE.currentUser?.user_id || 0);
    const users = STATE.users.filter(function (user) {
      if (Number(user.user_id || 0) === currentUserId) return false;
      if (!query) return true;
      return [user.first_name, user.last_name, user.email, user.username, user.role, user.roles].join(' ').toLowerCase().indexOf(query) !== -1;
    });

    if (!users.length) {
      DOM.groupMemberGrid.innerHTML = '<div class="messages-empty">No members available.</div>';
      renderGroupSummary();
      return;
    }

    DOM.groupMemberGrid.innerHTML = users.map(function (user) {
      const id = Number(user.user_id || 0);
      const checked = STATE.selectedGroupMemberIds.has(id);
      return '<label class="messages-user-chip ' + (checked ? 'selected' : '') + '">'
        + '<input type="checkbox" name="group-member" value="' + id + '" ' + (checked ? 'checked' : '') + ' />'
        + '<div><strong>' + esc(displayName(user)) + '</strong><small>' + esc(displayUserMeta(user)) + '</small></div>'
        + '</label>';
    }).join('');

    renderGroupSummary();
  }

  function renderGroupSummary() {
    if (!DOM.groupSummary) return;
    rememberVisibleGroupSelections();

    const selectedIds = Array.from(STATE.selectedGroupMemberIds);
    const names = selectedIds.map(function (memberId) {
      const user = STATE.users.find(function (row) { return Number(row.user_id || 0) === Number(memberId); });
      return displayName(user);
    }).filter(Boolean);

    if (!selectedIds.length) {
      DOM.groupSummary.textContent = 'Select members to preview the room recipients.';
      return;
    }

    DOM.groupSummary.textContent = selectedIds.length + ' member' + (selectedIds.length === 1 ? '' : 's') + ' selected' + (names.length ? ': ' + names.slice(0, 4).join(', ') + (names.length > 4 ? ' ...' : '') : '.');
  }

  function highlightDirectSelection() {
    const selected = DOM.composeModal?.querySelector('input[name="direct-user"]:checked');
    if (!selected) return;
    Array.from(DOM.userGrid?.querySelectorAll('.messages-user-chip') || []).forEach(function (chip) {
      chip.style.borderColor = chip.querySelector('input[name="direct-user"]:checked') ? '#006a3f' : '#e2e8f0';
      chip.style.background = chip.querySelector('input[name="direct-user"]:checked') ? '#f0fdf4' : '#fff';
    });
  }

  async function createRoomAndSendFirstMessage() {
    if (STATE.sending) return;

    const activeSection = getActiveComposeTab();
    const firstMessage = String(DOM.composeBody?.value || '').trim();
    if (!firstMessage) {
      showToastIfAvailable('Write the first message before starting the chat.', 'error');
      return;
    }

    STATE.sending = true;
    try {
      if (activeSection === 'direct') {
        const selected = DOM.composeModal?.querySelector('input[name="direct-user"]:checked');
        const otherUserId = Number(selected?.value || 0);
        if (!otherUserId) {
          showToastIfAvailable('Select a user to start a direct chat.', 'error');
          return;
        }

        const roomResponse = await ChatAPI.createRoom({ room_type: 'direct', other_user_id: otherUserId });
        const room = pickCreatedRoom(roomResponse, otherUserId);
        if (!room?.uuid) {
          showToastIfAvailable('Unable to open the new direct chat.', 'error');
          return;
        }

        await ChatAPI.sendMessage(room.uuid, { message_type: 'text', message_text: firstMessage });
        closeComposeModal();
        DOM.composeBody.value = '';
        await loadData();
        await selectRoom(room.uuid, true);
        showToastIfAvailable('Direct chat created.', 'success');
        return;
      }

      const selectedMembers = getSelectedGroupMemberIds();
      if (!selectedMembers.length) {
        showToastIfAvailable('Select at least one member for the group.', 'error');
        return;
      }

      const groupName = String(DOM.groupName?.value || '').trim() || 'New group chat';
      const roomResponse = await ChatAPI.createRoom({
        room_type: 'group',
        room_name: groupName,
        category_type: 'custom',
        category_label: groupName,
        member_ids: selectedMembers,
      });

      // Group create response may only return room_id; refresh rooms before resolving UUID.
      await loadData();
      const room = pickCreatedGroupRoom(roomResponse, groupName);
      if (!room?.uuid) {
        showToastIfAvailable('Unable to open the new group chat.', 'error');
        return;
      }

      await ChatAPI.sendMessage(room.uuid, { message_type: 'text', message_text: firstMessage });
      closeComposeModal();
      DOM.composeBody.value = '';
      await selectRoom(room.uuid, true);
      showToastIfAvailable('Group chat created.', 'success');
    } catch (error) {
      console.error('Create chat error:', error);
      showToastIfAvailable('Failed to create chat.', 'error');
    } finally {
      STATE.sending = false;
    }
  }

  function pickCreatedRoom(response, otherUserId) {
    const roomId = Number(response?.data?.room_id || response?.room_id || 0);
    if (!roomId) return null;

    const roomList = extractRooms(response?.data?.rooms || response?.rooms || response);
    const match = roomList.find(function (room) { return Number(room.room_id || 0) === roomId; });
    if (match) return match;

    return STATE.rooms.find(function (room) {
      const pairMatch = String(room.room_type || '') === 'direct'
        && (Number(room.direct_user_1 || 0) === Number(STATE.currentUser?.user_id || 0) || Number(room.direct_user_2 || 0) === Number(STATE.currentUser?.user_id || 0))
        && (Number(room.direct_user_1 || 0) === Number(otherUserId) || Number(room.direct_user_2 || 0) === Number(otherUserId));
      return Number(room.room_id || 0) === roomId || pairMatch;
    }) || null;
  }

  function pickCreatedGroupRoom(response, fallbackName) {
    const roomId = Number(response?.data?.room_id || response?.room_id || 0);
    const roomUuid = String(response?.data?.room_uuid || response?.room_uuid || '').trim();
    const responseRoom = response?.data?.room || response?.room || null;

    if (responseRoom?.uuid) {
      return responseRoom;
    }

    if (roomUuid) {
      const byUuid = STATE.rooms.find(function (room) {
        return String(room.uuid || '') === roomUuid;
      });
      if (byUuid) return byUuid;
    }

    if (roomId > 0) {
      const byId = STATE.rooms.find(function (room) {
        return Number(room.room_id || 0) === roomId;
      });
      if (byId) return byId;
    }

    const normalizedFallback = String(fallbackName || '').trim().toLowerCase();
    if (!normalizedFallback) return null;

    return STATE.rooms.find(function (room) {
      return String(room.room_name || '').trim().toLowerCase() === normalizedFallback;
    }) || null;
  }

  function getActiveComposeTab() {
    return String(DOM.composeModal?.querySelector('.messages-tab.active')?.getAttribute('data-compose-tab') || 'direct');
  }

  function rememberVisibleGroupSelections() {
    const visibleInputs = Array.from(DOM.groupMemberGrid?.querySelectorAll('input[name="group-member"]') || []);
    visibleInputs.forEach(function (input) {
      const memberId = Number(input.value || 0);
      if (memberId <= 0) return;
      if (input.checked) {
        STATE.selectedGroupMemberIds.add(memberId);
      } else {
        STATE.selectedGroupMemberIds.delete(memberId);
      }
    });
  }

  function getSelectedGroupMemberIds() {
    rememberVisibleGroupSelections();
    return Array.from(STATE.selectedGroupMemberIds).filter(function (memberId) {
      return Number(memberId) > 0;
    });
  }

  function resetComposeState() {
    STATE.selectedGroupMemberIds = new Set();
    STATE.pendingAttachments = [];
    if (DOM.userSearch) DOM.userSearch.value = '';
    if (DOM.composeClassFilter) DOM.composeClassFilter.value = '';
    if (DOM.composeProgramFilter) DOM.composeProgramFilter.value = '';
    if (DOM.composeRoleFilter) DOM.composeRoleFilter.value = '';
    if (DOM.groupMemberSearch) DOM.groupMemberSearch.value = '';
    if (DOM.groupName) DOM.groupName.value = '';
    if (DOM.composeBody) DOM.composeBody.value = '';
    STATE.composeFilters = { classFilter: '', programFilter: '', role: '' };
    syncAttachmentSummary();
  }

  function displayName(user) {
    return ((user?.first_name || '') + ' ' + (user?.last_name || '')).trim() || user?.email || 'User';
  }

  function displayUserMeta(user) {
    const pieces = [user?.email, user?.username];
    const role = user?.role || (Array.isArray(user?.roles) ? user.roles.join(', ') : user?.roles);
    if (role) pieces.push(role);
    return pieces.filter(Boolean).join(' • ');
  }

  function pickImageFile() {
    return new Promise(function (resolve) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = function () {
        const file = input.files && input.files.length ? input.files[0] : null;
        resolve(file);
      };
      input.click();
    });
  }

  function fmtDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Now: within 30 seconds
    if (diffSecs < 30) {
      return 'now';
    }

    // Mins: within 60 minutes
    if (diffMins < 60) {
      return diffMins + ' min' + (diffMins === 1 ? '' : 's') + ' ago';
    }

    // Hours: within 24 hours
    if (diffHours < 24) {
      return diffHours + ' hour' + (diffHours === 1 ? '' : 's') + ' ago';
    }

    // Yesterday: exactly 1 day ago
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'yesterday';
    }

    // Date: older than yesterday
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function esc(value) {
    if (typeof escapeHtml === 'function') return escapeHtml(String(value ?? ''));
    return String(value ?? '').replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function showToastIfAvailable(message, type) {
    if (typeof showToast === 'function') {
      showToast(message, type || 'info');
    }
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      if (DOM.actionModal?.classList.contains('open')) {
        closeActionDialog(null);
        return;
      }
      closeComposeModal();
    }
  });
})();
