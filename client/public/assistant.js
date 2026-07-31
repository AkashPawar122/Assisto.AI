(function () {


    // userData

    const script = document.currentScript;

    const userId = script?.dataset?.userId

    const theme = "sunset"

    let assistantConfig = null


    // load CSS

    const link = document.createElement("link")

    link.rel = "stylesheet"

    link.href = "http://https://assisto-ai-frontend.onrender.com/assistant.css"

    document.head.appendChild(link)


    // Create PopUp

    const popup = document.createElement("div")

    popup.className = `assisto-popup theme-${theme}`

    popup.innerHTML = `
    <div class="assisto-overlay"></div>

    <div class="assisto-content">

       <div class="assisto-top">
            <div class="assisto-orb-wrap">

                <div class="assisto-orb-glow"></div>

                <div class="assisto-orb"></div>

            </div>

            <h2 class="assisto-title">
                Hello! I'm Assisto AI
            </h2>

            <p class="assisto-sub">
                Your smart voice assistant.
                <br />
                Ask anything about your website.
            </p>


            <div class="assisto-status">
                Tap button to Speak
            </div>

            <div class="assisto-wave">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>

            <!-- User Text -->
            <div class="assisto-user-text">
            </div>

            <!-- AI Text -->
            <div class="assisto-ai-text">
            </div>
  
        </div>


        <div class="assisto-bottom">
            
            <button class="assisto-mic">

               <img 
               src="http://https://assisto-ai-frontend.onrender.com/mic.svg"
               alt="mic"
               class="assisto-mic-icon"/>
            </button>
        </div>
    </div>
    
    `;

    document.body.appendChild(popup);

    // floating Button

    const button = document.createElement("button")

    button.className = `assisto-btn theme-${theme}`

    button.innerHTML = `
    <img 
    src="http://https://assisto-ai-frontend.onrender.com/logo.svg"
    alt="logo"
    />`;
    document.body.appendChild(button)




    // toggle popup

    let open = false

    button.onclick = () => {
        open = !open;
        popup.style.display = open ? "flex" : "none";
    }


    // load Assistant

    const loadAssistant = async () => {
        try {
            const res = await fetch(`http://https://assisto-ai-backend.onrender.com/api/assistant/config/${userId}`)

            const data = await res.json()

            if (data) {
                assistantConfig = data.user
                applyConfig()
            }

        } catch (error) {
            console.log(
                "Assistant Load Error:",
                error
            );
        }
    }


    const applyConfig = () => {
        if (!assistantConfig) return;

        popup.className = `assisto-popup theme-${assistantConfig.theme}`

        button.className = `assisto-btn theme-${assistantConfig.theme}`

        const title = popup.querySelector(".assisto-title")

        title.innerHTML = `Hello! I'm ${assistantConfig.assistantName}`;

        const subTitle = popup.querySelector(".assisto-sub")
        subTitle.innerHTML = `
    Welcome to
    ${assistantConfig.businessName}.
    <br />
    Ask anything about your website.
  `;


    }

    loadAssistant()


    // Element


    const status =
        popup.querySelector(
            ".assisto-status"
        );

    const wave =
        popup.querySelector(
            ".assisto-wave"
        );

    const userText =
        popup.querySelector(
            ".assisto-user-text"
        );

    const aiText =
        popup.querySelector(
            ".assisto-ai-text"
        );

    const mic =
        popup.querySelector(
            ".assisto-mic"
        );



    // text-speech

    const speak = (text, onEnd) => {
        window.speechSynthesis.cancel();

        // Show AI response
        aiText.innerText =
            text;

        status.innerText =
            "AI Speaking...";

        const speech = new SpeechSynthesisUtterance(text)

        speech.lang =
            "hi-IN";

        speech.rate = 1;

        speech.pitch = 1;

        speech.volume = 1;

        // Voice end
        speech.onend = () => {

            status.innerText =
                "Tap button to Speak";

            wave.style.opacity =
                "0";

            if (onEnd) onEnd();
        };

        // Fallback in case speech synthesis errors out silently
        // (missing voice, no audio device, etc.) - without this,
        // onEnd would never fire and navigation would never happen.
        speech.onerror = () => {

            status.innerText =
                "Tap button to Speak";

            wave.style.opacity =
                "0";

            if (onEnd) onEnd();
        };

        // Start speaking
        window.speechSynthesis.speak(
            speech
        );
    }


    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition


    if (SpeechRecognition) {

        const recognition = new SpeechRecognition();

        recognition.lang =
            "en-US";

        recognition.continuous =
            false;

        recognition.interimResults =
            false;


        mic.onclick = () => {
            wave.style.opacity =
                "1";

            status.innerText =
                "Listening...";

            userText.innerText =
                "";

            aiText.innerText =
                "";

            recognition.start();
        }


        recognition.onresult = (e) => {
            const text = e.results[0][0].transcript

            userText.innerText = "You: " + text;

            recognition.stop();


            setTimeout(async () => {
                try {
                    status.innerText = "Thinking...";


                    const res = await fetch("http://https://assisto-ai-backend.onrender.com/api/assistant/ask", {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            message: text,
                            userId,
                            currentPath: window.location.pathname
                        })
                    })

                    const data = await res.json()
                    console.log(data)

                    if (data.success) {

                        if (data.action === "navigate") {
                            speak(data.response, () => {
                                window.location.href = data.path
                            })

                        } else {
                            speak(data.aiResponse || data.response)
                        }

                    } else {
                        speak("Response Error please Check your plan")

                    }



                } catch (error) {
                    console.log(error)
                    speak("AI Server Error")

                }
            }, 600)
        };

        recognition.onerror = () => {
            status.innerText =
                "Tap button to Speak";

            wave.style.opacity =
                "0";
        }


    }
    else {
        status.innerText =
            "Speech Recognition not supported";
    }


})();