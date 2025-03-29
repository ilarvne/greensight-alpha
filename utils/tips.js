// utils/tips.js

export const MICROGREEN_TIPS = [
  "Water microgreens gently, ideally from the bottom or side, to avoid damaging delicate sprouts.",
  "Good air circulation is key! Ensure your growing area has some airflow to help prevent mold.",
  "Most microgreens thrive with 4-6 hours of direct sunlight or 10-14 hours under grow lights daily.",
  "Don't over-soak seeds! Check specific soaking times for each variety, some don't need soaking at all.",
  "Harvest microgreens just above the soil line with sharp scissors when the first true leaves appear for the best flavor.",
  "Seeing mold? Increase air circulation, reduce humidity slightly, and consider a food-grade hydrogen peroxide spray.",
  "Clean your growing trays thoroughly with soap and water between batches to prevent disease.",
  "Patience is a virtue! Different microgreens germinate and grow at different speeds.",
  "A seedling heat mat can significantly speed up germination, especially in cooler environments.",
  "If using window light, rotate your trays 180 degrees daily to encourage even growth.",
  "Use a shallow layer of growing medium (1-2 inches) – microgreens don't need deep soil.",
  "Keep the growing medium consistently moist but not waterlogged, like a wrung-out sponge.",
  "Overcrowding seeds can lead to poor airflow and increase mold risk. Spread them evenly.",
  "Taste test! Harvest times can vary based on preference; try harvesting at slightly different stages.",
  "Label your batches clearly with the variety and sowing date – it's easy to forget!",
  "Store harvested microgreens in a breathable container in the fridge with a paper towel to absorb excess moisture."
];

// Function to get a random tip (optional helper)
export const getRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * MICROGREEN_TIPS.length);
    return MICROGREEN_TIPS[randomIndex];
};