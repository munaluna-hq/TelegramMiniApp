import { useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NewCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startDate: Date) => void;
}

export default function NewCycleModal({
  isOpen,
  onClose,
  onSave,
}: NewCycleModalProps) {
  // Default to today's date
  const today = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState<string>(today);

  const handleSave = () => {
    onSave(new Date(startDate));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Начать новый цикл</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 mb-4">
          Выберите дату начала менструации:
        </p>
        
        <div className="mb-5">
          <Label htmlFor="newCycleDate" className="block text-sm text-gray-600 mb-1">
            Дата
          </Label>
          <Input
            id="newCycleDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={today}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave}>
            Начать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
