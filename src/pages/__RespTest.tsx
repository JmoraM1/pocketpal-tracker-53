import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
export default function RespTest() {
  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader><DialogTitle>Test</DialogTitle></DialogHeader>
        {Array.from({ length: 20 }).map((_, i) => (
          <input key={i} className="h-10 w-full border" placeholder={`campo ${i}`} />
        ))}
        <button data-testid="last">Guardar</button>
      </DialogContent>
    </Dialog>
  );
}
