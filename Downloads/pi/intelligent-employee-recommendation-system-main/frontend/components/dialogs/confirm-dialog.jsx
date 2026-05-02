"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"



export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "default"
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white border-none rounded-[4px] p-8 shadow-2xl">
        <AlertDialogHeader>
          <p className={cn("text-[9px] font-black tracking-[0.4em] mb-3", variant === "destructive" ? "text-rose-500" : "text-[#F28C1B]")}>Safety Protocol</p>
          <AlertDialogTitle className="text-3xl font-black text-[#222222] tracking-tighter ">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[10px] font-black text-gray-400 tracking-widest leading-loose mt-4 opacity-70">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-10 gap-4">
          <AlertDialogCancel className="bg-transparent border border-[#EEEEEE] hover:bg-gray-50 text-gray-400 font-black py-6 px-10 rounded-[4px] tracking-widest text-[10px] transition-all h-auto">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              "font-black py-6 px-10 rounded-[4px] tracking-widest text-[10px] shadow-xl transition-all active:scale-95 border-none h-auto",
              variant === "destructive"
                ? "bg-rose-500 hover:bg-rose-600 text-white"
                : "bg-[#222222] hover:bg-[#F28C1B] text-white"
            )}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

