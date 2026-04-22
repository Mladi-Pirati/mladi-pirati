export interface NavItem {
  href: `#${string}`;
  label: string;
  highlighted?: boolean;
}

export interface ProgramItem {
  title: string;
  description: string;
}

export interface FooterLink {
  href: string;
  label: string;
}

export type SocialIconName = `simple-icons:${string}`;

export interface SocialLink {
  href: `https://${string}`;
  label: string;
  icon: SocialIconName;
}

const fallbackSiteUrl = "https://mladipirati.si";
// Temporary safety default for public development deployments.
// Set ALLOW_INDEXING=true when the production site is ready for indexing.
const indexingEnabled = import.meta.env.ALLOW_INDEXING === "true";

export const blockedRobotsPolicy =
  "noindex, nofollow, noarchive, nosnippet, noimageindex";

export const DISCORD_URL = "https://discord.gg/jqS7QFpc2C";
export const INSTAGRAM_URL = "https://www.instagram.com/mladipiratisi/";
export const TIKTOK_URL = "https://www.tiktok.com/@mladipirati";
export const GITHUB_URL = "https://github.com/mladi-pirati";

export const siteMetadata = {
  name: "Mladi Pirati",
  shortName: "Mladi Pirati",
  language: "sl",
  locale: "sl_SI",
  siteUrl: (process.env.SITE_URL ?? fallbackSiteUrl).replace(/\/$/, ""),
  indexingEnabled,
  title: "Mladi Pirati | Podmladek Piratske stranke Slovenije",
  description:
    "Mladi Pirati smo podmladek Piratske stranke Slovenije. Zavzemamo se za digitalne pravice, transparentnost, svobodo in prihodnost mladih.",
  themeColor: "#000000",
  ogImage: "/logos/mladi-pirati-logo.png",
  footerText: "Podmladek Piratske stranke Slovenije.",
} as const;

export const navigationItems: NavItem[] = [
  { href: "#o-nas", label: "O nas" },
  { href: "#program", label: "Program" },
  { href: "#hero", label: "Pridruži se", highlighted: true },
];

export const heroContent = {
  headline: "Svet je v razsulu.",
  summary: "Vsi, ki ",
  quotePhrases: [
    { text: "nimate svojega stanovanja.", accent: null },
    { text: "ste naveličani korupcije.", accent: null },
    { text: "hočete, da se to spremeni", accent: "spremeni" },
  ],
  cta: ["Pomdladek", "Piratske stranke Slovenije"],
} as const;

export const heroJoinCardContent = {
  eyebrow: "Pristopnica",
  title: "Pridruži se!",
  description:
    "Prijavnica zbere vse podatke in izjave, ki jih potrebujemo za obravnavo članstva.",
  bullets: [
    // "izpolniš jo v nekaj minutah",
    // "vključuje vse podatke iz uradne pristopnice",
    // "oddana je neposredno v sistem za obravnavo prijav",
  ],
  buttonLabel: "Odpri pristopnico",
  note: "Če si mlajši/-a od 18 let, ti bomo poslali obrazec s soglasjem staršev.",
} as const;

export const aboutContent = {
  title: "O nas",
  subtitle:
    "Gradimo prostor za mlade, ki hočejo politiko odprto ljudem, ne zaprto za vrati.",
  paragraphs: [
    "Mladi Pirati smo glas generacije, ki ji je počasi dovolj. Dovolj najemnin, ki požrejo pol življenja. Dovolj praznih obljub, ki se ponavljajo iz volitev v volitve. Dovolj prihodnosti, o kateri odločajo ljudje, ki je sploh ne bodo živeli.",
    "Ne želimo več stati ob strani in gledati, kako se o naših življenjih odloča brez nas. Gre se za stvari, ki se zadevajo našega vsakdana. Stanovanja, ki si ga ne moreš privoščiti, izobraževanje, ki te pripravlja na negotovost, službe brez varnosti, svet na spletu, kjer tvoje pravice niso samoumevne, in tempo življenja, ki ti počasi razjeda glavo.",
    "Hočemo svoboden internet, ki ostaja pristen in ga ne preplavlja generična AI vsebina, ter pravico do zasebnosti. Hočemo znanje, ki ni zaklenjeno za dragimi naročninami. Hočemo stanovanja, ki niso luksuz. Hočemo javne storitve, ki dejansko delujejo. In hočemo družbo, kjer si lahko mlad človek brez strahu ustvari življenje.",
    "In ne, na to prihodnost ne bomo čakali. Vzeli jo bomo nazaj in začeli graditi sami."
  ],
} as const;

export const programContent = {
  title: "Naš program",
  subtitle:
    "Teme, ki jih odpiramo, so praktične: od zasebnosti in znanja do dostojnega življenja mladih.",
  items: [
    {
      title: "Stanovanja",
      description: "Dostopno stanovanje ni privilegij, ampak pogoj za samostojno življenje, varnost in prihodnost mladih."
    },
    {
      title: "Zdravstvo",
      description: "Javno zdravstvo mora biti dostopno, učinkovito in zanesljivo, ne pa sistem, v katerem predolgo čakaš ali ostaneš brez obravnave."
    },
    {
      title: "Plače",
      description: "Delo mora omogočati dostojno življenje. Zavzemamo se za višje neto plače, manj obremenitve dela in bolj varen položaj zaposlenih."
    },
    {
      title: "Digitalne pravice",
      description:
        "Branimo zasebnost, svoboden internet in tehnologijo, ki ljudi opolnomoči namesto nadzira.",
    },
    {
      title: "Transparentna država",
      description:
        "Želimo odločanje, ki je preverljivo, razumljivo in odprto za javnost, ne samo za insajderje.",
    },
  ] satisfies ProgramItem[],
} as const;

export const footerLinks: FooterLink[] = [
  {
    href: "/politika-zasebnosti",
    label: "Politika zasebnosti",
  },
];

export const socialLinks: SocialLink[] = [
  {
    href: DISCORD_URL,
    label: "Discord",
    icon: "simple-icons:discord",
  },
  {
    href: INSTAGRAM_URL,
    label: "Instagram",
    icon: "simple-icons:instagram",
  },
  {
    href: TIKTOK_URL,
    label: "TikTok",
    icon: "simple-icons:tiktok",
  },
  {
    href: GITHUB_URL,
    label: "GitHub",
    icon: "simple-icons:github",
  },
];
