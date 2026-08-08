import { EN_COMMON } from "./en.common";
import { EN_HOME } from "./en.home";
import { EN_EXPENSES } from "./en.expenses";
import { EN_SAVINGS } from "./en.savings";
import { EN_DEBTS } from "./en.debts";
import { EN_SETTINGS } from "./en.settings";
import { EN_AUTH } from "./en.auth";

export const EN: Record<string, string> = {
  ...EN_COMMON,
  ...EN_HOME,
  ...EN_EXPENSES,
  ...EN_SAVINGS,
  ...EN_DEBTS,
  ...EN_SETTINGS,
  ...EN_AUTH,
};
