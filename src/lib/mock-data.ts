// Realistic mock data for the comic collection app.
// No backend; used throughout the UI prototype.

export type Publisher =
  | "Marvel"
  | "DC"
  | "Image"
  | "Dark Horse"
  | "Boom Studios"
  | "IDW"
  | "Valiant";

export type Universe = Publisher;

export interface Comic {
  id: string;
  title: string;
  issue: number;
  volume: number;
  series: string;
  run?: string;
  publisher: Publisher;
  universe: Universe;
  writers: string[];
  artists: string[];
  coverArtist?: string;
  releaseDate: string; // ISO
  addedDate: string;
  synopsis: string;
  characters: string[];
  teams: string[];
  storyArcs: string[];
  owned: boolean;
  read: boolean;
  wishlist: boolean;
  favorite: boolean;
  rating?: number;
}

const iso = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m - 1, d)).toISOString();

export const publishers: Publisher[] = [
  "Marvel",
  "DC",
  "Image",
  "Dark Horse",
  "Boom Studios",
  "IDW",
  "Valiant",
];

export const publisherAccent: Record<Publisher, string> = {
  Marvel: "var(--gradient-marvel)",
  DC: "var(--gradient-dc)",
  Image: "var(--gradient-image)",
  "Dark Horse": "var(--gradient-darkhorse)",
  "Boom Studios": "var(--gradient-boom)",
  IDW: "var(--gradient-idw)",
  Valiant: "var(--gradient-valiant)",
};

export const comics: Comic[] = [
  {
    id: "asm-800",
    title: "Go Down Swinging, Finale",
    issue: 800,
    volume: 1,
    series: "The Amazing Spider-Man",
    run: "Dan Slott Run",
    publisher: "Marvel",
    universe: "Marvel",
    writers: ["Dan Slott"],
    artists: ["Stuart Immonen", "Humberto Ramos", "Giuseppe Camuncoli"],
    coverArtist: "Alex Ross",
    releaseDate: iso(2018, 5, 30),
    addedDate: iso(2026, 7, 12),
    synopsis:
      "The 800th issue of Amazing Spider-Man closes Dan Slott's decade-long run with a devastating confrontation between Peter Parker and the Red Goblin.",
    characters: ["Spider-Man", "Green Goblin", "Red Goblin", "Mary Jane"],
    teams: [],
    storyArcs: ["Go Down Swinging"],
    owned: true,
    read: true,
    wishlist: false,
    favorite: true,
    rating: 4.7,
  },
  {
    id: "batman-608",
    title: "Hush, Chapter One",
    issue: 608,
    volume: 1,
    series: "Batman",
    run: "Hush",
    publisher: "DC",
    universe: "DC",
    writers: ["Jeph Loeb"],
    artists: ["Jim Lee"],
    coverArtist: "Jim Lee",
    releaseDate: iso(2002, 10, 9),
    addedDate: iso(2026, 7, 15),
    synopsis:
      "A mysterious villain named Hush pulls the strings behind Gotham's rogues in one of the most iconic Batman stories ever told.",
    characters: ["Batman", "Catwoman", "Killer Croc", "Hush"],
    teams: ["Bat-Family"],
    storyArcs: ["Hush"],
    owned: true,
    read: true,
    wishlist: false,
    favorite: true,
    rating: 4.9,
  },
  {
    id: "spawn-1",
    title: "Questions",
    issue: 1,
    volume: 1,
    series: "Spawn",
    publisher: "Image",
    universe: "Image",
    writers: ["Todd McFarlane"],
    artists: ["Todd McFarlane"],
    coverArtist: "Todd McFarlane",
    releaseDate: iso(1992, 5, 1),
    addedDate: iso(2026, 6, 30),
    synopsis:
      "Al Simmons returns from Hell as a hellspawn, forced to reckon with the demonic bargain that brought him back.",
    characters: ["Spawn", "Malebolgia", "Wanda Blake"],
    teams: [],
    storyArcs: ["Questions"],
    owned: true,
    read: true,
    wishlist: false,
    favorite: false,
  },
  {
    id: "saga-1",
    title: "Saga #1",
    issue: 1,
    volume: 1,
    series: "Saga",
    publisher: "Image",
    universe: "Image",
    writers: ["Brian K. Vaughan"],
    artists: ["Fiona Staples"],
    coverArtist: "Fiona Staples",
    releaseDate: iso(2012, 3, 14),
    addedDate: iso(2026, 7, 1),
    synopsis:
      "Two soldiers from opposite sides of a galactic war fall in love — and go on the run with their newborn daughter.",
    characters: ["Alana", "Marko", "Hazel"],
    teams: [],
    storyArcs: ["The Will"],
    owned: true,
    read: true,
    wishlist: false,
    favorite: true,
    rating: 4.8,
  },
  {
    id: "invincible-1",
    title: "Family Matters",
    issue: 1,
    volume: 1,
    series: "Invincible",
    publisher: "Image",
    universe: "Image",
    writers: ["Robert Kirkman"],
    artists: ["Cory Walker"],
    coverArtist: "Cory Walker",
    releaseDate: iso(2003, 1, 22),
    addedDate: iso(2026, 6, 22),
    synopsis:
      "Mark Grayson, son of Earth's greatest superhero, inherits his father's powers — and a legacy far darker than he imagined.",
    characters: ["Invincible", "Omni-Man", "Atom Eve"],
    teams: ["Teen Team"],
    storyArcs: ["Family Matters"],
    owned: true,
    read: true,
    wishlist: false,
    favorite: true,
    rating: 4.6,
  },
  {
    id: "xmen-141",
    title: "Days of Future Past",
    issue: 141,
    volume: 1,
    series: "Uncanny X-Men",
    run: "Claremont / Byrne",
    publisher: "Marvel",
    universe: "Marvel",
    writers: ["Chris Claremont", "John Byrne"],
    artists: ["John Byrne"],
    coverArtist: "John Byrne",
    releaseDate: iso(1981, 1, 10),
    addedDate: iso(2026, 5, 3),
    synopsis:
      "A dystopian future ruled by Sentinels sends Kitty Pryde's mind back in time to prevent an assassination that dooms mutantkind.",
    characters: ["Kitty Pryde", "Wolverine", "Storm", "Magneto"],
    teams: ["X-Men"],
    storyArcs: ["Days of Future Past"],
    owned: true,
    read: true,
    wishlist: false,
    favorite: true,
    rating: 4.9,
  },
  {
    id: "dd-181",
    title: "Last Hand",
    issue: 181,
    volume: 1,
    series: "Daredevil",
    run: "Frank Miller Run",
    publisher: "Marvel",
    universe: "Marvel",
    writers: ["Frank Miller"],
    artists: ["Frank Miller", "Klaus Janson"],
    coverArtist: "Frank Miller",
    releaseDate: iso(1982, 1, 5),
    addedDate: iso(2026, 4, 18),
    synopsis:
      "The devastating final showdown between Daredevil, Bullseye, and Elektra in one of the most influential comics of the 80s.",
    characters: ["Daredevil", "Elektra", "Bullseye"],
    teams: [],
    storyArcs: ["Last Hand"],
    owned: true,
    read: true,
    wishlist: false,
    favorite: false,
  },
  {
    id: "jl-1",
    title: "The Extinction Machines",
    issue: 1,
    volume: 4,
    series: "Justice League",
    publisher: "DC",
    universe: "DC",
    writers: ["Bryan Hitch"],
    artists: ["Tony S. Daniel"],
    coverArtist: "Tony S. Daniel",
    releaseDate: iso(2016, 7, 20),
    addedDate: iso(2026, 7, 10),
    synopsis:
      "Rebirth-era Justice League faces a planet-killing threat as Superman and Wonder Woman try to hold the team together.",
    characters: ["Superman", "Batman", "Wonder Woman", "Flash", "Aquaman"],
    teams: ["Justice League"],
    storyArcs: ["The Extinction Machines"],
    owned: true,
    read: false,
    wishlist: false,
    favorite: false,
  },
  {
    id: "avengers-4",
    title: "Endgame",
    issue: 4,
    volume: 8,
    series: "Avengers",
    publisher: "Marvel",
    universe: "Marvel",
    writers: ["Jason Aaron"],
    artists: ["Ed McGuinness"],
    coverArtist: "Ed McGuinness",
    releaseDate: iso(2018, 8, 8),
    addedDate: iso(2026, 7, 18),
    synopsis:
      "Fresh Avengers assemble against the Final Host as ancient Celestials awaken beneath the Earth.",
    characters: ["Thor", "Iron Man", "Captain America", "She-Hulk"],
    teams: ["Avengers"],
    storyArcs: ["The Final Host"],
    owned: false,
    read: false,
    wishlist: true,
    favorite: false,
  },
  {
    id: "hellboy-1",
    title: "Seed of Destruction",
    issue: 1,
    volume: 1,
    series: "Hellboy",
    publisher: "Dark Horse",
    universe: "Dark Horse",
    writers: ["Mike Mignola", "John Byrne"],
    artists: ["Mike Mignola"],
    coverArtist: "Mike Mignola",
    releaseDate: iso(1994, 3, 1),
    addedDate: iso(2026, 6, 4),
    synopsis:
      "A demon summoned by Nazis becomes humanity's greatest paranormal defender in Mignola's iconic occult saga.",
    characters: ["Hellboy", "Abe Sapien", "Liz Sherman"],
    teams: ["B.P.R.D."],
    storyArcs: ["Seed of Destruction"],
    owned: true,
    read: false,
    wishlist: false,
    favorite: true,
  },
  {
    id: "tmnt-1",
    title: "Change is Constant",
    issue: 1,
    volume: 5,
    series: "Teenage Mutant Ninja Turtles",
    publisher: "IDW",
    universe: "IDW",
    writers: ["Kevin Eastman", "Tom Waltz"],
    artists: ["Dan Duncan"],
    coverArtist: "Dan Duncan",
    releaseDate: iso(2011, 8, 24),
    addedDate: iso(2026, 5, 20),
    synopsis:
      "IDW relaunches the Turtles with a fresh origin that weaves in past-life mysticism and the search for a missing brother.",
    characters: ["Leonardo", "Raphael", "Donatello", "Michelangelo", "Splinter"],
    teams: ["TMNT"],
    storyArcs: ["Change is Constant"],
    owned: false,
    read: false,
    wishlist: true,
    favorite: false,
  },
  {
    id: "bloodshot-1",
    title: "Setting the World on Fire",
    issue: 1,
    volume: 3,
    series: "Bloodshot",
    publisher: "Valiant",
    universe: "Valiant",
    writers: ["Duane Swierczynski"],
    artists: ["Manuel Garcia"],
    coverArtist: "Arturo Lozzi",
    releaseDate: iso(2012, 7, 11),
    addedDate: iso(2026, 4, 2),
    synopsis:
      "A weaponized super-soldier with a head full of stolen memories tries to uncover which — if any — belong to him.",
    characters: ["Bloodshot", "Kuretich"],
    teams: ["Project Rising Spirit"],
    storyArcs: ["Setting the World on Fire"],
    owned: true,
    read: true,
    wishlist: false,
    favorite: false,
  },
  {
    id: "wicked-1",
    title: "Faust Act",
    issue: 1,
    volume: 1,
    series: "The Wicked + The Divine",
    publisher: "Image",
    universe: "Image",
    writers: ["Kieron Gillen"],
    artists: ["Jamie McKelvie"],
    coverArtist: "Jamie McKelvie",
    releaseDate: iso(2014, 6, 18),
    addedDate: iso(2026, 7, 20),
    synopsis:
      "Every ninety years, twelve gods reincarnate as pop stars. In two years, they'll be dead.",
    characters: ["Laura", "Lucifer", "Amaterasu"],
    teams: ["The Pantheon"],
    storyArcs: ["The Faust Act"],
    owned: false,
    read: false,
    wishlist: true,
    favorite: false,
  },
  {
    id: "asm-repeat-25",
    title: "New Threats",
    issue: 25,
    volume: 6,
    series: "The Amazing Spider-Man",
    publisher: "Marvel",
    universe: "Marvel",
    writers: ["Zeb Wells"],
    artists: ["John Romita Jr."],
    coverArtist: "John Romita Jr.",
    releaseDate: iso(2026, 7, 16),
    addedDate: iso(2026, 7, 17),
    synopsis:
      "Peter Parker juggles a new job, a new roommate, and a familiar rogues' gallery pulling him back into the dark.",
    characters: ["Spider-Man", "Black Cat"],
    teams: [],
    storyArcs: ["Gang War Aftermath"],
    owned: false,
    read: false,
    wishlist: true,
    favorite: false,
  },
  {
    id: "batman-new-155",
    title: "Dark Prisms",
    issue: 155,
    volume: 3,
    series: "Batman",
    publisher: "DC",
    universe: "DC",
    writers: ["Chip Zdarsky"],
    artists: ["Jorge Jiménez"],
    coverArtist: "Jorge Jiménez",
    releaseDate: iso(2026, 7, 22),
    addedDate: iso(2026, 7, 22),
    synopsis:
      "A new prismatic threat splinters Bruce's psyche as the Bat-Family scrambles to keep Gotham from tearing itself apart.",
    characters: ["Batman", "Nightwing", "Robin"],
    teams: ["Bat-Family"],
    storyArcs: ["Dark Prisms"],
    owned: false,
    read: false,
    wishlist: false,
    favorite: false,
  },
  {
    id: "invincible-new",
    title: "Return",
    issue: 145,
    volume: 1,
    series: "Invincible Universe",
    publisher: "Image",
    universe: "Image",
    writers: ["Robert Kirkman"],
    artists: ["Ryan Ottley"],
    coverArtist: "Ryan Ottley",
    releaseDate: iso(2026, 7, 20),
    addedDate: iso(2026, 7, 20),
    synopsis:
      "A one-shot return to the Invincible universe hints at Mark's next chapter.",
    characters: ["Invincible", "Atom Eve"],
    teams: [],
    storyArcs: ["Return"],
    owned: false,
    read: false,
    wishlist: true,
    favorite: false,
  },
];

export const series = Array.from(new Set(comics.map((c) => c.series)));
export const writers = Array.from(new Set(comics.flatMap((c) => c.writers)));
export const artists = Array.from(new Set(comics.flatMap((c) => c.artists)));
export const characters = Array.from(new Set(comics.flatMap((c) => c.characters)));
export const teams = Array.from(new Set(comics.flatMap((c) => c.teams).filter(Boolean)));

export const favoriteSeries = [
  "The Amazing Spider-Man",
  "Batman",
  "Saga",
  "Invincible",
  "Uncanny X-Men",
];
export const favoritePublishers: Publisher[] = ["Marvel", "DC", "Image"];
export const favoriteWriters = ["Dan Slott", "Jeph Loeb", "Brian K. Vaughan", "Chris Claremont"];
export const favoriteArtists = ["Jim Lee", "Fiona Staples", "John Byrne", "Todd McFarlane"];

export interface CustomList {
  id: string;
  name: string;
  description: string;
  coverPublisher: Publisher;
  isPublic: boolean;
  comicIds: string[];
}

export const customLists: CustomList[] = [
  {
    id: "best-batman",
    name: "Best Batman Stories",
    description: "My personal ranking of essential Dark Knight reads.",
    coverPublisher: "DC",
    isPublic: true,
    comicIds: ["batman-608", "batman-new-155"],
  },
  {
    id: "to-buy",
    name: "To Buy",
    description: "Shopping list for the next convention.",
    coverPublisher: "Marvel",
    isPublic: false,
    comicIds: ["avengers-4", "asm-repeat-25", "wicked-1"],
  },
  {
    id: "horror",
    name: "Horror Comics",
    description: "Occult, gothic, and cosmic dread.",
    coverPublisher: "Dark Horse",
    isPublic: true,
    comicIds: ["hellboy-1", "spawn-1"],
  },
  {
    id: "covers",
    name: "Favorite Covers",
    description: "Just gorgeous artwork.",
    coverPublisher: "Image",
    isPublic: true,
    comicIds: ["saga-1", "wicked-1", "invincible-1"],
  },
  {
    id: "signed",
    name: "Signed Comics",
    description: "Convention pickups & signings.",
    coverPublisher: "Image",
    isPublic: false,
    comicIds: ["invincible-1", "spawn-1"],
  },
];

export const stats = {
  owned: comics.filter((c) => c.owned).length,
  read: comics.filter((c) => c.read).length,
  wishlist: comics.filter((c) => c.wishlist).length,
  favorites: comics.filter((c) => c.favorite).length,
  lists: customLists.length + 2,
  totalIssues: 1247,
};

export const readingProgress = [
  { comicId: "jl-1", progress: 62 },
  { comicId: "hellboy-1", progress: 24 },
  { comicId: "bloodshot-1", progress: 88 },
];

export const getComic = (id: string) => comics.find((c) => c.id === id);
export const relatedComics = (c: Comic) =>
  comics.filter((x) => x.id !== c.id && (x.series === c.series || x.publisher === c.publisher)).slice(0, 6);
