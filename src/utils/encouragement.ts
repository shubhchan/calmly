const ENCOURAGEMENT_MESSAGES = {
  habit: {
    complete: [
      "Beautiful! One step at a time 🌱",
      "You showed up for yourself today. That matters.",
      "Small wins build big changes ✨",
      "Progress, not perfection 🌿",
      "Your future self will thank you",
      "Consistency > intensity",
      "You're building something meaningful",
      "One habit, one day at a time 🌻",
    ],
    streak: [
      "Incredible streak! You're on fire 🔥",
      "Look at you go! 🌟",
      "Consistency is your superpower",
      "Day {streak} — you're unstoppable",
      "This streak is proof of your commitment",
    ],
    missed: [
      "You missed yesterday. That's okay. Start again today 🌱",
      "A missed day doesn't erase your progress",
      "Tomorrow is a fresh start. No guilt needed 🌿",
      "Life happens. What matters is coming back",
      "One off day won't break your journey",
      "Be gentle with yourself. Begin again 🌸",
    ],
    empty: [
      "No habits yet. Your first one can start small 🌱",
      "Ready to build something? Start with one tiny habit",
      "Small steps lead to big transformations ✨",
    ],
  },
  journal: {
    empty: [
      "No entries yet. Your first thought can start here 🌱",
      "Your story begins with a single word",
      "This space is yours. Fill it at your pace ✨",
    ],
    complete: [
      "Your thoughts are safe here 📖",
      "Writing it down makes it real",
      "Another page in your journey",
    ],
  },
  calm: {
    complete: [
      "You took time to breathe. That's powerful 🌿",
      "Calm restored. Carry this feeling forward",
      "Your nervous system thanks you ✨",
    ],
  },
  gratitude: {
    empty: [
      "No gratitude entries yet. Notice something good? 🌱",
      "Gratitude grows when you water it 🌿",
      "Your first 'thank you' can start here ✨",
    ],
    complete: [
      "Gratitude saved. Your heart grows lighter 🌿",
      "Noticing the good changes everything ✨",
      "Another moment of appreciation captured 🌱",
    ],
    resurfaced: [
      "Remember this? ❤️ A little sunshine from your past",
      "You wrote this when you needed it. You need it now too 🌿",
      "A gift from your past self 🌱",
    ],
  },
  positive: {
    empty: [
      "No good things saved yet. Capture a win? ✨",
      "Small moments matter. Save one today 🌿",
      "Your highlight reel starts with one entry 🌱",
    ],
    complete: [
      "Good thing saved. Joy compounds 🌿",
      "Another win for your collection ✨",
      "You're building a reservoir of light 🌱",
    ],
    resurfaced: [
      "Remember this? ❤️ A little sunshine from your past",
      "You wrote this when you needed it. You need it now too 🌿",
      "A gift from your past self 🌱",
    ],
  },
  general: [
    "You're doing better than you know 🌱",
    "One moment at a time",
    "Small steps, big heart",
    "Progress isn't always visible. Trust the process 🌿",
  ],
};

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getEncouragement(
  category: keyof typeof ENCOURAGEMENT_MESSAGES,
  subcategory?: string,
  context?: { streak?: number }
): string {
  const cat = ENCOURAGEMENT_MESSAGES[category];
  if (!cat) return getRandom(ENCOURAGEMENT_MESSAGES.general);

  if (subcategory && typeof cat === 'object' && subcategory in cat) {
    const messages = (cat as Record<string, string[]>)[subcategory];
    let msg = getRandom(messages);
    if (context?.streak !== undefined) {
      msg = msg.replace('{streak}', context.streak.toString());
    }
    return msg;
  }

  if (Array.isArray(cat)) {
    return getRandom(cat);
  }

  return getRandom(ENCOURAGEMENT_MESSAGES.general);
}

export function getHabitEncouragement(type: 'complete' | 'streak' | 'missed' | 'empty', streak?: number): string {
  return getEncouragement('habit', type, { streak });
}

export function getJournalEncouragement(type: 'complete' | 'empty'): string {
  return getEncouragement('journal', type);
}

export function getCalmEncouragement(type: 'complete'): string {
  return getEncouragement('calm', type);
}

export function getGeneralEncouragement(): string {
  return getRandom(ENCOURAGEMENT_MESSAGES.general);
}

export function getGratitudeEncouragement(type: 'complete' | 'empty' | 'resurfaced'): string {
  return getEncouragement('gratitude', type);
}

export function getPositiveMomentEncouragement(type: 'complete' | 'empty' | 'resurfaced'): string {
  return getEncouragement('positive', type);
}