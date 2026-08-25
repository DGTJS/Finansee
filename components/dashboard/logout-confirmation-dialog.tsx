"use client";

import { CircleAlert, LogOut } from "@/components/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type LogoutConfirmationDialogProps = {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function LogoutConfirmationDialog({ open, pending, onOpenChange, onConfirm }: LogoutConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !pending && onOpenChange(nextOpen)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-1 grid size-10 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <CircleAlert className="size-5" aria-hidden="true" />
          </div>
          <AlertDialogTitle>Deseja realmente sair?</AlertDialogTitle>
          <AlertDialogDescription>
            Sua sessão será encerrada neste dispositivo. Você precisará entrar novamente para acessar seus dados financeiros.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {pending ? <span className="inline-flex items-center gap-2"><span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />Saindo...</span> : <><LogOut data-icon />Sair</>}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
