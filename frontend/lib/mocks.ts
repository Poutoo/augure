export type TrendStatus = 'viral' | 'emergent' | 'stable' | 'en_hausse' | 'en_baisse';
export type TrendCategory = 'Mode' | 'Food' | 'Musique' | 'Art' | 'Tech' | 'Lifestyle';

export interface Trend {
  id: string;
  slug: string;
  rank?: number;
  title: string;
  description: string;
  context: string;
  usage_example: string;
  usage_keys: string[];
  created_at: string;
  category: TrendCategory;
  status: TrendStatus;
  region: string;
  age_range: string;
  platforms: string[];
  badges: string[];
  image_url: string;
  extra_stats: {
    label: string;
    value: string;
  }[];
  score_base: number;
}

export const mockTrends: Trend[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    slug: "six-seven",
    rank: 1,
    title: "Six Seven",
    description: "Expression virale désignant l'état d'être entre deux états, à cheval sur deux mondes ou deux décisions.",
    context: "Popularisé sur TikTok en 2025. Référence au fait d'être 'six feet under or seven feet tall' — symbolisant l'incertitude extrême.",
    usage_example: "Je suis complètement six seven sur ce projet, je sais pas si je continue ou j'abandonne.",
    usage_keys: [
      "« Je suis complètement six seven sur ce projet, je sais pas si je continue ou j'abandonne. »",
      "« L'économie actuelle nous met tous dans une situation six seven. »"
    ],
    created_at: "2026-05-28T12:00:00Z",
    category: "Mode",
    status: "viral",
    region: "Monde",
    age_range: "13 - 24 ans",
    platforms: ["TikTok", "Instagram", "Pinterest"],
    badges: ["Mode"],
    image_url: "/img_trends/six_seven.png",
    extra_stats: [
      { label: "Vues TikTok", value: "4.2B" },
      { label: "Croissance", value: "+400%" }
    ],
    score_base: 100
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    slug: "tasty-crousty",
    rank: 2,
    title: "Tasty-Crousty",
    description: "Adjectif inventé pour qualifier quelque chose d'à la fois savoureux visuellement et d'une qualité supérieure.",
    context: "Issu de la scène Food et gastronomique sur Instagram et YouTube FR.",
    usage_example: "Cette présentation est vraiment tasty-crousty, ça donne envie immédiatement.",
    usage_keys: [
      "« Cette présentation est vraiment tasty-crousty, ça donne envie immédiatement. »",
      "« On a besoin d'un rendu tasty-crousty pour ce pitch client. »"
    ],
    created_at: "2026-05-25T12:00:00Z",
    category: "Food",
    status: "emergent",
    region: "France",
    age_range: "13 - 24 ans",
    platforms: ["TikTok", "Instagram"],
    badges: ["Food"],
    image_url: "/img_trends/tasty_crousty.png",
    extra_stats: [
      { label: "Mentions Instagram", value: "1.8M" },
      { label: "Engagement", value: "Très Fort" }
    ],
    score_base: 85
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    slug: "matcha-coded",
    rank: 3,
    title: "Matcha Coded",
    description: "Désigne quelque chose qui est intrinsèquement lié à une esthétique wellness, calme et haut de gamme.",
    context: "Né de la tendance wellness & slow life. Le matcha est devenu le symbole d'un lifestyle sobre et raffiné.",
    usage_example: "Leur branding est complètement matcha coded, très sobre et premium.",
    usage_keys: [
      "« Leur branding est complètement matcha coded, très sobre et premium. »",
      "« Je veux un onboarding matcha coded, pas de stress, juste de la fluidité. »"
    ],
    created_at: "2026-05-22T12:00:00Z",
    category: "Mode",
    status: "en_hausse",
    region: "États-Unis",
    age_range: "18 - 35 ans",
    platforms: ["YouTube", "Pinterest"],
    badges: ["Mode", "Lifestyle"],
    image_url: "/img_trends/matcha_coded.png",
    extra_stats: [
      { label: "Recherches Google", value: "+300%" },
      { label: "Viralité", value: "Modérée" }
    ],
    score_base: 70
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    slug: "old-money-aesthetic",
    rank: 4,
    title: "Old Money Aesthetic",
    description: "Esthétique sobre et élégante inspirée de la vieille aristocratie européenne, à l'opposé du bling ostentatoire.",
    context: "Contre-réaction au hype streetwear. Retour aux matières nobles, coupes classiques et discrétion du luxe.",
    usage_example: "Pour votre communication, visez l'old money aesthetic : sobre, premium, intemporel.",
    usage_keys: [
      "« Pour votre communication, visez l'old money aesthetic : sobre, premium, intemporel. »",
      "« Le silence est old money, les annonces bruyantes sont new money. »"
    ],
    created_at: "2026-05-20T12:00:00Z",
    category: "Mode",
    status: "en_hausse",
    region: "Europe",
    age_range: "22 - 38 ans",
    platforms: ["TikTok", "Instagram"],
    badges: ["Mode"],
    image_url: "/img_trends/old_money_aesthetic.png",
    extra_stats: [
      { label: "Mentions", value: "3.2M" },
      { label: "Croissance", value: "+150%" }
    ],
    score_base: 65
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    slug: "cottagecore-revival",
    rank: 5,
    title: "Cottagecore Revival",
    description: "Retour à une esthétique rurale romantique : jardins fleuris, pain maison, vie simple et connectée à la nature.",
    context: "Après l'ère tech-maximaliste, une aspiration collective au retour au naturel et à l'artisanat authentique.",
    usage_example: "Notre stratégie se base sur le cottagecore revival : authenticité, local, chaleur humaine.",
    usage_keys: [
      "« Notre stratégie se base sur le cottagecore revival : authenticité, local, chaleur humaine. »",
      "« Le packaging est totalement cottagecore, naturel et rassurant. »"
    ],
    created_at: "2026-05-18T12:00:00Z",
    category: "Lifestyle",
    status: "emergent",
    region: "Global",
    age_range: "18 - 30 ans",
    platforms: ["Pinterest", "Instagram"],
    badges: ["Mode", "Lifestyle"],
    image_url: "/img_trends/cottagecore_revival.png",
    extra_stats: [
      { label: "Recherches Google", value: "+200%" },
      { label: "Communauté Reddit", value: "450K" }
    ],
    score_base: 60
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440005",
    slug: "gorpcore",
    rank: 6,
    title: "Gorpcore",
    description: "Style outdoor fonctionnel élevé au rang de mode urbaine. Vêtements techniques portés en ville comme un statement.",
    context: "Du GORP (Good Ol' Raisins and Peanuts, snack de randonneur). La montagne s'invite en ville de manière assumée.",
    usage_example: "Son look ce matin était très gorpcore, entre le board meeting et l'ascension du Mont-Blanc.",
    usage_keys: [
      "« Son look ce matin était très gorpcore, entre le board meeting et l'ascension du Mont-Blanc. »",
      "« Le gorpcore, c'est mettre une doudoune arc'teryx en réunion et assumer. »"
    ],
    created_at: "2026-05-15T12:00:00Z",
    category: "Mode",
    status: "stable",
    region: "Global",
    age_range: "20 - 35 ans",
    platforms: ["Instagram", "Pinterest"],
    badges: ["Mode"],
    image_url: "/img_trends/gorpcore.png",
    extra_stats: [
      { label: "Vues Pinterest", value: "890M" },
      { label: "Croissance", value: "+80%" }
    ],
    score_base: 50
  }
];
