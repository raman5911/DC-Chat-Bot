require("dotenv").config(); // <- MUST be at the very top
const { Client, GatewayIntentBits } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "models/gemini-2.5-flash-lite",
});

const PERSONALITY = process.env.PERSONALITY;

function safeJSONParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

const fallbackReplies = JSON.parse(process.env.FALLBACK_REPLIES, ["Hmm 😅", "Samajh nahi aaya", "Phir se bol na"]);
const specialReplies = JSON.parse(process.env.SPECIAL_REPLIES, {});

function generateReply(userMessage) {
  try {
    const text = (userMessage || "").toLowerCase();
    const specialWord = containsSpecialMention(text);

    if (specialWord && specialReplies[specialWord]) {
      return specialReplies[specialWord];
    }

    return randomFrom(fallbackReplies);
  } catch (e) {
    return "😅 Aaliya thoda busy hai abhi";
  }
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function containsSpecialMention(text) {
  const arr = safeJSONParse(process.env.SPECIAL_MENTIONS, []);
  const specialMentions = new Set(arr);

  const words = text.toLowerCase().split(/\s+/);

  for (const word of words) {
    if (specialMentions.has(word)) {
      return word; // return matched keyword
    }
  }
  return null;
}

console.log("Token:", process.env.DISCORD_TOKEN);

client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

let input = "";

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Only reply when mentioned
  if (!message.mentions.has(client.user)) return;

  try {
    await message.channel.sendTyping();

    const userText = message.content.replace(`<@${client.user.id}>`, "").trim();
    input = userText;

    const result = await model.generateContent([PERSONALITY, userText]);

    let reply = result.response.text();

    // Basic human cleanup
    reply = reply.replace(/as an ai.*?\./gi, "").slice(0, 400);

    message.reply(reply);
  } catch (err) {
    console.error(err);
    // Pick a random fallback message

    const reply = generateReply(input);

    message.reply(reply);
  }
});

client.login(process.env.DISCORD_TOKEN);
