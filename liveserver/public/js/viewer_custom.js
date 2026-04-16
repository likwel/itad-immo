document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('viewerForm')
    const msgBtn = document.getElementById('messagesBtn')
    const closeBtn = document.getElementById('messagesCloseBtn')

    const chatCount = document.getElementById('chatCount')
    const realArea = document.getElementById('viewerMessagesArea') // MiroTalk

    const updateCount = () => {
        const msgs = realArea ? realArea.children.length : 0
        chatCount.textContent = msgs
    }

    // Initial
    updateCount()

    const openChat = () => {
        form.classList.remove('chat-closed')
        msgBtn.classList.add('chat-open')
    }
    const closeChat = () => {
        form.classList.add('chat-closed')
        msgBtn.classList.remove('chat-open')
    }

    /* toggle depuis la toolbar */
    msgBtn.addEventListener('click', () => {
        form.classList.contains('chat-closed') ? openChat() : closeChat()
    })

    /* fermeture depuis le ✕ du panel */
    if (closeBtn) closeBtn.addEventListener('click', closeChat)

    /* état initial : chat ouvert */
    openChat()

    // Observer les changements
    if (realArea) {
        new MutationObserver(updateCount)
            .observe(realArea, { childList: true, subtree: true })
    }

})