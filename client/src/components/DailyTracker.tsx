import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Save, Loader2 } from "lucide-react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { getPhaseNameInRussian } from "@/lib/cycleCalculations";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DailyTracker() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const { toast } = useToast();
  
  // Define type for form data
  interface WorshipFormData {
    prayers: {
      fajr: boolean;
      zuhr: boolean;
      asr: boolean;
      maghrib: boolean;
      isha: boolean;
      [key: string]: boolean;
    };
    quranReading: number;
    dua: boolean;
    sadaqa: boolean;
    fast: "none" | "fard" | "nafl" | "kada";
    note: string;
  }
  
  // Track form data locally with state
  const [formData, setFormData] = useState<WorshipFormData>({
    prayers: {
      fajr: false,
      zuhr: false,
      asr: false,
      maghrib: false,
      isha: false
    },
    quranReading: 0,
    dua: false,
    sadaqa: false,
    fast: "none" as "none" | "fard" | "nafl" | "kada",
    note: ""
  });
  
  // Define types for the cycle data
  interface CycleDay {
    id: number;
    userId: number;
    date: string;
    phase: string;
    cycleDuration?: number;
    menstruationDuration?: number;
    ovulationDate?: string;
  }

  // Fetch cycle data to determine phase
  const { data: cycleData } = useQuery<CycleDay[]>({
    queryKey: ['/api/cycles'],
  });

  // Fetch prayer times
  const { data: prayerTimes } = useQuery({
    queryKey: ['/api/prayer-times', format(currentDate, 'yyyy-MM-dd')],
  });

  // We're using WorshipFormData defined above for both the form and API data

  // Fetch daily worship data - use our same type as the form data
  const { data: worshipData, isLoading: isLoadingWorship } = useQuery<WorshipFormData>({
    queryKey: ['/api/worship', format(currentDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/worship?date=${format(currentDate, 'yyyy-MM-dd')}`);
        if (!response.ok) {
          throw new Error("Failed to fetch worship data");
        }
        const data = await response.json();
        // Make sure we have a properly formed prayers object
        const result: WorshipFormData = {
          prayers: {
            fajr: data?.prayers?.fajr || false,
            zuhr: data?.prayers?.zuhr || false,
            asr: data?.prayers?.asr || false,
            maghrib: data?.prayers?.maghrib || false,
            isha: data?.prayers?.isha || false
          },
          quranReading: data?.quranReading || 0,
          dua: data?.dua || false,
          sadaqa: data?.sadaqa || false,
          fast: (data?.fast as "none" | "fard" | "nafl" | "kada") || "none",
          note: data?.note || ""
        };
        return result;
      } catch (error) {
        console.error("Error fetching worship data:", error);
        // Return default empty data
        return {
          prayers: {
            fajr: false,
            zuhr: false,
            asr: false,
            maghrib: false,
            isha: false
          },
          quranReading: 0,
          dua: false,
          sadaqa: false,
          fast: "none" as const,
          note: ""
        };
      }
    }
  });

  // Update form data when worship data changes or date changes
  useEffect(() => {
    if (worshipData) {
      setFormData({
        prayers: worshipData.prayers || {
          fajr: false,
          zuhr: false,
          asr: false,
          maghrib: false,
          isha: false
        },
        quranReading: worshipData.quranReading || 0,
        dua: worshipData.dua || false,
        sadaqa: worshipData.sadaqa || false,
        fast: worshipData.fast || "none",
        note: worshipData.note || ""
      });
    } else {
      // Reset form when no data is available
      setFormData({
        prayers: {
          fajr: false,
          zuhr: false,
          asr: false,
          maghrib: false,
          isha: false
        },
        quranReading: 0,
        dua: false,
        sadaqa: false,
        fast: "none",
        note: ""
      });
    }
  }, [worshipData, currentDate]);

  // Save worship data mutation
  const saveWorshipMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/worship", {
        date: format(currentDate, 'yyyy-MM-dd'),
        ...data
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Сохранено",
        description: "Данные успешно сохранены",
        variant: "default",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/worship', format(currentDate, 'yyyy-MM-dd')] });
    },
    onError: (error) => {
      console.error("Error saving worship data:", error);
      toast({
        title: "❌ Ошибка",
        description: "Не удалось сохранить данные",
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  const handlePrevDay = () => {
    setCurrentDate((prev) => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setCurrentDate((prev) => addDays(prev, 1));
  };

  const handlePrayerChange = (prayer: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      prayers: {
        ...prev.prayers,
        [prayer]: value
      }
    }));
  };

  const handleQuranChange = (minutes: number) => {
    setFormData(prev => ({
      ...prev,
      quranReading: minutes
    }));
  };

  const handleDuaChange = (value: boolean) => {
    setFormData(prev => ({
      ...prev,
      dua: value
    }));
  };

  const handleSadaqaChange = (value: boolean) => {
    setFormData(prev => ({
      ...prev,
      sadaqa: value
    }));
  };

  const handleFastChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      fast: value as "none" | "fard" | "nafl" | "kada"
    }));
  };

  const handleNoteChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      note: value
    }));
  };
  
  const handleSaveData = () => {
    saveWorshipMutation.mutate(formData);
  };

  // Determine if the current day is in menstruation phase
  const currentCycleDay = cycleData?.find(day => 
    day.date && isSameDay(new Date(day.date), currentDate)
  );
  const isMenstruationPhase = currentCycleDay?.phase === "menstruation";

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Трекер ибадатов</h2>
        <div className="flex items-center">
          <button onClick={handlePrevDay} className="text-dark mr-2">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={handleNextDay} className="text-dark">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Date Display */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium">
          {format(currentDate, "d MMMM yyyy", { locale: ru })}
        </h3>
        {currentCycleDay && (
          <div className="flex justify-center mt-1">
            <div className="flex items-center">
              <div className={`w-3 h-3 ${
                currentCycleDay.phase === "menstruation" ? "bg-menstruation" : 
                currentCycleDay.phase === "ovulation" ? "bg-ovulation" : "bg-clean"
              } rounded-full mr-2`}></div>
              <span className="text-sm text-gray-600">
                {getPhaseNameInRussian(currentCycleDay.phase)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Menstruation Phase Message */}
      {isMenstruationPhase && (
        <div className="bg-purple-50 border border-primary rounded-xl p-4 mb-6 text-center">
          <p className="text-primary font-medium mb-2">Ты в фазе отдыха.</p>
          <p className="text-sm text-gray-600">И это тоже поклонение 💜</p>
          {/* SVG illustration of a woman in hijab relaxing */}
          <div className="mt-4 flex justify-center">
            <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M80 20C88.2843 20 95 26.7157 95 35C95 43.2843 88.2843 50 80 50C71.7157 50 65 43.2843 65 35C65 26.7157 71.7157 20 80 20Z" fill="#8B5CF6" fillOpacity="0.2"/>
              <path d="M80 45C84.1421 45 87.5 41.6421 87.5 37.5C87.5 33.3579 84.1421 30 80 30C75.8579 30 72.5 33.3579 72.5 37.5C72.5 41.6421 75.8579 45 80 45Z" fill="#8B5CF6"/>
              <path d="M60 60C60 51.7157 68.9543 45 80 45C91.0457 45 100 51.7157 100 60V100H60V60Z" fill="#8B5CF6" fillOpacity="0.2"/>
              <path d="M95 55C95 55 90 65 80 65C70 65 65 55 65 55" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
              <path d="M75 80H85" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
              <path d="M110 70C120 75 125 90 125 90" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
              <path d="M50 70C40 75 35 90 35 90" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      )}

      {/* Prayer Tracker */}
      <div className={`bg-white rounded-xl shadow-md p-4 mb-6 ${isMenstruationPhase ? "opacity-50" : ""}`}>
        <h3 className="text-lg font-medium mb-3">Намаз</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Switch
                id="fajr"
                checked={formData.prayers.fajr}
                onCheckedChange={(checked) => handlePrayerChange("fajr", checked)}
                disabled={isMenstruationPhase}
              />
              <Label htmlFor="fajr" className="ml-2 text-gray-700 cursor-pointer">
                Фаджр
              </Label>
            </div>
            <span className="text-sm text-gray-500">{prayerTimes?.fajr || "--:--"}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Switch
                id="zuhr"
                checked={formData.prayers.zuhr}
                onCheckedChange={(checked) => handlePrayerChange("zuhr", checked)}
                disabled={isMenstruationPhase}
              />
              <Label htmlFor="zuhr" className="ml-2 text-gray-700 cursor-pointer">
                Зухр
              </Label>
            </div>
            <span className="text-sm text-gray-500">{prayerTimes?.zuhr || "--:--"}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Switch
                id="asr"
                checked={formData.prayers.asr}
                onCheckedChange={(checked) => handlePrayerChange("asr", checked)}
                disabled={isMenstruationPhase}
              />
              <Label htmlFor="asr" className="ml-2 text-gray-700 cursor-pointer">
                Аср
              </Label>
            </div>
            <span className="text-sm text-gray-500">{prayerTimes?.asr || "--:--"}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Switch
                id="maghrib"
                checked={formData.prayers.maghrib}
                onCheckedChange={(checked) => handlePrayerChange("maghrib", checked)}
                disabled={isMenstruationPhase}
              />
              <Label htmlFor="maghrib" className="ml-2 text-gray-700 cursor-pointer">
                Магриб
              </Label>
            </div>
            <span className="text-sm text-gray-500">{prayerTimes?.maghrib || "--:--"}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Switch
                id="isha"
                checked={formData.prayers.isha}
                onCheckedChange={(checked) => handlePrayerChange("isha", checked)}
                disabled={isMenstruationPhase}
              />
              <Label htmlFor="isha" className="ml-2 text-gray-700 cursor-pointer">
                Иша
              </Label>
            </div>
            <span className="text-sm text-gray-500">{prayerTimes?.isha || "--:--"}</span>
          </div>
        </div>
      </div>

      {/* Other Worship Tracker */}
      <div className={`bg-white rounded-xl shadow-md p-4 mb-6 ${isMenstruationPhase ? "opacity-50" : ""}`}>
        <h3 className="text-lg font-medium mb-3">Другие поклонения</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quran" className="text-gray-700">Чтение Корана</Label>
            <div className="flex items-center">
              <Input
                id="quran"
                type="number"
                className="w-16 h-9 text-center"
                placeholder="мин"
                value={formData.quranReading || ""}
                onChange={(e) => handleQuranChange(parseInt(e.target.value) || 0)}
                disabled={isMenstruationPhase}
              />
              <span className="ml-2 text-sm text-gray-500">мин</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="dua" className="text-gray-700">Ду'а</Label>
            <Switch
              id="dua"
              checked={formData.dua}
              onCheckedChange={handleDuaChange}
              disabled={isMenstruationPhase}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sadaqa" className="text-gray-700">Садака</Label>
            <Switch
              id="sadaqa"
              checked={formData.sadaqa}
              onCheckedChange={handleSadaqaChange}
              disabled={isMenstruationPhase}
            />
          </div>
          <div>
            <Label className="text-gray-700 block mb-2">Пост</Label>
            <RadioGroup
              value={formData.fast}
              onValueChange={handleFastChange}
              disabled={isMenstruationPhase}
              className="flex flex-wrap gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="fast-none" />
                <Label htmlFor="fast-none" className="text-sm">Нет</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fard" id="fast-fard" />
                <Label htmlFor="fast-fard" className="text-sm">Обязательный</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nafl" id="fast-nafl" />
                <Label htmlFor="fast-nafl" className="text-sm">Нафиля</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="kada" id="fast-kada" />
                <Label htmlFor="fast-kada" className="text-sm">Када</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>

      {/* Day Note */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        <h3 className="text-lg font-medium mb-2">Заметка к дню</h3>
        <Textarea
          className="w-full h-24 resize-none"
          placeholder="Запиши свои мысли и чувства..."
          value={formData.note}
          onChange={(e) => handleNoteChange(e.target.value)}
        />
      </div>
      
      {/* Save Button */}
      <div className="flex justify-center mt-6 mb-4">
        <Button 
          onClick={handleSaveData} 
          disabled={saveWorshipMutation.isPending || isMenstruationPhase}
          className="w-full bg-primary hover:bg-primary/90 text-white"
        >
          {saveWorshipMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Сохранение...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> 
              Сохранить
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
