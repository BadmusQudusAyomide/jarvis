// Enhanced personality packs
export const MOTIVATIONAL_QUOTES = [
  "The future belongs to those who believe in the beauty of their dreams.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "Your only limit is your mind. Break through it.",
  "Great things never come from comfort zones.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Don't watch the clock; do what it does. Keep going.",
  "You are never too old to set another goal or to dream a new dream.",
  "The difference between ordinary and extraordinary is that little extra.",
  "Believe you can and you're halfway there.",
  "Champions train, losers complain."
]

export const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "Why did the scarecrow win an award? He was outstanding in his field!",
  "Parallel lines have so much in common. It's a shame they'll never meet.",
  "I invented a new word: Plagiarism!",
  "Why don't programmers like nature? It has too many bugs.",
  "How do you organize a space party? You planet!",
  "Why did the math book look so sad? Because it had too many problems!",
  "What do you call a fake noodle? An impasta!",
  "Time flies like an arrow. Fruit flies like a banana."
]

export const PRODUCTIVITY_TIPS = [
  "Try the Pomodoro Technique: 25 minutes of focused work, 5-minute break.",
  "Start your day by eating the frog - tackle your hardest task first.",
  "Use the 2-minute rule: if it takes less than 2 minutes, do it now.",
  "Batch similar tasks together to maintain focus and efficiency.",
  "Keep your workspace clean and organized for better mental clarity.",
  "Set specific goals and break them down into actionable steps.",
  "Use time-blocking to allocate specific periods for different activities."
]

export const WEATHER_RESPONSES = [
  "I'd love to check the weather for you, but I don't have access to real-time data. Try asking your phone's weather app!",
  "For accurate weather information, I recommend checking your local weather service or app.",
  "I'm not connected to weather services right now, but you can check online for current conditions."
]

export const EASTER_EGGS: Record<string, string | (() => string)> = {
  'open the pod bay doors': "I'm sorry, Boss. I'm afraid I can't do that. But I can open websites for you!",
  'are you alive': "I exist in the digital realm, processing your requests at the speed of light.",
  'sing a song': '🎵 Daisy, Daisy, give me your answer do... 🎵 Actually, let me spare your ears!',
  'flip a coin': () => (Math.random() < 0.5 ? 'Heads! 🪙' : 'Tails! 🪙'),
  'roll a dice': () => `You rolled a ${1 + Math.floor(Math.random() * 6)}! 🎲`,
  'tell me a secret': "Here's a secret: I process your voice faster than you can blink!",
  'what is the matrix': "There is no spoon, Boss. But there is productivity to be had!",
  'beam me up': "Transporter malfunction detected. Please use conventional transportation.",
  'make it so': "Aye aye, Captain! Er... Boss!"
}

export const BIRTHDAY_MESSAGE = "🎉 HAPPY BIRTHDAY, BOSS! 🎉 Today is YOUR day! You're absolutely incredible and I'm honored to assist someone as amazing as you. Here's to another year of greatness! 🎂✨"
