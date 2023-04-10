// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require("discord.js");
const WebSocket = require("ws");
const axios = require("axios");

let recentMessage = null;

async function sendPoeMessage(message) {
  try {
    await axios.post(
      "https://poe.com/api/gql_POST",
      {
        queryName: "chatHelpers_sendMessageMutation_Mutation",
        variables: {
          chatId: 8076237,
          bot: "chinchilla",
          query: message,
          source: null,
          withChatBreak: false,
        },
        query:
          "mutation chatHelpers_sendMessageMutation_Mutation(\n  $chatId: BigInt!\n  $bot: String!\n  $query: String!\n  $source: MessageSource\n  $withChatBreak: Boolean!\n) {\n  messageEdgeCreate(chatId: $chatId, bot: $bot, query: $query, source: $source, withChatBreak: $withChatBreak) {\n    chatBreak {\n      cursor\n      node {\n        id\n        messageId\n        text\n        author\n        suggestedReplies\n        creationTime\n        state\n      }\n      id\n    }\n    message {\n      cursor\n      node {\n        id\n        messageId\n        text\n        author\n        suggestedReplies\n        creationTime\n        state\n        chat {\n          shouldShowDisclaimer\n          id\n        }\n      }\n      id\n    }\n  }\n}\n",
      },
      {
        headers: {
          origin: "https://poe.com",
          referer: "https://poe.com/ChatGPT",
          "sec-ch-ua":
            '"Brave";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
          cookie: "<>",
          "poe-formkey": "<>",
          "poe-tchannel": "<>",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
        },
      }
    );
  } catch (e) {
    console.error(e);
    throw e;
  }
}

let clientIsConnected = false;
let lastMessageID = null;

const ws = new WebSocket(
  "wss://tch532065.tch.poe.com/up/chan54-8888/updates?min_seq=4685248704&channel=poe-chan54-8888-pxdttdwmvnxglvkmjkwa&hash=14146363163894608184"
);

ws.on("error", console.error);

ws.on("open", () => {
  clientIsConnected = true;
  console.log("Connected");
});

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let firstMessage = true;

ws.on("message", (message) => {
  //  console.log(message.toString());
  const parsedMessage = JSON.parse(message.toString());
  if (!parsedMessage.messages?.length) return;
  const data = JSON.parse(parsedMessage.messages[0]);
  if (data.payload?.data?.messageAdded?.state === "complete") {
    if (
      !firstMessage &&
      clientIsConnected &&
      data.payload.data.messageAdded.id !== lastMessageID
    ) {
      recentMessage.reply(data.payload.data.messageAdded.text);
      lastMessageID = data.payload.data.messageAdded.id;
      console.log(data.payload.data.messageAdded.text);
      recentMessage = null;
    }
  }
  firstMessage = false;
});

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (
    !(
      message.content.toLowerCase().includes("chatgpt") ||
      message.content.toLowerCase().includes("994610603173875812")
    )
  )
    return;
  if (recentMessage !== null) {
    await message.react("❌");
    return;
  }
  recentMessage = message;
  recentMessage.channel.sendTyping();
  await sendPoeMessage(message.content);
});

// Login to Discord with your client's token
client.login("<TOKEN>");
