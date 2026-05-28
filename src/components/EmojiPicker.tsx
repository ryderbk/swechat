import { useState, ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile, Search, X } from "lucide-react";

interface EmojiItem {
  char: string;
  keywords: string[];
}

const EMOJI_DATA: Record<string, { label: string; icon: string; items: EmojiItem[] }> = {
  smileys: {
    label: "Smileys & People",
    icon: "😊",
    items: [
      { char: "😀", keywords: ["happy", "smile", "grin", "face", "laugh"] },
      { char: "😃", keywords: ["happy", "smile", "grin", "face", "laugh"] },
      { char: "😄", keywords: ["happy", "smile", "grin", "face", "laugh"] },
      { char: "😁", keywords: ["happy", "smile", "grin", "face", "laugh", "beam"] },
      { char: "😆", keywords: ["happy", "smile", "grin", "face", "laugh", "squint"] },
      { char: "😅", keywords: ["happy", "smile", "sweat", "laugh", "relief"] },
      { char: "😂", keywords: ["happy", "face", "tear", "laugh", "joy", "cry"] },
      { char: "🤣", keywords: ["happy", "face", "floor", "laugh", "rofl", "rolling"] },
      { char: "😊", keywords: ["happy", "smile", "blush", "face", "shy"] },
      { char: "😇", keywords: ["happy", "smile", "halo", "angel", "innocent"] },
      { char: "🙂", keywords: ["happy", "smile", "slight"] },
      { char: "🙃", keywords: ["happy", "smile", "upside", "down"] },
      { char: "😉", keywords: ["happy", "smile", "wink"] },
      { char: "😌", keywords: ["satisfied", "relieved", "calm", "peace"] },
      { char: "😍", keywords: ["heart", "eyes", "love", "crush", "adoration"] },
      { char: "🥰", keywords: ["heart", "face", "love", "blush", "affection"] },
      { char: "😘", keywords: ["kiss", "heart", "love", "blow"] },
      { char: "😗", keywords: ["kiss"] },
      { char: "😙", keywords: ["kiss", "smile"] },
      { char: "😚", keywords: ["kiss", "close", "eyes"] },
      { char: "😋", keywords: ["yummy", "tongue", "delicious", "food"] },
      { char: "😛", keywords: ["tongue", "silly", "playful"] },
      { char: "😝", keywords: ["tongue", "silly", "squint"] },
      { char: "😜", keywords: ["tongue", "silly", "wink"] },
      { char: "🤪", keywords: ["crazy", "silly", "goofy"] },
      { char: "🤨", keywords: ["raised", "eyebrow", "suspicious", "doubt"] },
      { char: "🧐", keywords: ["monocle", "smart", "analyze", "inspect"] },
      { char: "🤓", keywords: ["nerd", "geek", "smart", "glasses"] },
      { char: "😎", keywords: ["cool", "sunglasses", "chill", "swagger"] },
      { char: "🥸", keywords: ["disguise", "mask", "glasses"] },
      { char: "🤩", keywords: ["star", "struck", "excited", "amazed"] },
      { char: "🥳", keywords: ["party", "celebrate", "birthday", "hat"] },
      { char: "😏", keywords: ["smirk", "sly", "flirt", "sarcastic"] },
      { char: "😒", keywords: ["unamused", "annoyed", "bored", "meh"] },
      { char: "😞", keywords: ["disappointed", "sad", "down"] },
      { char: "😔", keywords: ["pensive", "sad", "thoughtful", "sorrow"] },
      { char: "😟", keywords: ["worried", "anxious", "nervous"] },
      { char: "😕", keywords: ["confused", "puzzled", "unsure"] },
      { char: "🙁", keywords: ["frown", "sad", "slight"] },
      { char: "☹️", keywords: ["frown", "sad"] },
      { char: "😣", keywords: ["persevere", "struggle", "pain"] },
      { char: "😖", keywords: ["confounded", "overwhelmed"] },
      { char: "😫", keywords: ["tired", "exhausted", "weary"] },
      { char: "😩", keywords: ["weary", "tired", "cry"] },
      { char: "🥺", keywords: ["pleading", "begging", "cute", "eyes", "plz"] },
      { char: "😢", keywords: ["sad", "cry", "tear", "upset"] },
      { char: "😭", keywords: ["sad", "cry", "tear", "sobbing", "loudly"] },
      { char: "😤", keywords: ["angry", "triumph", "frustrated", "snort"] },
      { char: "😠", keywords: ["angry", "mad", "annoyed"] },
      { char: "😡", keywords: ["angry", "mad", "pout", "furious"] },
      { char: "🤬", keywords: ["angry", "swearing", "cussing", "furious"] },
      { char: "🤯", keywords: ["mind", "blown", "shocked", "amazing"] },
      { char: "😳", keywords: ["flushed", "embarrassed", "shocked", "blush"] },
      { char: "🥵", keywords: ["hot", "sweat", "fever", "heat"] },
      { char: "🥶", keywords: ["cold", "freeze", "ice", "winter"] },
      { char: "😱", keywords: ["scared", "scream", "shocked", "fear"] },
      { char: "😨", keywords: ["fear", "scared", "nervous"] },
      { char: "😰", keywords: ["fear", "sweat", "nervous", "anxious"] },
      { char: "😥", keywords: ["sad", "sweat", "relief", "close"] },
      { char: "😓", keywords: ["sweat", "sad", "stressed"] },
      { char: "🤔", keywords: ["think", "wonder", "ponder", "hmm"] },
      { char: "🫣", keywords: ["peeking", "fear", "shy", "look"] },
      { char: "🤭", keywords: ["giggle", "laugh", "secret", "oops"] },
      { char: "🫢", keywords: ["gasp", "shocked", "surprise"] },
      { char: "🫡", keywords: ["salute", "respect", "yes", "sir"] },
      { char: "🤫", keywords: ["quiet", "shh", "silence", "secret"] },
      { char: "🫠", keywords: ["melt", "hot", "sarcasm", "warmth"] },
      { char: "🤥", keywords: ["lie", "liar", "pinocchio", "nose"] },
      { char: "😶", keywords: ["silent", "speechless", "no", "mouth"] },
      { char: "🫥", keywords: ["dotted", "disappear", "invisible", "ignore"] },
      { char: "😐", keywords: ["neutral", "meh", "indifferent"] },
      { char: "😑", keywords: ["expressionless", "indifferent", "unimpressed"] },
      { char: "😬", keywords: ["grimace", "awkward", "nervous", "yikes"] },
      { char: "🫨", keywords: ["shaking", "vibrate", "shock", "dizzy"] },
      { char: "🙄", keywords: ["roll", "eyes", "sarcastic", "bored"] },
      { char: "😯", keywords: ["hushed", "surprised", "gasp"] },
      { char: "😦", keywords: ["frown", "open", "mouth", "shocked"] },
      { char: "😧", keywords: ["anguished", "shocked", "sad"] },
      { char: "😮", keywords: ["surprise", "wow", "gasp"] },
      { char: "😲", keywords: ["astonished", "shocked", "amazed"] },
      { char: "🥱", keywords: ["yawn", "tired", "sleepy", "bored"] },
      { char: "😴", keywords: ["sleep", "zzz", "snore"] },
      { char: "🤤", keywords: ["drool", "delicious", "desire"] },
      { char: "😪", keywords: ["sleepy", "sad", "tear"] },
      { char: "😵", keywords: ["dizzy", "dead", "crossed", "eyes"] },
      { char: "😵‍💫", keywords: ["dizzy", "confused", "spiral"] },
      { char: "🫵", keywords: ["you", "point", "finger"] },
      { char: "👍", keywords: ["thumbs", "up", "yes", "agree", "like", "good"] },
      { char: "👎", keywords: ["thumbs", "down", "no", "disagree", "dislike", "bad"] },
      { char: "👊", keywords: ["fist", "punch", "bump"] },
      { char: "✊", keywords: ["fist", "raised", "power"] },
      { char: "🤛", keywords: ["fist", "left", "bump"] },
      { char: "🤜", keywords: ["fist", "right", "bump"] },
      { char: "🤞", keywords: ["fingers", "crossed", "luck", "hope"] },
      { char: "🤟", keywords: ["love", "you", "hand", "sign"] },
      { char: "🤘", keywords: ["rock", "on", "horns", "metal"] },
      { char: "👌", keywords: ["ok", "perfect", "hand"] },
      { char: "🤌", keywords: ["italian", "pinched", "what", "want"] },
      { char: "🤏", keywords: ["pinch", "small", "little"] },
      { char: "👈", keywords: ["point", "left"] },
      { char: "👉", keywords: ["point", "right"] },
      { char: "👆", keywords: ["point", "up"] },
      { char: "👇", keywords: ["point", "down"] },
      { char: "✋", keywords: ["hand", "stop", "high", "five"] },
      { char: "🤚", keywords: ["raised", "back", "hand"] },
      { char: "👋", keywords: ["wave", "hello", "hi", "bye", "goodbye"] },
      { char: "🤝", keywords: ["shake", "hands", "deal", "agreement"] },
      { char: "🙏", keywords: ["pray", "please", "thank", "you", "namaste", "hope"] },
      { char: "👏", keywords: ["clap", "applause", "bravo", "good"] },
      { char: "🙌", keywords: ["raised", "hands", "celebrate", "hooray"] },
      { char: "🫶", keywords: ["heart", "hands", "love", "adorable"] },
      { char: "✍️", keywords: ["write", "hand", "pen"] },
      { char: "🤳", keywords: ["selfie", "phone", "camera"] },
      { char: "💅", keywords: ["nail", "polish", "fabulous", "sassy"] }
    ]
  },
  love: {
    label: "Hearts & Love",
    icon: "❤️",
    items: [
      { char: "❤️", keywords: ["heart", "love", "red"] },
      { char: "🧡", keywords: ["heart", "love", "orange"] },
      { char: "💛", keywords: ["heart", "love", "yellow"] },
      { char: "💚", keywords: ["heart", "love", "green"] },
      { char: "💙", keywords: ["heart", "love", "blue"] },
      { char: "💜", keywords: ["heart", "love", "purple"] },
      { char: "🖤", keywords: ["heart", "love", "black"] },
      { char: "🤍", keywords: ["heart", "love", "white"] },
      { char: "🤎", keywords: ["heart", "love", "brown"] },
      { char: "🩵", keywords: ["heart", "love", "light", "blue"] },
      { char: "🩶", keywords: ["heart", "love", "grey"] },
      { char: "🩷", keywords: ["heart", "love", "pink"] },
      { char: "💔", keywords: ["heart", "broken", "sad", "love"] },
      { char: "❤️‍🔥", keywords: ["heart", "fire", "love", "passionate"] },
      { char: "❤️‍🩹", keywords: ["heart", "mending", "bandage", "healing"] },
      { char: "❣️", keywords: ["heart", "exclamation", "love"] },
      { char: "💕", keywords: ["hearts", "love", "two"] },
      { char: "💞", keywords: ["hearts", "spinning", "love"] },
      { char: "💓", keywords: ["heart", "beating", "love", "nervous"] },
      { char: "💗", keywords: ["heart", "growing", "love"] },
      { char: "💖", keywords: ["heart", "sparkling", "love", "shiny"] },
      { char: "💘", keywords: ["heart", "arrow", "cupid", "love"] },
      { char: "💝", keywords: ["heart", "ribbon", "gift", "love"] },
      { char: "💟", keywords: ["heart", "decoration", "purple"] },
      { char: "💌", keywords: ["love", "letter", "heart", "envelope"] },
      { char: "💋", keywords: ["kiss", "lips", "makeup"] },
      { char: "💏", keywords: ["kiss", "couple", "love"] },
      { char: "💑", keywords: ["couple", "heart", "love"] }
    ]
  },
  nature: {
    label: "Animals & Nature",
    icon: "🌸",
    items: [
      { char: "🐶", keywords: ["dog", "puppy", "pet", "animal"] },
      { char: "🐱", keywords: ["cat", "kitty", "pet", "animal"] },
      { char: "🐭", keywords: ["mouse", "animal"] },
      { char: "🐹", keywords: ["hamster", "pet", "animal"] },
      { char: "🐰", keywords: ["rabbit", "bunny", "animal"] },
      { char: "🦊", keywords: ["fox", "animal"] },
      { char: "🐻", keywords: ["bear", "animal"] },
      { char: "🐼", keywords: ["panda", "bear", "animal"] },
      { char: "🐨", keywords: ["koala", "animal"] },
      { char: "🐯", keywords: ["tiger", "animal"] },
      { char: "🦁", keywords: ["lion", "king", "animal"] },
      { char: "🐮", keywords: ["cow", "animal"] },
      { char: "🐷", keywords: ["pig", "animal"] },
      { char: "🐸", keywords: ["frog", "animal"] },
      { char: "🐵", keywords: ["monkey", "animal"] },
      { char: "🐔", keywords: ["chicken", "animal"] },
      { char: "🐧", keywords: ["penguin", "animal"] },
      { char: "🐦", keywords: ["bird", "animal"] },
      { char: "🦆", keywords: ["duck", "animal"] },
      { char: "🦅", keywords: ["eagle", "bird", "animal"] },
      { char: "🦉", keywords: ["owl", "bird", "animal"] },
      { char: "🦋", keywords: ["butterfly", "insect", "pretty"] },
      { char: "🐝", keywords: ["bee", "honey", "insect"] },
      { char: "🐞", keywords: ["ladybug", "insect"] },
      { char: "🐙", keywords: ["octopus", "sea", "animal"] },
      { char: "🦑", keywords: ["squid", "sea", "animal"] },
      { char: "🦞", keywords: ["lobster", "sea", "food"] },
      { char: "🦀", keywords: ["crab", "sea", "animal"] },
      { char: "🐬", keywords: ["dolphin", "sea", "animal"] },
      { char: "🐳", keywords: ["whale", "sea", "animal"] },
      { char: "🦈", keywords: ["shark", "sea", "animal"] },
      { char: "🦄", keywords: ["unicorn", "magic", "horse"] },
      { char: "🌸", keywords: ["flower", "cherry", "blossom", "spring", "pink"] },
      { char: "🌺", keywords: ["flower", "hibiscus", "tropical"] },
      { char: "🌼", keywords: ["flower", "blossom", "yellow"] },
      { char: "🌻", keywords: ["flower", "sunflower", "summer", "yellow"] },
      { char: "🌹", keywords: ["flower", "rose", "love", "red"] },
      { char: "🌷", keywords: ["flower", "tulip", "spring"] },
      { char: "🍀", keywords: ["clover", "four", "leaf", "luck", "green"] },
      { char: "🌿", keywords: ["herb", "leaves", "green"] },
      { char: "🍃", keywords: ["leaves", "wind", "nature"] },
      { char: "🌙", keywords: ["moon", "crescent", "night", "sky"] },
      { char: "⭐", keywords: ["star", "yellow", "sky"] },
      { char: "🌟", keywords: ["star", "glowing", "shiny"] },
      { char: "✨", keywords: ["sparkles", "magic", "shiny", "clean"] },
      { char: "🌈", keywords: ["rainbow", "colorful", "sky"] },
      { char: "☀️", keywords: ["sun", "sunny", "hot", "weather", "summer"] },
      { char: "❄️", keywords: ["snow", "snowflake", "cold", "winter"] },
      { char: "🌊", keywords: ["sea", "wave", "ocean", "beach", "water"] },
      { char: "🌴", keywords: ["palm", "tree", "beach", "tropical", "island"] },
      { char: "🌵", keywords: ["cactus", "desert", "plant"] }
    ]
  },
  food: {
    label: "Food & Drink",
    icon: "🍓",
    items: [
      { char: "🍏", keywords: ["apple", "green", "fruit"] },
      { char: "🍎", keywords: ["apple", "red", "fruit"] },
      { char: "🍌", keywords: ["banana", "fruit", "yellow"] },
      { char: "🍉", keywords: ["watermelon", "fruit", "summer"] },
      { char: "🍇", keywords: ["grapes", "fruit"] },
      { char: "🍓", keywords: ["strawberry", "fruit", "sweet", "red"] },
      { char: "🍒", keywords: ["cherries", "fruit", "red"] },
      { char: "🍑", keywords: ["peach", "fruit", "sweet"] },
      { char: "🥭", keywords: ["mango", "fruit", "tropical"] },
      { char: "🍍", keywords: ["pineapple", "fruit", "tropical"] },
      { char: "🥥", keywords: ["coconut", "tropical"] },
      { char: "🥑", keywords: ["avocado", "healthy", "food"] },
      { char: "🥦", keywords: ["broccoli", "vegetable", "green"] },
      { char: "🍟", keywords: ["fries", "fast", "food"] },
      { char: "🍕", keywords: ["pizza", "cheese", "fast", "food"] },
      { char: "🍔", keywords: ["burger", "hamburger", "fast", "food"] },
      { char: "🌭", keywords: ["hotdog", "fast", "food"] },
      { char: "🥪", keywords: ["sandwich", "food"] },
      { char: "🍜", keywords: ["noodles", "ramen", "soup"] },
      { char: "🍝", keywords: ["pasta", "spaghetti", "noodles"] },
      { char: "🍣", keywords: ["sushi", "japanese", "fish"] },
      { char: "🌮", keywords: ["taco", "mexican", "food"] },
      { char: "🍿", keywords: ["popcorn", "movie", "snack"] },
      { char: "🍩", keywords: ["donut", "sweet", "dessert"] },
      { char: "🍪", keywords: ["cookie", "sweet", "dessert", "chocolate"] },
      { char: "🎂", keywords: ["cake", "birthday", "sweet", "dessert"] },
      { char: "🍰", keywords: ["cake", "slice", "sweet", "dessert"] },
      { char: "🧁", keywords: ["cupcake", "sweet", "dessert"] },
      { char: "🍫", keywords: ["chocolate", "sweet", "candy"] },
      { char: "🍬", keywords: ["candy", "sweet"] },
      { char: "🍭", keywords: ["lollipop", "sweet"] },
      { char: "🍦", keywords: ["icecream", "sweet", "cold"] },
      { char: "☕", keywords: ["coffee", "tea", "hot", "drink"] },
      { char: "🧋", keywords: ["bubble", "tea", "boba", "sweet"] },
      { char: "🍺", keywords: ["beer", "drink", "alcohol"] },
      { char: "🍻", keywords: ["beers", "cheers", "drink", "alcohol"] },
      { char: "🍷", keywords: ["wine", "glass", "drink", "alcohol", "red"] },
      { char: "🥂", keywords: ["clinking", "glasses", "cheers", "celebrate"] },
      { char: "🍾", keywords: ["champagne", "celebrate", "bottle"] },
      { char: "🍹", keywords: ["cocktail", "drink", "tropical"] }
    ]
  },
  activity: {
    label: "Activity & Travel",
    icon: "⚽",
    items: [
      { char: "⚽", keywords: ["soccer", "football", "ball", "sport"] },
      { char: "🏀", keywords: ["basketball", "ball", "sport"] },
      { char: "🏈", keywords: ["football", "sport"] },
      { char: "⚾", keywords: ["baseball", "ball", "sport"] },
      { char: "🎾", keywords: ["tennis", "ball", "sport"] },
      { char: "🏐", keywords: ["volleyball", "ball", "sport"] },
      { char: "🎱", keywords: ["billiards", "8ball", "pool"] },
      { char: "🏓", keywords: ["pingpong", "sport"] },
      { char: "🏸", keywords: ["badminton", "sport"] },
      { char: "🥊", keywords: ["boxing", "glove", "sport"] },
      { char: "🛹", keywords: ["skateboard", "ride"] },
      { char: "🚴", keywords: ["bicycle", "cyclist", "sport"] },
      { char: "🏆", keywords: ["trophy", "winner", "prize", "first"] },
      { char: "🥇", keywords: ["medal", "gold", "first"] },
      { char: "🎮", keywords: ["game", "controller", "playstation", "xbox", "gaming"] },
      { char: "🎲", keywords: ["dice", "game", "play"] },
      { char: "✈️", keywords: ["plane", "airplane", "fly", "travel", "vacation"] },
      { char: "🚗", keywords: ["car", "drive", "travel"] },
      { char: "🚀", keywords: ["rocket", "space", "fly", "fast"] },
      { char: "⛵", keywords: ["boat", "sailboat", "sea"] },
      { char: "⛺", keywords: ["tent", "camping", "outdoor"] },
      { char: "🏖", keywords: ["beach", "umbrella", "summer", "vacation"] },
      { char: "🎡", keywords: ["ferris", "wheel", "carnival", "fun"] },
      { char: "🎢", keywords: ["roller", "coaster", "fun", "carnival"] }
    ]
  },
  objects: {
    label: "Objects & Symbols",
    icon: "💡",
    items: [
      { char: "💡", keywords: ["lightbulb", "idea", "smart"] },
      { char: "🔦", keywords: ["flashlight", "light"] },
      { char: "🕯", keywords: ["candle", "light", "wax"] },
      { char: "💵", keywords: ["money", "dollar", "cash"] },
      { char: "💳", keywords: ["card", "credit", "money"] },
      { char: "✉️", keywords: ["envelope", "mail", "letter"] },
      { char: "🎁", keywords: ["gift", "present", "box", "birthday", "christmas"] },
      { char: "🎈", keywords: ["balloon", "party", "celebrate"] },
      { char: "🎉", keywords: ["popper", "party", "celebrate", "congrats"] },
      { char: "🎊", keywords: ["ball", "party", "celebrate"] },
      { char: "🧸", keywords: ["teddy", "bear", "toy", "cute"] },
      { char: "🔑", keywords: ["key", "lock", "secret"] },
      { char: "🔒", keywords: ["lock", "closed", "secure"] },
      { char: "🔓", keywords: ["lock", "open", "secure"] },
      { char: "🔮", keywords: ["crystal", "ball", "magic", "fortune"] },
      { char: "📷", keywords: ["camera", "photo", "shoot"] },
      { char: "📱", keywords: ["phone", "mobile", "iphone", "screen"] },
      { char: "💻", keywords: ["computer", "laptop", "screen", "work"] },
      { char: "📚", keywords: ["books", "read", "study", "library"] },
      { char: "📝", keywords: ["memo", "write", "note", "paper"] },
      { char: "✏️", keywords: ["pencil", "write", "draw"] },
      { char: "📌", keywords: ["pushpin", "pin", "note"] },
      { char: "📢", keywords: ["megaphone", "announcement", "loud"] },
      { char: "🔔", keywords: ["bell", "notification", "ring"] }
    ]
  }
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  trigger?: ReactNode;
}

export function EmojiPicker({ onSelect, trigger }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("smileys");
  const [search, setSearch] = useState("");

  const getFilteredEmojis = () => {
    const query = search.toLowerCase().trim();
    if (!query) return null;

    const results: string[] = [];
    Object.values(EMOJI_DATA).forEach((cat) => {
      cat.items.forEach((item) => {
        if (
          item.char.includes(query) ||
          item.keywords.some((kw) => kw.includes(query))
        ) {
          if (!results.includes(item.char)) {
            results.push(item.char);
          }
        }
      });
    });
    return results;
  };

  const filtered = getFilteredEmojis();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ? (
          <span>{trigger}</span>
        ) : (
          <Button
            data-testid="button-emoji"
            variant="ghost"
            size="icon"
            type="button"
            className="rounded-xl text-muted-foreground hover:text-foreground"
          >
            <Smile className="w-5 h-5" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-[310px] p-3 rounded-2xl border border-primary/15 shadow-romantic bg-card/95 backdrop-blur-xl animate-fade-in"
        sideOffset={8}
      >
        {/* Category Tabs */}
        <div className="flex gap-0.5 mb-2.5">
          {Object.entries(EMOJI_DATA).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setSearch(""); }}
              title={cat.label}
              className={`flex-1 text-lg py-1 rounded-xl transition-all duration-200 ${
                tab === key && !search
                  ? "bg-primary/10 text-primary scale-110 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {cat.icon}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative mb-2.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search emojis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-muted/40 border border-primary/5 rounded-xl outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/50 text-foreground"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Scrollable Emoji List */}
        <div className="h-48 overflow-y-auto pr-1 scrollbar-thin">
          {filtered !== null ? (
            filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-xs text-muted-foreground gap-1.5 animate-fade-in py-8">
                <span className="text-xl">🥺</span>
                <p>No matching emojis found</p>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {filtered.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { onSelect(emoji); setOpen(false); setSearch(""); }}
                    className="text-2xl p-1.5 rounded-xl hover:bg-primary/10 hover:scale-115 active:scale-95 transition-all leading-none flex items-center justify-center duration-150 cursor-pointer"
                    data-testid={`emoji-${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {EMOJI_DATA[tab]?.items.map((item) => (
                <button
                  key={item.char}
                  onClick={() => { onSelect(item.char); setOpen(false); }}
                  className="text-2xl p-1.5 rounded-xl hover:bg-primary/10 hover:scale-115 active:scale-95 transition-all leading-none flex items-center justify-center duration-150 cursor-pointer"
                  data-testid={`emoji-${item.char}`}
                >
                  {item.char}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
