import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Settings2, Plus, X } from "lucide-react";

interface CategoryManagerProps {
  categories: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}

export function CategoryManager({ categories, onAdd, onRemove }: CategoryManagerProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (trimmed && !categories.includes(trimmed)) {
      onAdd(trimmed);
      setNewName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Settings2 className="h-4 w-4" />
          Categorías
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Categorías</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nueva categoría"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="gap-1 py-1.5 text-sm">
                {cat}
                <button
                  onClick={() => onRemove(cat)}
                  className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                >
                  <X className="h-3 w-3 text-destructive" />
                </button>
              </Badge>
            ))}
          </div>
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay categorías. Agrega una arriba.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
