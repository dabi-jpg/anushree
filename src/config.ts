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
  // The correct password (as defined in the Stitch login screen mockup)
  PASSWORD: "LogitechG402@",
  
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
      title: "Jain Temple",
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

  // Encrypted letter payload
  ENCRYPTED_LETTER: "b77ee28dc31a3f57c23c5473b0efc6ca477c864307447c00f2bc3d356df90b50fda000271d562db87190a15518c72d3bb51470085145ad64b2dd35d74335ae5f7f21426a4c2590e28de5aef54e64b89c9931137cafe2de2c8cc97d75a471c82f8fda06bd2398c8dc02f8cbdfda489160c1185f51a0b61f32be316df0b49229e387b4665cc6fd17366d90fd4d11e918564acf2a70180deeb6519d621c7dee566916b96699b21db92d994fcaaf65b91cd79b50e50f6770aa954dcdf107315557d75421d87e0bf305d2b5b9bd9d542cba997b54eb3ed69fbf2526fb0e3e9e2bd51e4f98c73a38ff27274e2a6fba3633a48c94a49797b8b46b5117831b24916df0982cc20ba11a6772a38e0f9dfde24a10502f7d360aaee19139f58f52f3fe8bd6518dcb71fe4e0c651fcef6ec846f8a4561907878db9509a8f6410bc4a7fc35a1ddc9e13dd783361cb0f6cbf3d03063cc5889b42ccc30507f3d82424711b8ed09bc41f332329024de9c788b377a2a72fa249b7b1d790ce4b16f21d132c04408ffd40687df4185099507390c47143e9ed78f6d57b6c72b10a34b7048247a56526fad4e0ead3557a26c6c810cd0eecfe09ed70821d07453c5d891eab6b0d6fea3432dde2cd61a0eacae24fc8a696ab8d6fc00e3293d877a89708c79dc47ed3830ab2934d20e445a6b4b7a882cd1c588966c3c72e63fce33822288e1dfb58bbda5bf546a313717c925e53ad684d23a77d674e6a1c797ba0aba6c75be79133f287b500a266a404e673b3ac99ade51a05c6ed9f98a2fabb99ffaf550d8b81e3412f246901b795a1d7fe00ee72728cae5db65b19664033e04fe9a2ced399370307a86d3af429de1f666716375b0a40ffcad14d246dd7d408f223531ef7e72d9fa5e3060d15818d8cc8db83f37a4c3a2471dfa9845da9a95a92a642d0615b14ef14a21d6c58bbf7c4b71c078533e0fdff69f9854754baf1d4b4cc9b25711a814e35e745b0cbca8a954a314feaba65398773bc940f4008e6731675267767ce1cb88b9fd44f89ba96ad9f900d1259acf167a62ff6bdae3a9b6a01d9f829a0a81839500d60d74e65cfb4e68f2c70dbe10b7ba4356ed07329bb3fcdd9060e4ab362b7d2d1e40aa219c447332ff6f60c1f91f69bcfdffc176d16964f294dbcc9e75bf6e0da820618f65af1a518392d7fbe4b32634778811c45c31d1341cd822b00891bed79b1692dd5c05bfeca29aaece9965f72851e7299c7cf6e92ca39de9e39b3d0376f9ac7a58a37ffda31acfb0d1382feb72f566bf3b3ef71d95edb92a29724c68c43084bd4556b81a602b8e139a6f9322736b3db7b5ebe12637a8738cf93039be2e1a8b17a627d9421174e94411b9c9ecbf5da6089f17f4e8b633e2754ebded91bdf13b9db7b048c421058d4816af6bdc7ab588e4151ec701453f731aa948e12fc58f5537b501eabc52cf4d8ba46e80be37e37de85cf7ab0fb33a57a8ba866f266381f62891ee3513909756dcb9076ad4297993345ea2f630fed8152dfbb0cac8fb77ca4cdde321b0258601dcf772c7e7057b62eb203789cdc1a6e8b34edb4c8ae4dbb59c33439a0ea97b904095bf47661779fb4fbf8a2784d6d43177931f9cb91dce423ae4612bd40dc852c6b1e6337ac8c894d3d416359b2d32d017929eeb0b0f29786e8406a71d3d8f58fc8c060cc8a79fb55b0d5380b21dacc2958f45ac49159b5dee07563564a093475c08e9a0f574104026498fa7a9b5bef060b0c47578cdd109bbbba473516c43e2b340eb4285da5ee293ae6b7e3fd4695bd25be9396181d0ea64c2af0394bc1fb844879dfd289299bbe881bf4fdec3e48c7df16bfd46ebc909b9adb551c03860db53e78c86fbb02da126a96ad909452b6c9d227c7bb45cc7dba1a2868a5643caf4969e7c6d4fd463e9acbe92ebc628fc69203094bde0da2b8628a9be431b94da56ec82cf6cfd02a645041e87f71e05a6e4a80e691465d8406c0b0fca897735c7272048893f9ca462bdf60373e4b49c6bda9dad63d5b91dd85061fda3350e2cf16afd405b74b90f63ca699eecac9b31e716c80e0e43986fdb0bbbbc9600a2a20c27e861d8a56fb7f7f59d6a0eb1944ee57ec3bc791947cdc73996cea113f0125ac527302cb90248b031c43401e29a16af397a8c0b653e37b9b9338fe35c2ba80972499ceb8f36ac54e8e29fd1d1a35ce3007875880c19bffb2d07e105dc58256294bcbfa3eae33a76da74507ae9fa544096245391db3595c2d302b6c47ee77f1ec230d4d25d9e29a9d2e4b30f32a145635149d18db9508b65194f86aed447297f9f15e7d712c139900aec6ba1f1c22852540f5b7d93416055170bf1b0dbd156bfb0b41c12da131077812c9c368c463f0c4c6271214dba4cf34b42b2552e584c3b4a98f27a9860e4f80321ab60a986ecbf0cdb68b572fbec402cb05e5751b176b21dbdf0c4a7c13a4b2d0304d42bad5255a75da9296cc898a7fdea6eb40eab991ac17cfebedf194191135125f2a754b09a8a981d317042ff0ffe7af51105e1c3e3fe65ccbc0227fd16503c7008f4b11d14307b31b0cfd73cf06ed120bff7dea44df51139c06d205f3e783d6c2dae2bd89c39b9724ac69f52d7d9e5907bf0f26e406e8b0792f44862341967979ae0f88af5ea036f5163bd6627d570a01e0dfc073ee850fd2c22928264c3d9c39b39b4df2f32174e3154a47bda8cd4643f909cd2a2e7e28f13a0f0422788fd366c1f992fa8c60ae4fb823e7922966efef540ca3a3a599d6ce3c678c9887cd6384df99fdecf11d6765e6ccc271978dae9d0dc322c817bc2ed184744efaf45503faab54049215190c0e0cc4214f92654084c0279010b3a27c058d9d10d5848287e650627f7d764f846f86b8e45bd2b873d7290159ffcc1599df3e7633ef2dc7b02048e53650bea1bae36e692b6f6d0d957e244792b6e6712f41db180faf59ebb95c238989183a7c8c4e7d8610d847feba0212d64960ae4c16e59040e36aa307ff91bd2aea09788d1efd480195b4f66b378ed2726300b7486f3008207c37e9c786916d23c1ebeff741e1be05c45a9e01b37c2479c9eef15f5214636fc77186e0151ea14bd74cd70d5bf45f5e7c32d0c4f3d1f8c2c6d855d49df094b1f8eea900aa0a774568fe64ed25099e26f662cd7"
};
