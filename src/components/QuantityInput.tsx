import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}

export function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 9999,
  step = 1,
  unit,
  className,
}: QuantityInputProps) {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || min;
    onChange(Math.max(min, Math.min(max, newValue)));
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-lg shrink-0"
        onClick={handleDecrement}
        disabled={value <= min}
      >
        <Minus className="h-4 w-4" />
      </Button>

      <div className="relative flex-1 max-w-24">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={handleInputChange}
          className="quantity-input w-full"
          min={min}
          max={max}
          step={step}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-lg shrink-0"
        onClick={handleIncrement}
        disabled={value >= max}
      >
        <Plus className="h-4 w-4" />
      </Button>

      {unit && (
        <span className="unit-badge ml-1">{unit}</span>
      )}
    </div>
  );
}
