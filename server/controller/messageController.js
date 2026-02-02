import axios from "axios";
import Message from "../models/message.js";
import User from "../models/User.js";
import Group from "../models/group.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";
import googleAIConfig from "../lib/googleAIConfig.js";

// Web search function
async function performWebSearch(query) {
  try {
    console.log("Performing web search for:", query);

    // Array to store results from multiple sources
    const searchResults = [];

    // First source: DuckDuckGo
    try {
      const ddgResponse = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 8000 // 8 second timeout
      });

      console.log("DuckDuckGo search response received");

      if (ddgResponse.data && ddgResponse.data.AbstractText && ddgResponse.data.AbstractText.length > 0) {
        searchResults.push({
          answer: ddgResponse.data.AbstractText,
          source: ddgResponse.data.AbstractSource || "DuckDuckGo",
          link: ddgResponse.data.AbstractURL || "",
          confidence: 0.9
        });
      } else if (ddgResponse.data && ddgResponse.data.RelatedTopics && ddgResponse.data.RelatedTopics.length > 0) {
        // Get up to 3 related topics
        const topics = ddgResponse.data.RelatedTopics.slice(0, 3);
        topics.forEach((topic, index) => {
          if (topic.Text && topic.Text.length > 0) {
            searchResults.push({
              answer: topic.Text,
              source: "DuckDuckGo",
              link: topic.FirstURL || "",
              confidence: 0.8 - (index * 0.1) // Decrease confidence for later results
            });
          }
        });
      }

      // Try to extract any useful information from the Infobox
      if (ddgResponse.data && ddgResponse.data.Infobox && ddgResponse.data.Infobox.content) {
        const content = ddgResponse.data.Infobox.content;
        if (content.length > 0) {
          const infoText = content.map(item => `${item.label || ''}: ${item.value || ''}`).join('. ');
          searchResults.push({
            answer: infoText,
            source: "DuckDuckGo Infobox",
            link: "",
            confidence: 0.75
          });
        }
      }
    } catch (error) {
      console.error("DuckDuckGo search error:", error.message);
    }

    // Second source: Wikipedia-specific search using MediaWiki API
    try {
      const wikiResponse = await axios.get(`https://en.wikipedia.org/w/api.php`, {
        params: {
          action: 'query',
          format: 'json',
          prop: 'extracts|info',
          exintro: true,
          explaintext: true,
          inprop: 'url',
          titles: query,
          redirects: 1,
          origin: '*'
        },
        timeout: 8000
      });

      console.log("Wikipedia search response received");

      if (wikiResponse.data && wikiResponse.data.query && wikiResponse.data.query.pages) {
        const pages = wikiResponse.data.query.pages;
        const pageIds = Object.keys(pages);

        for (const pageId of pageIds) {
          if (pageId !== '-1') { // -1 means no results
            const page = pages[pageId];
            if (page.extract && page.extract.length > 0) {
              searchResults.push({
                answer: page.extract.substring(0, 500) + (page.extract.length > 500 ? '...' : ''),
                source: "Wikipedia",
                link: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
                confidence: 0.95
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Wikipedia search error:", error.message);
    }

    // Sort results by confidence
    searchResults.sort((a, b) => b.confidence - a.confidence);

    if (searchResults.length > 0) {
      return {
        success: true,
        results: searchResults
      };
    }

    console.log("No results found in any search response");
    return { success: false, message: "No results found" };
  } catch (error) {
    console.error("Web search error:", error.message);
    return { success: false, message: "Error performing web search" };
  }
}

// Simple AI chatbot responses
const simpleResponses = {
  greeting: ["Hello!", "Hi there!", "Hey! How can I help?", "Greetings!"],
  farewell: ["Goodbye!", "See you later!", "Take care!", "Bye!"],
  thanks: ["You're welcome!", "No problem!", "Glad to help!", "Anytime!"],
  help: ["I'm here to help! What do you need?", "How can I assist you?", "What can I do for you?"],
  name: ["My name is Bumble Bee!", "I'm Bumble Bee, nice to meet you!", "I'm Bumble Bee, how can I help you today?"],
  app_info: [
    "Talklet is a real-time chat application developed by Surya S. It allows users to chat with friends, share media, and even talk to me - an AI assistant! The app features user profiles, group chats, and media sharing capabilities.",
    "Talklet is a messaging app created by Surya S. It has features like real-time messaging, profile customization, media sharing, and an AI chatbot (that's me!).",
    "This is Talklet, a chat application developed by Surya S. You can use it to message friends, create groups, share images and audio, and chat with me!"
  ],
  features: [
    "Talklet has many cool features! You can: 1) Chat with friends in real-time, 2) Create and join group chats, 3) Share images and audio messages, 4) Talk to me - an AI assistant, 5) Customize your profile with pictures, and 6) See who's online.",
    "Some features of Talklet include: real-time messaging, group chats, media sharing (images and audio), AI chatbot assistance, user profiles, and online status indicators."
  ],
  developer: [
    "✨ Talklet was developed by Surya S, a talented full-stack developer passionate about creating innovative chat applications! 👨‍💻 He loves building user-friendly interfaces and powerful backend systems. 🚀",
    "🌟 I was created by Surya S, the brilliant mind behind Talklet! He designed this app to provide a seamless chatting experience. 🧠 He's always working on new features to make this app even better! 💯",
    "😎 Surya S is the creative developer who built Talklet from scratch! His expertise in modern web technologies makes this app smooth and responsive. 🛠️ He's constantly improving the user experience!",
    "💫 Meet Surya S - the awesome developer of Talklet! With his coding skills and attention to detail, he created this amazing chat platform. 🎯 He's passionate about connecting people through technology!",
    "❤️ Talklet is the brainchild of Surya S, a developer with a vision for better communication tools! 💻 His dedication to clean code and intuitive design is evident throughout the app!",
    "⚡ Surya S is the tech wizard behind Talklet! 🧙‍♂️ His innovative approach to chat applications combines security, speed, and style in one amazing package!"
  ],
  how_to_use: [
    "To use Talklet, simply create an account, add friends, and start chatting! You can send text messages, images, and audio. You can also chat with me anytime!",
    "Using Talklet is easy! Just log in, find your friends in the contacts list, and start messaging. You can also create groups for multiple people to chat together."
  ],
  weather: [
    "I'm sorry, I don't have access to weather information. You might want to check a weather app or website for that!",
    "I can't check the weather for you, but you can easily find that information online!"
  ],
  jokes: [
    "Why don't scientists trust atoms? Because they make up everything!",
    "What did one wall say to the other wall? I'll meet you at the corner!",
    "Why did the scarecrow win an award? Because he was outstanding in his field!",
    "What do you call a fake noodle? An impasta!"
  ],
  music: [
    "I don't have the ability to play music, but Talklet lets you share audio messages with your friends!",
    "While I can't play music for you, you can use other apps for that. Talklet is great for chatting though!"
  ],
  hobbies: [
    "As a chatbot, my hobby is helping users like you! What are your hobbies?",
    "I enjoy chatting with people and learning new things. What about you?"
  ],
  compliment: [
    "Thank you! You're pretty awesome yourself!",
    "That's very kind of you to say!",
    "You just made my day! Thank you!"
  ],
  unknown: ["I'm still learning. You can ask your question at my gurunathar https://gemini.google.com",
    "I'm not sure I understand. Please try asking at my gurunathar https://gemini.google.com as I'm still under development.",
    "Sorry, I don't have an answer for that yet. Try asking this to my gurunathar at https://gemini.google.com",
    "I'm still under development. For better answers, please visit my gurunathar https://gemini.google.com"]
};

// Helper function to get a random response from a category
const getRandomResponse = (category) => {
  const responses = simpleResponses[category] || simpleResponses.unknown;
  return responses[Math.floor(Math.random() * responses.length)];
};

// Simple AI chatbot logic
const getSimpleAIResponse = async (message) => {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.match(/\b(hi|hello|hey|greetings)\b/)) {
    return getRandomResponse('greeting');
  } else if (lowerMsg.match(/\b(bye|goodbye|see you|farewell)\b/)) {
    return getRandomResponse('farewell');
  } else if (lowerMsg.match(/\b(thanks|thank you|appreciate|grateful)\b/)) {
    return getRandomResponse('thanks');
  } else if (lowerMsg.match(/\b(help|assist|support)\b/)) {
    return getRandomResponse('help');
  } else if (lowerMsg.match(/\b(what is your name|who are you|your name)\b/) ||
    (lowerMsg.includes('name') && lowerMsg.includes('your'))) {
    return getRandomResponse('name');
  } else if (lowerMsg.match(/\b(what is talklet|about talklet|this app|this application|tell me about|app info)\b/) ||
    (lowerMsg.includes('talklet') && (lowerMsg.includes('what') || lowerMsg.includes('about')))) {
    return getRandomResponse('app_info');
  } else if (lowerMsg.match(/\b(features|what can|functionality|capabilities|what does it do)\b/)) {
    return getRandomResponse('features');
  } else if (lowerMsg.match(/\b(who made|developer|creator|who created|who developed|who built)\b/) ||
    (lowerMsg.includes('developer') || lowerMsg.includes('surya'))) {
    return getRandomResponse('developer');
  } else if (lowerMsg.match(/\b(how to use|how do i|instructions|guide|tutorial)\b/)) {
    return getRandomResponse('how_to_use');
  } else if (lowerMsg.match(/\b(weather|temperature|forecast|rain|sunny)\b/)) {
    return getRandomResponse('weather');
  } else if (lowerMsg.match(/\b(joke|funny|make me laugh|tell me something funny)\b/)) {
    return getRandomResponse('jokes');
  } else if (lowerMsg.match(/\b(music|song|play|listen)\b/)) {
    return getRandomResponse('music');
  } else if (lowerMsg.match(/\b(hobby|hobbies|what do you do|free time|interests)\b/)) {
    return getRandomResponse('hobbies');
  } else if (lowerMsg.match(/\b(nice|good job|great|awesome|cool|amazing|excellent|wonderful)\b/)) {
    return getRandomResponse('compliment');
  } else {
    // Try web search for unknown queries. Prefer searching a filtered keyword
    try {
      console.log("No predefined response found, attempting web search");
      // Extract significant keyword(s) from the message by removing common stopwords
      const stopwords = new Set(['the', 'is', 'in', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'of', 'for', 'to', 'what', 'who', 'when', 'where', 'why', 'how', 'was', 'were', 'are', 'it', 'that', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'they', 'we', 'my', 'your', 'his', 'her', 'their', 'but', 'by', 'with', 'as', 'be', 'from', 'have', 'has', 'had', 'do', 'does', 'did']);
      const tokens = message.replace(/[.,!?;:\/()\[\]"']/g, ' ').split(/\s+/).map(t => t.trim()).filter(Boolean);
      const significant = tokens.filter(t => !stopwords.has(t.toLowerCase()));
      // Prefer a single keyword: pick the last significant token if multiple present
      let query;
      if (significant.length === 0) {
        query = message;
      } else if (significant.length === 1) {
        query = significant[0];
      } else {
        query = significant[significant.length - 1];
      }

      const searchResult = await performWebSearch(query);

      if (searchResult.success && searchResult.results && searchResult.results.length > 0) {
        console.log("Web search successful, returning answers");

        // Get up to 3 results to display
        const resultsToShow = searchResult.results.slice(0, 3);

        // Format the response with ChatGPT-like style - more empty lines, emojis, and better spacing
        const mainTopic = message.split(' ').slice(0, 3).join(' '); // Extract potential topic from query

        // Create a title without symbols, just bold text with emoji
        let response = `✨ ${mainTopic.toUpperCase()} ✨\n\n`;

        // Add subtitle as a separate point with empty lines and emoji
        let overviewSentence = "";
        if (resultsToShow[0] && resultsToShow[0].answer) {
          const firstSentence = resultsToShow[0].answer.split('.')[0];
          if (firstSentence && firstSentence.length > 20) {
            overviewSentence = firstSentence;
            response += `💡 ${overviewSentence}.\n\n`;
          } else {
            response += `💡 This is a topic I found some interesting information about.\n\n`;
          }
        } else {
          response += `💡 This is a topic I found some interesting information about.\n\n`;
        }

        // Add heading for highlights with emoji instead of symbol
        response += `🔍 KEY HIGHLIGHTS 🔍\n\n`;

        // Extract key points from the search results
        const allText = resultsToShow.map(result => result.answer).join(' ');
        let sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 15).slice(0, 7);

        // Filter out sentences that are too similar to the overview
        if (overviewSentence) {
          sentences = sentences.filter(sentence => {
            // Skip sentences that are too similar to the overview
            const similarity = (s1, s2) => {
              const words1 = s1.toLowerCase().split(/\W+/);
              const words2 = s2.toLowerCase().split(/\W+/);
              const commonWords = words1.filter(w => words2.includes(w) && w.length > 3);
              return commonWords.length / Math.max(words1.length, words2.length);
            };
            return similarity(sentence, overviewSentence) < 0.5;
          });
        }

        // Limit to 5 sentences
        sentences = sentences.slice(0, 5);

        // Add bullet points with emojis
        const bulletEmojis = ['🌟', '🔹', '💫', '✅', '📌'];
        sentences.forEach((sentence, index) => {
          const emoji = bulletEmojis[index % bulletEmojis.length];
          response += `• ${emoji} ${sentence.trim()}.\n\n`;
        });

        // No sources section as requested

        // Add follow-up suggestions without heading but with emojis
        const followUpSuggestions = [
          `🤔 Want to explore more about ${mainTopic} or learn about related topics?`,
          `🧐 Curious about specific aspects of ${mainTopic}?`,
          `📚 This is just an overview of ${mainTopic}. Would you like to dive deeper into any particular area?`,
          `🔎 I can help you discover more about ${mainTopic} or explore similar topics.`
        ];

        response += `${followUpSuggestions[Math.floor(Math.random() * followUpSuggestions.length)]}\n\n`;
        response += `🙂 I'm here to help!\n\n`;

        return response;
      } else {
        // Fallback to unknown response if search fails
        console.log("Web search failed or returned no results, using fallback response");
        return getRandomResponse('unknown') + "\n\n❓ Is there something else I can help you with?";
      }
    } catch (error) {
      console.error("Error in web search:", error);
      return getRandomResponse('unknown');
    }
  }
};

// ✅ Get AI response from Google AI Studio API with fallback to simple chatbot
const getAIResponse = async (userMessage) => {
  const apiKey = googleAIConfig.apiKey;

  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        contents: [{ parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          key: apiKey
        },
        timeout: 20000,
      }
    );

    // Extract text from the response
    const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    // If we got a valid response from the API, return it
    if (responseText && responseText.trim() !== "") {
      return responseText;
    } else {
      // If API returned empty response, use our simple chatbot
      return getSimpleAIResponse(userMessage);
    }
  } catch (error) {
    console.error("AI API error:", error.message);
    // On API error, use our simple chatbot
    return getSimpleAIResponse(userMessage);
  }
};

// ✅ Send message (text or image)
export const sendMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const { text, image, audio } = req.body;

    let newMessage;

    if (image) {
      const uploadResult = await cloudinary.uploader.upload(image);
      newMessage = await Message.create({
        senderId,
        receiverId,
        text,
        image: uploadResult.secure_url
      });
    } else if (audio) {
      const uploadAudio = await cloudinary.uploader.upload(audio, { resource_type: "video" });
      newMessage = await Message.create({ senderId, receiverId, text, audio: uploadAudio.secure_url });
    } else {
      newMessage = await Message.create({ senderId, receiverId, text });
    }

    // ✅ If chatting with Bumble Bee, get AI reply
    const receiverUser = await User.findById(receiverId);
    if (receiverUser?.isBot) {
      const aiText = await getAIResponse(text);
      // increase delay to 2 seconds to ensure ordering below user's message
      await new Promise((r) => setTimeout(r, 500));
      const aiMessage = await Message.create({
        senderId: receiverId,
        receiverId: senderId,
        text: aiText,
        seen: true
      });

      const senderSocketId = userSocketMap[senderId.toString()];
      if (senderSocketId) {
        io.to(senderSocketId).emit("newMessage", aiMessage);
      }
    }

    const receiverSocketId = userSocketMap[receiverId.toString()];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.json({ success: true, message: newMessage });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ Get all messages between two users
export const getMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    }).sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ Get users for sidebar (excluding current user)
export const getUserForSidebar = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();

    // Ensure the AI bot exists and is named Bumble Bee
    let bot = await User.findOne({ isBot: true });

    if (bot) {
      // Update name if it's still the old one
      if (bot.fullName !== "Bumble Bee") {
        bot.fullName = "Bumble Bee";
        await bot.save();
      }
    } else {
      // Create new if doesn't exist
      bot = await User.create({
        fullName: "Bumble Bee",
        profilePic: "/static/chitti.jpg",
        bio: "May I help you?",
        isBot: true,
      });
    }

    // Import FriendRequest model
    const FriendRequest = (await import("../models/FriendRequest.js")).default;

    // Get accepted friends
    const acceptedRequests = await FriendRequest.find({
      $or: [
        { senderId: currentUserId, status: 'accepted' },
        { receiverId: currentUserId, status: 'accepted' }
      ]
    });

    // Extract friend IDs
    const friendIds = acceptedRequests.map(req =>
      req.senderId.toString() === currentUserId ? req.receiverId : req.senderId
    );

    // Fetch accepted friends and bot
    let users = await User.find({
      _id: { $in: [...friendIds, bot._id] }
    });

    // Fetch groups where current user is a member and mix into users array
    const groups = await Group.find({ members: currentUserId }).populate("members", "fullName profilePic");
    const groupAsUsers = groups.map(g => ({
      _id: g._id,
      fullName: g.name,
      profilePic: "",
      isGroup: true,
      members: g.members,
    }));

    // Sort users by most recent message with current user
    const usersWithLastMessage = await Promise.all(users.map(async (u) => {
      const lastMsg = await Message.findOne({
        $or: [
          { senderId: currentUserId, receiverId: u._id },
          { senderId: u._id, receiverId: currentUserId }
        ]
      }).sort({ createdAt: -1 }).select('createdAt');
      return { user: u, lastAt: lastMsg?.createdAt || new Date(0) };
    }));

    usersWithLastMessage.sort((a, b) => b.lastAt - a.lastAt);
    const sortedUsers = usersWithLastMessage.map(x => x.user);

    res.json({ success: true, users: [...sortedUsers, ...groupAsUsers] });
  } catch (error) {
    console.log("Sidebar fetch error:", error.message);
    res.json({ success: false, message: error.message });
  }
};




// ✅ Mark messages as seen
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;

    await Message.updateMany(
      { senderId, receiverId, seen: false },
      { $set: { seen: true } }
    );

    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
