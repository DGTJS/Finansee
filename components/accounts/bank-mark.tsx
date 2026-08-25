import { WalletCards } from "@/components/icons";
import { cn } from "@/lib/utils";
import Image from "next/image";
import bradesco from "@thesvg/icons/bradesco";
import itau from "@thesvg/icons/itau";
import nubank from "@thesvg/icons/nubank";

const bankAssets = [
  { matches: ["bradesco"], src: "/banks/bradesco.png", alt: "Bradesco" },
  { matches: ["santander"], src: "/banks/santander.png", alt: "Santander" },
  { matches: ["swile"], src: "/banks/swile.png", alt: "Swile" },
  { matches: ["picpay", "pic pay"], src: "/banks/picpay.webp", alt: "PicPay" },
  { matches: ["inter"], src: "/banks/inter.png", alt: "Inter" },
];

export function BankMark({ name, type, className }: { name: string; type: string; className?: string }) {
  const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const isNubank = normalized.includes("nubank");
  const isBradesco = normalized.includes("bradesco");
  const isItau = normalized.includes("itau");
  const isSantander = normalized.includes("santander");
  const asset = bankAssets.find((item) => item.matches.some((match) => normalized.includes(match)));
  const brandClass = isNubank ? "bg-[var(--account-purple)] text-[var(--account-on-color)]" : isBradesco ? "bg-[var(--account-red)] text-[var(--account-on-color)]" : isItau ? "bg-status-warning text-[var(--account-on-color)]" : isSantander ? "bg-status-danger text-[var(--account-on-color)]" : "bg-muted text-muted-foreground";
  const brand = isNubank ? nubank : isBradesco ? bradesco : isItau ? itau : null;
  return <span className={cn("grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl", brandClass, className)} aria-label={`Banco ${name} · ${type === "credit_card" ? "cartão" : "conta"}`}>
    {asset ? <Image src={asset.src} alt={asset.alt} width={40} height={40} className="size-full object-cover" /> : brand ? <span className="grid size-6 place-items-center [&>svg]:size-full" aria-hidden="true" dangerouslySetInnerHTML={{ __html: brand.svg }} /> : <WalletCards />}
  </span>;
}
