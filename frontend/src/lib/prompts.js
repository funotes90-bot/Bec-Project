export const SPEAKING_PROMPTS = [
  "What do you think about your English so far?",
  "Talk about your favourite hobby and why you enjoy it.",
  "Describe your typical daily routine as an English learner.",
  "Talk about your favourite food and how to make it.",
  "What is your favourite movie and why do you like it?",
  "Describe your best friend and what you like about them.",
  "Talk about a place you really want to visit one day.",
  "What did you do last weekend?",
  "Describe your family in a few sentences.",
  "What is your dream job and why?",
  "Talk about your favourite song or singer.",
  "What makes you happy on a difficult day?",
  "Describe your hometown to a foreign friend.",
  "What is the hardest thing about learning English for you?",
  "Talk about a book or story you enjoyed.",
  "What would you do with a completely free day tomorrow?",
  "Describe your favourite season and why you like it.",
  "Talk about a person who inspires you.",
  "What is your favourite way to relax after studying?",
  "Describe a memorable trip you have taken.",
  "What technology can you not live without, and why?",
  "Talk about a goal you want to achieve this year.",
  "Describe your favourite childhood memory.",
  "What do you usually do to practise your English?",
  "Talk about your favourite sport or physical activity.",
  "If you could meet anyone in the world, who would it be?",
  "Describe your ideal weekend morning.",
  "Talk about something new you learned recently.",
  "Talk about your favourite app and how you use it.",
  "Why is learning English important for your future?",
];

export const WRITING_PROMPTS = [
  "Write about your daily routine as a student.",
  "Describe your favourite hobby and why you love it.",
  "Write about the last movie you watched.",
  "Write a short paragraph about your best friend.",
  "Describe a place you would love to visit and why.",
  "Write about what you did last weekend.",
  "Introduce your family in a short paragraph.",
  "Write about your dream job.",
  "Describe your favourite food and how it tastes.",
  "Write about why you are learning English.",
  "Describe your hometown.",
  "Write about a person who inspires you.",
  "Write about your favourite season.",
  "Describe a memorable day in your life.",
  "Write about your goals for this year.",
  "Write a short email inviting a friend to your birthday.",
  "Describe your favourite book.",
  "Write about your morning routine.",
  "Write about a new hobby you would like to try.",
  "Describe your favourite gadget and how you use it.",
  "Write about the best gift you have ever received.",
  "Write about what makes someone a good friend.",
  "Describe your favourite way to spend free time.",
  "Write about a challenge you overcame.",
  "Write a short review of a restaurant you like.",
  "Describe your ideal holiday.",
  "Write about your favourite childhood memory.",
  "Write about a skill you want to learn.",
  "Describe a typical day at your school or work.",
  "Write about why reading is important.",
];

export function randomPrompt(list, exclude) {
  let p = list[Math.floor(Math.random() * list.length)];
  if (exclude && list.length > 1) {
    while (p === exclude) p = list[Math.floor(Math.random() * list.length)];
  }
  return p;
}

export const SPEAKING_CATEGORIES = [
  {
    id: "hobbies",
    label: "Hobbies & Favourites",
    prompts: [
      "Talk about your favourite hobby and why you enjoy it.",
      "Talk about your favourite food and how to make it.",
      "What is your favourite movie and why do you like it?",
      "Talk about your favourite song or singer.",
      "Talk about a book or story you enjoyed.",
      "Describe your favourite season and why you like it.",
      "Talk about your favourite sport or physical activity.",
      "Talk about your favourite app and how you use it.",
      "What is your favourite way to relax after studying?",
    ],
  },
  {
    id: "daily",
    label: "Daily Life",
    prompts: [
      "Describe your typical daily routine as an English learner.",
      "What did you do last weekend?",
      "Describe your family in a few sentences.",
      "Describe your hometown to a foreign friend.",
      "Describe your ideal weekend morning.",
      "What do you usually do to practise your English?",
    ],
  },
  {
    id: "opinion",
    label: "Opinions & Reflection",
    prompts: [
      "What do you think about your English so far?",
      "What is the hardest thing about learning English for you?",
      "What makes you happy on a difficult day?",
      "Why is learning English important for your future?",
      "Talk about something new you learned recently.",
    ],
  },
  {
    id: "people",
    label: "People & Inspiration",
    prompts: [
      "Describe your best friend and what you like about them.",
      "Talk about a person who inspires you.",
      "If you could meet anyone in the world, who would it be?",
    ],
  },
  {
    id: "goals",
    label: "Experiences & Goals",
    prompts: [
      "Talk about a place you really want to visit one day.",
      "What is your dream job and why?",
      "What would you do with a completely free day tomorrow?",
      "Talk about a goal you want to achieve this year.",
      "Describe your favourite childhood memory.",
      "Describe a memorable trip you have taken.",
      "What technology can you not live without, and why?",
    ],
  },
];

export const WRITING_CATEGORIES = [
  {
    id: "hobbies",
    label: "Hobbies & Favourites",
    prompts: [
      "Describe your favourite hobby and why you love it.",
      "Write about the last movie you watched.",
      "Describe your favourite food and how it tastes.",
      "Describe your favourite book.",
      "Write about your favourite season.",
      "Describe your favourite gadget and how you use it.",
      "Describe your favourite way to spend free time.",
      "Write about a new hobby you would like to try.",
    ],
  },
  {
    id: "daily",
    label: "Daily Life",
    prompts: [
      "Write about your daily routine as a student.",
      "Write about what you did last weekend.",
      "Introduce your family in a short paragraph.",
      "Describe your hometown.",
      "Write about your morning routine.",
      "Describe a typical day at your school or work.",
    ],
  },
  {
    id: "opinion",
    label: "Opinions & Reflection",
    prompts: [
      "Write about why you are learning English.",
      "Write about what makes someone a good friend.",
      "Write about why reading is important.",
      "Write a short review of a restaurant you like.",
    ],
  },
  {
    id: "people",
    label: "People & Inspiration",
    prompts: [
      "Write a short paragraph about your best friend.",
      "Write about a person who inspires you.",
      "Write a short email inviting a friend to your birthday.",
    ],
  },
  {
    id: "goals",
    label: "Experiences & Goals",
    prompts: [
      "Describe a place you would love to visit and why.",
      "Write about your dream job.",
      "Describe a memorable day in your life.",
      "Write about your goals for this year.",
      "Write about the best gift you have ever received.",
      "Write about a challenge you overcame.",
      "Describe your ideal holiday.",
      "Write about your favourite childhood memory.",
      "Write about a skill you want to learn.",
    ],
  },
];

export function promptsForCategory(categories, catId) {
  if (!catId || catId === "all") return categories.flatMap((c) => c.prompts);
  const c = categories.find((x) => x.id === catId);
  return c ? c.prompts : categories.flatMap((x) => x.prompts);
}
