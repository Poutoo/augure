export type TrendStatus = 'Viral' | 'Émergent' | 'Stable' | 'En hausse' | 'En baisse';
export type TrendCategory = 'Mode' | 'Food' | 'Musique' | 'Art' | 'Tech' | 'Lifestyle';

export interface Trend {
  id: number;
  rank?: number;
  title: string;
  signification: string;
  context: string;
  usageKeys: string[];
  date: string;
  category: TrendCategory;
  status: TrendStatus;
  region: string;
  ageRange: string;
  platforms: string[];
  badges: string[];
  stats: {
    label: string;
    value: string;
  }[];
}

export const mockTrends: Trend[] = [
  {
    id: 1,
    rank: 1,
    title: "Six Seven",
    signification: "Expression virale désignant l'état d'être entre deux états, à cheval sur deux mondes ou deux décisions.",
    context: "Popularisé sur TikTok en 2025. Référence au fait d'être 'six feet under or seven feet tall' — symbolisant l'incertitude extrême.",
    usageKeys: [
      "« Je suis complètement six seven sur ce projet, je sais pas si je continue ou j'abandonne. »",
      "« L'économie actuelle nous met tous dans une situation six seven. »"
    ],
    date: "2026-05-28",
    category: "Mode",
    status: "Viral",
    region: "Monde",
    ageRange: "13 - 24 ans",
    platforms: ["TikTok", "Instagram", "Pinterest"],
    badges: ["Mode"],
    stats: [
      { label: "Vues TikTok", value: "4.2B" },
      { label: "Croissance", value: "+400%" }
    ]
  },
  {
    id: 2,
    rank: 2,
    title: "Tasty-Crousty",
    signification: "Adjectif inventé pour qualifier quelque chose d'à la fois savoureux visuellement et d'une qualité supérieure.",
    context: "Issu de la scène Food et gastronomique sur Instagram et YouTube FR.",
    usageKeys: [
      "« Cette présentation est vraiment tasty-crousty, ça donne envie immédiatement. »",
      "« On a besoin d'un rendu tasty-crousty pour ce pitch client. »"
    ],
    date: "2026-05-25",
    category: "Food",
    status: "Émergent",
    region: "France",
    ageRange: "13 - 24 ans",
    platforms: ["TikTok", "Instagram"],
    badges: ["Food"],
    stats: [
      { label: "Mentions Instagram", value: "1.8M" },
      { label: "Engagement", value: "Très Fort" }
    ]
  },
  {
    id: 3,
    rank: 3,
    title: "Matcha Coded",
    signification: "Désigne quelque chose qui est intrinsèquement lié à une esthétique wellness, calme et haut de gamme.",
    context: "Né de la tendance wellness & slow life. Le matcha est devenu le symbole d'un lifestyle sobre et raffiné.",
    usageKeys: [
      "« Leur branding est complètement matcha coded, très sobre et premium. »",
      "« Je veux un onboarding matcha coded, pas de stress, juste de la fluidité. »"
    ],
    date: "2026-05-22",
    category: "Mode",
    status: "En hausse",
    region: "États-Unis",
    ageRange: "18 - 35 ans",
    platforms: ["YouTube", "Pinterest"],
    badges: ["Mode", "Lifestyle"],
    stats: [
      { label: "Recherches Google", value: "+300%" },
      { label: "Viralité", value: "Modérée" }
    ]
  },
  {
    id: 4,
    rank: 4,
    title: "Old Money Aesthetic",
    signification: "Esthétique sobre et élégante inspirée de la vieille aristocratie européenne, à l'opposé du bling ostentatoire.",
    context: "Contre-réaction au hype streetwear. Retour aux matières nobles, coupes classiques et discrétion du luxe.",
    usageKeys: [
      "« Pour votre communication, visez l'old money aesthetic : sobre, premium, intemporel. »",
      "« Le silence est old money, les annonces bruyantes sont new money. »"
    ],
    date: "2026-05-20",
    category: "Mode",
    status: "En hausse",
    region: "Europe",
    ageRange: "22 - 38 ans",
    platforms: ["TikTok", "Instagram"],
    badges: ["Mode"],
    stats: [
      { label: "Mentions", value: "3.2M" },
      { label: "Croissance", value: "+150%" }
    ]
  },
  {
    id: 5,
    rank: 5,
    title: "Cottagecore Revival",
    signification: "Retour à une esthétique rurale romantique : jardins fleuris, pain maison, vie simple et connectée à la nature.",
    context: "Après l'ère tech-maximaliste, une aspiration collective au retour au naturel et à l'artisanat authentique.",
    usageKeys: [
      "« Notre stratégie se base sur le cottagecore revival : authenticité, local, chaleur humaine. »",
      "« Le packaging est totalement cottagecore, naturel et rassurant. »"
    ],
    date: "2026-05-18",
    category: "Lifestyle",
    status: "Émergent",
    region: "Global",
    ageRange: "18 - 30 ans",
    platforms: ["Pinterest", "Instagram"],
    badges: ["Mode", "Lifestyle"],
    stats: [
      { label: "Recherches Google", value: "+200%" },
      { label: "Communauté Reddit", value: "450K" }
    ]
  },
  {
    id: 6,
    rank: 6,
    title: "Gorpcore",
    signification: "Style outdoor fonctionnel élevé au rang de mode urbaine. Vêtements techniques portés en ville comme un statement.",
    context: "Du GORP (Good Ol' Raisins and Peanuts, snack de randonneur). La montagne s'invite en ville de manière assumée.",
    usageKeys: [
      "« Son look ce matin était très gorpcore, entre le board meeting et l'ascension du Mont-Blanc. »",
      "« Le gorpcore, c'est mettre une doudoune arc'teryx en réunion et assumer. »"
    ],
    date: "2026-05-15",
    category: "Mode",
    status: "Stable",
    region: "Global",
    ageRange: "20 - 35 ans",
    platforms: ["Instagram", "Pinterest"],
    badges: ["Mode"],
    stats: [
      { label: "Vues Pinterest", value: "890M" },
      { label: "Croissance", value: "+80%" }
    ]
  }
];
