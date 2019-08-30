import { Signale } from "signale";

const SignaleConfig = {
  disabled: (process.env.DEBUG === "0") ? true : false,
};

export const signale = new Signale(SignaleConfig);
