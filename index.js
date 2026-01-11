require("dotenv").config(); // <- MUST be at the very top
const { Client, GatewayIntentBits } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
const fallbackReplies = JSON.parse(process.env.FALLBACK_REPLIES);
const specialReplies = JSON.parse(process.env.SPECIAL_REPLIES);

function generateReply(userMessage) {
  const text = userMessage.toLowerCase();

  const specialWord = containsSpecialMention(text);

  if (specialWord) {
    return specialReplies[specialWord];
  }

  const randomReply = randomFrom(fallbackReplies);
  return randomReply;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function containsSpecialMention(text) {
  const arr = JSON.parse(process.env.SPECIAL_MENTIONS);
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
