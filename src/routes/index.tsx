import { createFileRoute } from "@tanstack/react-router";
import { BankApp } from "@/components/BankApp";

export const Route = createFileRoute("/")({
  component: BankApp,
});
