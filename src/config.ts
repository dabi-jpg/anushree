export interface MemoryItem {
  id: number;
  title: string;
  caption: string;
  image: string;
  rotation: string;
}

export interface WiseWordItem {
  id: number;
  author: string;
  message: string;
}

export interface AchievementItem {
  icon: string;
  title: string;
  desc: string;
}

export const BIRTHDAY_CONFIG = {
  // Target birthday date. Since local time is May 31, 2026, setting it to today makes it active.
  // If set in the future, the countdown will display.
  BIRTHDAY_DATE: "2026-05-31T00:00:00",

  // Memories horizontal timeline items
  TIMELINE_ITEMS: [
    {
      id: 1,
      title: "First Picture",
      caption: "one of the first pictures we ever took together God what was i thinking with that Moustache",
      image: "/memory_1.jpg",
      rotation: "rotate-2"
    },
    {
      id: 2,
      title: "Grumpy Baby",
      caption: "PMO since 2006",
      image: "/memory_2.jpg",
      rotation: "-rotate-3"
    },
    {
      id: 3,
      title: "Suresh Anna",
      caption: "Suresh Anna looking hot as ever",
      image: "/memory_3.jpg",
      rotation: "rotate-1"
    },
    {
      id: 4,
      title: "Lake Day",
      caption: "One of my time i ever spend with you.. And please dont wiggle when I'm driving",
      image: "/memory_4.jpg",
      rotation: "-rotate-2"
    },
    {
      id: 5,
      title: "Garba Outfit",
      caption: "I look Hot",
      image: "/memory_5.jpg",
      rotation: "rotate-3"
    }
  ] as MemoryItem[],

  // Wise words quotes (postcard swiper)
  WISE_WORDS: [
    {
      id: 1,
      author: "Neha",
      message: "Anushree when asked a normal question: 'I-I-I d-don't kn-know...'\nAnushree when Sana is mentioned: 'SANAA~'"
    },
    {
      id: 2,
      author: "Bijin",
      message: "Nee Oru Myrathy Aaan"
    },
    {
      id: 3,
      author: "Manvi",
      message: "My bad I dont have her number and Neha said she slept off"
    },
    {
      id: 4,
      author: "Ditae",
      message: "She slept off so couldn't get from her also my bad gng"
    },
    {
      id: 5,
      author: "SaNa",
      message: "Sadly I dont have her number even if I did idt she is picking up my call"
    }
  ] as WiseWordItem[],

  // Gaming-themed achievements
  ACHIEVEMENTS: [
    {
      icon: "🏆",
      title: "Professional Yapper",
      desc: "Has the legendary ability to talk for 4+ hours without taking a single breath. Speeds up by 2x in game lobbies."
    },
    {
      icon: "🏆",
      title: "Chaos Generator",
      desc: "Passively radiates chaotic energy (+100 chaos). Side effects include turning simple tasks into wild side-quests."
    },
    {
      icon: "🏆",
      title: "Carried The Team Once",
      desc: "A miraculous event that occurred on a random Tuesday. Details are currently under review by gaming historians."
    },
    {
      icon: "🏆",
      title: "Birthday Girl",
      desc: "Exclusive 24-hour buff: Grants total immunity to teasing and a 3x multiplier on cake consumption."
    },
    {
      icon: "🏆",
      title: "Emotional Damage Dealer",
      desc: "Deals 95% critical damage using only light sarcasm and raised eyebrows. High combat efficiency."
    }
  ] as AchievementItem[],

  // Random Wisdom Generator (Compliment generator)
  WISDOM_FORECASTS: [
    "Today's forecast: 100% birthday energy, with a high chance of chaotic gaming throws.",
    "You are legally required to have fun today. Non-compliance will be reported to the Birthday Council.",
    "The Birthday Council has approved your license to yap. Speak freely, Birthday Queen!",
    "Legend says if you eat enough birthday cake today, your teammates will stop throwing. Worth a shot!",
    "Congratulations! You've unlocked Level 20+ of being amazing, funny, and slightly annoying.",
    "Your chaos level is currently operating at 150%. Please maintain this level until tomorrow.",
    "Warning: Birthday vibes are reaching critical levels. Please proceed to the nearest slice of cake.",
    "Scientific fact: Birthdays are good for you. Statistics show that people who have more birthdays live longer.",
    "Error 404: Chill not found. Birthday hype level is too high."
  ] as string[],

  // Surprise "Do Not Press" messages (rotates on click)
  SURPRISE_MESSAGES: [
    "You pressed it.",
    "I knew you would.",
    "This is why I don't trust you.",
    "Stop pressing me! I have feelings.",
    "Okay, that was a close one. Please stop.",
    "Do you want me to crash the site? Because that's how we crash the site.",
    "Seriously? Again?",
    "Every time you click, a pixel cries.",
    "Access Denied. Just kidding, here's more confetti! 🎉",
    "Loading self-destruct in 3... 2... actually, I'm too cute to self-destruct.",
    "Legend says if you click this 100 times, you get absolute gaming luck.",
    "You are very stubborn. I respect that.",
    "Alright, you win. Here's a virtual hug. 🤗",
    "Okay, go scroll down and read the letter now!"
  ] as string[],

  // Spotify Playlist Embed Songs (we'll embed some nice indie/chill tracks or gamer theme)
  // These are standard embed links that we'll load into our Spotify section.
  SPOTIFY_TRACKS: [
    "https://open.spotify.com/embed/track/7ouMYWpwJ422jWrw78257k?utm_source=generator", // Chill song
    "https://open.spotify.com/embed/track/254b321qpEg84Jz1ccEFj3?utm_source=generator"  // Gaming / upbeat
  ] as string[],

  // Birthday letter
  LETTER: {
    header: "Hey Anushree,",
    body: [
      "I am really bad at this ig idk, but yeah, Happy Birthday. I kinda know things are bad between us, and I'm sorry for doing this, and yes, I am going to be emo cause you had all the chance not to click on that button.",
      "You are one of the best people I ever came across. Thank you for being there for me even when I asked you not to be there. Thank you for being there when it was really hard for you also. IDK if things between us will ever be the same, IDK next year this time we will even be in talking terms, but I hope things go back to what it was.",
      "You were the first person in my entire life who I clicked with instantly. IDK, something about you and your stupid glasses, and that awkward smile you had in SP trying to blend in with me and Jake when we were yapping some shit about Wayanad. IDK, for some reason, I was like, damn, I'm gonna be friends with this chick. You being in VLSI gave me a reason to text you, and IDK bro what happened after that. It was a rollercoaster of emotions, tbh. You made me realise that I'm someone who deserves love; for a kid who grew up feeling weird and not someone who could easily blend in, that meant a lot. You trusted in me when I didn't even trust in myself.",
      "Ahhhh, IDK what to tell, bro. The way you walk is funny, the way you eat fries is funny, the way you pinch my neck when I PMO you is like the cutest thing ever. IDK bro, the way your eyes look and you wiggling when sitting behind a scooter—if it was someone else, I would either beat them up or cuss at their entire generation of family members, you can ask Karthik. Yeah, IDK really what to say. Thank you for starting the tradition of jamming Spotify while sleeping, tbh it helped a lot of my friends when they were sad, I just send them a jam link and ask them to join. IDK how I impacted your life. IDK if we are ever gonna be together.",
      "For what it's worth, it was a privilege knowing you, Anushree Suresh. Anyone who gets to be your friend and partner is really lucky to have you, ig (My English, ahhh). So have an amazing year, Anushree. You are a good soul, and I hope I get to be a part of it.",
      "Love,\nNiranjan",
      "PS: If I don't get a job, please tell Suresh Anna to give me one."
    ]
  }
};
