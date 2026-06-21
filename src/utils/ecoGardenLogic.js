export const STAGES = [
  { level: 1, minPoints: 0, maxPoints: 200, title: "The Little Sprout", description: "Every great forest begins with a single seed. Keep logging eco-activities to help it grow!", icon: "ph:seedling-fill", color: "text-leaf", iconSimple: "ph:plant-bold" },
  { level: 2, minPoints: 201, maxPoints: 600, title: "The Young Sapling", description: "Your daily actions are taking root. Your tree is growing stronger every day!", icon: "ph:plant-fill", color: "text-leaf", iconSimple: "ph:plant-fill" },
  { level: 3, minPoints: 601, maxPoints: 1200, title: "The Flourishing Tree", description: "A healthy, strong tree! Your commitment to sustainability is making a real difference.", icon: "ph:tree-evergreen-fill", color: "text-forest", iconSimple: "ph:potted-plant-duotone" },
  { level: 4, minPoints: 1201, maxPoints: Infinity, title: "The Eternal Guardian", description: "A legendary, magical ancient tree. You are a true eco-hero!", icon: "ph:tree-fill", color: "text-terracotta", iconSimple: "ph:tree-fill" }
];

export const getStageData = (points) => {
  const currentStageIndex = STAGES.findIndex(s => points >= s.minPoints && points <= s.maxPoints);
  const stage = STAGES[currentStageIndex !== -1 ? currentStageIndex : STAGES.length - 1];
  const nextStage = STAGES[currentStageIndex !== -1 ? currentStageIndex + 1 : STAGES.length];
  
  return {
    stageIndex: currentStageIndex !== -1 ? currentStageIndex : STAGES.length - 1,
    stage,
    nextStage
  };
};
