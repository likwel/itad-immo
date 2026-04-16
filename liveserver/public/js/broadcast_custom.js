document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('broadcastForm');
    const realArea = document.getElementById('messagesArea');
    const chatCount = document.getElementById('chatCount');

    // ── Mapping bouton → panel ────────────────────────
    const PANELS = {
        messagesOpenForm: { panel: document.getElementById('messagesForm'), btn: null },
        viewersOpenForm: { panel: document.getElementById('viewersForm'), btn: null },
        settingsBtn: { panel: document.getElementById('broadcasterSettingsForm'), btn: null },
    };

    // Rattacher les boutons d'ouverture
    Object.keys(PANELS).forEach(id => {
        PANELS[id].btn = document.getElementById(id);
    });

    let activeKey = null; // clé du panel actuellement ouvert

    // ── Ouvrir le panel ───────────────────────────────
    function openPanel(key) {
        // Fermer tous les panels
        Object.values(PANELS).forEach(({ panel, btn }) => {
            panel?.classList.remove('panel-open');
            btn?.classList.remove('panel-btn-active');
        });

        const { panel, btn } = PANELS[key];

        panel?.classList.add('panel-open');
        btn?.classList.add('panel-btn-active');
        activeKey = key;

        form.classList.add('chat-open');
        form.style.setProperty('grid-template-columns', '1fr var(--chat-w)', 'important');
    }

    // ── Fermer tous les panels ─────────────────────────
    function closeAll() {
        Object.values(PANELS).forEach(({ panel, btn }) => {
            panel?.classList.remove('panel-open');
            btn?.classList.remove('panel-btn-active');
        });
        activeKey = null;

        form.classList.remove('chat-open');
        form.style.setProperty('grid-template-columns', '1fr 0px', 'important');
    }

    // ── Toggle depuis la toolbar ──────────────────────
    Object.keys(PANELS).forEach(key => {
        PANELS[key].btn?.addEventListener('click', () => {
            activeKey === key ? closeAll() : openPanel(key);
        });
    });

    // ── Boutons de fermeture (✕ dans chaque panel) ────
    const closeBtns = [
        '#messagesCloseForm',
        '#viewersCloseForm',
        '#toggleSettingsBtn',
    ];
    closeBtns.forEach(selector => {
        document.querySelector(selector)
            ?.addEventListener('click', closeAll);
    });

    // ── Bouton "Viewers" dans le panel messages ───────
    document.getElementById('messagesOpenViewersForm')
        ?.addEventListener('click', () => openPanel('viewersOpenForm'));

    // ── Bouton "Messages" dans le panel viewers ───────
    document.getElementById('viewerOpenMessageForm')
        ?.addEventListener('click', () => openPanel('messagesOpenForm'));

    // ── Compteur messages ─────────────────────────────
    const updateCount = () => {
        const n = realArea?.children.length ?? 0;
        if (chatCount) chatCount.textContent = n;
    };
    updateCount();
    if (realArea) {
        new MutationObserver(updateCount)
            .observe(realArea, { childList: true, subtree: true });
    }

    // ── État initial : messages ouvert ────────────────
    openPanel('messagesOpenForm');

});