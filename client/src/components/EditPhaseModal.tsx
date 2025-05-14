import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface EditPhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  onSave: (phase: string) => void;
  currentPhase: string;
}

export default function EditPhaseModal({
  isOpen,
  onClose,
  date,
  onSave,
  currentPhase,
}: EditPhaseModalProps) {
  const [selectedPhase, setSelectedPhase] = useState<string>(currentPhase);

  const handleSave = () => {
    onSave(selectedPhase);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактирование фазы</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 mb-4">
          {format(date, "d MMMM yyyy", { locale: ru })}
        </p>
        
        <RadioGroup value={selectedPhase} onValueChange={setSelectedPhase} className="space-y-3 mb-5">
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="menstruation" id="phase-menstruation" />
            <div className="flex items-center">
              <div className="w-4 h-4 bg-menstruation rounded-full mr-2"></div>
              <Label htmlFor="phase-menstruation">Менструация</Label>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="clean" id="phase-clean" />
            <div className="flex items-center">
              <div className="w-4 h-4 bg-clean rounded-full mr-2"></div>
              <Label htmlFor="phase-clean">Чистые дни</Label>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="ovulation" id="phase-ovulation" />
            <div className="flex items-center">
              <div className="w-4 h-4 bg-ovulation rounded-full mr-2"></div>
              <Label htmlFor="phase-ovulation">Овуляция</Label>
            </div>
          </div>
        </RadioGroup>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
