export type SupportLink = {
  label: string;
  href: string;
};

export type SupportTopic = {
  id: string;
  title: string;
  keywords: string[];
  answer: string;
  links: SupportLink[];
};

export const SUPPORT_TOPICS: SupportTopic[] = [
  {
    id: 'book',
    title: 'Book a consultation',
    keywords: ['book', 'booking', 'appointment', 'schedule', 'see a healer', 'consultation', 'session'],
    answer:
      'To book a consultation, open Find practitioners, choose a healer, and set a date, time, and video or audio call. The session then appears under My consultations. Join from that page when it is time — the call stays on the same screen.',
    links: [
      { label: 'Find a practitioner', href: '/practitioners' },
      { label: 'My consultations', href: '/consultations' },
    ],
  },
  {
    id: 'join',
    title: 'Join a video or audio call',
    keywords: ['join', 'call', 'video', 'audio', 'camera', 'microphone', 'daily', 'room', 'tab'],
    answer:
      'Open the consultation from My consultations or the practitioner dashboard. The video or audio room loads on that page — you do not need another tab. Allow camera and microphone when the browser asks. Your name in the call is the name on your profile, so you do not type a new one.',
    links: [
      { label: 'My consultations', href: '/consultations' },
      { label: 'Edit your profile', href: '/profile/edit' },
    ],
  },
  {
    id: 'cancel',
    title: 'Cancel an appointment',
    keywords: ['cancel', 'cancelled', 'reschedule', 'cannot attend', 'drop'],
    answer:
      'Both the patient and the practitioner can cancel a scheduled or in-progress appointment. Open the consultation list or the room itself and choose Cancel. Completed sessions cannot be cancelled. After cancel, the video room is closed.',
    links: [
      { label: 'My consultations', href: '/consultations' },
      { label: 'Practitioner consultations', href: '/practitioners/consultations' },
    ],
  },
  {
    id: 'identify',
    title: 'Identify a plant',
    keywords: ['identify', 'plant', 'herb', 'camera', 'photo', 'leaf', 'upload', 'picture'],
    answer:
      'Go to Identify a herb. Open your camera or upload a clear photo of the leaf or plant. We name it and point you to traditional uses in the library. Sign in if you want to save it to My herbs or History.',
    links: [
      { label: 'Identify a herb', href: '/identify' },
      { label: 'Search the library', href: '/search' },
    ],
  },
  {
    id: 'profile',
    title: 'Edit your profile',
    keywords: ['profile', 'name', 'photo', 'edit profile', 'display name', 'account'],
    answer:
      'Members can update name, photo, phone, location, and bio on Edit profile. Practitioners also have a public profile that patients see when they book — edit that from the practitioner dashboard under Edit profile.',
    links: [
      { label: 'Edit account profile', href: '/profile/edit' },
      { label: 'Edit practitioner profile', href: '/practitioners/profile/edit' },
    ],
  },
  {
    id: 'apply',
    title: 'Become a practitioner',
    keywords: ['apply', 'practitioner', 'healer', 'join as', 'verification', 'dashboard'],
    answer:
      'Apply from the practitioners page. You will add your details and identity documents. After approval, your login becomes a practitioner account and you can open the practitioner dashboard to manage sessions.',
    links: [
      { label: 'Apply as a practitioner', href: '/practitioners/apply' },
      { label: 'Practitioner dashboard', href: '/practitioners/dashboard' },
    ],
  },
  {
    id: 'subscription',
    title: 'Plans and access',
    keywords: ['subscription', 'plan', 'premium', 'basic', 'pay', 'pricing', 'forum'],
    answer:
      'Consultations are included in an active plan. Open Pricing to choose a plan, or Subscription to manage the one you already have. Forum access is for Premium Pro members and admins.',
    links: [
      { label: 'View pricing', href: '/subscription' },
      { label: 'Manage subscription', href: '/subscription/manage' },
    ],
  },
  {
    id: 'search',
    title: 'Find a remedy',
    keywords: ['search', 'herb', 'remedy', 'symptom', 'category', 'ailment', 'library'],
    answer:
      'Search remedies by plant name or how you feel. Categories group herbs by concern. Results are for education — they are not a diagnosis. For personal guidance, book a verified practitioner.',
    links: [
      { label: 'Search remedies', href: '/search' },
      { label: 'Browse categories', href: '/category' },
    ],
  },
];

export const SUPPORT_STARTERS = [
  'How do I book a consultation?',
  'How do I join a video call?',
  'How do I cancel an appointment?',
  'How do I identify a plant with my camera?',
  'How do I edit my profile?',
  'How do I apply as a practitioner?',
];

function tokenize(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

export function rankSupportTopics(question: string) {
  const words = new Set(tokenize(question));
  return SUPPORT_TOPICS
    .map((topic) => {
      const haystack = new Set(tokenize(`${topic.title} ${topic.keywords.join(' ')} ${topic.answer}`));
      let score = 0;
      words.forEach((word) => {
        if (topic.keywords.some((keyword) => keyword.includes(word) || word.includes(keyword))) score += 3;
        if (haystack.has(word)) score += 1;
      });
      return { topic, score };
    })
    .sort((a, b) => b.score - a.score);
}

export function localSupportReply(question: string) {
  const ranked = rankSupportTopics(question);
  const best = ranked[0];
  if (!best || best.score < 2) {
    return {
      answer:
        'I can guide you around RemedyAfrica — booking a healer, joining a call, identifying a plant, editing your profile, or applying as a practitioner. Ask one of those, or write to hello@remedyafrica.com if you need a person.',
      links: [
        { label: 'Find a practitioner', href: '/practitioners' },
        { label: 'Identify a herb', href: '/identify' },
        { label: 'Write to us', href: '/contact' },
      ] as SupportLink[],
      topicId: 'fallback',
    };
  }

  return {
    answer: best.topic.answer,
    links: best.topic.links,
    topicId: best.topic.id,
  };
}

export function supportSystemPrompt() {
  const catalog = SUPPORT_TOPICS.map(
    (topic) => `${topic.title}: ${topic.answer} Links: ${topic.links.map((link) => `${link.label} (${link.href})`).join(', ')}`
  ).join('\n');

  return `You are Remedy, a calm in-app guide for RemedyAfrica (remedyafrica.com).
Help people use the website: booking, video/audio consultations, cancelling, identifying plants, editing profiles, applying as a practitioner, and subscriptions.
Do not diagnose illness or prescribe herbs or doses. Point them to search, identify, or a verified practitioner.
Keep answers short (under 120 words), warm, and specific. Mention the matching page to open.
If the question is off-topic, say you only guide the RemedyAfrica app and offer the contact page.

App facts:
${catalog}`;
}
