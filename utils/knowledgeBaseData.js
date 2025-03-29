// utils/knowledgeBaseData.js
import { MaterialCommunityIcons } from '@expo/vector-icons'; // For potential icon names

export const KNOWLEDGE_BASE_DATA = [
  {
    id: 'radish',
    name: 'Radish (Daikon, China Rose, etc.)',
    iconName: 'seed-outline', // Example icon
    description: 'Fast-growing microgreens with a spicy, peppery kick similar to mature radishes. Very popular and easy for beginners.',
    germinationTime: '2-4 days',
    idealTemp: '15-22°C (60-72°F)',
    lighting: 'Needs bright light after germination (4-6 hours direct or 10-12 hours grow light). Can get leggy without enough light.',
    watering: 'Keep consistently moist but not waterlogged. Bottom watering is preferred to avoid disturbing seeds/sprouts.',
    harvest: 'Typically 7-10 days after sowing, when cotyledons are fully developed and first true leaves may start appearing.',
    tips: [
      'Excellent source of Vitamins C & B6.',
      'Adds a nice zest to salads and sandwiches.',
      'Tend to grow tall quickly.',
      'Use a blackout dome for the first 2-3 days for better germination.',
    ],
    difficulty: 'Easy',
  },
  {
    id: 'broccoli',
    name: 'Broccoli',
    iconName: 'spa-outline', // Example icon
    description: 'Mildly flavored microgreens packed with nutrients, tasting similar to mature broccoli but less intense.',
    germinationTime: '3-5 days',
    idealTemp: '15-21°C (60-70°F)',
    lighting: 'Requires good light (similar to radish) after germination to prevent legginess.',
    watering: 'Maintain consistent moisture. Susceptible to damping-off if overwatered.',
    harvest: 'Around 8-12 days, when cotyledons are fully open, before true leaves get large.',
    tips: [
      'High in Sulforaphane, a beneficial compound.',
      'Great base for microgreen salads or adding to smoothies.',
      'Ensure good airflow to prevent fungal issues.',
    ],
    difficulty: 'Easy',
  },
  {
    id: 'sunflower',
    name: 'Sunflower (Black Oil)',
    iconName: 'white-balance-sunny', // Example icon
    description: 'Large, crunchy microgreens with a nutty flavor. Require a bit more attention due to their thick hulls.',
    germinationTime: '3-5 days (after soaking & hull loosening)',
    idealTemp: '18-24°C (65-75°F)',
    lighting: 'Needs strong light once germinated. Can grow quite tall.',
    watering: 'Keep medium very moist during germination; slightly less once sprouted. Needs good drainage.',
    harvest: 'Around 10-14 days, typically just as the first true leaves begin to emerge.',
    tips: [
      'Soak seeds for 4-8 hours before sowing.',
      'Often requires weight on top during the first few days to help shed hulls.',
      'Prone to mold if hulls aren\'t shed properly or airflow is poor.',
      'Rinse seeds well after soaking.',
    ],
    difficulty: 'Medium',
  },
   {
    id: 'pea',
    name: 'Pea Shoots',
    iconName: 'leaf-circle-outline', // Example icon
    description: 'Sweet, crunchy shoots that taste remarkably like fresh peas. Produces tendrils.',
    germinationTime: '3-5 days (after soaking)',
    idealTemp: '15-21°C (60-70°F)',
    lighting: 'Tolerant of lower light than some, but bright light promotes stockier growth.',
    watering: 'Keep consistently moist. Prefers good drainage.',
    harvest: 'Around 10-16 days, when shoots are 3-5 inches tall with leaves and tendrils.',
    tips: [
      'Soak seeds (Speckled Peas or Dun Peas work well) for 6-12 hours.',
      'Can be regrown for a second, smaller harvest sometimes.',
      'Delicious raw in salads or lightly wilted in stir-fries.',
    ],
    difficulty: 'Easy',
  },
   {
    id: 'arugula',
    name: 'Arugula',
    iconName: 'rocket-launch-outline', // Example icon (pun intended!)
    description: 'Intensely peppery and nutty flavor, similar to mature arugula. Fast growing.',
    germinationTime: '2-4 days',
    idealTemp: '15-21°C (60-70°F)',
    lighting: 'Needs good light after germination.',
    watering: 'Keep consistently moist. Seeds are mucilaginous (get sticky when wet), so don\'t soak.',
    harvest: 'Around 8-12 days, when cotyledons are full and first true leaves appear.',
    tips: [
      'Do not soak seeds before planting.',
      'Can bolt (go to flower) quickly if stressed by heat or lack of water.',
      'Adds a strong flavor punch to dishes.',
    ],
    difficulty: 'Easy',
  },
  // Add more varieties: Watercress, Mustard, Basil, Kale, etc. following the same structure.
];