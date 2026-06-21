import { useUser } from '../context/UserContext';
import { STAGES, getStageData } from '../utils/ecoGardenLogic';

export default function EcoGarden() {
  const { leafPoints } = useUser();

  const { stageIndex, stage, nextStage } = getStageData(leafPoints);

  // Calculate progress to next stage
  let progressPercentage = 100;
  let pointsNeeded = 0;

  if (nextStage) {
    const pointsInCurrentTier = leafPoints - stage.minPoints;
    const totalPointsInTier = nextStage.minPoints - stage.minPoints;
    progressPercentage = Math.max(0, Math.min(100, (pointsInCurrentTier / totalPointsInTier) * 100));
    pointsNeeded = nextStage.minPoints - leafPoints;
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="bg-leaf border-4 border-forest shadow-brutal p-6 organic-card text-cream relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div className="relative z-10">
            <h2 className="font-serif text-3xl font-bold mb-1">Virtual Eco-Garden</h2>
            <p className="text-sm font-medium text-cream/90">Watch your digital forest grow as you earn Leaf Points.</p>
          </div>
          <div className="bg-cream border-2 border-forest rounded-full px-4 py-2 flex items-center gap-2 shadow-brutal-sm text-forest rotate-3 hover:rotate-0 transition-transform cursor-default">
            <iconify-icon icon="ph:leaf-fill" class="text-leaf text-xl"></iconify-icon>
            <div className="font-black text-xl">{leafPoints}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest pt-1">Pts</div>
          </div>
        </div>
      </div>

      {/* Main Garden View */}
      <div className="bg-cream border-4 border-forest shadow-brutal rounded-[2rem] overflow-hidden text-center relative flex flex-col items-center">
        
        {/* Sky / Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-200/50 to-cream/10 z-0"></div>

        {/* Tree Image */}
        <div className="relative z-10 w-full h-[400px] flex items-center justify-center pt-8 px-4">
          <iconify-icon 
            icon={stage.icon} 
            class={`text-[250px] ${stage.color} drop-shadow-2xl animate-float`}
          ></iconify-icon>
        </div>

        {/* Status Area */}
        <div className="relative z-10 w-full bg-cardBg border-t-4 border-forest p-8 flex flex-col items-center">
          <span className="text-xs font-black uppercase tracking-widest text-leaf mb-2">Stage {stageIndex + 1} of {STAGES.length}</span>
          <h3 className="font-serif text-3xl font-black text-forest mb-4">{stage.title}</h3>
          <p className="text-soil font-medium max-w-md mb-8">{stage.description}</p>

          {/* Progress Bar */}
          <div className="w-full max-w-lg">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-forest mb-2">
              <span>{stage.minPoints} pts</span>
              {nextStage ? <span>{nextStage.minPoints} pts</span> : <span>MAX LEVEL</span>}
            </div>
            
            <div className="h-6 w-full bg-soil/20 rounded-full border-2 border-forest overflow-hidden relative">
              <div 
                className="h-full bg-leaf border-r-2 border-forest transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
              {/* Shine effect on progress bar */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20"></div>
            </div>

            {nextStage && (
              <p className="text-sm font-bold text-terracotta mt-3 animate-pulse">
                Only {pointsNeeded} more points until the next stage!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
