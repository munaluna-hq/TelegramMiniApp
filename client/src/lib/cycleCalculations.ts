import { addDays, differenceInDays } from "date-fns";

export interface CycleDay {
  date: string;
  phase: string;
  id?: number;
  userId?: number;
  cycleDuration?: number;
  menstruationDuration?: number;
  ovulationDate?: string;
}

export function getPhaseColor(phase: string): string {
  switch (phase) {
    case "menstruation":
      return "bg-menstruation";
    case "ovulation":
      return "bg-ovulation";
    case "clean":
    default:
      return "bg-clean";
  }
}

export function getPhaseNameInRussian(phase: string): string {
  switch (phase) {
    case "menstruation":
      return "Менструация";
    case "ovulation":
      return "Овуляция";
    case "clean":
    default:
      return "Чистые дни";
  }
}

export function calculateCycleDays(startDate: Date, menstruationDays: number = 5, cycleDays: number = 28): CycleDay[] {
  const result: CycleDay[] = [];
  
  // 1. Add menstruation days
  for (let i = 0; i < menstruationDays; i++) {
    result.push({
      date: addDays(startDate, i).toISOString(),
      phase: "menstruation"
    });
  }
  
  // 2. Calculate ovulation day (typically around day 14 of the cycle)
  const ovulationDay = 14;
  const ovulationDate = addDays(startDate, ovulationDay - 1);
  
  // 3. Add clean days before ovulation
  for (let i = menstruationDays; i < ovulationDay - 1; i++) {
    result.push({
      date: addDays(startDate, i).toISOString(),
      phase: "clean"
    });
  }
  
  // 4. Add ovulation (typically lasts 2-3 days, we'll use 2 days)
  for (let i = 0; i < 2; i++) {
    result.push({
      date: addDays(ovulationDate, i).toISOString(),
      phase: "ovulation"
    });
  }
  
  // 5. Add clean days for the rest of the cycle
  for (let i = ovulationDay + 1; i < cycleDays; i++) {
    result.push({
      date: addDays(startDate, i).toISOString(),
      phase: "clean"
    });
  }
  
  return result;
}

export function findCurrentPhase(cycleData: CycleDay[], currentDate: Date): { phase: string, startDate: string, endDate?: string } | null {
  if (!cycleData || cycleData.length === 0) return null;
  
  // Sort cycle days by date
  const sortedDays = [...cycleData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Find the phase for the current date
  const currentDay = sortedDays.find(day => {
    const dayDate = new Date(day.date);
    return dayDate.getDate() === currentDate.getDate() &&
           dayDate.getMonth() === currentDate.getMonth() &&
           dayDate.getFullYear() === currentDate.getFullYear();
  });
  
  if (!currentDay) return null;
  
  // Find the start of this phase
  let phaseStartIndex = sortedDays.findIndex(day => day.phase === currentDay.phase);
  
  // Find consecutive days with the same phase
  let i = phaseStartIndex;
  while (i < sortedDays.length - 1 && sortedDays[i + 1].phase === currentDay.phase) {
    i++;
  }
  
  return {
    phase: currentDay.phase,
    startDate: sortedDays[phaseStartIndex].date,
    endDate: i < sortedDays.length - 1 ? sortedDays[i].date : undefined
  };
}

export function findNextPhase(cycleData: CycleDay[], currentDate: Date): { phase: string, startDate: string } | null {
  if (!cycleData || cycleData.length === 0) return null;
  
  const currentPhase = findCurrentPhase(cycleData, currentDate);
  if (!currentPhase) return null;
  
  // Sort cycle days by date
  const sortedDays = [...cycleData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Find the first day with a different phase after the current phase
  const nextPhaseDay = sortedDays.find(day => {
    return new Date(day.date) > new Date(currentPhase.startDate) && day.phase !== currentPhase.phase;
  });
  
  if (!nextPhaseDay) return null;
  
  return {
    phase: nextPhaseDay.phase,
    startDate: nextPhaseDay.date
  };
}
