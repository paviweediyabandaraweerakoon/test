// Chatbot Widget Loader
// Add this script to any website to embed the chatbot
(function () {
    // Configuration
    const CHATBOT_URL = 'https://manojaberathna24.github.io/Testing_Webchat/index.html';

    // Create styles
    const style = document.createElement('style');
    style.textContent = `
        #chatbot-widget-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6366f1, #a855f7);
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
            z-index: 99998;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        #chatbot-widget-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 30px rgba(99, 102, 241, 0.6);
        }
        #chatbot-widget-btn svg {
            width: 28px;
            height: 28px;
            fill: white;
        }
        #chatbot-widget-btn.open svg.chat-icon { display: none; }
        #chatbot-widget-btn.open svg.close-icon { display: block; }
        #chatbot-widget-btn:not(.open) svg.chat-icon { display: block; }
        #chatbot-widget-btn:not(.open) svg.close-icon { display: none; }
        
        #chatbot-widget-frame {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 350px;
            height: 450px;
            border: none;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 99999;
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            pointer-events: none;
            transition: all 0.3s ease;
        }
        #chatbot-widget-frame.open {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }
        
        @media (max-width: 400px) {
            #chatbot-widget-frame {
                width: calc(100vw - 40px);
                height: calc(100vh - 120px);
                bottom: 90px;
                right: 20px;
            }
        }
    `;
    document.head.appendChild(style);

    // Create button
    const btn = document.createElement('button');
    btn.id = 'chatbot-widget-btn';
    btn.innerHTML = `
        <svg class="chat-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            <circle cx="8" cy="10" r="1.5"/>
            <circle cx="12" cy="10" r="1.5"/>
            <circle cx="16" cy="10" r="1.5"/>
        </svg>
        <svg class="close-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
    `;
    btn.title = 'Chat with us!';
    document.body.appendChild(btn);

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'chatbot-widget-frame';
    iframe.src = CHATBOT_URL;
    iframe.title = 'Shop Assistant';
    document.body.appendChild(iframe);

    // Toggle function
    let isOpen = false;
    btn.addEventListener('click', function () {
        isOpen = !isOpen;
        btn.classList.toggle('open', isOpen);
        iframe.classList.toggle('open', isOpen);
    });
})();
