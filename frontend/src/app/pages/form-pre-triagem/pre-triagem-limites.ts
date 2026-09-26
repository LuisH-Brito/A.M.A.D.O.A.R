// O teto de peso é técnico e deve acompanhar a capacidade da balança usada.
export const PRE_TRIAGEM_LIMITES = {
  alturaMaxM: 3,
  pesoMaxMedicaoKg: 300,
  pesoMinDoacaoKg: 50,
  hemoglobinaMaxMedicaoGdl: 25,
  hemoglobinaMaxAptoGdl: 18,
  hemoglobinaMinAptoGdl: { F: 12.5, M: 13 },
} as const;
