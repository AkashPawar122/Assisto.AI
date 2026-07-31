import { generateGeminiResponse } from "../Configs/gemini.js"
import User from "../Models/user.model.js"


export const getAssistantConfig = async (req, res) => {
    try {
        const { userId } = req.params

        const user = await User.findById(userId).select("-geminiApiKey")
        if (!user) {
            return res.status(404).json({ message: "failed to get user" })
        }

        return res.status(200).json({ message: "Assistant Config data ", user })

    } catch (error) {
        return res.status(500).json({ message: `Assistant Config failed ${error}` })
    }
}


export const askAssistant = async (req, res) => {
    try {
        const { message, userId } = req.body

        if (!message || !userId) {
            return res.status(400).json({ message: "Message and UserId are required" })
        }

        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({ message: "User is not found" })
        }
        if (!user.geminiApiKey) {
            return res.status(400).json({ message: "gemini apikey is not added" })
        }

        if (user.plan === "free"
            && user.totalMessages >= user.requestLimit) {
            return res.status(400).json({ message: "Free limit reached" })
        }

        if (user.plan === "pro" && new Date(user.proExpiresAt) < new Date()) {
            user.plan = "free"

            await user.save()

            return res.status(400).json({ message: "Pro plan expired" })
        }

        const cleanMessage = message.toLowerCase()

        if (user.enableNavigation) {

            // Navigation Commands
            const navigationWords = [

                "open",
                "go",
                "start",
                "show",
                "navigate",
                "take me",

            ];

            // Check navigation intent
            const wantsNavigation =
                navigationWords.some((word) =>

                    cleanMessage.includes(word)
                );

            // User wants navigation
            if (wantsNavigation) {

                // Find matching page. Instead of returning the first page
                // whose keyword/name happens to appear in the message
                // (order-dependent, and a short generic keyword like "home"
                // could shadow a more specific one like "dashboard"), pick
                // the page whose matching keyword/name is the LONGEST /
                // most specific match found anywhere in the message.
                let matchedPage = null;
                let bestMatchLength = 0;

                for (const page of user.pages) {

                    const candidates = [
                        ...(page.keywords || []),
                        page.name,
                    ].filter(Boolean);

                    for (const candidate of candidates) {

                        const normalized = candidate.trim().toLowerCase();

                        if (
                            normalized &&
                            cleanMessage.includes(normalized) &&
                            normalized.length > bestMatchLength
                        ) {
                            bestMatchLength = normalized.length;
                            matchedPage = page;
                        }
                    }
                }

                // Page found
                if (matchedPage) {

                    const displayName = matchedPage.name || "This page";

                    // Already open
                    if (
                        req.body.currentPath ===
                        matchedPage.path
                    ) {

                        return res.json({

                            success: true,

                            response:
                                `${displayName} is already open`

                        });
                    }

                    // Navigate
                    return res.json({

                        success: true,

                        action: "navigate",

                        path: matchedPage.path,

                        response:
                            `Opening ${displayName}`,

                    });
                }

                // Navigation intent detected but no page matched -
                // tell the user instead of silently falling through
                // to the general AI prompt (which knows nothing about
                // page routing and will just chat back, making it look
                // like navigation is broken).
                return res.json({

                    success: true,

                    response:
                        "I couldn't find that page.",

                });
            }
        }



        const prompt = `

You are ${user.assistantName}.

Business Name:
${user.businessName}

Business Type:
${user.businessType}

Business Description:
${user.businessDescription}

Assistant Tone:
${user.tone}


Rules:

- Keep replies under 15 words
- Give fast direct responses
- Talk naturally
- Behave like smart voice assistant
- Avoid long explanations
- Keep responses short for quick voice playback

User Question:
${message}

`;

        const aiResponse = await generateGeminiResponse({ prompt, apikey: user.geminiApiKey, user })

        if (user.plan === "free") {
            user.totalMessages += 1

            await user.save()

        }
        return res.json({
            success: true,
            aiResponse
        });

    } catch (error) {

        console.log(error)

        return res.status(500).json({
            success: false,
            message:
                "Assistant AI Error",
        });

    }
}