import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDay, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import EditPhaseModal from "./EditPhaseModal";
import NewCycleModal from "./NewCycleModal";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getPhaseColor, findCurrentPhase, findNextPhase, getPhaseNameInRussian } from "@/lib/cycleCalculations";
import { queryClient } from "@/lib/queryClient";

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showNewCycleModal, setShowNewCycleModal] = useState<boolean>(false);

  // Fetch user cycle data
  const { data: cycleData, isLoading } = useQuery({
    queryKey: ['/api/cycles'],
  });

  // Mutation for updating phase
  const updatePhaseMutation = useMutation({
    mutationFn: async ({ date, phase }: { date: Date, phase: string }) => {
      return apiRequest("POST", "/api/cycles/update-phase", { date, phase });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cycles'] });
      setShowEditModal(false);
    },
  });

  // Mutation for starting new cycle
  const startNewCycleMutation = useMutation({
    mutationFn: async (startDate: Date) => {
      return apiRequest("POST", "/api/cycles/start", { startDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cycles'] });
      setShowNewCycleModal(false);
    },
  });

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setShowEditModal(true);
  };

  const handleStartNewCycle = () => {
    setShowNewCycleModal(true);
  };

  const handleUpdatePhase = (phase: string) => {
    if (selectedDate) {
      updatePhaseMutation.mutate({ date: selectedDate, phase });
    }
  };

  const handleNewCycle = (startDate: Date) => {
    startNewCycleMutation.mutate(startDate);
  };

  // Get days for current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of the week of the month start (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const startDay = getDay(monthStart);
  
  // Adjust for Monday as first day (0 = Monday, ..., 6 = Sunday)
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

  // Create calendar grid
  const calendarGrid = [];
  let day = 1;
  for (let i = 0; i < 6; i++) { // 6 rows max for a month
    const row = [];
    for (let j = 0; j < 7; j++) { // 7 days in a week
      if (i === 0 && j < adjustedStartDay) {
        // Empty cells before the start of the month
        row.push(null);
      } else if (day > days.length) {
        // Empty cells after the end of the month
        row.push(null);
      } else {
        // Valid day in the month
        row.push(days[day - 1]);
        day++;
      }
    }
    calendarGrid.push(row);
    if (day > days.length) break; // Exit if we've processed all days
  }

  // Current phase information
  const currentPhase = cycleData ? findCurrentPhase(cycleData, new Date()) : null;
  const nextPhase = cycleData ? findNextPhase(cycleData, new Date()) : null;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Календарь цикла</h2>
        <button
          onClick={handleStartNewCycle}
          className="bg-primary text-white px-3 py-1 rounded-md text-sm"
        >
          Начать новый цикл
        </button>
      </div>

      {/* Current Phase Card */}
      {!isLoading && currentPhase && (
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <h3 className="text-lg font-medium mb-2">Текущая фаза</h3>
          <div className="flex items-center">
            <div className={`w-4 h-4 ${getPhaseColor(currentPhase.phase)} rounded-full mr-2`}></div>
            <span className="font-medium">{getPhaseNameInRussian(currentPhase.phase)}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {format(new Date(currentPhase.startDate), "d MMMM", { locale: ru })} - 
            {currentPhase.endDate ? format(new Date(currentPhase.endDate), " d MMMM yyyy", { locale: ru }) : " настоящее время"}
          </p>
          {nextPhase && (
            <p className="text-sm mt-2">
              <span className="font-medium">Следующая фаза: </span>
              <span>{getPhaseNameInRussian(nextPhase.phase)}</span>
              <span> с {format(new Date(nextPhase.startDate), "d MMMM", { locale: ru })}</span>
            </p>
          )}
        </div>
      )}

      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-3">
        <button onClick={handlePrevMonth} className="text-dark">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-medium">
          {format(currentMonth, "LLLL yyyy", { locale: ru })}
        </h3>
        <button onClick={handleNextMonth} className="text-dark">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        {/* Days of week */}
        <div className="grid grid-cols-7 mb-2 text-sm font-medium text-center">
          <div>Пн</div>
          <div>Вт</div>
          <div>Ср</div>
          <div>Чт</div>
          <div>Пт</div>
          <div>Сб</div>
          <div>Вс</div>
        </div>

        {/* Calendar days */}
        {calendarGrid.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1 mb-2">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`calendar-day ${!day ? "invisible" : ""}`}
                onClick={() => day && handleDayClick(day)}
              >
                {day && (
                  <>
                    <span className="text-sm">{format(day, "d")}</span>
                    {cycleData && (
                      <div 
                        className={`phase-indicator ${
                          getPhaseColor(cycleData.find(c => c.date && isSameDay(new Date(c.date), day))?.phase || "clean")
                        }`}
                      ></div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-menstruation rounded-full mr-2"></div>
            <span>Менструация</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-clean rounded-full mr-2"></div>
            <span>Чистые дни</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-ovulation rounded-full mr-2"></div>
            <span>Овуляция</span>
          </div>
        </div>
      </div>

      {/* Cycle Information */}
      {!isLoading && cycleData && cycleData.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <h3 className="text-lg font-medium mb-2">Информация о цикле</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Начало цикла:</p>
              <p className="font-medium">
                {format(new Date(cycleData[0].date), "d MMMM yyyy", { locale: ru })}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Длительность:</p>
              <p className="font-medium">{cycleData[0].cycleDuration || 28} дней</p>
            </div>
            <div>
              <p className="text-gray-600">Менструация:</p>
              <p className="font-medium">{cycleData[0].menstruationDuration || 5} дней</p>
            </div>
            <div>
              <p className="text-gray-600">Овуляция:</p>
              <p className="font-medium">
                {cycleData[0].ovulationDate && format(new Date(cycleData[0].ovulationDate), "d MMMM", { locale: ru })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Phase Modal */}
      {selectedDate && (
        <EditPhaseModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          date={selectedDate}
          onSave={handleUpdatePhase}
          currentPhase={
            cycleData?.find(c => c.date && isSameDay(new Date(c.date), selectedDate))?.phase || "clean"
          }
        />
      )}

      {/* New Cycle Modal */}
      <NewCycleModal
        isOpen={showNewCycleModal}
        onClose={() => setShowNewCycleModal(false)}
        onSave={handleNewCycle}
      />
    </div>
  );
}
