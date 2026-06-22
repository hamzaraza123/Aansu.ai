import type { FeedItem } from "../components/Feed";

export const INITIAL_MOCK_FEED: FeedItem[] = [
  {
    id: "feed-1",
    inconvenience: "My morning coffee became lukewarm before I could take a second sip.",
    poem: "Garm thhi jo subah ki lazzat, sard hai ab woh pyaala,\nBujh gaya dil ka chiraag, chha gaya gham ka haala.\nEk chuski ke tarasne ka gham kaise bayaan karun,\nLikh diya maut ne meri, khatm hai mera nivaala!",
    poetName: "Mirza Cold-Brew Ghalib",
    weepsCount: 142,
    createdTime: "2 hours ago",
    reactions: { laughing: 5, sad: 12, hands: 8, heart: 24 }
  },
  {
    id: "feed-2",
    inconvenience: "The automated door didn't detect me and I had to wave my hands like a madman.",
    poem: "Dastak di jo deewar pe, koi khula darwaza na mila,\nKhada raha dar-ba-dar, koi hum-safar saaza na mila.\nHath hilate rahe hum hawa me deewana-waar,\nIs aahat pe na haso yaaron, mujhe mera janaza na mila!",
    poetName: "Shair-e-Bluetooth-Dard",
    weepsCount: 89,
    createdTime: "4 hours ago",
    reactions: { laughing: 34, sad: 3, hands: 1, heart: 6 }
  },
  {
    id: "feed-3",
    inconvenience: "I forgot my password and the reset link took three minutes to arrive.",
    poem: "Khaak me mil gaya har raaz, har hisaab gaya,\nBhool gaya jo kalma-e-dakhil, mera azaab gaya.\nTees minat ke barabar the wo teen dard-o-sitam,\nMuntazir baithe rahe kabr me, aur shabaab gaya!",
    poetName: "Allama Reset-e-Qabr",
    weepsCount: 205,
    createdTime: "Yesterday",
    reactions: { laughing: 12, sad: 45, hands: 18, heart: 30 }
  },
  {
    id: "feed-4",
    inconvenience: "The rain started exactly 30 seconds after I stepped out without an umbrella.",
    poem: "Kadam jo nikale ghar se bahar, falak ro pada,\nMera hi naseeb thha ya asmaan ko gussa chadh pada.\nBina chatri ke is sehra me beh gaye saare armaan,\nKafan bhi bheeg gaya mera, jab pehla katra pad pada!",
    poetName: "Dard-e-Drizzle",
    weepsCount: 312,
    createdTime: "2 days ago",
    reactions: { laughing: 2, sad: 0, hands: 0, heart: 0 }
  }
];
