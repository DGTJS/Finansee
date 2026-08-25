import { z } from "zod";

const hasLowercase = /[a-z]/;
const hasUppercase = /[A-Z]/;
const hasNumber = /\d/;
const hasSymbol = /[^A-Za-z0-9]/;

export const passwordSchema = z.string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(128, "A senha deve ter no máximo 128 caracteres.")
  .refine((value) => hasLowercase.test(value), "Inclua pelo menos uma letra minúscula.")
  .refine((value) => hasUppercase.test(value), "Inclua pelo menos uma letra maiúscula.")
  .refine((value) => hasNumber.test(value), "Inclua pelo menos um número.")
  .refine((value) => hasSymbol.test(value), "Inclua pelo menos um símbolo.");

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(100, "O nome é muito longo."),
  email: z.string().trim().email("Informe um e-mail válido.").max(254, "O e-mail é muito longo."),
  password: passwordSchema,
  confirmation: z.string(),
}).superRefine(({ password, confirmation }, context) => {
  if (password !== confirmation) context.addIssue({ code: "custom", path: ["confirmation"], message: "As senhas não conferem." });
});

export const signInSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").max(254, "O e-mail é muito longo."),
  password: z.string().min(1, "Informe sua senha.").max(128, "Senha inválida."),
});

export type PasswordStrength = { score: number; label: "Fraca" | "Média" | "Forte" };

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "Fraca" };
  const score = [password.length >= 8, hasLowercase.test(password), hasUppercase.test(password), hasNumber.test(password), hasSymbol.test(password)].filter(Boolean).length;
  return { score, label: score >= 5 ? "Forte" : score >= 3 ? "Média" : "Fraca" };
}

export function getFirstValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Confira os dados informados.";
}
