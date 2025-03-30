// utils/achievementsData.js
export const achievementsList = [
  {
      id: 'first_batch',
      name: 'Green Thumb Initiate',
      description: 'Started your first batch!',
      icon: 'seed-outline', // MaterialCommunityIcons name
      type: 'batch_count', // Condition type
      value: 1 // Condition value (e.g., number of batches)
  },
  {
      id: 'first_observation',
      name: 'First Look',
      description: 'Logged your first observation.',
      icon: 'eye-check-outline',
      type: 'observation_count',
      value: 1
  },
  {
      id: 'streak_3',
      name: 'Consistent Grower',
      description: '3-day observation streak!',
      icon: 'calendar-check',
      type: 'streak',
      value: 3
  },
  {
      id: 'streak_7',
      name: 'Dedicated Cultivator',
      description: '7-day observation streak!',
      icon: 'calendar-star',
      type: 'streak',
      value: 7
  },
  {
      id: 'streak_14',
      name: 'Microgreen Master',
      description: '14-day observation streak!!',
      icon: 'trophy-variant-outline',
      type: 'streak',
      value: 14
  },
  {
      id: 'five_batches',
      name: 'Getting Serious',
      description: 'Started 5 different batches.',
      icon: 'sprout',
      type: 'batch_count',
      value: 5
  },
  {
      id: 'ten_observations',
      name: 'Keen Observer',
      description: 'Logged 10 observations in total.',
      icon: 'notebook-check-outline',
      type: 'observation_count',
      value: 10
  },
  // Add more achievement ideas:
  // { id: 'first_harvest', name: 'First Harvest', description: 'Marked a batch as harvested.', icon: 'content-cut', type: 'harvest_count', value: 1 },
  // { id: 'photo_log', name: 'Picture Perfect', description: 'Added photos to 3 observations.', icon: 'image-multiple-outline', type: 'photo_count', value: 3 },
  // { id: 'variety_expert', name: 'Variety Explorer', description: 'Grown 3 different types of microgreens.', icon: 'leaf-multiple', type: 'variety_count', value: 3 },
];

/**
 * Finds an achievement object by its ID.
 * @param {string} id The ID of the achievement to find.
 * @returns {object | undefined} The achievement object or undefined if not found.
 */
export const getAchievementById = (id) => achievementsList.find(a => a.id === id);