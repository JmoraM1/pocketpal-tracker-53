import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Settings2, Plus, X, Pencil, Check } from "lucide-react";
import { isSavingsCategory } from "@/lib/constants";
import type { CategoryInfo } from "@/hooks/useCategories";
import { useT } from "@/lib/i18n";

interface CategoryManagerProps {
  categories: CategoryInfo[];
  onAdd: (name: string, is_cumulative_savings?: boolean) => void;
  onRemove: (name: string) => void;
  onEdit: (oldName: string, newName: string) => void;
  onToggleCumulative: (name: string, value: boolean) => void;
}

export function CategoryManager({ categories, onAdd, onRemove, onEdit, onToggleCumulative }: CategoryManagerProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCumulative, setNewCumulative] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const categoryNames = categories.map((c) => c.name);
  const showCumulativeOption = isSavingsCategory(newName);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (trimmed && !categoryNames.includes(trimmed)) {
      onAdd(trimmed, showCumulativeOption ? newCumulative : false);
      setNewName("");
      setNewCumulative(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Settings2 className="h-4 w-4" />
          {t("Categorías")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Gestionar Categorías")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("Nueva categoría")}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {showCumulativeOption && (
              <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-2">
                <Switch checked={newCumulative} onCheckedChange={setNewCumulative} />
                <Label className="text-sm">{t("Ahorro acumulativo")}</Label>
              </div>
            )}
          </div>
          <div className="chip-row gap-2">
            {categories.map((cat) => (
              editingCat === cat.name ? (
                <div key={cat.name} className="flex items-center gap-1">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const trimmed = editValue.trim();
                        if (trimmed && trimmed !== cat.name && !categoryNames.includes(trimmed)) {
                          onEdit(cat.name, trimmed);
                        }
                        setEditingCat(null);
                      } else if (e.key === "Escape") {
                        setEditingCat(null);
                      }
                    }}
                    className="h-7 w-32 text-sm"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      const trimmed = editValue.trim();
                      if (trimmed && trimmed !== cat.name && !categoryNames.includes(trimmed)) {
                        onEdit(cat.name, trimmed);
                      }
                      setEditingCat(null);
                    }}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div key={cat.name} className="flex flex-col gap-1">
                  <Badge variant="secondary" className="gap-1 py-1.5 text-sm">
                    {cat.name}
                    {cat.is_cumulative_savings && (
                      <span className="ml-1 text-xs text-primary">📊</span>
                    )}
                    <button
                      onClick={() => { setEditingCat(cat.name); setEditValue(cat.name); }}
                      className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
                    >
                      <Pencil className="h-3 w-3 text-primary" />
                    </button>
                    <button
                      onClick={() => onRemove(cat.name)}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  </Badge>
                  {isSavingsCategory(cat.name) && (
                    <div className="flex items-center gap-1.5 pl-1">
                      <Switch
                        checked={cat.is_cumulative_savings}
                        onCheckedChange={(v) => onToggleCumulative(cat.name, v)}
                        className="scale-75"
                      />
                      <span className="text-xs text-muted-foreground">{t("Acumulativo")}</span>
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("No hay categorías. Agrega una arriba.")}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
