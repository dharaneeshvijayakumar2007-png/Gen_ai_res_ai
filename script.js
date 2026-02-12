// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------
const API_KEY = "AIzaSyD_Zi1WgWSypND36zImlqk9pnsBL80gQ-U";
const MODEL_NAME = "gemini-2.0-flash"; // Using the model confirmed in your list

document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const resetBtn = document.getElementById('reset-btn');

    // Initial Greeting
    setTimeout(() => {
        addBotMessage("Hello! I am connected to Gemini AI. How can I help you today?");
    }, 500);

    // Event Listeners
    sendBtn.addEventListener('click', handleUserMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserMessage();
    });

    resetBtn.addEventListener('click', () => {
        chatWindow.innerHTML = '';
        addBotMessage("Conversation cleared.");
    });

    async function handleUserMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        addUserMessage(text);
        userInput.value = '';
        showTypingIndicator();

        try {
            const botResponse = await callGemini(text);
            removeTypingIndicator();
            addBotMessage(botResponse);
        } catch (error) {
            removeTypingIndicator();
            console.error(error);
            addBotMessage(`**Error:** ${error.message}`);
        }
    }

    async function callGemini(userText) {
        // Use models confirmed in your list
        const modelsToTry = ["gemini-2.0-flash", "gemini-2.5-flash"];

        for (const model of modelsToTry) {
            try {
                return await attemptGeminiCall(userText, model);
            } catch (error) {
                // If it's the last model or not a rate limit error, throw it
                if (model === modelsToTry[modelsToTry.length - 1] || !error.message.includes("429")) {
                    throw error;
                }
                console.warn(`Model ${model} rate limited or failed. Trying next...`);
            }
        }
    }

    async function attemptGeminiCall(userText, modelName) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

        const payload = {
            contents: [{
                parts: [{ text: userText }]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || `API Error: ${response.status}`;

            // Explicitly throw 429 errors to trigger fallback
            if (response.status === 429 || errorMessage.includes("Quota")) {
                throw new Error("429 Rate Limit Exceeded");
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    // ---------------------------------------------------------
    // UI HELPERS
    // ---------------------------------------------------------
    function addUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'message user-message';
        div.textContent = text;
        chatWindow.appendChild(div);
        scrollToBottom();
    }

    function addBotMessage(text) {
        const div = document.createElement('div');
        div.className = 'message bot-message';
        // Basic formatting
        div.innerHTML = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\n/g, '<br>'); // Newlines
        chatWindow.appendChild(div);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'typing-indicator';
        div.id = 'typing-indicator';
        div.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        chatWindow.appendChild(div);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    function scrollToBottom() {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
});
