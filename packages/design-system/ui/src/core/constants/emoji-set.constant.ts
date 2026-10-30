/**
 * Stackra file contract:
 * Purpose: `EMOJI_SET`, the curated emoji an EmojiPicker offers, by category, each with English search words.
 * Boundary: data only; categories are named through `ui::emoji_picker.*`.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { EmojiEntry } from "#core/types/emoji-entry.type";

// shortcut: a curated set of about 150 emoji with English words; swap for a full Unicode dataset (emojibase) with
// localised words when a product needs search in every language.
/** The emoji categories, in the order the picker shows them. */
type EmojiCategory =
  | "smileys"
  | "people"
  | "nature"
  | "food"
  | "activities"
  | "travel"
  | "objects"
  | "symbols";

/** The raw set: each emoji with its words. */
const RAW: Record<EmojiCategory, readonly (readonly [string, string])[]> = {
  smileys: [
    ["😀", "grin smile happy"],
    ["😂", "joy laugh tears"],
    ["🙂", "slight smile"],
    ["😉", "wink"],
    ["😍", "heart eyes love"],
    ["🥰", "smiling hearts love"],
    ["😎", "cool sunglasses"],
    ["🤔", "thinking"],
    ["😅", "sweat smile relief"],
    ["😢", "cry sad"],
    ["😮", "surprised wow"],
    ["😡", "angry"],
    ["🥳", "party celebrate"],
    ["😴", "sleep tired"],
    ["🤩", "star struck"],
    ["🙏", "thanks pray please"],
    ["😇", "angel innocent"],
    ["🤗", "hug"],
    ["😬", "grimace awkward"],
    ["🤯", "mind blown"],
  ],
  people: [
    ["👍", "thumbs up like yes"],
    ["👎", "thumbs down no"],
    ["👏", "clap applause"],
    ["🙌", "raise hands hooray"],
    ["👋", "wave hello bye"],
    ["🤝", "handshake deal"],
    ["💪", "strong muscle"],
    ["✌️", "peace victory"],
    ["👌", "ok perfect"],
    ["🤞", "fingers crossed luck"],
    ["👀", "eyes look"],
    ["🫡", "salute"],
    ["🧑‍💻", "developer laptop"],
    ["🧑‍🍳", "cook chef"],
    ["🧑‍🏫", "teacher"],
    ["🧑‍⚕️", "health worker"],
  ],
  nature: [
    ["🌴", "palm tree"],
    ["🌵", "cactus desert"],
    ["🌸", "blossom flower"],
    ["🌹", "rose"],
    ["🍀", "clover luck"],
    ["☀️", "sun"],
    ["🌙", "moon crescent"],
    ["⭐", "star"],
    ["🔥", "fire hot"],
    ["🌧️", "rain"],
    ["❄️", "snow cold"],
    ["🐪", "camel"],
    ["🐎", "horse"],
    ["🦅", "eagle falcon"],
    ["🐱", "cat"],
    ["🐶", "dog"],
  ],
  food: [
    ["☕", "coffee"],
    ["🍵", "tea"],
    ["🫖", "teapot"],
    ["🍰", "cake"],
    ["🍕", "pizza"],
    ["🍔", "burger"],
    ["🥗", "salad"],
    ["🍚", "rice"],
    ["🥙", "shawarma wrap"],
    ["🍉", "watermelon"],
    ["🍓", "strawberry"],
    ["🥤", "drink cup"],
    ["🍫", "chocolate"],
    ["🍪", "cookie"],
    ["🥐", "croissant"],
    ["🌶️", "chili spicy"],
  ],
  activities: [
    ["⚽", "football soccer"],
    ["🏀", "basketball"],
    ["🎾", "tennis"],
    ["🏋️", "weights gym"],
    ["🏃", "run"],
    ["🚴", "bike cycle"],
    ["🏊", "swim"],
    ["🎉", "party tada"],
    ["🎁", "gift present"],
    ["🏆", "trophy win"],
    ["🥇", "gold medal first"],
    ["🎮", "game controller"],
    ["🎨", "art palette"],
    ["🎵", "music note"],
    ["📚", "books study"],
    ["🧘", "yoga calm"],
  ],
  travel: [
    ["✈️", "plane flight"],
    ["🚗", "car"],
    ["🚕", "taxi"],
    ["🚚", "truck delivery"],
    ["🛵", "scooter delivery"],
    ["🚆", "train"],
    ["🏠", "home house"],
    ["🏢", "office building"],
    ["🏪", "store shop"],
    ["🕌", "mosque"],
    ["🏝️", "island holiday"],
    ["🗺️", "map"],
    ["📍", "pin location"],
    ["⛽", "fuel"],
    ["🅿️", "parking"],
    ["🏨", "hotel"],
  ],
  objects: [
    ["💡", "idea bulb"],
    ["📱", "phone mobile"],
    ["💻", "laptop"],
    ["📦", "package box"],
    ["🧾", "receipt"],
    ["💳", "card payment"],
    ["💰", "money bag"],
    ["🛒", "cart shopping"],
    ["🔑", "key"],
    ["🔒", "lock"],
    ["📅", "calendar date"],
    ["⏰", "alarm clock"],
    ["📈", "chart up growth"],
    ["📉", "chart down"],
    ["📝", "memo note"],
    ["📎", "paperclip attach"],
  ],
  symbols: [
    ["❤️", "heart love red"],
    ["💙", "blue heart"],
    ["💚", "green heart"],
    ["💯", "hundred perfect"],
    ["✅", "check done yes"],
    ["❌", "cross no"],
    ["⚠️", "warning"],
    ["❗", "exclamation"],
    ["❓", "question"],
    ["✨", "sparkles new"],
    ["🚀", "rocket launch"],
    ["🎯", "target goal"],
    ["🆕", "new"],
    ["🔔", "bell notify"],
    ["⭕", "circle"],
    ["➕", "plus add"],
  ],
};

/** The emoji by category. */
export const EMOJI_SET: Readonly<Record<EmojiCategory, readonly EmojiEntry[]>> = Object.freeze(
  Object.fromEntries(
    Object.entries(RAW).map(([category, list]) => [
      category,
      list.map(([emoji, words]) => ({ emoji, words })),
    ]),
  ) as unknown as Record<EmojiCategory, readonly EmojiEntry[]>,
);
