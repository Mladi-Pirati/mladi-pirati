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

export interface SocialLink {
  href: string;
  label: string;
}

const fallbackSiteUrl = "https://mladipirati.si";
// Temporary safety default for public development deployments.
// Set ALLOW_INDEXING=true when the production site is ready for indexing.
const indexingEnabled = import.meta.env.ALLOW_INDEXING === "true";

export const blockedRobotsPolicy =
  "noindex, nofollow, noarchive, nosnippet, noimageindex";

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
  ogImage: "/logos/Pirati_MladiPirati_Logo_3.png",
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
  cta: "Podmladek Piratske stranke Slovenije",
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
  note: "Članstvo je odprto za osebe med 15. in 32. letom starosti.",
} as const;

export const aboutContent = {
  title: "O nas",
  subtitle:
    "Gradimo prostor za mlade, ki hocejo politiko odprto ljudem, ne zaprto za vrati.",
  paragraphs: [
    "Mladi Pirati smo glas generacije, ki ji je dovolj dragih najemnin, praznih obljub in prihodnosti, o kateri odločajo drugi. Verjamemo, da mladi ne smemo ostati le opazovalci politike, ki nas zadeva najbolj neposredno, od stanovanj in izobraževanja do digitalnih pravic, duševnega zdravja in dostojnega dela.",
    "Zavzemamo se za svoboden internet, pravico do zasebnosti, odprto znanje, dostopna stanovanja, kakovostne javne storitve in družbo, v kateri imajo mladi resnično možnost za samostojno, varno in dostojno življenje. Hočemo skupnost, ki temelji na svobodi, solidarnosti, transparentnosti in pogumu za spremembe.",
    "Takšne prihodnosti pa ne bomo le čakali, ampak jo bomo skupaj ustvarili.",
  ],
} as const;

export const programContent = {
  title: "Naš program",
  subtitle:
    "Teme, ki jih odpiramo, so prakticne: od zasebnosti in znanja do dostojnega zivljenja mladih.",
  items: [
    {
      title: "Digitalne pravice",
      description:
        "Branimo zasebnost, svoboden internet in tehnologijo, ki ljudi opolnomoci namesto nadzira.",
    },
    {
      title: "Transparentna drzava",
      description:
        "Zelimo odlocanje, ki je preverljivo, razumljivo in odprto za javnost, ne samo za insajderje.",
    },
    {
      title: "Dostopno znanje",
      description:
        "Podpiramo odprto znanje, kakovostno javno izobrazevanje in pogoje, v katerih se lahko mladi razvijajo.",
    },
    {
      title: "Prihodnost mladih",
      description:
        "Stanovanja, delo, mobilnost in kakovostno zivljenje niso luksuz, ampak osnova za samostojno prihodnost.",
    },
  ] satisfies ProgramItem[],
} as const;

export const footerLinks: FooterLink[] = [];

export const socialLinks: SocialLink[] = [];
